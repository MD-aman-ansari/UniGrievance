/**
 * Secure File Upload Middleware
 * 
 * Level 9: Defense-in-Depth File Handling with Multer and Magic Bytes Inspection
 * 
 * Enforces:
 * 1. 5MB hard limit via Multer streaming limits
 * 2. Magic byte file signature verification (rejects spoofed extensions and MIME types)
 * 3. Immediate disk deletion of rejected or malicious files
 * 4. Cryptographic random filename assignment
 * 5. Removal of executable filesystem bits (chmod 0644)
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { 
  UPLOAD_DIRECTORY, 
  MAX_FILE_SIZE_BYTES, 
  inspectFileSignature, 
  generateSecureFilename, 
  sanitizeOriginalFilename 
} from '../services/fileSecurityService.js';

// Temporary staging storage with random names
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIRECTORY);
  },
  filename: (req, file, cb) => {
    // Generate temporary quarantine filename
    const tempName = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}.tmp`;
    cb(null, tempName);
  },
});

// Preliminary client-header filter (Defense layer 1)
const fileFilter = (req, file, cb) => {
  // We do NOT trust this alone, but we reject obvious non-matches early
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname || '').toLowerCase();

  if (!allowedExtensions.includes(ext)) {
    return cb(new Error('INVALID_EXTENSION: Allowed file types are PDF, JPG, and PNG only.'), false);
  }
  cb(null, true);
};

export const uploadAttachmentMulter = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES, // 5 MB
    files: 1, // Single attachment per upload request
  },
  fileFilter,
});

/**
 * Post-Upload Magic Byte Validation & Hardening Middleware (Defense layer 2 & 3)
 * Runs immediately after Multer writes to disk.
 */
export const validateAndSecureAttachment = async (req, res, next) => {
  if (!req.file) {
    // No file provided in this request (valid if attachment is optional)
    return next();
  }

  const tempFilePath = req.file.path;

  try {
    // 1. Inspect authentic binary magic bytes from the file header
    const inspection = inspectFileSignature(tempFilePath);

    if (!inspection.valid) {
      // Malicious or mismatched file: Delete immediately from disk!
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      return res.status(400).json({
        success: false,
        error: 'Invalid File Signature',
        message: 'Security validation failed: File binary header does not match allowed signatures (PDF, JPG, PNG). Client-provided Content-Type or file extension was spoofed or file is corrupt.',
        details: inspection.error,
      });
    }

    // 2. Double-check file size on disk
    const stats = fs.statSync(tempFilePath);
    if (stats.size > MAX_FILE_SIZE_BYTES || stats.size === 0) {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      return res.status(413).json({
        success: false,
        error: 'Payload Too Large',
        message: `File size (${stats.size} bytes) exceeds the maximum allowed limit of 5 MB.`,
      });
    }

    // 3. Generate permanent cryptographically random filename with verified extension
    const secureFilename = generateSecureFilename(inspection.ext);
    const finalFilePath = path.join(UPLOAD_DIRECTORY, secureFilename);

    // 4. Move from quarantine temp name to final randomized path
    fs.renameSync(tempFilePath, finalFilePath);

    // 5. Ensure file is NOT executable by stripping execution permissions (0644 = rw-r--r--)
    fs.chmodSync(finalFilePath, 0o644);

    // 6. Attach verified metadata to request
    req.verifiedAttachment = {
      id: `att_${Date.now()}`,
      originalName: sanitizeOriginalFilename(req.file.originalname),
      storedFilename: secureFilename,
      filePath: finalFilePath,
      mimeType: inspection.mime,
      fileSignatureType: inspection.type,
      sizeBytes: stats.size,
      uploadedAt: new Date().toISOString(),
      uploadedBy: req.user ? req.user.name : 'Unknown',
      uploaderEmail: req.user ? req.user.email : 'Unknown',
    };

    next();
  } catch (err) {
    // Cleanup on unexpected error
    if (fs.existsSync(tempFilePath)) {
      try { fs.unlinkSync(tempFilePath); } catch (e) {}
    }
    return res.status(500).json({
      success: false,
      error: 'File Processing Error',
      message: 'An error occurred during file security verification.',
    });
  }
};

/**
 * Express error handler wrapper for Multer errors (e.g., LIMIT_FILE_SIZE)
 */
export const handleMulterErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        error: 'File Too Large',
        message: 'The uploaded file exceeds the 5 MB limit. Please compress or select a smaller file.',
      });
    }
    return res.status(400).json({
      success: false,
      error: 'Upload Error',
      message: `File upload error: ${err.message}`,
    });
  }

  if (err && err.message && err.message.startsWith('INVALID_EXTENSION:')) {
    return res.status(400).json({
      success: false,
      error: 'Unsupported File Type',
      message: err.message.replace('INVALID_EXTENSION: ', ''),
    });
  }

  next(err);
};

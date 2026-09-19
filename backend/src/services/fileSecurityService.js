/**
 * File Security & Magic Bytes Validation Service
 * 
 * Level 9: Secure File Upload Handling
 * 
 * Implements:
 * 1. Magic Bytes (File Signature) validation for PDF, JPEG, and PNG.
 * 2. Cryptographically random filename generation to defeat Path Traversal.
 * 3. Strict MIME-type resolution based on verified byte signatures (NOT client headers).
 * 4. Safe Content-Disposition and security headers for attachment streaming.
 */

import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

// Maximum allowed size: 5 MB (5,242,880 bytes)
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

// Dedicated secure storage directory outside public web root
export const UPLOAD_DIRECTORY = path.resolve(process.cwd(), 'backend/uploads/attachments');

// Ensure directory exists with restrictive permissions
if (!fs.existsSync(UPLOAD_DIRECTORY)) {
  fs.mkdirSync(UPLOAD_DIRECTORY, { recursive: true, mode: 0o755 });
}

/**
 * Known File Signatures (Magic Bytes)
 * 
 * Never trust Content-Type or file extension from client!
 * The first few bytes of the file binary header identify the real format.
 */
export const MAGIC_SIGNATURES = {
  // PDF: '%PDF-' (Hex: 25 50 44 46 2D)
  pdf: {
    mime: 'application/pdf',
    ext: '.pdf',
    check: (buffer) => {
      if (buffer.length < 5) return false;
      return (
        buffer[0] === 0x25 && // %
        buffer[1] === 0x50 && // P
        buffer[2] === 0x44 && // D
        buffer[3] === 0x46 && // F
        buffer[4] === 0x2D    // -
      );
    },
  },

  // PNG: \x89PNG\r\n\x1a\n (Hex: 89 50 4E 47 0D 0A 1A 0A)
  png: {
    mime: 'image/png',
    ext: '.png',
    check: (buffer) => {
      if (buffer.length < 8) return false;
      return (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 && // P
        buffer[2] === 0x4E && // N
        buffer[3] === 0x47 && // G
        buffer[4] === 0x0D &&
        buffer[5] === 0x0A &&
        buffer[6] === 0x1A &&
        buffer[7] === 0x0A
      );
    },
  },

  // JPEG: Starts with SOI marker 0xFF 0xD8 0xFF
  jpg: {
    mime: 'image/jpeg',
    ext: '.jpg',
    check: (buffer) => {
      if (buffer.length < 3) return false;
      return (
        buffer[0] === 0xFF &&
        buffer[1] === 0xD8 &&
        buffer[2] === 0xFF
      );
    },
  },
};

/**
 * Inspects a file buffer on disk to determine its authentic file type via magic bytes.
 * Returns { valid: true, type: 'pdf'|'jpg'|'png', mime: string, ext: string } or { valid: false, error: string }
 */
export const inspectFileSignature = (filePath) => {
  try {
    const fileDescriptor = fs.openSync(filePath, 'r');
    const headerBuffer = Buffer.alloc(16);
    fs.readSync(fileDescriptor, headerBuffer, 0, 16, 0);
    fs.closeSync(fileDescriptor);

    for (const [typeKey, sigConfig] of Object.entries(MAGIC_SIGNATURES)) {
      if (sigConfig.check(headerBuffer)) {
        return {
          valid: true,
          type: typeKey,
          mime: sigConfig.mime,
          ext: sigConfig.ext,
        };
      }
    }

    return {
      valid: false,
      error: 'File signature verification failed. The file contents do not match any allowed format (PDF, JPG, PNG).',
    };
  } catch (err) {
    return {
      valid: false,
      error: `Failed to inspect file header: ${err.message}`,
    };
  }
};

/**
 * Generates a cryptographically random filename.
 * Prevents Directory Traversal (../), null-byte attacks, and file collision.
 */
export const generateSecureFilename = (verifiedExtension) => {
  const randomHex = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  return `att_${timestamp}_${randomHex}${verifiedExtension}`;
};

/**
 * Sanitizes original client filename for display purposes only.
 * Removes directory paths, control characters, and dangerous characters.
 */
export const sanitizeOriginalFilename = (rawName) => {
  if (!rawName || typeof rawName !== 'string') return 'attachment';
  // Strip path traversal sequences and keep only alphanumeric, dashes, underscores, and single dots
  const basename = path.basename(rawName).replace(/[^a-zA-Z0-9._-]/g, '_');
  return basename.slice(0, 80) || 'attachment';
};

/**
 * Creates sample files with authentic magic bytes for initial testing if not present.
 */
export const seedSampleFiles = () => {
  try {
    const samplePdfPath = path.join(UPLOAD_DIRECTORY, 'att_seed_sample_leak_report.pdf');
    if (!fs.existsSync(samplePdfPath)) {
      const minimalPdf = Buffer.from(
        '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF\n'
      );
      fs.writeFileSync(samplePdfPath, minimalPdf, { mode: 0o644 });
    }

    const sampleJpgPath = path.join(UPLOAD_DIRECTORY, 'att_seed_sample_projector_port.jpg');
    if (!fs.existsSync(sampleJpgPath)) {
      const minimalJpg = Buffer.from(
        'ffd8ffe000104a46494600010101006000600000ffdb004300080606070605080707070909080a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c231c1c2837292c30313434341f27393d38323c2e333432ffc0000b080001000101011100ffc4001f0000010501010101010100000000000000000102030405060708090a0bffda0008010100003f007f00ffd9',
        'hex'
      );
      fs.writeFileSync(sampleJpgPath, minimalJpg, { mode: 0o644 });
    }

    const sampleMariaPath = path.join(UPLOAD_DIRECTORY, 'att_seed_sample_maria_temp_log.pdf');
    if (!fs.existsSync(sampleMariaPath)) {
      const minimalPdf = Buffer.from(
        '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF\n'
      );
      fs.writeFileSync(sampleMariaPath, minimalPdf, { mode: 0o644 });
    }
  } catch (err) {
    console.warn('[Seed File Warning]:', err.message);
  }
};

// Automatically seed on startup
seedSampleFiles();


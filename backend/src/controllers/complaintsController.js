/**
 * Complaints Controller
 * 
 * The Controller bridges HTTP requests and Business Logic (Services).
 * Responsibilities:
 * 1. Read input from req.params, req.query, and req.body.
 * 2. Invoke the corresponding service method.
 * 3. Send back the HTTP response with appropriate status code and JSON payload.
 * 
 * Notice that the controller DOES NOT contain database queries or raw arrays.
 * That separation keeps the code modular, testable, and maintainable.
 */

import * as complaintsService from '../services/complaintsService.js';
import path from 'path';
import fs from 'fs';
import { UPLOAD_DIRECTORY } from '../services/fileSecurityService.js';


/**
 * GET /api/complaints
 * Retrieves list of complaints with role-based scoping:
 * - Students: Scoped strictly to complaints they own (matching studentId / studentEmail).
 * - Admins: Permitted to view all campus complaints across departments.
 */
export const getComplaints = async (req, res, next) => {
  try {
    const { status, category, priority, search } = req.query;

    const filters = {
      status,
      category,
      priority,
      search,
    };

    // Level 5 Authorization Scoping:
    // If the caller is a student, enforce their identity to prevent unauthorized viewing of others' tickets
    if (req.user?.role === 'student') {
      filters.studentId = req.user.id;
      filters.studentEmail = req.user.email;
    } else if (req.user?.role === 'admin') {
      // Admins may optionally filter by specific studentId via query parameter
      if (req.query.studentId) {
        filters.studentId = req.query.studentId;
      }
    }

    const complaints = await complaintsService.getAllComplaints(filters);

    return res.status(200).json({
      success: true,
      count: complaints.length,
      data: complaints,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/complaints/:id
 * Retrieves a single complaint by ID or ticketNumber.
 * Ownership and role authorization is pre-verified by `checkComplaintAccess` middleware.
 */
export const getComplaintById = async (req, res, next) => {
  try {
    // If checkComplaintAccess middleware has already fetched and verified the resource, use it directly
    const complaint = req.complaint || (await complaintsService.getComplaintById(req.params.id));

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Complaint Not Found',
        message: `No complaint found matching identifier "${req.params.id}".`,
      });
    }

    return res.status(200).json({
      success: true,
      data: complaint,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/complaints
 * Creates a new complaint ticket
 */
export const createComplaint = async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      // If user is authenticated via JWT token, use verified claims from token
      studentId: req.user?.id || req.body.studentId,
      studentName: req.user?.name || req.body.studentName,
      studentEmail: req.user?.email || req.body.studentEmail,
    };

    const newComplaint = await complaintsService.createComplaint(payload);

    // 201 Created status code signifies that a new resource has been created
    return res.status(201).json({
      success: true,
      message: 'Complaint ticket created successfully.',
      data: newComplaint,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/complaints/:id
 * Updates an existing complaint (status, notes, priority, etc.)
 */
export const updateComplaint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = {
      ...req.body,
      actorName: req.user?.name || req.body.actorName,
      actorRole: req.user?.role || req.body.actorRole,
    };

    const updated = await complaintsService.updateComplaint(id, payload);

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Complaint Not Found',
        message: `Cannot update. No complaint found with identifier "${id}".`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Complaint ticket updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/complaints/:id
 * Removes a complaint ticket from the system
 */
export const deleteComplaint = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deleted = await complaintsService.deleteComplaint(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Complaint Not Found',
        message: `Cannot delete. No complaint found with identifier "${id}".`,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Complaint "${deleted.ticketNumber}" was successfully deleted.`,
      deletedId: deleted.id,
      ticketNumber: deleted.ticketNumber,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/complaints/:id/comments
 * Adds a new comment / message to a complaint ticket.
 * Ownership has already been verified by `checkComplaintAccess` middleware.
 * - Students can only add comments to tickets they own.
 * - Admins can add comments to any ticket.
 */
export const addComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Comment message cannot be empty.',
      });
    }

    const newComment = await complaintsService.addCommentToComplaint(id, {
      userId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role === 'admin' ? 'Admin' : 'Student',
      message: message.trim(),
    });

    if (!newComment) {
      return res.status(404).json({
        success: false,
        error: 'Complaint Not Found',
        message: `No complaint found with identifier "${id}".`,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Comment added successfully.',
      data: newComment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/complaints/:id/attachment
 * Uploads a verified attachment to a complaint ticket.
 * Ownership has already been verified by checkComplaintAccess.
 * Multer and validateAndSecureAttachment have already verified:
 * 1. File size <= 5MB
 * 2. Magic bytes (PDF, JPG, PNG)
 * 3. File extension and generated randomized filename
 * 4. Permissions set to 0644 (non-executable)
 */
export const uploadAttachment = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.verifiedAttachment) {
      return res.status(400).json({
        success: false,
        error: 'Missing File',
        message: 'No valid file attachment was provided in the request.',
      });
    }

    const updatedComplaint = await complaintsService.addAttachmentToComplaint(
      id,
      req.verifiedAttachment
    );

    if (!updatedComplaint) {
      return res.status(404).json({
        success: false,
        error: 'Complaint Not Found',
        message: `No complaint found with identifier "${id}".`,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Attachment uploaded and verified successfully.',
      data: {
        attachment: req.verifiedAttachment,
        complaint: updatedComplaint,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/complaints/:id/attachment
 * GET /api/complaints/:id/attachments/:attachmentId
 * Securely streams an attachment file to authorized users.
 * Protected by authenticate + checkComplaintAccess (IDOR Protection).
 * - Students can ONLY download attachments for their own complaints.
 * - Cross-student downloads receive HTTP 403 Forbidden.
 * - Sets nosniff, strict CSP, and Content-Disposition to prevent execution.
 */
export const downloadAttachment = async (req, res, next) => {
  try {
    const { id, attachmentId } = req.params;

    // req.complaint is already verified by checkComplaintAccess
    const attachment = await complaintsService.getComplaintAttachment(id, attachmentId);

    if (!attachment) {
      return res.status(404).json({
        success: false,
        error: 'Attachment Not Found',
        message: 'No attachment found for this complaint ticket.',
      });
    }

    // Path traversal defense: ensure basename only
    const safeFilename = path.basename(attachment.storedFilename);
    const safeFilePath = path.resolve(UPLOAD_DIRECTORY, safeFilename);

    if (!safeFilePath.startsWith(UPLOAD_DIRECTORY)) {
      return res.status(403).json({
        success: false,
        error: 'Security Violation',
        message: 'Path traversal attempt detected.',
      });
    }

    if (!fs.existsSync(safeFilePath)) {
      return res.status(404).json({
        success: false,
        error: 'File Missing',
        message: 'The requested attachment file is missing from server storage.',
      });
    }

    // Security Headers:
    // 1. Content-Type strictly determined by binary magic byte inspection
    res.setHeader('Content-Type', attachment.mimeType);

    // 2. Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // 3. Strict CSP to forbid script execution in case of HTML/SVG payload
    res.setHeader('Content-Security-Policy', "default-src 'none'");

    // 4. Force download rather than inline execution
    const safeOriginalName = (attachment.originalName || 'download').replace(/[^a-zA-Z0-9._-]/g, '_');
    res.setHeader('Content-Disposition', `attachment; filename="${safeOriginalName}"`);

    // Stream file securely to client
    const fileStream = fs.createReadStream(safeFilePath);
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
};



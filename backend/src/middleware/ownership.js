/**
 * Ownership & Access Control Middleware
 * 
 * Level 5: Prevents Broken Access Control and Insecure Direct Object References (IDOR).
 * 
 * OWASP Top 10 - A01:2021 Broken Access Control:
 * "IDOR occurs when an application provides direct access to objects based on user-supplied input.
 * As a result of this vulnerability attackers can bypass authorization and access resources in the system
 * directly, for example database records or files."
 * 
 * This middleware ensures:
 * - Admin users can view/manage any complaint.
 * - Student users can ONLY access complaints they personally created.
 * - Any unauthorized access attempt receives HTTP 403 Forbidden.
 */

import * as complaintsService from '../services/complaintsService.js';

export const checkComplaintAccess = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required. Please log in.',
      });
    }

    const complaint = await complaintsService.getComplaintById(id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Complaint Not Found',
        message: `No complaint found matching identifier "${id}".`,
      });
    }

    // 1. Admin users have elevated oversight permissions across all complaints
    if (req.user.role === 'admin') {
      req.complaint = complaint;
      return next();
    }

    // 2. Student role: Verify ownership
    const isOwner =
      (complaint.studentId && req.user.id && String(complaint.studentId) === String(req.user.id)) ||
      (complaint.studentEmail && req.user.email && complaint.studentEmail.toLowerCase() === req.user.email.toLowerCase());

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: "Access denied. You are not authorized to access another student's complaint (IDOR protection enforced).",
      });
    }

    // Attach verified complaint to request to prevent duplicate database lookups in controllers
    req.complaint = complaint;
    next();
  } catch (error) {
    next(error);
  }
};

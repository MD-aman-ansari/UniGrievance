/**
 * Complaints Routes
 * 
 * Level 5: Enforces Role-Based Access Control (RBAC) and IDOR Protection.
 * 
 * Access Matrix:
 * - GET /api/complaints            -> Authenticated (Students see own tickets; Admins see all)
 * - GET /api/complaints/:id        -> Authenticated + Ownership Check (IDOR protection: student can only view own)
 * - POST /api/complaints           -> Authenticated (Student / Admin can lodge tickets)
 * - POST /api/complaints/:id/comments -> Authenticated + Ownership Check (Student comments on own; Admin on all)
 * - PUT /api/complaints/:id        -> Authenticated + Admin Role (Only Admin can change status / resolution)
 * - DELETE /api/complaints/:id     -> Authenticated + Admin Role (Only Admin can delete tickets)
 */

import { Router } from 'express';
import * as complaintsController from '../controllers/complaintsController.js';
import { validateCreateComplaint, validateUpdateComplaint, validateAddComment } from '../middleware/validator.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { checkComplaintAccess } from '../middleware/ownership.js';
import { 
  uploadAttachmentMulter, 
  validateAndSecureAttachment, 
  handleMulterErrors 
} from '../middleware/fileUpload.js';

const router = Router();

// Level 9: Security Lab Standalone Upload Probe
router.post(
  '/security-lab/test-upload',
  authenticate,
  uploadAttachmentMulter.single('file'),
  validateAndSecureAttachment,
  (req, res) => {
    return res.status(200).json({
      success: true,
      message: 'Upload passed all security checks! Magic bytes verified, randomized filename assigned.',
      data: req.verifiedAttachment,
    });
  },
  handleMulterErrors
);

// 1. Scoped Complaints List
// Students get their own tickets; Admins get all tickets across campus
router.get('/', authenticate, complaintsController.getComplaints);

// 2. Single Complaint Details with IDOR Protection
// Admin can view any; Student can ONLY view tickets matching their identity
router.get('/:id', authenticate, checkComplaintAccess, complaintsController.getComplaintById);

// Level 9: Secure Attachment Download (Protected by authenticate + checkComplaintAccess IDOR Defense)
router.get(
  '/:id/attachment',
  authenticate,
  checkComplaintAccess,
  complaintsController.downloadAttachment
);

router.get(
  '/:id/attachments/:attachmentId',
  authenticate,
  checkComplaintAccess,
  complaintsController.downloadAttachment
);

// Level 9: Upload Attachment to Existing Complaint (Protected by authenticate + checkComplaintAccess)
router.post(
  '/:id/attachment',
  authenticate,
  checkComplaintAccess,
  uploadAttachmentMulter.single('attachment'),
  validateAndSecureAttachment,
  complaintsController.uploadAttachment,
  handleMulterErrors
);

// 3. Lodge a Complaint
// Authenticated students create tickets; user identity is bound from JWT
router.post('/', authenticate, requireRole('student', 'admin'), validateCreateComplaint, complaintsController.createComplaint);


// 4. Add Comment / Message to Complaint Ticket
// Ownership enforced: Student can only comment on their own ticket; Admin can comment on any
// Level 6: validateAddComment prevents oversized, malformed, or invalid types
router.post('/:id/comments', authenticate, checkComplaintAccess, validateAddComment, complaintsController.addComment);

// 5. Update Complaint Status & Resolution (Admin Only)
// Students attempting to change status receive HTTP 403 Forbidden
router.put('/:id', authenticate, requireRole('admin'), validateUpdateComplaint, complaintsController.updateComplaint);

// 6. Delete Complaint (Admin Only)
// Students attempting to delete records receive HTTP 403 Forbidden
router.delete('/:id', authenticate, requireRole('admin'), complaintsController.deleteComplaint);

export default router;


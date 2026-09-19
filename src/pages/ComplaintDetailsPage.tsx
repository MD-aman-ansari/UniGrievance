import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { ComplaintStatus } from '../types';
import { 
  ArrowLeft, 
  Clock, 
  MapPin, 
  Building2, 
  User, 
  Mail, 
  Hash, 
  CheckCircle2, 
  ShieldCheck, 
  MessageSquare, 
  Send,
  AlertOctagon,
  Calendar,
  Trash2,
  Paperclip,
  Download,
  Upload,
  FileText,
  Image as ImageIcon,
  ShieldAlert,
  FileCheck
} from 'lucide-react';

export const ComplaintDetailsPage: React.FC = () => {
  const { 
    selectedComplaint, 
    currentUser, 
    navigate, 
    updateComplaintStatus, 
    deleteComplaint, 
    addComment,
    uploadAttachment,
    downloadAttachment 
  } = useApp();

  const [adminNote, setAdminNote] = useState('');
  const [selectedNewStatus, setSelectedNewStatus] = useState<ComplaintStatus>('IN_PROGRESS');
  const [actionSuccess, setActionSuccess] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Attachment upload state
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [attachmentSuccess, setAttachmentSuccess] = useState<string | null>(null);
  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null);

  // Comment state for students and admins
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);


  if (!selectedComplaint) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4">
        <AlertOctagon className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Ticket Not Found</h2>
        <p className="text-xs text-slate-500">The selected complaint ticket does not exist or has been removed.</p>
        <button
          onClick={() => navigate(currentUser?.role === 'admin' ? 'admin-dashboard' : 'my-complaints')}
          className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Level 5 Ownership Check (IDOR Guard)
  const isOwner =
    currentUser?.role === 'admin' ||
    (currentUser &&
      ((currentUser.id && selectedComplaint.studentId === currentUser.id) ||
        (currentUser.email && selectedComplaint.studentEmail?.toLowerCase() === currentUser.email.toLowerCase())));

  // If a student tries to access another student's complaint (IDOR Attempt)
  if (!isOwner) {
    return (
      <div id="idor-block-banner" className="max-w-3xl mx-auto space-y-6 py-8">
        <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-8 space-y-5">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-rose-100 rounded-xl text-rose-700">
              <AlertOctagon className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-200/60 px-2.5 py-0.5 rounded-full">
                HTTP 403 Forbidden — IDOR Blocked
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                Unauthorized Ticket Access Detected
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                You are authenticated as <strong>{currentUser?.name}</strong> ({currentUser?.email}), but ticket{' '}
                <strong className="font-mono text-rose-800">{selectedComplaint.ticketNumber}</strong> belongs to another student.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-rose-200/80 text-xs space-y-2">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-rose-600" />
              Level 5 Ownership Guard Enforced:
            </h4>
            <p className="text-slate-600">
              Insecure Direct Object Reference (IDOR) occurs when an attacker modifies a resource ID parameter (e.g. changing <code>/api/complaints/101</code> to <code>/api/complaints/102</code>).
              Our backend middleware <code>checkComplaintAccess</code> validates that <code>req.user.id === complaint.studentId</code> before returning sensitive grievance records.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => navigate('my-complaints')}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
            >
              Return to My Complaints
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleAdminAction = (e: React.FormEvent) => {
    e.preventDefault();
    updateComplaintStatus(selectedComplaint.id, selectedNewStatus, adminNote);
    setAdminNote('');
    setActionSuccess(true);
    setTimeout(() => setActionSuccess(false), 3000);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setIsSubmittingComment(true);
    setCommentError(null);

    const result = await addComment(selectedComplaint.id, commentText.trim());
    setIsSubmittingComment(false);

    if (result.success) {
      setCommentText('');
    } else {
      setCommentError(result.error || 'Failed to submit message.');
    }
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAttachmentError(null);
    setAttachmentSuccess(null);

    // Client-side advisory check
    if (file.size > 5 * 1024 * 1024) {
      setAttachmentError('File size exceeds the 5 MB limit.');
      return;
    }

    setIsUploadingAttachment(true);
    const result = await uploadAttachment(selectedComplaint.id, file);
    setIsUploadingAttachment(false);

    // Reset input
    e.target.value = '';

    if (result.success) {
      setAttachmentSuccess(`Verified & stored securely: ${result.data?.attachment?.originalName || file.name}`);
      setTimeout(() => setAttachmentSuccess(null), 4500);
    } else {
      setAttachmentError(result.error || 'Upload failed validation.');
    }
  };

  const handleDownload = async (attachmentId?: string, filename?: string) => {
    setDownloadFeedback('Verifying identity & streaming file...');
    const result = await downloadAttachment(selectedComplaint.id, attachmentId, filename);
    if (!result.success) {
      setDownloadFeedback(`Forbidden: ${result.error} (Status: ${result.status})`);
    } else {
      setDownloadFeedback('Download started successfully.');
      setTimeout(() => setDownloadFeedback(null), 3000);
    }
  };


  return (
    <div id="page-complaint-details" className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          id="complaint-details-back-btn"
          onClick={() => {
            if (currentUser?.role === 'admin') navigate('admin-dashboard');
            else navigate('my-complaints');
          }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {currentUser?.role === 'admin' ? 'Admin Console' : 'My Complaints'}
        </button>

        <span className="text-xs font-mono text-slate-400">
          Internal ID: {selectedComplaint.id}
        </span>
      </div>

      {/* Main Ticket Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Top bar with Ticket ID, Badges, and Date */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-sm font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
              {selectedComplaint.ticketNumber}
            </span>
            <StatusBadge status={selectedComplaint.status} size="md" />
            <PriorityBadge priority={selectedComplaint.priority} />
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Lodged: {new Date(selectedComplaint.createdAt).toLocaleString()}
          </div>
        </div>

        {/* Title and Description */}
        <div className="space-y-3">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
            {selectedComplaint.title}
          </h1>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {selectedComplaint.description}
          </div>
        </div>

        {/* Meta Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <MapPin className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block">Location</span>
              <span className="font-medium text-slate-800">{selectedComplaint.location}</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <Building2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block">Assigned Dept</span>
              <span className="font-medium text-slate-800">{selectedComplaint.assignedDepartment}</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <User className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block">Complainant</span>
              <span className="font-medium text-slate-800">{selectedComplaint.studentName}</span>
              <span className="text-[11px] text-slate-400 block">{selectedComplaint.studentEmail}</span>
            </div>
          </div>
        </div>

        {/* Resolution Notes (if any) */}
        {selectedComplaint.resolutionNotes && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Official Resolution Report:
            </div>
            <p className="text-emerald-800/90 leading-relaxed">
              {selectedComplaint.resolutionNotes}
            </p>
          </div>
        )}
      </div>

      {/* Level 9: Attachments & Evidence Section */}
      <div id="complaint-attachments-section" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <Paperclip className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Attachments &amp; Documentary Evidence</h2>
              <p className="text-xs text-slate-500">
                Verified files (PDF, JPG, PNG up to 5 MB). Validated via binary magic bytes with strict IDOR access control.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100 self-start sm:self-auto">
            {selectedComplaint.attachments?.length || 0} File{selectedComplaint.attachments?.length === 1 ? '' : 's'} Attached
          </span>
        </div>

        {/* Existing Attachments List */}
        {selectedComplaint.attachments && selectedComplaint.attachments.length > 0 ? (
          <div className="space-y-3">
            {selectedComplaint.attachments.map((att) => (
              <div
                key={att.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`p-2 rounded-lg shrink-0 ${att.fileSignatureType === 'pdf' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {att.fileSignatureType === 'pdf' ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs sm:text-sm text-slate-800 truncate" title={att.originalName}>
                        {att.originalName}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                        {att.fileSignatureType}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500 mt-0.5">
                      <span>{(att.sizeBytes / 1024).toFixed(1)} KB</span>
                      <span>•</span>
                      <span>Uploaded by {att.uploadedBy}</span>
                      <span>•</span>
                      <span className="font-mono text-[10px] text-slate-400">Stored as: {att.storedFilename}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDownload(att.id, att.originalName)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                    title="Download verified attachment through authenticated & authorized stream"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download File
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-xl border border-dashed border-slate-200 text-center space-y-2">
            <Paperclip className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-medium text-slate-600">No attachments currently linked to this complaint ticket.</p>
            <p className="text-[11px] text-slate-400">Upload maintenance receipts, photos, or medical notes below.</p>
          </div>
        )}

        {/* Feedback message */}
        {downloadFeedback && (
          <div className="text-xs p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 font-medium">
            {downloadFeedback}
          </div>
        )}

        {/* Upload Form for Owner or Admin */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <label className="block text-xs font-bold text-slate-800">
            Upload Additional Evidence (Max 5 MB • PDF, JPG, PNG):
          </label>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-indigo-300 hover:border-indigo-500 bg-indigo-50/30 hover:bg-indigo-50/60 transition-colors">
              <Upload className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-semibold text-indigo-700">
                {isUploadingAttachment ? 'Verifying Binary Magic Bytes...' : 'Select File from Device'}
              </span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleUploadFile}
                disabled={isUploadingAttachment}
                className="hidden"
              />
            </label>
          </div>

          {attachmentError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{attachmentError}</span>
            </div>
          )}

          {attachmentSuccess && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
              <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{attachmentSuccess}</span>
            </div>
          )}

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 space-y-1">
            <span className="font-semibold text-slate-700 block">Level 9 Security Controls Active:</span>
            <ul className="list-disc list-inside space-y-0.5 text-slate-600">
              <li>Client-provided extension &amp; MIME types are ignored; binary magic bytes are inspected.</li>
              <li>Files are renamed to random UUIDs/hashes to prevent path traversal &amp; filename collisions.</li>
              <li>Stored in isolated storage with file execution bits stripped (<code>chmod 0644</code>).</li>
              <li>Enforced with <code>checkComplaintAccess</code> IDOR authorization middleware.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Security Architecture Callout: IDOR / BOLA Prevention */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 text-xs text-amber-950 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold block">Security Concept: Broken Object Level Authorization (OWASP API1:2019 / BOLA)</span>
          <p className="text-amber-900/90 leading-relaxed">
            In standard REST architecture, a user might change the URL parameter from <code>/complaints/1001</code> to <code>/complaints/1004</code>. In <strong>Level 4 &amp; 5</strong>, our Express authorization middleware will verify that <code>req.user.id === complaint.studentId</code> (or <code>req.user.role === 'admin'</code>). If an unauthorized student requests another student's grievance, the API will strictly reject with HTTP <code>403 Forbidden</code>.
          </p>
        </div>
      </div>

      {/* Audit Timeline / Progress History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900">Audit Trail &amp; Lifecycle Timeline</h2>
        </div>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {selectedComplaint.timeline.map((event, idx) => (
            <div key={event.id || idx} className="relative group">
              <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-indigo-600 group-hover:scale-125 transition-transform" />
              <div className="space-y-1 bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 text-xs">{event.actorName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-medium">
                      {event.actorRole}
                    </span>
                    <StatusBadge status={event.status} size="sm" />
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {new Date(event.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{event.comment}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comment Section (Level 5: Students add comments to their own complaints; Admins to all) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            {currentUser?.role === 'admin' ? 'Administrative Inquiry & Response' : 'Add Comment / Follow-up Message'}
          </h2>
        </div>
        <p className="text-xs text-slate-500">
          Post updates, clarify maintenance issues, or submit technician responses to this complaint ticket.
        </p>

        {commentError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-600" />
            <span>{commentError}</span>
          </div>
        )}

        <form onSubmit={handleAddComment} className="space-y-3">
          <textarea
            id="complaint-comment-input"
            rows={2}
            placeholder={
              currentUser?.role === 'admin'
                ? 'Type an official update or inquiry for the student...'
                : 'Provide additional details or question for the maintenance department...'
            }
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
          <div className="flex justify-end">
            <button
              id="submit-comment-btn"
              type="submit"
              disabled={isSubmittingComment || !commentText.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmittingComment ? 'Posting...' : 'Post Comment'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Admin Action Console (Level 5: Strictly Restricted to Admin Role) */}
      {currentUser?.role === 'admin' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">Administrative Action Console</h2>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
              Admin Authorized
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Authorize status transitions (e.g. assigning to field contractors, scheduling site inspections, or closing tickets).
          </p>

          {actionSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Complaint status and audit timeline successfully updated!</span>
            </div>
          )}

          <form onSubmit={handleAdminAction} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Set New Status</label>
                <select
                  id="admin-new-status-select"
                  value={selectedNewStatus}
                  onChange={(e) => setSelectedNewStatus(e.target.value as ComplaintStatus)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="PENDING">PENDING (Under review)</option>
                  <option value="IN_PROGRESS">IN_PROGRESS (Technician dispatched)</option>
                  <option value="RESOLVED">RESOLVED (Service restored / Verified)</option>
                  <option value="REJECTED">REJECTED (Duplicate or out of scope)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Department</label>
                <input
                  type="text"
                  disabled
                  value={selectedComplaint.assignedDepartment}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 bg-slate-100 text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Resolution Note / Technician Log
              </label>
              <textarea
                id="admin-resolution-note-input"
                rows={2}
                placeholder="e.g., Plumber replaced 3/4 inch ball valve; verified zero pressure drops."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
              <button
                id="admin-update-status-btn"
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-sm flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Update Status &amp; Append Audit Log</span>
              </button>

              <button
                id="delete-complaint-btn"
                type="button"
                onClick={async () => {
                  if (window.confirm(`Are you sure you want to permanently delete ticket ${selectedComplaint.ticketNumber}? This will trigger DELETE /api/complaints/${selectedComplaint.id}.`)) {
                    setIsDeleting(true);
                    await deleteComplaint(selectedComplaint.id);
                    setIsDeleting(false);
                    navigate('admin-dashboard');
                  }
                }}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>{isDeleting ? 'Deleting via API...' : 'Delete Ticket (DELETE API)'}</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>
            Status changes and ticket resolution are managed exclusively by Campus Administrators.
          </span>
          <span className="font-mono text-[11px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
            Role: Student
          </span>
        </div>
      )}
    </div>
  );
};

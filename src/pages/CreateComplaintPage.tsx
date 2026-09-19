import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ComplaintCategory, ComplaintPriority } from '../types';
import { 
  FilePlus, 
  MapPin, 
  Tag, 
  AlertTriangle, 
  UploadCloud, 
  ArrowLeft, 
  Check, 
  ShieldAlert 
} from 'lucide-react';

export const CreateComplaintPage: React.FC = () => {
  const { navigate, addComplaint } = useApp();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ComplaintCategory>('Hostel & Housing');
  const [priority, setPriority] = useState<ComplaintPriority>('MEDIUM');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const categories: ComplaintCategory[] = [
    'Hostel & Housing',
    'Academic & Courses',
    'IT & Labs',
    'Library Services',
    'Cafeteria & Hygiene',
    'Campus Infrastructure',
    'Fees & Accounts',
  ];

  const handleSimulatedFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileNames = Array.from(e.target.files).map(f => f.name);
      setAttachedFiles((prev) => [...prev, ...fileNames]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!title.trim() || title.length < 5) {
      setError('Title must be at least 5 characters long and describe the problem.');
      return;
    }
    if (!location.trim()) {
      setError('Please specify the exact room, wing, or campus location.');
      return;
    }
    if (!description.trim() || description.length < 15) {
      setError('Please provide at least 15 characters describing what occurred and when.');
      return;
    }

    const newTicketId = await addComplaint({
      title,
      category,
      priority,
      location,
      description: description + (attachedFiles.length > 0 ? `\n[Simulated Attachments: ${attachedFiles.join(', ')}]` : ''),
    });

    // Navigate to the newly created complaint details page
    navigate('complaint-details', newTicketId);
  };

  return (
    <div id="page-create-complaint" className="max-w-3xl mx-auto py-4 sm:py-8 space-y-6">
      {/* Back button */}
      <button
        id="create-complaint-back-btn"
        onClick={() => navigate('student-dashboard')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <FilePlus className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Lodge New Grievance</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Submit a formal service request or complaint. An official ticket number and SLA tracker will be assigned immediately.
          </p>
        </div>

        {/* Security Learning Callout */}
        <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-4 text-xs text-indigo-950 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">Security & Validation Note (Level 1 Foundation):</span>
            <p className="text-indigo-900/80 leading-relaxed">
              In this UI layer, inputs are validated for user experience. In <strong>Level 5 (Complaint REST APIs)</strong>, the backend will strictly enforce input sanitation against <strong>XSS (Cross-Site Scripting)</strong> and use parameterized queries in PostgreSQL to prevent <strong>SQL Injection (OWASP A03:2021)</strong>. File uploads will be verified using strict MIME-type sniffing to prevent malicious executable execution.
            </p>
          </div>
        </div>

        {/* Error Notice */}
        {error && (
          <div id="create-complaint-error" className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
            <span className="font-semibold">Validation Error:</span> {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Complaint Subject / Headline <span className="text-rose-500">*</span>
            </label>
            <input
              id="complaint-title-input"
              type="text"
              placeholder="e.g., Water leakage in Block B 3rd Floor Washroom"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category / Domain <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <select
                  id="complaint-category-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Urgency / Priority <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <AlertTriangle className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <select
                  id="complaint-priority-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as ComplaintPriority)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="LOW">Low (Minor inconvenience)</option>
                  <option value="MEDIUM">Medium (Normal service request)</option>
                  <option value="HIGH">High (Urgent attention needed)</option>
                  <option value="CRITICAL">Critical (Safety hazard / Severe outage)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Exact Location / Room / Floor <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                id="complaint-location-input"
                type="text"
                placeholder="e.g. Hostel Block B, 3rd Floor Washroom (near Room 312)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Detailed Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="complaint-description-input"
              rows={4}
              placeholder="Describe the issue in detail: when it began, its impact, and any attempted initial remediation..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          {/* File Attachment Upload Simulation */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Attach Supporting Evidence / Photos (Optional)
            </label>
            <div className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-5 text-center transition-colors bg-slate-50/50">
              <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-700 font-medium">
                Click or drag photos of damaged equipment or location
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG up to 5MB</p>
              <input
                id="complaint-file-upload-input"
                type="file"
                multiple
                accept="image/*"
                onChange={handleSimulatedFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => document.getElementById('complaint-file-upload-input')?.click()}
                className="mt-3 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
              >
                Browse Files
              </button>

              {attachedFiles.length > 0 && (
                <div className="mt-3 text-left bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">Attached:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {attachedFiles.map((name, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-700 flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" />
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              id="complaint-cancel-btn"
              type="button"
              onClick={() => navigate('student-dashboard')}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              id="complaint-submit-btn"
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-100 flex items-center gap-2"
            >
              <FilePlus className="w-4 h-4" />
              <span>Submit Grievance</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

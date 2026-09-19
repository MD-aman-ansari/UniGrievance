export type Role = 'student' | 'admin' | 'guest';

export type ComplaintStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';

export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ComplaintCategory = 
  | 'Hostel & Housing'
  | 'Academic & Courses'
  | 'IT & Labs'
  | 'Library Services'
  | 'Cafeteria & Hygiene'
  | 'Campus Infrastructure'
  | 'Fees & Accounts';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  studentId?: string;
  department?: string;
}

export interface TimelineEvent {
  id: string;
  status: ComplaintStatus;
  timestamp: string;
  actorName: string;
  actorRole: string;
  comment: string;
}

export interface Complaint {
  id: string;
  ticketNumber: string;
  title: string;
  category: ComplaintCategory;
  description: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  location: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  createdAt: string;
  updatedAt: string;
  assignedDepartment: string;
  resolutionNotes?: string;
  timeline: TimelineEvent[];
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  originalName: string;
  storedFilename: string;
  mimeType: string;
  fileSignatureType: 'pdf' | 'jpg' | 'png';
  sizeBytes: number;
  uploadedAt: string;
  uploadedBy: string;
  uploaderEmail?: string;
}

export type PageView = 
  | 'home'
  | 'register'
  | 'login'
  | 'student-dashboard'
  | 'create-complaint'
  | 'my-complaints'
  | 'complaint-details'
  | 'admin-dashboard'
  | 'input-security'
  | 'api-security'
  | 'session-security'
  | 'upload-security';


import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Complaint, ComplaintStatus, PageView, User } from '../types';
import { DEMO_ADMIN, DEMO_STUDENT, INITIAL_COMPLAINTS } from '../mock/data';

interface AppContextType {
  currentUser: User | null;
  token: string | null;
  currentPage: PageView;
  selectedComplaintId: string | null;
  complaints: Complaint[];
  apiConnected: boolean;
  isLoading: boolean;
  navigate: (page: PageView, complaintId?: string) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    role?: 'student' | 'admin';
  }) => Promise<{ success: boolean; error?: string }>;
  loginAs: (role: 'student' | 'admin') => Promise<void>;
  logout: () => void;
  addComplaint: (data: {
    title: string;
    category: Complaint['category'];
    description: string;
    priority: Complaint['priority'];
    location: string;
  }) => Promise<string>;
  updateComplaintStatus: (
    complaintId: string,
    newStatus: ComplaintStatus,
    adminNote?: string
  ) => Promise<void>;
  deleteComplaint: (complaintId: string) => Promise<boolean>;
  addComment: (complaintId: string, message: string) => Promise<{ success: boolean; error?: string }>;
  uploadAttachment: (complaintId: string, file: File) => Promise<{ success: boolean; data?: any; error?: string }>;
  downloadAttachment: (complaintId: string, attachmentId?: string, filename?: string) => Promise<{ success: boolean; error?: string; status?: number }>;
  refreshComplaints: () => Promise<void>;
  selectedComplaint: Complaint | undefined;
}

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('auth_token');
  });
  const [currentUser, setCurrentUser] = useState<User | null>(DEMO_STUDENT);
  const [currentPage, setCurrentPage] = useState<PageView>('home');
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>('cmp_1001');
  const [complaints, setComplaints] = useState<Complaint[]>(INITIAL_COMPLAINTS);
  const [apiConnected, setApiConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Re-verify session token on mount
  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem('auth_token');
      if (!storedToken) return;

      try {
        const response = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });

        if (response.ok) {
          const json = await response.json();
          if (json.success && json.data?.user) {
            setCurrentUser(json.data.user);
            setToken(storedToken);
          }
        } else if (response.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('auth_token');
          setToken(null);
        }
      } catch (err) {
        console.warn('Session verification skipped, keeping local state:', err);
      }
    };

    verifySession();
  }, []);

  // Fetch complaints from Express REST API with role-based scoping (Level 5)
  const refreshComplaints = useCallback(async () => {
    setIsLoading(true);
    try {
      const activeToken = token || localStorage.getItem('auth_token');
      const headers: Record<string, string> = {};
      if (activeToken) {
        headers['Authorization'] = `Bearer ${activeToken}`;
      }

      const response = await fetch(`${API_BASE}/complaints`, { headers });
      if (response.ok) {
        const json = await response.json();
        if (json.success && Array.isArray(json.data)) {
          setComplaints(json.data);
          setApiConnected(true);
          return;
        }
      }
      setApiConnected(false);
    } catch (err) {
      console.warn('API not reachable yet, maintaining local state:', err);
      setApiConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Synchronize on startup
  useEffect(() => {
    refreshComplaints();
  }, [refreshComplaints]);

  const navigate = (page: PageView, complaintId?: string) => {
    if (complaintId) {
      setSelectedComplaintId(complaintId);
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const json = await response.json();

      if (response.ok && json.success && json.data) {
        const { user, token: jwtToken } = json.data;
        setToken(jwtToken);
        setCurrentUser(user);
        localStorage.setItem('auth_token', jwtToken);

        if (user.role === 'admin') {
          navigate('admin-dashboard');
        } else {
          navigate('student-dashboard');
        }

        return { success: true };
      }

      return {
        success: false,
        error: json.message || json.error || 'Authentication failed. Please check your credentials.',
      };
    } catch (err: any) {
      console.warn('Network error during login:', err);
      return {
        success: false,
        error: 'Unable to reach authentication server. Please verify backend is running.',
      };
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    role?: 'student' | 'admin';
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await response.json();

      if (response.ok && json.success && json.data) {
        const { user, token: jwtToken } = json.data;
        setToken(jwtToken);
        setCurrentUser(user);
        localStorage.setItem('auth_token', jwtToken);

        if (user.role === 'admin') {
          navigate('admin-dashboard');
        } else {
          navigate('student-dashboard');
        }

        return { success: true };
      }

      return {
        success: false,
        error: json.message || json.error || 'Registration failed. Please check submitted data.',
      };
    } catch (err: any) {
      console.warn('Network error during registration:', err);
      return {
        success: false,
        error: 'Unable to reach authentication server. Please try again.',
      };
    }
  };

  const loginAs = async (role: 'student' | 'admin') => {
    const email = role === 'student' ? 'alex.rivera@campus.edu' : 'e.vance@campus.edu';
    const password = role === 'student' ? 'student123' : 'admin123';

    const res = await login(email, password);
    if (!res.success) {
      // Fallback if network or DB is not reachable
      if (role === 'student') {
        setCurrentUser(DEMO_STUDENT);
        navigate('student-dashboard');
      } else {
        setCurrentUser(DEMO_ADMIN);
        navigate('admin-dashboard');
      }
    }
  };

  const logout = () => {
    // Notify server of logout (stateless JWT acknowledgment)
    fetch(`${API_BASE}/auth/logout`, { method: 'POST' }).catch(() => {});
    localStorage.removeItem('auth_token');
    setToken(null);
    setCurrentUser(null);
    navigate('home');
  };

  // Helper to build headers with Bearer token
  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  // POST /api/complaints (Protected route)
  const addComplaint = async (data: {
    title: string;
    category: Complaint['category'];
    description: string;
    priority: Complaint['priority'];
    location: string;
  }): Promise<string> => {
    const payload = {
      title: data.title,
      category: data.category,
      description: data.description,
      priority: data.priority,
      location: data.location,
      studentId: currentUser ? currentUser.id : 'usr_student_101',
      studentName: currentUser ? currentUser.name : 'Alex Rivera',
      studentEmail: currentUser ? currentUser.email : 'alex.rivera@campus.edu',
    };

    try {
      const response = await fetch(`${API_BASE}/complaints`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          setComplaints((prev) => [json.data, ...prev]);
          setSelectedComplaintId(json.data.id);
          setApiConnected(true);
          return json.data.id;
        }
      }
    } catch (err) {
      console.warn('Network error when posting to /api/complaints, using local fallback:', err);
    }

    // Fallback if API is offline
    const nextNum = complaints.length + 1;
    const ticketNumber = `TKT-2026-${String(nextNum).padStart(3, '0')}`;
    const id = `cmp_${Date.now()}`;
    const now = new Date().toISOString();

    const newTicket: Complaint = {
      id,
      ticketNumber,
      title: data.title,
      category: data.category,
      description: data.description,
      status: 'PENDING',
      priority: data.priority,
      location: data.location,
      studentId: currentUser ? currentUser.id : 'usr_student_101',
      studentName: currentUser ? currentUser.name : 'Alex Rivera',
      studentEmail: currentUser ? currentUser.email : 'alex.rivera@campus.edu',
      createdAt: now,
      updatedAt: now,
      assignedDepartment: getDepartmentForCategory(data.category),
      timeline: [
        {
          id: `tl_${Date.now()}`,
          status: 'PENDING',
          timestamp: now,
          actorName: currentUser ? currentUser.name : 'Student',
          actorRole: currentUser?.role === 'admin' ? 'Admin' : 'Student',
          comment: 'Complaint ticket lodged in system.',
        },
      ],
    };

    setComplaints((prev) => [newTicket, ...prev]);
    setSelectedComplaintId(id);
    return id;
  };

  // PUT /api/complaints/:id (Protected route)
  const updateComplaintStatus = async (
    complaintId: string,
    newStatus: ComplaintStatus,
    adminNote?: string
  ) => {
    try {
      const response = await fetch(`${API_BASE}/complaints/${complaintId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: newStatus,
          adminComment: adminNote,
          actorName: currentUser ? currentUser.name : 'System Admin',
          actorRole: currentUser?.role === 'admin' ? 'Admin' : 'Staff',
        }),
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          setComplaints((prev) =>
            prev.map((c) => (c.id === complaintId ? json.data : c))
          );
          setApiConnected(true);
          return;
        }
      }
    } catch (err) {
      console.warn('Network error updating complaint via API, using fallback:', err);
    }

    // Fallback local update
    const now = new Date().toISOString();
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id !== complaintId) return c;
        const newTimeline = [
          ...c.timeline,
          {
            id: `tl_${Date.now()}`,
            status: newStatus,
            timestamp: now,
            actorName: currentUser ? currentUser.name : 'System Admin',
            actorRole: 'Admin',
            comment: adminNote || `Status updated to ${newStatus}`,
          },
        ];

        return {
          ...c,
          status: newStatus,
          updatedAt: now,
          resolutionNotes: adminNote ? adminNote : c.resolutionNotes,
          timeline: newTimeline,
        };
      })
    );
  };

  // DELETE /api/complaints/:id (Protected route)
  const deleteComplaint = async (complaintId: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/complaints/${complaintId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        setComplaints((prev) => prev.filter((c) => c.id !== complaintId));
        if (selectedComplaintId === complaintId) {
          setSelectedComplaintId(null);
        }
        setApiConnected(true);
        return true;
      }
    } catch (err) {
      console.warn('Network error deleting complaint via API, using fallback:', err);
    }

    // Fallback local delete
    setComplaints((prev) => prev.filter((c) => c.id !== complaintId));
    if (selectedComplaintId === complaintId) {
      setSelectedComplaintId(null);
    }
    return true;
  };

  // POST /api/complaints/:id/comments (Level 5: Student comments on own complaint, Admin on all)
  const addComment = async (
    complaintId: string,
    message: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE}/complaints/${complaintId}/comments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ message }),
      });

      const json = await response.json();

      if (response.ok && json.success && json.data) {
        setComplaints((prev) =>
          prev.map((c) => {
            if (c.id === complaintId) {
              return {
                ...c,
                timeline: [...c.timeline, json.data],
                updatedAt: new Date().toISOString(),
              };
            }
            return c;
          })
        );
        setApiConnected(true);
        return { success: true };
      }

      return {
        success: false,
        error: json.message || json.error || 'Failed to submit comment.',
      };
    } catch (err: any) {
      console.warn('Network error adding comment:', err);
      // Fallback local append
      const now = new Date().toISOString();
      const localComment = {
        id: `tl_${Date.now()}`,
        status: (selectedComplaint?.status || 'PENDING') as ComplaintStatus,
        timestamp: now,
        actorName: currentUser ? currentUser.name : 'Student',
        actorRole: currentUser?.role === 'admin' ? 'Admin' : 'Student',
        comment: message,
      };

      setComplaints((prev) =>
        prev.map((c) => {
          if (c.id === complaintId) {
            return {
              ...c,
              timeline: [...c.timeline, localComment],
              updatedAt: now,
            };
          }
          return c;
        })
      );
      return { success: true };
    }
  };

  // POST /api/complaints/:id/attachment
  const uploadAttachment = async (
    complaintId: string,
    file: File
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const formData = new FormData();
      formData.append('attachment', file);

      const authHeaders = getAuthHeaders();
      // Remove Content-Type so browser sets multipart boundary automatically
      delete (authHeaders as any)['Content-Type'];

      const response = await fetch(`${API_BASE}/complaints/${complaintId}/attachment`, {
        method: 'POST',
        headers: authHeaders,
        body: formData,
      });

      const json = await response.json();

      if (response.ok && json.success) {
        // Update local complaint state
        setComplaints((prev) =>
          prev.map((c) => {
            if (c.id === complaintId) {
              const currentAttachments = c.attachments || [];
              return {
                ...c,
                attachments: [...currentAttachments, json.data.attachment],
                updatedAt: new Date().toISOString(),
              };
            }
            return c;
          })
        );
        setApiConnected(true);
        return { success: true, data: json.data };
      }

      return {
        success: false,
        error: json.message || json.error || 'Failed to upload attachment.',
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during upload.' };
    }
  };

  // GET /api/complaints/:id/attachment
  const downloadAttachment = async (
    complaintId: string,
    attachmentId?: string,
    filename?: string
  ): Promise<{ success: boolean; error?: string; status?: number }> => {
    try {
      const url = attachmentId 
        ? `${API_BASE}/complaints/${complaintId}/attachments/${attachmentId}`
        : `${API_BASE}/complaints/${complaintId}/attachment`;

      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        let errMsg = `Server returned ${response.status}`;
        try {
          const json = await response.json();
          errMsg = json.message || json.error || errMsg;
        } catch (_) {}
        return { success: false, error: errMsg, status: response.status };
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename || 'attachment';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(objectUrl);

      return { success: true, status: 200 };
    } catch (err: any) {
      return { success: false, error: err.message || 'Download failed' };
    }
  };

  const selectedComplaint = complaints.find((c) => c.id === selectedComplaintId);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        token,
        currentPage,
        selectedComplaintId,
        complaints,
        apiConnected,
        isLoading,
        navigate,
        login,
        register,
        loginAs,
        logout,
        addComplaint,
        updateComplaintStatus,
        deleteComplaint,
        addComment,
        uploadAttachment,
        downloadAttachment,
        refreshComplaints,
        selectedComplaint,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

function getDepartmentForCategory(category: Complaint['category']): string {
  switch (category) {
    case 'Hostel & Housing':
      return 'Civil & Hostel Maintenance';
    case 'Academic & Courses':
      return 'Academic Registrar & Deans Office';
    case 'IT & Labs':
      return 'IT Support & Audiovisual';
    case 'Library Services':
      return 'Library & Learning Resources';
    case 'Cafeteria & Hygiene':
      return 'Campus Health & Dining Services';
    case 'Campus Infrastructure':
      return 'HVAC & Physical Plant';
    case 'Fees & Accounts':
      return 'Finance & Student Accounts';
    default:
      return 'General Grievance Cell';
  }
}

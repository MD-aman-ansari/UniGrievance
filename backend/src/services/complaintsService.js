/**
 * Complaints Service
 * 
 * Level 3: Dual-Mode Persistence Layer (PostgreSQL with In-Memory fallback).
 * 
 * When PostgreSQL / Supabase is connected (via DATABASE_URL):
 *   - Executes parameterized SQL queries using pg.Pool
 *   - Joins `complaints`, `users`, and `comments` tables
 *   - Preserves relational integrity with Foreign Keys
 * 
 * When DATABASE_URL is not yet provided:
 *   - Operates gracefully using in-memory state so local testing is never blocked
 */

import { ALLOWED_CATEGORIES, CATEGORY_DEPARTMENT_MAP } from '../config/index.js';
import { pool, isConnected } from '../config/db.js';

// Seed with initial realistic complaints for in-memory mode
let inMemoryComplaints = [
  {
    id: 'cmp_1001',
    ticketNumber: 'TKT-2026-001',
    title: 'Water leakage in Block B 3rd Floor Washroom',
    category: 'Hostel & Housing',
    description: 'Continuous leaking tap and standing water creating a slip hazard near Room 312. Maintenance notified informally two days ago but not fixed.',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    location: 'Hostel Block B, 3rd Floor',
    studentId: 'usr_student_101',
    studentName: 'Alex Rivera',
    studentEmail: 'alex.rivera@campus.edu',
    createdAt: '2026-09-14T09:30:00.000Z',
    updatedAt: '2026-09-15T11:15:00.000Z',
    assignedDepartment: 'Civil & Hostel Maintenance',
    resolutionNotes: 'Plumbing contractor dispatched; replacement valve being installed today.',
    timeline: [
      {
        id: 'tl_1',
        status: 'PENDING',
        timestamp: '2026-09-14T09:30:00.000Z',
        actorName: 'Alex Rivera',
        actorRole: 'Student',
        comment: 'Grievance ticket created with priority HIGH.',
      },
      {
        id: 'tl_2',
        status: 'IN_PROGRESS',
        timestamp: '2026-09-15T11:15:00.000Z',
        actorName: 'Dr. Eleanor Vance',
        actorRole: 'Admin',
        comment: 'Assigned to Civil & Hostel Maintenance team. Plumber on site.',
      },
    ],
    attachments: [
      {
        id: 'att_seed_101',
        originalName: 'block_b_pipe_leakage_inspection.pdf',
        storedFilename: 'att_seed_sample_leak_report.pdf',
        mimeType: 'application/pdf',
        fileSignatureType: 'pdf',
        sizeBytes: 248,
        uploadedAt: '2026-09-14T09:32:00.000Z',
        uploadedBy: 'Alex Rivera',
        uploaderEmail: 'alex.rivera@campus.edu',
      },
    ],
  },
  {
    id: 'cmp_1002',
    ticketNumber: 'TKT-2026-002',
    title: 'Projector HDMI port damaged in Lab 404',
    category: 'IT & Labs',
    description: 'The ceiling mounted projector fails to receive signal from both faculty and student presentation laptops. Cable socket pins are bent.',
    status: 'PENDING',
    priority: 'MEDIUM',
    location: 'Engineering Building, Room 404',
    studentId: 'usr_student_101',
    studentName: 'Alex Rivera',
    studentEmail: 'alex.rivera@campus.edu',
    createdAt: '2026-09-16T14:20:00.000Z',
    updatedAt: '2026-09-16T14:20:00.000Z',
    assignedDepartment: 'IT Support & Audiovisual',
    timeline: [
      {
        id: 'tl_3',
        status: 'PENDING',
        timestamp: '2026-09-16T14:20:00.000Z',
        actorName: 'Alex Rivera',
        actorRole: 'Student',
        comment: 'Grievance ticket created.',
      },
    ],
    attachments: [
      {
        id: 'att_seed_102',
        originalName: 'hdmi_bent_pins_photo.jpg',
        storedFilename: 'att_seed_sample_projector_port.jpg',
        mimeType: 'image/jpeg',
        fileSignatureType: 'jpg',
        sizeBytes: 154,
        uploadedAt: '2026-09-16T14:25:00.000Z',
        uploadedBy: 'Alex Rivera',
        uploaderEmail: 'alex.rivera@campus.edu',
      },
    ],
  },
  {
    id: 'cmp_1003',
    ticketNumber: 'TKT-2026-003',
    title: 'Incorrect library late fine assessed after book return',
    category: 'Library Services',
    description: 'Returned "Algorithms 4th Edition" on Sept 10th before 4 PM, but the automated account debit logged a $15 overdue charge.',
    status: 'RESOLVED',
    priority: 'LOW',
    location: 'Central Campus Library Desk',
    studentId: 'usr_student_101',
    studentName: 'Alex Rivera',
    studentEmail: 'alex.rivera@campus.edu',
    createdAt: '2026-09-11T16:05:00.000Z',
    updatedAt: '2026-09-13T10:00:00.000Z',
    assignedDepartment: 'Library & Learning Resources',
    resolutionNotes: 'Barcode scanner log verified; return timestamp adjusted and fine reversed to student ledger.',
    timeline: [
      {
        id: 'tl_4',
        status: 'PENDING',
        timestamp: '2026-09-11T16:05:00.000Z',
        actorName: 'Alex Rivera',
        actorRole: 'Student',
        comment: 'Ticket filed regarding fee discrepancy.',
      },
      {
        id: 'tl_5',
        status: 'IN_PROGRESS',
        timestamp: '2026-09-12T08:45:00.000Z',
        actorName: 'Library Staff',
        actorRole: 'Staff',
        comment: 'Checking drop-box checkin log archives.',
      },
      {
        id: 'tl_6',
        status: 'RESOLVED',
        timestamp: '2026-09-13T10:00:00.000Z',
        actorName: 'Dr. Eleanor Vance',
        actorRole: 'Admin',
        comment: 'Fine reversed. Receipt emailed.',
      },
    ],
  },
  {
    id: 'cmp_1004',
    ticketNumber: 'TKT-2026-004',
    title: 'AC unit blowing warm air during mid-day lectures',
    category: 'Campus Infrastructure',
    description: 'Auditorium C air conditioning refrigerant seems depleted. Room temperature reached 84°F during 200-student lecture.',
    status: 'PENDING',
    priority: 'CRITICAL',
    location: 'Auditorium C, Science Block',
    studentId: 'usr_student_202',
    studentName: 'Maria Chen',
    studentEmail: 'm.chen@campus.edu',
    createdAt: '2026-09-17T08:00:00.000Z',
    updatedAt: '2026-09-17T08:00:00.000Z',
    assignedDepartment: 'HVAC & Physical Plant',
    timeline: [
      {
        id: 'tl_7',
        status: 'PENDING',
        timestamp: '2026-09-17T08:00:00.000Z',
        actorName: 'Maria Chen',
        actorRole: 'Student',
        comment: 'Ticket filed due to heat exhaustion concern during lectures.',
      },
    ],
    attachments: [
      {
        id: 'att_seed_104',
        originalName: 'auditorium_temperature_sensor_log.pdf',
        storedFilename: 'att_seed_sample_maria_temp_log.pdf',
        mimeType: 'application/pdf',
        fileSignatureType: 'pdf',
        sizeBytes: 248,
        uploadedAt: '2026-09-17T08:05:00.000Z',
        uploadedBy: 'Maria Chen',
        uploaderEmail: 'm.chen@campus.edu',
      },
    ],
  },
];

let counter = 1005;

/**
 * Fetch all complaints with optional filtering
 */
export const getAllComplaints = async (filters = {}) => {
  // 1. If PostgreSQL is active, query the database tables
  if (pool && isConnected) {
    try {
      let queryText = `
        SELECT 
          c.id,
          c.title,
          c.description,
          c.category,
          c.status,
          c.created_at as "createdAt",
          c.updated_at as "updatedAt",
          c.user_id as "studentId",
          u.name as "studentName",
          u.email as "studentEmail"
        FROM complaints c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE 1=1
      `;
      const queryParams = [];

      if (filters.status) {
        queryParams.push(filters.status.toUpperCase());
        queryText += ` AND c.status = $${queryParams.length}`;
      }

      if (filters.category) {
        queryParams.push(filters.category);
        queryText += ` AND c.category = $${queryParams.length}`;
      }

      if (filters.studentId || filters.studentEmail) {
        queryParams.push(filters.studentId || filters.studentEmail);
        queryText += ` AND (c.user_id::text = $${queryParams.length} OR u.email ILIKE $${queryParams.length})`;
      }

      if (filters.search) {
        queryParams.push(`%${filters.search}%`);
        queryText += ` AND (c.title ILIKE $${queryParams.length} OR c.description ILIKE $${queryParams.length})`;
      }

      queryText += ` ORDER BY c.created_at DESC`;

      const result = await pool.query(queryText, queryParams);
      
      // Map to frontend-friendly schema
      return result.rows.map((row) => ({
        ...row,
        ticketNumber: `TKT-${row.id.substring(0, 8).toUpperCase()}`,
        priority: 'MEDIUM',
        location: 'Campus Facility',
        assignedDepartment: CATEGORY_DEPARTMENT_MAP[row.category] || 'General Grievance Cell',
        timeline: [],
      }));
    } catch (err) {
      console.warn('[DB Query Error in getAllComplaints, falling back]:', err.message);
    }
  }

  // 2. In-Memory fallback
  let result = [...inMemoryComplaints];

  if (filters.status) {
    result = result.filter((c) => c.status.toLowerCase() === filters.status.toLowerCase());
  }

  if (filters.category) {
    result = result.filter((c) => c.category.toLowerCase() === filters.category.toLowerCase());
  }

  if (filters.priority) {
    result = result.filter((c) => c.priority.toLowerCase() === filters.priority.toLowerCase());
  }

  if (filters.studentId || filters.studentEmail) {
    result = result.filter(
      (c) =>
        (filters.studentId && c.studentId === filters.studentId) ||
        (filters.studentEmail && c.studentEmail && c.studentEmail.toLowerCase() === filters.studentEmail.toLowerCase())
    );
  }

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.ticketNumber.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q)
    );
  }

  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return result;
};

/**
 * Fetch a single complaint by ID or ticketNumber
 */
export const getComplaintById = async (idOrTicket) => {
  if (pool && isConnected) {
    try {
      // 1. Fetch complaint & user details
      const complaintQuery = `
        SELECT 
          c.id,
          c.title,
          c.description,
          c.category,
          c.status,
          c.created_at as "createdAt",
          c.updated_at as "updatedAt",
          c.user_id as "studentId",
          u.name as "studentName",
          u.email as "studentEmail"
        FROM complaints c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.id::text = $1
      `;
      const compRes = await pool.query(complaintQuery, [idOrTicket]);

      if (compRes.rows.length > 0) {
        const row = compRes.rows[0];

        // 2. Fetch associated comments/timeline for this ticket
        const commentsQuery = `
          SELECT 
            cm.id,
            cm.message as comment,
            cm.created_at as timestamp,
            u.name as "actorName",
            u.role as "actorRole"
          FROM comments cm
          LEFT JOIN users u ON cm.user_id = u.id
          WHERE cm.complaint_id = $1
          ORDER BY cm.created_at ASC
        `;
        const commentsRes = await pool.query(commentsQuery, [row.id]);

        return {
          ...row,
          ticketNumber: `TKT-${row.id.substring(0, 8).toUpperCase()}`,
          priority: 'HIGH',
          location: 'Campus Facility',
          assignedDepartment: CATEGORY_DEPARTMENT_MAP[row.category] || 'General Grievance Cell',
          timeline: commentsRes.rows.map((c) => ({
            ...c,
            status: row.status,
          })),
        };
      }
    } catch (err) {
      console.warn('[DB Query Error in getComplaintById, falling back]:', err.message);
    }
  }

  // Fallback in-memory
  return (
    inMemoryComplaints.find(
      (c) => c.id === idOrTicket || c.ticketNumber.toLowerCase() === idOrTicket.toLowerCase()
    ) || null
  );
};

/**
 * Create a new complaint ticket
 */
export const createComplaint = async (data) => {
  const assignedDepartment = CATEGORY_DEPARTMENT_MAP[data.category] || 'General Grievance Cell';

  if (pool && isConnected) {
    try {
      // Ensure demo user exists in database
      const demoUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

      const insertQuery = `
        INSERT INTO complaints (user_id, title, description, category, status)
        VALUES ($1, $2, $3, $4, 'PENDING')
        RETURNING *
      `;
      const res = await pool.query(insertQuery, [
        demoUserId,
        data.title.trim(),
        data.description.trim(),
        data.category,
      ]);

      const inserted = res.rows[0];

      // Insert initial audit comment
      await pool.query(
        `INSERT INTO comments (complaint_id, user_id, message) VALUES ($1, $2, $3)`,
        [inserted.id, demoUserId, 'Grievance ticket created in database.']
      );

      return {
        id: inserted.id,
        ticketNumber: `TKT-${inserted.id.substring(0, 8).toUpperCase()}`,
        title: inserted.title,
        category: inserted.category,
        description: inserted.description,
        status: inserted.status,
        priority: data.priority || 'MEDIUM',
        location: data.location || 'Campus Facility',
        studentId: demoUserId,
        studentName: data.studentName || 'Alex Rivera',
        studentEmail: data.studentEmail || 'alex.rivera@campus.edu',
        createdAt: inserted.created_at,
        updatedAt: inserted.updated_at,
        assignedDepartment,
        timeline: [
          {
            id: `tl_${Date.now()}`,
            status: 'PENDING',
            timestamp: inserted.created_at,
            actorName: data.studentName || 'Alex Rivera',
            actorRole: 'Student',
            comment: 'Grievance ticket created in database.',
          },
        ],
      };
    } catch (err) {
      console.warn('[DB Query Error in createComplaint, using fallback]:', err.message);
    }
  }

  // Fallback in-memory
  const nextNumber = counter++;
  const ticketNumber = `TKT-2026-${String(nextNumber).padStart(3, '0')}`;
  const id = `cmp_${Date.now()}`;
  const now = new Date().toISOString();

  const newComplaint = {
    id,
    ticketNumber,
    title: data.title.trim(),
    category: data.category,
    description: data.description.trim(),
    status: 'PENDING',
    priority: data.priority || 'MEDIUM',
    location: data.location.trim(),
    studentId: data.studentId || 'usr_student_101',
    studentName: data.studentName || 'Alex Rivera',
    studentEmail: data.studentEmail || 'alex.rivera@campus.edu',
    createdAt: now,
    updatedAt: now,
    assignedDepartment,
    resolutionNotes: data.resolutionNotes || '',
    timeline: [
      {
        id: `tl_${Date.now()}`,
        status: 'PENDING',
        timestamp: now,
        actorName: data.studentName || 'Alex Rivera',
        actorRole: 'Student',
        comment: 'Grievance ticket created in system.',
      },
    ],
    attachments: data.attachments || [],
  };

  inMemoryComplaints.unshift(newComplaint);
  return newComplaint;
};

/**
 * Update an existing complaint ticket
 */
export const updateComplaint = async (id, updateData) => {
  if (pool && isConnected) {
    try {
      const demoAdminId = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

      let updateQuery = `UPDATE complaints SET updated_at = NOW()`;
      const params = [];

      if (updateData.status) {
        params.push(updateData.status.toUpperCase());
        updateQuery += `, status = $${params.length}`;
      }

      params.push(id);
      updateQuery += ` WHERE id::text = $${params.length} RETURNING *`;

      const res = await pool.query(updateQuery, params);

      if (res.rows.length > 0) {
        const updated = res.rows[0];

        // If comment provided, insert into comments table
        if (updateData.adminComment) {
          await pool.query(
            `INSERT INTO comments (complaint_id, user_id, message) VALUES ($1, $2, $3)`,
            [updated.id, demoAdminId, updateData.adminComment]
          );
        }

        return {
          id: updated.id,
          ticketNumber: `TKT-${updated.id.substring(0, 8).toUpperCase()}`,
          title: updated.title,
          category: updated.category,
          description: updated.description,
          status: updated.status,
          priority: updateData.priority || 'HIGH',
          location: 'Campus Facility',
          assignedDepartment: CATEGORY_DEPARTMENT_MAP[updated.category] || 'General Grievance Cell',
          createdAt: updated.created_at,
          updatedAt: updated.updated_at,
          resolutionNotes: updateData.resolutionNotes || '',
          timeline: [],
        };
      }
    } catch (err) {
      console.warn('[DB Query Error in updateComplaint, using fallback]:', err.message);
    }
  }

  // Fallback in-memory
  const index = inMemoryComplaints.findIndex(
    (c) => c.id === id || c.ticketNumber.toLowerCase() === id.toLowerCase()
  );

  if (index === -1) {
    return null;
  }

  const existing = inMemoryComplaints[index];
  const now = new Date().toISOString();
  const updatedTimeline = [...existing.timeline];

  if (updateData.status && updateData.status !== existing.status) {
    updatedTimeline.push({
      id: `tl_${Date.now()}`,
      status: updateData.status,
      timestamp: now,
      actorName: updateData.actorName || 'System Admin',
      actorRole: updateData.actorRole || 'Admin',
      comment: updateData.adminComment || `Status changed from ${existing.status} to ${updateData.status}`,
    });
  } else if (updateData.adminComment) {
    updatedTimeline.push({
      id: `tl_${Date.now()}`,
      status: existing.status,
      timestamp: now,
      actorName: updateData.actorName || 'System Admin',
      actorRole: updateData.actorRole || 'Admin',
      comment: updateData.adminComment,
    });
  }

  const updatedComplaint = {
    ...existing,
    title: updateData.title !== undefined ? updateData.title.trim() : existing.title,
    description: updateData.description !== undefined ? updateData.description.trim() : existing.description,
    location: updateData.location !== undefined ? updateData.location.trim() : existing.location,
    category: updateData.category !== undefined ? updateData.category : existing.category,
    status: updateData.status !== undefined ? updateData.status : existing.status,
    priority: updateData.priority !== undefined ? updateData.priority : existing.priority,
    resolutionNotes: updateData.resolutionNotes !== undefined ? updateData.resolutionNotes : existing.resolutionNotes,
    assignedDepartment: updateData.category ? (CATEGORY_DEPARTMENT_MAP[updateData.category] || existing.assignedDepartment) : existing.assignedDepartment,
    updatedAt: now,
    timeline: updatedTimeline,
  };

  inMemoryComplaints[index] = updatedComplaint;
  return updatedComplaint;
};

/**
 * Delete a complaint by ID or ticketNumber
 */
export const deleteComplaint = async (id) => {
  if (pool && isConnected) {
    try {
      // Deleting complaint cascades to comments automatically via ON DELETE CASCADE
      const res = await pool.query(
        `DELETE FROM complaints WHERE id::text = $1 RETURNING *`,
        [id]
      );
      if (res.rows.length > 0) {
        const deleted = res.rows[0];
        return {
          id: deleted.id,
          ticketNumber: `TKT-${deleted.id.substring(0, 8).toUpperCase()}`,
        };
      }
    } catch (err) {
      console.warn('[DB Query Error in deleteComplaint, using fallback]:', err.message);
    }
  }

  // Fallback in-memory
  const index = inMemoryComplaints.findIndex(
    (c) => c.id === id || c.ticketNumber.toLowerCase() === id.toLowerCase()
  );

  if (index === -1) {
    return null;
  }

  const [deleted] = inMemoryComplaints.splice(index, 1);
  return deleted;
};

/**
 * Add a comment / message to a complaint ticket
 * Level 5: Supports student comments on their own tickets and admin communications.
 */
export const addCommentToComplaint = async (complaintId, { userId, actorName, actorRole, message }) => {
  if (pool && isConnected) {
    try {
      // Find UUID of user or fallback to demo user
      const userRes = await pool.query(
        `SELECT id FROM users WHERE id::text = $1 OR email = $2`,
        [userId, actorName]
      );
      const validUserId = userRes.rows.length > 0 ? userRes.rows[0].id : 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

      const insertRes = await pool.query(
        `INSERT INTO comments (complaint_id, user_id, message) VALUES ($1, $2, $3) RETURNING *`,
        [complaintId, validUserId, message]
      );
      if (insertRes.rows.length > 0) {
        const row = insertRes.rows[0];
        return {
          id: row.id,
          comment: row.message,
          message: row.message,
          timestamp: row.created_at,
          actorName,
          actorRole,
        };
      }
    } catch (err) {
      console.warn('[DB Query Error in addCommentToComplaint, using fallback]:', err.message);
    }
  }

  // In-memory fallback
  const complaint = inMemoryComplaints.find(
    (c) => c.id === complaintId || c.ticketNumber.toLowerCase() === complaintId.toLowerCase()
  );

  if (!complaint) {
    return null;
  }

  const now = new Date().toISOString();
  const newComment = {
    id: `cm_${Date.now()}`,
    status: complaint.status,
    timestamp: now,
    actorName: actorName || 'Anonymous',
    actorRole: actorRole || 'Student',
    comment: message,
    message,
  };

  if (!complaint.timeline) {
    complaint.timeline = [];
  }
  complaint.timeline.push(newComment);
  complaint.updatedAt = now;

  return newComment;
};

/**
 * Add a verified secure attachment to a complaint ticket
 */
export const addAttachmentToComplaint = async (complaintId, attachmentData) => {
  const complaint = inMemoryComplaints.find(
    (c) => c.id === complaintId || c.ticketNumber.toLowerCase() === complaintId.toLowerCase()
  );

  if (!complaint) {
    return null;
  }

  if (!complaint.attachments) {
    complaint.attachments = [];
  }

  complaint.attachments.push(attachmentData);
  complaint.updatedAt = new Date().toISOString();

  // Audit timeline entry
  if (!complaint.timeline) {
    complaint.timeline = [];
  }
  complaint.timeline.push({
    id: `tl_${Date.now()}`,
    status: complaint.status,
    timestamp: new Date().toISOString(),
    actorName: attachmentData.uploadedBy || 'User',
    actorRole: 'Student',
    comment: `Attachment uploaded: ${attachmentData.originalName} (${(attachmentData.sizeBytes / 1024).toFixed(1)} KB, verified ${attachmentData.fileSignatureType.toUpperCase()})`,
  });

  return complaint;
};

/**
 * Retrieve a specific attachment from a complaint
 */
export const getComplaintAttachment = async (complaintId, attachmentId) => {
  const complaint = inMemoryComplaints.find(
    (c) => c.id === complaintId || c.ticketNumber.toLowerCase() === complaintId.toLowerCase()
  );

  if (!complaint || !complaint.attachments || complaint.attachments.length === 0) {
    return null;
  }

  if (!attachmentId) {
    return complaint.attachments[0] || null;
  }

  return (
    complaint.attachments.find(
      (a) => a.id === attachmentId || a.storedFilename === attachmentId
    ) || null
  );
};



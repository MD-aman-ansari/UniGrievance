import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  ShieldAlert, 
  FileCheck, 
  AlertTriangle, 
  FileCode, 
  FileText, 
  Image as ImageIcon, 
  HardDrive, 
  Lock, 
  Key, 
  Terminal, 
  CheckCircle2, 
  XCircle, 
  Bug, 
  ArrowRight,
  FileSpreadsheet,
  Download,
  Upload,
  RefreshCw,
  UserX,
  UserCheck
} from 'lucide-react';

export const UploadSecurityPage: React.FC = () => {
  const { currentUser, token, navigate } = useApp();

  // Test states
  const [activeTab, setActiveTab] = useState<'explanation' | 'lab' | 'checklist'>('explanation');
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testResults, setTestResults] = useState<{
    name: string;
    status: 'pending' | 'success' | 'failed';
    message: string;
    details?: any;
  }[]>([]);

  // Lab custom file testing state
  const [customFileType, setCustomFileType] = useState<'spoofed_png' | 'valid_pdf' | 'oversized_file' | 'fake_jpg'>('spoofed_png');
  const [labResponse, setLabResponse] = useState<any>(null);
  const [labLoading, setLabLoading] = useState(false);

  // IDOR Cross-Student test state
  const [idorComplaintId, setIdorComplaintId] = useState<'cmp_1001' | 'cmp_1004'>('cmp_1004');
  const [idorResult, setIdorResult] = useState<{
    status: number;
    success: boolean;
    message: string;
    data?: any;
  } | null>(null);
  const [idorLoading, setIdorLoading] = useState(false);

  const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

  // 1. Run Lab Upload Test
  const handleRunUploadLab = async () => {
    setLabLoading(true);
    setLabResponse(null);

    try {
      let file: File;
      if (customFileType === 'spoofed_png') {
        // Malicious file: Extension is .png, MIME is image/png, but binary body is a PHP webshell!
        const maliciousPhpContent = '<?php echo "EXPLOIT EXECUTION TEST: system("id");"; phpinfo(); ?>';
        file = new File([maliciousPhpContent], 'invoice_slip.png', { type: 'image/png' });
      } else if (customFileType === 'fake_jpg') {
        // Fake JPG: HTML XSS script named profile.jpg
        const xssContent = '<html><script>alert("XSS Attack via SVG/HTML in JPG")</script></html>';
        file = new File([xssContent], 'profile_badge.jpg', { type: 'image/jpeg' });
      } else if (customFileType === 'oversized_file') {
        // 5.5 MB payload exceeding the 5MB limit
        const fivePointFiveMbBuffer = new Uint8Array(5.5 * 1024 * 1024);
        fivePointFiveMbBuffer.fill(0x41); // filled with 'A'
        file = new File([fivePointFiveMbBuffer], 'large_crash_dump.pdf', { type: 'application/pdf' });
      } else {
        // Authentic minimal PDF with valid magic bytes (%PDF-1.4)
        const authenticPdfString = '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF\n';
        file = new File([authenticPdfString], 'maintenance_receipt.pdf', { type: 'application/pdf' });
      }

      const formData = new FormData();
      formData.append('file', file);

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}/complaints/security-lab/test-upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const json = await res.json();
      setLabResponse({
        status: res.status,
        ok: res.ok,
        data: json,
        testedFile: {
          name: file.name,
          clientMime: file.type,
          sizeBytes: file.size,
          sizeFormatted: `${(file.size / 1024).toFixed(1)} KB`,
        }
      });
    } catch (err: any) {
      setLabResponse({
        status: 500,
        ok: false,
        data: { error: 'Network Error', message: err.message },
      });
    } finally {
      setLabLoading(false);
    }
  };

  // 2. Run IDOR Cross-Student Attachment Download Test
  const handleTestIdorDownload = async () => {
    setIdorLoading(true);
    setIdorResult(null);

    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}/complaints/${idorComplaintId}/attachment`, {
        headers,
      });

      if (res.ok) {
        const contentType = res.headers.get('Content-Type');
        const disposition = res.headers.get('Content-Disposition');
        const nosniff = res.headers.get('X-Content-Type-Options');
        setIdorResult({
          status: res.status,
          success: true,
          message: `Access GRANTED (${res.status} OK). You are authorized to view this ticket.`,
          data: {
            contentType,
            disposition,
            nosniff,
            contentSecurityPolicy: res.headers.get('Content-Security-Policy'),
          },
        });
      } else {
        const json = await res.json().catch(() => ({}));
        setIdorResult({
          status: res.status,
          success: false,
          message: json.message || json.error || `HTTP ${res.status} Access Denied.`,
          data: json,
        });
      }
    } catch (err: any) {
      setIdorResult({
        status: 500,
        success: false,
        message: err.message || 'Network request failed',
      });
    } finally {
      setIdorLoading(false);
    }
  };

  // 3. Automated Full Security Suite
  const runFullSecuritySuite = async () => {
    setIsRunningTest(true);
    setTestResults([]);

    const suite: typeof testResults = [];

    // Test 1: Upload spoofed PHP webshell as .png
    try {
      const phpShell = '<?php system($_GET["cmd"]); ?>';
      const file1 = new File([phpShell], 'backdoor.png', { type: 'image/png' });
      const fd1 = new FormData();
      fd1.append('file', file1);
      const res1 = await fetch(`${API_BASE}/complaints/security-lab/test-upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd1,
      });
      const data1 = await res1.json();
      if (res1.status === 400 && data1.error === 'File Signature Mismatch') {
        suite.push({
          name: 'Magic Byte Spoofing Defense',
          status: 'success',
          message: 'PASS: PHP webshell masquerading as PNG rejected via binary magic bytes.',
          details: data1,
        });
      } else {
        suite.push({
          name: 'Magic Byte Spoofing Defense',
          status: 'failed',
          message: `FAIL: Expected HTTP 400 but got ${res1.status}.`,
          details: data1,
        });
      }
    } catch (e: any) {
      suite.push({ name: 'Magic Byte Spoofing Defense', status: 'failed', message: e.message });
    }

    // Test 2: File size limit enforcement (> 5 MB)
    try {
      const bigBuffer = new Uint8Array(5.3 * 1024 * 1024);
      const file2 = new File([bigBuffer], 'overflow.pdf', { type: 'application/pdf' });
      const fd2 = new FormData();
      fd2.append('file', file2);
      const res2 = await fetch(`${API_BASE}/complaints/security-lab/test-upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd2,
      });
      const data2 = await res2.json();
      if (res2.status === 413) {
        suite.push({
          name: '5 MB File Size Limit (DoS Prevention)',
          status: 'success',
          message: 'PASS: 5.3 MB upload rejected with HTTP 413 Payload Too Large.',
          details: data2,
        });
      } else {
        suite.push({
          name: '5 MB File Size Limit (DoS Prevention)',
          status: 'failed',
          message: `FAIL: Expected HTTP 413, received ${res2.status}.`,
          details: data2,
        });
      }
    } catch (e: any) {
      suite.push({ name: '5 MB File Size Limit', status: 'failed', message: e.message });
    }

    // Test 3: Authentic PDF upload verification
    try {
      const validPdf = '%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\nxref\n0 1\n0000000000 65535 f \ntrailer<</Size 1/Root 1 0 R>>\nstartxref\n50\n%%EOF\n';
      const file3 = new File([validPdf], 'valid_doc.pdf', { type: 'application/pdf' });
      const fd3 = new FormData();
      fd3.append('file', file3);
      const res3 = await fetch(`${API_BASE}/complaints/security-lab/test-upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd3,
      });
      const data3 = await res3.json();
      if (res3.status === 200 && data3.success && data3.data?.storedFilename) {
        suite.push({
          name: 'Valid File Verification & Random Storage Name',
          status: 'success',
          message: `PASS: PDF verified. Renamed to cryptographic ID: ${data3.data.storedFilename}`,
          details: data3.data,
        });
      } else {
        suite.push({
          name: 'Valid File Verification & Random Storage Name',
          status: 'failed',
          message: `FAIL: Expected HTTP 200, received ${res3.status}.`,
          details: data3,
        });
      }
    } catch (e: any) {
      suite.push({ name: 'Valid File Verification', status: 'failed', message: e.message });
    }

    // Test 4: Cross-Student IDOR Attachment Protection
    try {
      // Alex Rivera (student_101) attempting to download Maria Chen's (student_202) attachment
      const res4 = await fetch(`${API_BASE}/complaints/cmp_1004/attachment`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data4 = await res4.json().catch(() => ({}));

      if (currentUser?.role === 'admin') {
        if (res4.status === 200) {
          suite.push({
            name: 'Role-Based Access Control (Admin View)',
            status: 'success',
            message: 'PASS: Admin is authorized to access student attachments across tickets.',
          });
        }
      } else if (currentUser?.email === 'alex.rivera@campus.edu') {
        if (res4.status === 403) {
          suite.push({
            name: 'IDOR Protection (Cross-Student Access Blocked)',
            status: 'success',
            message: 'PASS: Student Alex Rivera blocked with HTTP 403 when requesting Maria Chen’s private file.',
            details: data4,
          });
        } else {
          suite.push({
            name: 'IDOR Protection (Cross-Student Access Blocked)',
            status: 'failed',
            message: `FAIL: Expected HTTP 403 Forbidden, received ${res4.status}.`,
            details: data4,
          });
        }
      } else {
        suite.push({
          name: 'IDOR Protection (Cross-Student Access)',
          status: 'success',
          message: `INFO: Tested as user ${currentUser?.name} (${currentUser?.role}). Status ${res4.status}.`,
        });
      }
    } catch (e: any) {
      suite.push({ name: 'IDOR Protection Check', status: 'failed', message: e.message });
    }

    setTestResults(suite);
    setIsRunningTest(false);
  };

  return (
    <div id="page-upload-security" className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-mono font-medium border border-indigo-500/30">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            LEVEL 9 — SECURE FILE UPLOADS
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Secure File Upload Architecture &amp; IDOR Defense
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Unrestricted file upload is one of the most critical vulnerabilities in web applications (OWASP Top 10), potentially leading to Remote Code Execution (RCE), Stored XSS, Directory Traversal, and unauthorized access to student records.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => setActiveTab('explanation')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'explanation'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              1. Deep Architecture &amp; Concepts
            </button>
            <button
              onClick={() => setActiveTab('lab')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'lab'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              2. Interactive Security Lab
            </button>
            <button
              onClick={() => setActiveTab('checklist')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'checklist'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              3. Security Checklist &amp; Test Suite
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: THE 9 REQUIRED CONCEPTS EXPLAINED */}
      {activeTab === 'explanation' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. File Extension */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-sm hover:border-indigo-200 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400">Concept 1</span>
                  <h3 className="text-sm font-bold text-slate-900">File Extension Spoofing</h3>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                The file extension (e.g., <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">.png</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">.pdf</code>) is simply a string at the end of a filename supplied by the client. Attackers routinely disguise dangerous scripts by:
              </p>
              <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                <li>Double extensions: <code className="font-mono text-rose-700">exploit.php.png</code></li>
                <li>Null byte injection: <code className="font-mono text-rose-700">webshell.php%00.jpg</code></li>
                <li>Right-to-Left Override (RLO) character tricks</li>
              </ul>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-[11px] text-amber-900 font-medium">
                Rule: Never use the client-supplied extension to validate what a file actually is.
              </div>
            </div>

            {/* 2. MIME Type */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-sm hover:border-indigo-200 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400">Concept 2</span>
                  <h3 className="text-sm font-bold text-slate-900">MIME Type Manipulation</h3>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                The <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">Content-Type: image/png</code> header is sent by the browser or attacker HTTP client (curl/Burp Suite). Anyone can send:
              </p>
              <div className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[11px] overflow-x-auto">
                curl -F "file=@malware.php;type=image/png" https://campus.edu/upload
              </div>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-[11px] text-rose-900 font-medium">
                Rule: Content-Type is untrusted user input. Servers must NEVER rely on it for security gating.
              </div>
            </div>

            {/* 3. Magic Bytes / File Signatures */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-sm hover:border-indigo-200 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400">Concept 3</span>
                  <h3 className="text-sm font-bold text-slate-900">File Signatures &amp; Magic Bytes</h3>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Authentic binary files begin with invariant signature bytes in their binary header:
              </p>
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-bold text-slate-700">PDF:</span>
                  <span className="text-indigo-600">%PDF- (25 50 44 46)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-bold text-slate-700">PNG:</span>
                  <span className="text-indigo-600">89 50 4E 47 0D 0A 1A 0A</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-bold text-slate-700">JPEG:</span>
                  <span className="text-indigo-600">FF D8 FF</span>
                </div>
              </div>
              <p className="text-xs text-slate-600">
                Our <code className="text-indigo-700 font-mono">fileSecurityService</code> reads the binary buffer slice to verify authentic headers regardless of file extension.
              </p>
            </div>

            {/* 4. File Size Limits */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-sm hover:border-indigo-200 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400">Concept 4</span>
                  <h3 className="text-sm font-bold text-slate-900">Strict File Size Enforcement (5 MB)</h3>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Unbounded file uploads cause <strong>Denial of Service (DoS)</strong> through:
              </p>
              <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                <li>Disk exhaustion (filling the server storage volume)</li>
                <li>Memory exhaustion (buffering multi-gigabyte payloads in Node.js RAM)</li>
                <li>Connection starvation (holding TCP sockets open for hours)</li>
              </ul>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-[11px] text-blue-900 font-medium">
                Our application enforces a hard 5 MB limit streamed through Multer. Oversized payloads abort immediately with HTTP 413.
              </div>
            </div>

            {/* 5. Random Filenames */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-sm hover:border-indigo-200 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400">Concept 5</span>
                  <h3 className="text-sm font-bold text-slate-900">Cryptographic Random Filenames</h3>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Accepting original filenames leads to catastrophic Directory Traversal and Stored XSS:
              </p>
              <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                <li><code className="font-mono text-rose-700">../../etc/cron.d/job</code> overwrites system files</li>
                <li><code className="font-mono text-rose-700">&lt;script&gt;alert(1)&lt;/script&gt;.pdf</code> triggers XSS in file lists</li>
                <li>Name collisions: uploading <code className="font-mono text-slate-700">receipt.pdf</code> overwrites another student&apos;s receipt</li>
              </ul>
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-[11px] text-purple-900 font-mono">
                Storage: att_1726650920_a89b3f01c4d7.pdf
              </div>
            </div>

            {/* 6. Storage Location */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-sm hover:border-indigo-200 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400">Concept 6</span>
                  <h3 className="text-sm font-bold text-slate-900">Storage Location (Outside Web Root)</h3>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                If files are stored in <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-700">public/uploads/</code>, the web server (Nginx/Apache/Express static) serves them directly to the Internet. An attacker can browse directly to <code className="font-mono text-xs">/uploads/shell.php</code> and execute code!
              </p>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-[11px] text-emerald-900 font-medium">
                Our uploads are stored in an isolated private directory (<code className="font-mono text-xs">backend/uploads/attachments/</code>) that is NEVER mounted as a static asset path.
              </div>
            </div>

            {/* 7. Access Control & IDOR Protection */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-sm hover:border-indigo-200 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                  <UserX className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400">Concept 7</span>
                  <h3 className="text-sm font-bold text-slate-900">Access Control &amp; IDOR Protection</h3>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                A student&apos;s grievance attachment might be a sensitive medical certificate, disciplinary record, or financial invoice. If download links are predictable (e.g., <code className="font-mono text-slate-700">/download?file=104</code>), student A can download student B&apos;s private document!
              </p>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-[11px] text-rose-900 font-medium">
                Downloads require JWT authentication + <code>checkComplaintAccess</code> ownership validation. Students receive HTTP 403 Forbidden if they attempt to download tickets they do not own.
              </div>
            </div>

            {/* 8. Malicious Files & Polyglots */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-sm hover:border-indigo-200 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                  <Bug className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400">Concept 8</span>
                  <h3 className="text-sm font-bold text-slate-900">Malicious Files &amp; Polyglots</h3>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sophisticated attackers create <strong>Polyglots</strong>—files that are valid in two different formats simultaneously:
              </p>
              <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                <li>A valid GIF/JPEG with PHP shell code hidden in the EXIF comment field</li>
                <li>A valid PDF containing embedded JavaScript actions (<code className="font-mono text-xs">/JavaScript /JS (app.alert(1))</code>)</li>
                <li>HTML disguised as an image file that executes in Internet Explorer via MIME-sniffing</li>
              </ul>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-[11px] text-amber-900 font-medium">
                Defense: We set <code>X-Content-Type-Options: nosniff</code> and force <code>Content-Disposition: attachment</code> to prevent browsers from executing scripts.
              </div>
            </div>
          </div>

          {/* 9. Why uploaded files must not be executable */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 sm:p-8 space-y-4 border border-slate-700 shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-indigo-400 font-bold">Concept 9</span>
                <h2 className="text-lg font-bold text-white">Why Uploaded Files Must NEVER Be Executable</h2>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              If an uploaded file is marked executable (<code className="bg-slate-800 text-rose-400 font-mono px-1.5 py-0.5 rounded">chmod +x</code>) or is saved in a directory where the web server has scripting engines enabled (such as PHP, CGI, or Perl), an attacker who manages to sneak in a file can execute arbitrary commands with the privileges of the web application.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                <span className="text-xs font-bold text-indigo-400 block">1. Filesystem Permissions</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Files are saved with octal mode <strong>0644</strong> (<code>rw-r--r--</code>). Execution bits (<code>0111</code>) are strictly denied so OS kernels reject execution.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                <span className="text-xs font-bold text-indigo-400 block">2. Web Server Handlers</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  The upload folder does not execute scripts. In Apache, this is configured with <code>RemoveHandler .php</code> and <code>Options -ExecCGI</code>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                <span className="text-xs font-bold text-indigo-400 block">3. Browser Headers</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  <code>Content-Security-Policy: default-src &apos;none&apos;</code> and <code>X-Content-Type-Options: nosniff</code> stop clients from rendering untrusted HTML/SVG in-page.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INTERACTIVE LIVE SECURITY LAB */}
      {activeTab === 'lab' && (
        <div className="space-y-6">
          {/* Lab 1: Upload Bypass & Magic Byte Verification */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Lab Test A: File Upload Security Filter Probe</h2>
                  <p className="text-xs text-slate-500">
                    Send test files through our Express Multer &amp; magic-byte security pipeline (<code className="font-mono">POST /api/complaints/security-lab/test-upload</code>).
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                Select Payload to Send:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCustomFileType('spoofed_png')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    customFileType === 'spoofed_png'
                      ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">PHP Webshell as .png</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-semibold">MALICIOUS</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Client says filename=&quot;invoice.png&quot; and Content-Type=&quot;image/png&quot;, but file contents are raw PHP code.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setCustomFileType('fake_jpg')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    customFileType === 'fake_jpg'
                      ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">HTML XSS Script as .jpg</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-semibold">SPOOFED</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Client sends &quot;&lt;script&gt;alert(1)&lt;/script&gt;&quot; inside &quot;photo.jpg&quot;. Tests magic byte rejection.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setCustomFileType('oversized_file')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    customFileType === 'oversized_file'
                      ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">5.5 MB Oversized File</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold">&gt; 5 MB LIMIT</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Generates a 5.5 megabyte stream to verify Multer stream cutoff (HTTP 413 Payload Too Large).
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setCustomFileType('valid_pdf')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    customFileType === 'valid_pdf'
                      ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">Authentic PDF Document</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-semibold">AUTHENTIC</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Contains authentic binary &quot;%PDF-1.4&quot; magic bytes. Should pass verification and be assigned a random UUID filename.
                  </p>
                </button>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleRunUploadLab}
                  disabled={labLoading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-sm inline-flex items-center gap-2 transition-colors"
                >
                  {labLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Transmit Payload to Security Filter
                </button>
              </div>

              {/* Lab Response Viewer */}
              {labResponse && (
                <div className={`p-5 rounded-2xl border space-y-3 ${
                  labResponse.ok 
                    ? 'bg-emerald-50/70 border-emerald-200' 
                    : 'bg-rose-50/70 border-rose-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {labResponse.ok ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-600" />
                      )}
                      <span className="text-xs font-bold text-slate-900">
                        HTTP Status: {labResponse.status} ({labResponse.ok ? 'Accepted & Verified' : 'Security Rejected'})
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-500">
                      Payload: {labResponse.testedFile?.name} ({labResponse.testedFile?.sizeFormatted})
                    </span>
                  </div>

                  <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-xs overflow-x-auto">
                    {JSON.stringify(labResponse.data, null, 2)}
                  </div>

                  <p className="text-xs text-slate-700">
                    <strong>Observation: </strong>
                    {labResponse.status === 400 && 'The server read the first 8 bytes from disk, detected a mismatch between the filename/Content-Type and binary signatures, deleted the temporary file immediately, and rejected the upload.'}
                    {labResponse.status === 413 && 'Multer streaming limits triggered before disk storage completed, preserving server RAM and disk capacity.'}
                    {labResponse.status === 200 && 'Binary magic bytes matched authentic PDF/Image specifications. The file was renamed with a cryptographically secure random token and stored in isolated storage.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Lab 2: Cross-Student IDOR Attachment Access Test */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                  <UserX className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Lab Test B: Cross-Student Attachment IDOR Guard</h2>
                  <p className="text-xs text-slate-500">
                    Verify that one student CANNOT access or download another student&apos;s private grievance attachments.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">Currently Authenticated As:</span>
                <span className="font-semibold text-indigo-700">
                  {currentUser ? `${currentUser.name} (${currentUser.role})` : 'Anonymous'}
                </span>
                <span className="text-slate-400 font-mono text-[11px]">[{currentUser?.email}]</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                • Complaint <code className="font-bold text-indigo-800">cmp_1001</code> belongs to <strong>Alex Rivera</strong> (alex.rivera@campus.edu).<br />
                • Complaint <code className="font-bold text-rose-800">cmp_1004</code> belongs to <strong>Maria Chen</strong> (m.chen@campus.edu).
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                Target Ticket to Request Attachment From:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIdorComplaintId('cmp_1001')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    idorComplaintId === 'cmp_1001'
                      ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-900 block">TKT-2026-001 (cmp_1001)</span>
                  <span className="text-[11px] text-slate-500">Owner: Alex Rivera (alex.rivera@campus.edu)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIdorComplaintId('cmp_1004')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    idorComplaintId === 'cmp_1004'
                      ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-900 block">TKT-2026-004 (cmp_1004)</span>
                  <span className="text-[11px] text-rose-600 font-semibold">Owner: Maria Chen (Other Student)</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleTestIdorDownload}
                disabled={idorLoading}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {idorLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Attempt Attachment Stream (GET /api/complaints/{idorComplaintId}/attachment)
              </button>

              {idorResult && (
                <div className={`p-5 rounded-2xl border space-y-3 ${
                  idorResult.success ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {idorResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-600" />
                    )}
                    <span className="text-xs font-bold text-slate-900">
                      Response: HTTP {idorResult.status} — {idorResult.message}
                    </span>
                  </div>

                  {idorResult.data && (
                    <div className="bg-slate-900 text-slate-100 rounded-xl p-3 font-mono text-xs overflow-x-auto">
                      {JSON.stringify(idorResult.data, null, 2)}
                    </div>
                  )}

                  <p className="text-xs text-slate-600">
                    {idorResult.status === 403 && (
                      <span className="text-rose-800 font-medium">
                        IDOR Protection SUCCESSFUL: Student {currentUser?.name} was strictly blocked from accessing Maria Chen&apos;s confidential file.
                      </span>
                    )}
                    {idorResult.status === 200 && (
                      <span className="text-emerald-800 font-medium">
                        Legitimate Access Authorized: Identity matched ticket owner or user holds Admin role. Security headers were attached to prevent in-browser execution.
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CHECKLIST & TEST SUITE */}
      {activeTab === 'checklist' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Automated File Upload Security Test Suite</h2>
                <p className="text-xs text-slate-500">
                  Runs regression tests covering spoofed magic bytes, size limits, and cross-student IDOR authorization.
                </p>
              </div>
              <button
                type="button"
                onClick={runFullSecuritySuite}
                disabled={isRunningTest}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto disabled:opacity-50"
              >
                {isRunningTest ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Execute All Level 9 Tests
              </button>
            </div>

            {testResults.length > 0 && (
              <div className="space-y-3">
                {testResults.map((t, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border flex items-start justify-between gap-4 ${
                      t.status === 'success'
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                        : 'bg-rose-50/60 border-rose-200 text-rose-950'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {t.status === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-600" />
                        )}
                        <span className="text-xs font-bold text-slate-900">{t.name}</span>
                      </div>
                      <p className="text-xs text-slate-600">{t.message}</p>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      t.status === 'success' ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'
                    }`}>
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Manual CLI Testing Guide */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Manual Security Tests via cURL (Security Auditing):
              </h3>

              <div className="space-y-3 font-mono text-[11px]">
                {/* 1. Spoofed extension test */}
                <div className="p-3.5 bg-slate-900 text-slate-200 rounded-xl space-y-1.5 overflow-x-auto">
                  <div className="text-slate-400 font-sans text-[10px] font-bold uppercase">
                    1. Test Magic Byte Rejection (PHP webshell with .png extension):
                  </div>
                  <code>
                    echo &apos;&lt;?php system($_GET[&quot;c&quot;]); ?&gt;&apos; &gt; webshell.png<br />
                    curl -i -X POST http://localhost:3000/api/complaints/cmp_1001/attachment \<br />
                    &nbsp;&nbsp;-H &quot;Authorization: Bearer $TOKEN&quot; \<br />
                    &nbsp;&nbsp;-F &quot;attachment=@webshell.png;type=image/png&quot;
                  </code>
                  <div className="text-emerald-400 font-sans text-[10px] pt-1">
                    Expected: HTTP 400 Bad Request — &quot;File Signature Mismatch&quot;
                  </div>
                </div>

                {/* 2. Oversized payload test */}
                <div className="p-3.5 bg-slate-900 text-slate-200 rounded-xl space-y-1.5 overflow-x-auto">
                  <div className="text-slate-400 font-sans text-[10px] font-bold uppercase">
                    2. Test 5 MB Size Limit Enforcement (Denial of Service Guard):
                  </div>
                  <code>
                    dd if=/dev/zero of=large.pdf bs=1M count=6<br />
                    curl -i -X POST http://localhost:3000/api/complaints/cmp_1001/attachment \<br />
                    &nbsp;&nbsp;-H &quot;Authorization: Bearer $TOKEN&quot; \<br />
                    &nbsp;&nbsp;-F &quot;attachment=@large.pdf&quot;
                  </code>
                  <div className="text-emerald-400 font-sans text-[10px] pt-1">
                    Expected: HTTP 413 Payload Too Large
                  </div>
                </div>

                {/* 3. Cross-Student IDOR test */}
                <div className="p-3.5 bg-slate-900 text-slate-200 rounded-xl space-y-1.5 overflow-x-auto">
                  <div className="text-slate-400 font-sans text-[10px] font-bold uppercase">
                    3. Test Cross-Student IDOR Download Access Control:
                  </div>
                  <code>
                    # Alex Rivera (student) requesting Maria Chen&apos;s ticket attachment:<br />
                    curl -i -X GET http://localhost:3000/api/complaints/cmp_1004/attachment \<br />
                    &nbsp;&nbsp;-H &quot;Authorization: Bearer $ALEX_TOKEN&quot;
                  </code>
                  <div className="text-emerald-400 font-sans text-[10px] pt-1">
                    Expected: HTTP 403 Forbidden — &quot;Access Denied: You do not own this ticket.&quot;
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

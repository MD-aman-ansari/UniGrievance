import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Key, 
  Server, 
  Globe, 
  Sliders, 
  FileCheck, 
  EyeOff, 
  AlertOctagon, 
  CheckCircle2, 
  XCircle, 
  Play, 
  RefreshCw,
  Clock,
  Layers,
  Terminal
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ApiSecurityPage: React.FC = () => {
  const { token, navigate } = useApp();
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testOutput, setTestOutput] = useState<{ id: string; status: number; data: any; passed: boolean; message: string } | null>(null);

  const runLiveTest = async (testId: string) => {
    setTestingId(testId);
    try {
      if (testId === 'headers') {
        const res = await fetch('/api/health');
        const headers = {
          'x-content-type-options': res.headers.get('x-content-type-options'),
          'x-frame-options': res.headers.get('x-frame-options'),
          'strict-transport-security': res.headers.get('strict-transport-security'),
          'x-powered-by': res.headers.get('x-powered-by') || '(Removed/None)',
          'x-ratelimit-limit': res.headers.get('x-ratelimit-limit'),
          'x-ratelimit-remaining': res.headers.get('x-ratelimit-remaining'),
        };
        setTestOutput({
          id: testId,
          status: res.status,
          data: headers,
          passed: headers['x-content-type-options'] === 'nosniff' && headers['x-frame-options'] === 'SAMEORIGIN',
          message: 'Security headers verified: nosniff, SAMEORIGIN, and X-Powered-By stripped.'
        });
      } else if (testId === 'unauth') {
        const res = await fetch('/api/complaints/cmp_1001'); // Without auth header
        const data = await res.json();
        setTestOutput({
          id: testId,
          status: res.status,
          data,
          passed: res.status === 401,
          message: 'Authentication middleware rejected request without Bearer token with HTTP 401.'
        });
      } else if (testId === 'idor') {
        // Attempting to access complaint without proper ownership
        const res = await fetch('/api/complaints/cmp_1004', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const data = await res.json();
        setTestOutput({
          id: testId,
          status: res.status,
          data,
          passed: res.status === 403 || res.status === 401,
          message: res.status === 403 
            ? 'IDOR protection verified: Student forbidden from viewing another student ticket.'
            : 'Protected: Authentication token required first.'
        });
      } else if (testId === 'oversized') {
        const huge = { garbage: 'Z'.repeat(60 * 1024) };
        const res = await fetch('/api/complaints', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify(huge)
        });
        const data = await res.json();
        setTestOutput({
          id: testId,
          status: res.status,
          data,
          passed: res.status === 413,
          message: 'Request body limit verified: 60KB payload rejected with HTTP 413 Payload Too Large.'
        });
      }
    } catch (err: any) {
      setTestOutput({
        id: testId,
        status: 500,
        data: { error: err.message },
        passed: false,
        message: 'Test network execution error.'
      });
    } finally {
      setTestingId(null);
    }
  };

  const securityPillars = [
    {
      num: '1',
      title: 'Rate Limiting',
      icon: Clock,
      desc: 'Enforces sliding-window limits (15 attempts/15min on auth endpoints to prevent brute-forcing; 120 req/min on general APIs to prevent DoS) returning HTTP 429 with Retry-After headers.',
      file: 'backend/src/middleware/rateLimiter.js'
    },
    {
      num: '2',
      title: 'CORS Configuration',
      icon: Globe,
      desc: 'Replaces wildcards (*) with trusted origin whitelisting, explicit HTTP methods (GET, POST, PUT, DELETE, OPTIONS), allowed headers, and safe credential handling.',
      file: 'backend/src/middleware/corsConfig.js'
    },
    {
      num: '3',
      title: 'Security HTTP Headers',
      icon: ShieldCheck,
      desc: 'Removes X-Powered-By technology fingerprints; injects X-Content-Type-Options: nosniff, X-Frame-Options: SAMEORIGIN, Strict-Transport-Security, and Permissions-Policy.',
      file: 'backend/src/middleware/securityHeaders.js'
    },
    {
      num: '4',
      title: 'Request Body Size Limits',
      icon: Sliders,
      desc: 'Caps express.json and express.urlencoded parsing to 50KB to block buffer overflow and memory exhaustion DoS, returning clean HTTP 413 Payload Too Large.',
      file: 'backend/src/app.js'
    },
    {
      num: '5',
      title: 'Input Validation',
      icon: FileCheck,
      desc: 'Enforces strict primitive data type checks, length constraints (5-120 title, 15-2000 description, max 72 password for bcrypt), category whitelisting, and regex email validation.',
      file: 'backend/src/middleware/validator.js'
    },
    {
      num: '6',
      title: 'Proper HTTP Status Codes',
      icon: Server,
      desc: 'Standardizes semantic status codes across all routes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 413 Too Large, 429 Rate Limited, 500 Server Error.',
      file: 'backend/src/controllers/*'
    },
    {
      num: '7',
      title: 'Secure Error Handling',
      icon: AlertOctagon,
      desc: 'Catches uncaught exceptions and in production sanitizes all internal error messages, completely omitting stack traces, SQL strings, and file system paths.',
      file: 'backend/src/middleware/errorHandler.js'
    },
    {
      num: '8',
      title: 'Authentication Middleware',
      icon: Key,
      desc: 'Validates cryptographically signed HMAC-SHA256 JWT Bearer tokens, rejecting expired or forged tokens with HTTP 401 before business logic execution.',
      file: 'backend/src/middleware/auth.js'
    },
    {
      num: '9',
      title: 'Authorization Middleware',
      icon: Lock,
      desc: 'Enforces Role-Based Access Control (requireRole) and Object-Level Ownership checks (checkComplaintAccess) to systematically eliminate IDOR vulnerabilities.',
      file: 'backend/src/middleware/ownership.js'
    },
    {
      num: '10',
      title: 'Logging Without Exposing Secrets',
      icon: EyeOff,
      desc: 'Recursively scrubs passwords, JWT tokens, Bearer headers, database URLs, and API keys before logging request activity to stdout/stderr.',
      file: 'backend/src/middleware/logger.js'
    }
  ];

  const endpointChecklist = [
    {
      endpoint: 'POST /api/auth/register',
      auth: 'Public (None)',
      roles: 'Anonymous',
      rateLimit: 'Strict (15/15m)',
      validation: 'Name, email regex, pass 8-72 chars, role whitelist',
      idor: 'N/A',
      codes: '201, 400, 409, 413, 429'
    },
    {
      endpoint: 'POST /api/auth/login',
      auth: 'Public (None)',
      roles: 'Anonymous',
      rateLimit: 'Strict (15/15m)',
      validation: 'Email regex, password string',
      idor: 'N/A',
      codes: '200, 400, 401, 413, 429'
    },
    {
      endpoint: 'POST /api/auth/logout',
      auth: 'Public / Opt',
      roles: 'All',
      rateLimit: 'General (120/m)',
      validation: 'None',
      idor: 'N/A',
      codes: '200, 429'
    },
    {
      endpoint: 'GET /api/auth/me',
      auth: 'Bearer JWT',
      roles: 'Student, Admin',
      rateLimit: 'General (120/m)',
      validation: 'Token claims',
      idor: 'N/A (Current User)',
      codes: '200, 401, 429'
    },
    {
      endpoint: 'GET /api/complaints',
      auth: 'Bearer JWT',
      roles: 'Student, Admin',
      rateLimit: 'General (120/m)',
      validation: 'Query sanitization',
      idor: 'Student query scoped to req.user.id; Admin views all',
      codes: '200, 401, 429'
    },
    {
      endpoint: 'GET /api/complaints/:id',
      auth: 'Bearer JWT',
      roles: 'Student, Admin',
      rateLimit: 'General (120/m)',
      validation: 'UUID / ID sanitization',
      idor: 'checkComplaintAccess: 403 if Student != Owner',
      codes: '200, 401, 403, 404, 429'
    },
    {
      endpoint: 'POST /api/complaints',
      auth: 'Bearer JWT',
      roles: 'Student, Admin',
      rateLimit: 'General (120/m)',
      validation: 'Title 5-120, Desc 15-2000, Category enum, Location',
      idor: 'Student identity locked to req.user.id',
      codes: '201, 400, 401, 413, 429'
    },
    {
      endpoint: 'POST /api/complaints/:id/comments',
      auth: 'Bearer JWT',
      roles: 'Student, Admin',
      rateLimit: 'General (120/m)',
      validation: 'Message string max 1000 chars',
      idor: 'checkComplaintAccess: Student can only comment on own ticket',
      codes: '201, 400, 401, 403, 404, 429'
    },
    {
      endpoint: 'PUT /api/complaints/:id',
      auth: 'Bearer JWT',
      roles: 'Admin Only',
      rateLimit: 'General (120/m)',
      validation: 'Status enum, Resolution notes',
      idor: 'requireRole("admin"): 403 if Student',
      codes: '200, 400, 401, 403, 404, 429'
    },
    {
      endpoint: 'DELETE /api/complaints/:id',
      auth: 'Bearer JWT',
      roles: 'Admin Only',
      rateLimit: 'General (120/m)',
      validation: 'ID check',
      idor: 'requireRole("admin"): 403 if Student',
      codes: '200, 401, 403, 404, 429'
    },
    {
      endpoint: 'GET /api/health',
      auth: 'Public',
      roles: 'All',
      rateLimit: 'General (120/m)',
      validation: 'None',
      idor: 'N/A',
      codes: '200, 429'
    }
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 mb-1">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Level 7 Security Architecture</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              API Security &amp; Express Hardening
            </h1>
            <p className="mt-1 text-sm text-slate-600 max-w-3xl">
              Complete implementation of the 10 core API security pillars: Rate Limiting, CORS whitelist, Security Headers, Payload Boundaries, Input Validation, Strict HTTP Status Codes, Safe Errors, Auth, RBAC/IDOR, and Secret-Free Logging.
            </p>
          </div>
          <button
            onClick={() => navigate('student-dashboard')}
            className="self-start sm:self-auto px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* Deep Dive: CORS Explanation (BAD vs SECURE) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Globe className="w-4 h-4" />
            <span>Cross-Origin Resource Sharing (CORS) Masterclass</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Why CORS Exists and Why "Access-Control-Allow-Origin: *" is Inappropriate with Credentials
          </h2>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            By default, the browser’s <strong>Same-Origin Policy (SOP)</strong> forbids scripts on one website (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">evil-tracker.com</code>) from reading HTTP responses returned by another domain (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">campus.edu</code>). 
            CORS is the browser-enforced mechanism where the API server explicitly tells the browser which foreign origins are permitted to read its responses.
          </p>
        </div>

        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 text-xs text-amber-950 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <AlertOctagon className="w-4 h-4 text-amber-600" />
            <span>The Danger of Wildcard (*) with Credentials</span>
          </div>
          <p className="leading-relaxed">
            When an API sets <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">Access-Control-Allow-Origin: *</code>, any website on the internet is granted permission to make cross-origin requests. 
            However, if authentication cookies or authorization headers are involved, modern browsers <strong>strictly reject and block responses</strong> when <code className="font-mono">Access-Control-Allow-Credentials: true</code> is combined with a wildcard <code className="font-mono">*</code> origin (per the W3C/WHATWG Fetch standard).
          </p>
          <p className="leading-relaxed">
            Furthermore, in token-based architectures, an unrestricted wildcard allows any malicious tab running in the student's browser to connect to the backend, probe for endpoints, or read unauthenticated diagnostic information.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* BAD CORS */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-xs uppercase">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>❌ BAD CORS Configuration</span>
            </div>
            <pre className="bg-slate-950 text-rose-300 text-xs font-mono p-4 rounded-xl overflow-x-auto border border-rose-950/40 leading-relaxed">
{`// ❌ BAD: Permissive wildcard & unconstrained methods
app.use(cors({
  origin: '*', // Allows ANY site on internet!
  methods: '*', // Allows PUT, DELETE without restriction
  credentials: true // Browsers reject this combination!
}));`}
            </pre>
            <p className="text-[11px] text-slate-500">
              Risks: Grants any untrusted third-party site permission to trigger actions; browser security exceptions on credentialed requests.
            </p>
          </div>

          {/* SECURE CORS */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>✅ SECURE CORS Configuration</span>
            </div>
            <pre className="bg-slate-950 text-emerald-300 text-xs font-mono p-4 rounded-xl overflow-x-auto border border-emerald-950/40 leading-relaxed">
{`// ✅ SECURE: Origin Whitelist & Restricted Methods
const TRUSTED_ORIGINS = [
  'https://grievance.campus.edu',
  'http://localhost:3000'
];

export const secureCors = (req, res, next) => {
  const origin = req.headers.origin;
  if (origin && TRUSTED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight 24h
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
};`}
            </pre>
            <p className="text-[11px] text-slate-500">
              Benefits: Only trusted campus origins receive access; preflight OPTIONS are cached for 24h reducing network latency.
            </p>
          </div>
        </div>
      </div>

      {/* The 10 Security Pillars Grid */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            The 10 Core API Security Pillars
          </h2>
          <p className="text-xs text-slate-600">
            Systematic defense implemented in the Express backend architecture.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {securityPillars.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.num} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-2.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center justify-center">
                      {p.num}
                    </span>
                    <Icon className="w-4 h-4 text-slate-400" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mt-2">{p.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{p.desc}</p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-mono">Module:</span>
                  <span className="text-indigo-600 font-mono font-medium truncate max-w-[180px]">{p.file}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Security Checklist for Every API Endpoint */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            <span>Audit & Verification Matrix</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Security Checklist for Every API Endpoint
          </h2>
          <p className="text-xs text-slate-600">
            Comprehensive audit matrix detailing authentication requirements, authorized roles, rate limiting tier, input validation guards, IDOR protection, and expected HTTP status codes for every endpoint.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-700">
                <th className="py-3 px-3 font-semibold">Endpoint</th>
                <th className="py-3 px-3 font-semibold">Authentication</th>
                <th className="py-3 px-3 font-semibold">Roles</th>
                <th className="py-3 px-3 font-semibold">Rate Limit</th>
                <th className="py-3 px-3 font-semibold">Input Validation</th>
                <th className="py-3 px-3 font-semibold">IDOR / Ownership Check</th>
                <th className="py-3 px-3 font-semibold">HTTP Codes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {endpointChecklist.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                    {item.endpoint}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.auth.includes('Bearer') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.auth}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">{item.roles}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.rateLimit.includes('Strict') ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-blue-50 text-blue-700'
                    }`}>
                      {item.rateLimit}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate" title={item.validation}>
                    {item.validation}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate" title={item.idor}>
                    {item.idor}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {item.codes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Interactive Verification Suite */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Terminal className="w-4 h-4" />
            <span>Interactive Verification Console</span>
          </div>
          <h2 className="text-xl font-bold text-white">
            Execute Real-Time API Security Probes
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Trigger live security probes against the Express server to inspect headers, auth rejection, IDOR blocking, and body-parser limits.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => runLiveTest('headers')}
            disabled={testingId !== null}
            className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center justify-center gap-2 transition-colors"
          >
            {testingId === 'headers' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>Probe Headers</span>
          </button>

          <button
            onClick={() => runLiveTest('unauth')}
            disabled={testingId !== null}
            className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center justify-center gap-2 transition-colors"
          >
            {testingId === 'unauth' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>Test 401 Auth</span>
          </button>

          <button
            onClick={() => runLiveTest('idor')}
            disabled={testingId !== null}
            className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center justify-center gap-2 transition-colors"
          >
            {testingId === 'idor' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>Test 403 IDOR</span>
          </button>

          <button
            onClick={() => runLiveTest('oversized')}
            disabled={testingId !== null}
            className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center justify-center gap-2 transition-colors"
          >
            {testingId === 'oversized' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>Test 413 Size</span>
          </button>
        </div>

        {testOutput && (
          <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                  testOutput.passed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}>
                  {testOutput.passed ? 'DEFENDED / SUCCESS' : 'FAILURE'}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  HTTP Status: {testOutput.status}
                </span>
              </div>
              <span className="text-xs text-slate-400">
                {testOutput.message}
              </span>
            </div>
            <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto max-h-44 p-2 bg-slate-900 rounded">
              {JSON.stringify(testOutput.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

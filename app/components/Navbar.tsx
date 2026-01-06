import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { useApiStore } from "~/lib/api";
import type { KVItem } from "~/lib/api";

const Navbar = () => {
  const { auth, kv, isLoading, auth: { signOut, signIn } } = useApiStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<Resume[]>([]);
  const initials = useMemo(() => {
    const name = auth.user?.username || "U";
    const parts = name.trim().split(/\s+/);
    return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : name[0]?.toUpperCase();
  }, [auth.user?.username]);

  useEffect(() => {
    const loadHistory = async () => {
      if (!auth.isAuthenticated) { setHistory([]); return; }
      try {
        const items = (await kv.list("resume:*", true)) as KVItem[];
        const parsed = (items || [])
          .map((it) => {
            try {
              const v = (it as any).value;
              const obj = typeof v === "string" ? JSON.parse(v) : v;
              return obj as Resume;
            } catch { return null; }
          })
          .filter(Boolean) as Resume[];
        // newest first by created/modified/id if available; fallback to current order
        const sorted = parsed.slice().reverse();
        setHistory(sorted.slice(0, 5));
      } catch (e) {
        setHistory([]);
        console.warn("Failed to load history", e);
      }
    };
    loadHistory();
  }, [auth.isAuthenticated]);

  return (
    <nav className="navbar">
      <Link to="/">
        <p className="text-2xl font-bold text-gradient">AI Resume Builder</p>
      </Link>

      <div className="flex items-center gap-2 max-sm:flex-wrap">
        <Link to="/upload" className="primary-button w-fit max-sm:px-3 max-sm:py-1.5 max-sm:text-sm">
          Analyze Resume
        </Link>
        {/* Create Resume Feature - Temporarily Disabled */}
        {/* <Link to="/editor/new" className="rounded-full px-4 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 transition-all max-sm:px-3 max-sm:py-1.5 max-sm:text-sm">
          Create Resume
        </Link> */}
        <Link to="/plans" className="rounded-full px-4 py-2 border border-gray-200 hidden sm:block hover:bg-gray-50 transition-colors">
          Pricing
        </Link>
        {auth.isAuthenticated && (
          <Link to="/resumes" className="rounded-full px-4 py-2 border border-gray-200 hidden sm:block">
            My Resumes
          </Link>
        )}

        {auth.isAuthenticated ? (
          <div className={`relative ${(location.pathname === '/upload') ? 'max-sm:hidden' : ''}`}>
            <button
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 border border-gray-200"
              onClick={() => setOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={open}
              title={auth.user?.username}
            >
              <span className="text-sm font-semibold">{initials}</span>
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-64 sm:w-80 bg-white border border-gray-200 rounded-2xl shadow-lg p-4 z-50">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                  <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-semibold">
                    {initials}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold truncate">{auth.user?.username}</span>
                    <span className="text-xs text-dark-200 break-all">{auth.user?.uuid}</span>
                  </div>
                </div>

                <div className="pt-3">
                  <Link to="/resumes" className="text-sm text-blue-600 hover:underline" onClick={() => setOpen(false)}>
                    Your Scanned Resumes
                  </Link>
                </div>

                <div className="pt-3 hidden sm:block">
                  <div className="text-xs text-dark-200 mb-2">Recent History</div>
                  {history.length === 0 ? (
                    <div className="text-sm text-dark-200">No recent items</div>
                  ) : (
                    <ul className="flex flex-col gap-2 max-h-60 overflow-auto">
                      {history.map((r) => (
                        <li key={r.id}>
                          <Link
                            to={`/resume/${r.id}`}
                            className="flex flex-col rounded-xl p-2 hover:bg-gray-50"
                            onClick={() => setOpen(false)}
                          >
                            <span className="text-sm font-medium line-clamp-1">{r.jobTitle || "Resume"}</span>
                            <span className="text-xs text-dark-200 line-clamp-1">{r.companyName || r.id}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-2">
                  <Link to="/wipe" className="text-sm text-red-600 hover:underline" onClick={() => setOpen(false)}>
                    Wipe App Data
                  </Link>
                  <button
                    className="text-sm text-left text-gray-700 hover:underline"
                    onClick={async () => { setOpen(false); await signOut(); navigate('/auth?next=/'); }}
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button className="rounded-full px-4 py-2 border border-gray-200 hidden sm:inline-block" onClick={() => {
                      const next = (location.pathname || '/') + (location.search || '');
                      navigate('/auth?next=' + encodeURIComponent(next));
                    }}>
            Sign in
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
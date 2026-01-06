import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useApiStore } from "~/lib/api";
import type { FSItem, KVItem } from "~/lib/api";
import Navbar from "~/components/Navbar";
import Footer from "~/components/Footer";

const WipeApp = () => {
  const { auth, isLoading, error, fs, kv } = useApiStore();
  const navigate = useNavigate();
  const [files, setFiles] = useState<FSItem[]>([]);
  const [kvCount, setKvCount] = useState<number>(0);
  const [confirm, setConfirm] = useState<string>("");
  const [working, setWorking] = useState(false);
  const [result, setResult] = useState<string>("");



  const load = async () => {
    const listed = (await fs.readDir("./")) as FSItem[];
    setFiles(listed || []);
    try {
      const kvItems = (await kv.list("resume:*", true)) as KVItem[];
      setKvCount(kvItems?.length || 0);
    } catch {
      setKvCount(0);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!isLoading && !auth.isAuthenticated) {
      navigate("/auth?next=/wipe");
    }
  }, [isLoading, auth.isAuthenticated, navigate]);

  const handleDelete = async () => {
    if (confirm.toLowerCase() !== "wipe") {
      setResult("Type 'wipe' to confirm.");
      return;
    }
    setWorking(true);
    setResult("");
    try {
      // delete files in parallel
      await Promise.all(
        (files || []).map(async (file) => {
          try { await fs.delete(file.path); } catch {}
        })
      );
      // flush kv
      await kv.flush();
      setResult("All app data has been wiped successfully.");
      await load();
    } catch (e) {
      setResult("Failed to wipe data. Please try again.");
      console.error(e);
    } finally {
      setWorking(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error {error}</div>;

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen flex flex-col">
      <Navbar />
      <section className="main-section flex-1">
        <div className="page-heading py-16">
          <h1>Danger Zone</h1>
          <h2>Wipe all app data from your storage and database</h2>
        </div>

        <div className="w-full max-w-2xl gradient-border">
          <div className="bg-white rounded-xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Authenticated as</div>
                <div className="text-dark-200 text-sm">{auth.user?.username} · {auth.user?.uuid}</div>
              </div>
              <Link to="/" className="back-button">Back to Home</Link>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-sm text-dark-200">Files in root</div>
                <div className="text-3xl font-semibold">{files.length}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-sm text-dark-200">Saved resumes (KV)</div>
                <div className="text-3xl font-semibold">{kvCount}</div>
              </div>
            </div>

            {files.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm">Show files</summary>
                <ul className="mt-2 list-disc pl-6 max-h-40 overflow-auto">
                  {files.map((f) => (
                    <li key={f.id} className="text-sm text-dark-200">{f.name}</li>
                  ))}
                </ul>
              </details>
            )}

            <div className="mt-4">
              <label className="text-sm">Type 'wipe' to confirm</label>
              <input
                className="mt-2"
                placeholder="wipe"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={working}
              />
            </div>

            {result && (
              <div className={`text-sm ${result.includes('Failed') ? 'text-red-600' : 'text-green-700'}`}>{result}</div>
            )}

            <button
              className={`rounded-full px-4 py-2 cursor-pointer w-full ${working ? 'primary-gradient opacity-60' : 'primary-gradient'} text-white`}
              onClick={handleDelete}
              disabled={working || confirm.toLowerCase() !== 'wipe'}
            >
              {working ? 'Wiping…' : 'Wipe App Data'}
            </button>
          </div>
        </div>
      </section>
        <Footer />
    </main>
  );
};

export default WipeApp;
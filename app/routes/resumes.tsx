import React, { useEffect, useState } from "react";
import Navbar from "~/components/Navbar";
import Footer from "~/components/Footer";
import ResumeCard from "~/components/ResumeCard";
import { useApiStore } from "~/lib/api";
import type { KVItem } from "~/lib/api";
import { Link, useNavigate } from "react-router";

export const meta = () => ([
  { title: 'AI Resume Builder | Your Scanned Resumes' },
  { name: 'description', content: 'Your scanned resumes and AI feedback history' }
]);

const Resumes = () => {
  const { auth, isLoading, kv } = useApiStore();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(true);



  // Require authentication for viewing personal history
  useEffect(() => {
    if (!isLoading && !auth.isAuthenticated) {
      navigate('/auth?next=' + encodeURIComponent('/resumes'));
    }
  }, [auth.isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    const loadResumes = async () => {
      setLoadingResumes(true);
      try {
        const items = (await kv.list('resume:*', true)) as KVItem[];
        const parsed = (items || []).map((it) => {
          try {
            const v = (it as any).value;
            return typeof v === 'string' ? JSON.parse(v) as Resume : v as Resume;
          } catch {
            return null;
          }
        }).filter(Boolean) as Resume[];
        // Show newest first
        setResumes(parsed.slice().reverse());
      } catch (e) {
        console.error('Failed to load resumes', e);
        setResumes([]);
      } finally {
        setLoadingResumes(false);
      }
    };

    if (auth.isAuthenticated) {
      loadResumes();
    }
  }, [auth.isAuthenticated, kv]);

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen flex flex-col">
      <Navbar />
      <section className="main-section flex-1">
        <div className="page-heading py-16">
          <h1>Your Scanned Resumes</h1>
          {loadingResumes ? (
            <h2>Loading your history…</h2>
          ) : resumes.length > 0 ? (
            <h2>Review your submissions and AI-powered feedback</h2>
          ) : (
            <h2>No scans yet — upload a resume to get started</h2>
          )}
          <div className="flex gap-3">
            <Link to="/upload" className="primary-button w-fit">Upload Resume</Link>
            <Link to="/" className="back-button">Back to Home</Link>
          </div>
        </div>

        {loadingResumes && (
          <div className="flex flex-col items-center justify-center">
            <img src="/images/resume-scan-2.gif" className="w-[200px]" />
          </div>
        )}

        {!loadingResumes && resumes.length > 0 && (
          <div className="resumes-section">
            {resumes.map((r) => (
              <ResumeCard key={r.id} resume={r} />
            ))}
          </div>
        )}
      </section>
      <Footer />
    </main>
  );
};

export default Resumes;

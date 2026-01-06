import type { Route } from "./+types/home";
import { useEffect } from "react";
import Navbar from "~/components/Navbar"
import Footer from "~/components/Footer";
import {Link, useNavigate} from "react-router";
import FreeTierWelcomeModal from "~/components/FreeTierWelcomeModal";
import { useFreeTierWelcome } from "~/lib/useFreeTierWelcome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "AI Resume Builder" },
    { name: "description", content: "Smart Feedback for your Dream Job!" },
  ];
}

export default function Home() {
    const navigate = useNavigate();
    const { showModal, dismissModal, freeTrialDaysRemaining } = useFreeTierWelcome();



    return <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen flex flex-col">
      <Navbar />
      <FreeTierWelcomeModal
        isOpen={showModal}
        onClose={dismissModal}
        onExplorePricing={() => {
          dismissModal();
          navigate('/plans');
        }}
        freeTrialDaysRemaining={freeTrialDaysRemaining}
      />
      <section className="main-section flex-1">
          <div className="page-heading py-16 text-center">
              <h1>Crack your dream job using AI</h1>
              <h2>Get instant ATS insights and improvement tips for your resume.</h2>
              
              {/* Main call to action */}
              <div className="flex items-center justify-center mt-8">
                <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-2xl shadow-lg max-w-md hover:shadow-xl transition-all">
                  <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-2xl font-bold text-black">AI Resume Builder</h3>
                  <p className="text-gray-600 text-center">Upload your existing resume for AI-powered ATS scoring, detailed feedback, and improvement suggestions</p>
                  <Link to="/upload" className="primary-button w-full text-lg font-semibold">
                    Upload & Analyze
                  </Link>
                </div>

                {/* Create Resume Feature - Temporarily Disabled */}
                {/* <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-2xl shadow-lg max-w-md hover:shadow-xl transition-all">
                  <svg className="w-16 h-16 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <h3 className="text-2xl font-bold text-black">Create Resume</h3>
                  <p className="text-gray-600 text-center">Start fresh with our markdown editor featuring live preview, professional templates, and AI-powered suggestions</p>
                  <Link to="/editor/new" className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all w-full text-lg font-semibold text-center">
                    Create New Resume
                  </Link>
                </div> */}
              </div>
          </div>

          <div className="flex flex-col items-center justify-center mt-12 gap-6">
              <h3 className="text-2xl font-semibold text-black">Sample Resumes</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-[860px] px-4">
                  <img src="/images/resume_01.png" alt="Sample resume 1" className="rounded-xl shadow-sm w-full max-w-[500px]"/>
                  <img src="/images/resume_02.png" alt="Sample resume 2" className="rounded-xl shadow-sm w-full max-w-[500px]"/>
                  <img src="/images/resume_03.png" alt="Sample resume 3" className="rounded-xl shadow-sm w-full max-w-[500px]"/>
              </div>
          </div>
      </section>
      <Footer />
  </main>;
}

import React, { useState, useEffect } from "react";

export type ATSSuggestion = {
  type: "good" | "improve";
  tip: string;
};

export type ATSProps = {
  score: number; // 1-100
  suggestions?: ATSSuggestion[];
};

const ATS: React.FC<ATSProps> = ({ score }) => {
  const clamped = Math.max(1, Math.min(100, Math.round(score)));
  const [isScrolled, setIsScrolled] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Background gradient start color based on score
  const fromColor = clamped > 69 ? "from-green-100" : clamped > 49 ? "from-yellow-100" : "from-red-100";

  // Icon based on score
  const icon = clamped > 69 ? "/icons/ats-good.svg" : clamped > 49 ? "/icons/ats-warning.svg" : "/icons/ats-bad.svg";

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Large card version
  if (!isScrolled) {
    return (
      <div className={`w-full rounded-2xl shadow-md bg-gradient-to-b ${fromColor} to-white p-6 transition-all duration-300`}> 
        <div className="flex items-center gap-4">
          <img src={icon} alt="Compatibility status" className="h-12 w-12" />
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">Compatibility Score with JD - {clamped}/100</h2>
          </div>
        </div>
      </div>
    );
  }

  // Small circle version (top right, fixed with smooth animation)
  return (
    <div
      className="fixed top-6 right-6 z-40 transition-all duration-500 ease-out animate-in fade-in zoom-in-50"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="relative group">
        {/* Circle showing score - White background with black text */}
        <div
          className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-xl border-2 border-gray-200"
        >
          <div className="text-center">
            <div className="text-3xl font-black text-black">{clamped}</div>
            <div className="text-xs font-semibold text-gray-600">/100</div>
          </div>
        </div>

        {/* Tooltip on hover */}
        {showTooltip && (
          <div className="absolute top-full right-0 mt-2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap pointer-events-none shadow-lg animate-in fade-in duration-200">
            Compatibility Score with JD
            <div className="absolute bottom-full right-2 -mb-1 w-2 h-2 bg-gray-900 transform rotate-45"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ATS;

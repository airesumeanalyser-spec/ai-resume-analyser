import React from 'react';

interface ScoreBadgeProps {
  score: number;
}

// Small reusable badge that displays a qualitative label for a numeric score.
// Structure requirement: the component returns a single div with exactly one <p> inside.
const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score }) => {
  // Determine color set and label based on thresholds
  let bgClass = '';
  let textClass = '';
  let label = '';

  if (score > 70) {
    // Strong
    bgClass = 'bg-badge-green';
    textClass = 'text-green-600';
    label = 'Strong';
  } else if (score < 49) {
    // Good Start
    bgClass = 'bg-badge-yellow';
    textClass = 'text-yellow-600';
    label = 'Good Start';
  } else {
    // Needs Work
    bgClass = 'bg-badge-red';
    textClass = 'text-red-600';
    label = 'Needs Work';
  }

  return (
    <div className={`inline-flex items-center rounded-full px-3 py-1 ${bgClass}`}>
      <p className={`text-sm font-medium ${textClass}`}>{label}</p>
    </div>
  );
};

export default ScoreBadge;

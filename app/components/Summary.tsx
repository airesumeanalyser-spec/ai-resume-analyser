import React from 'react';
import ScoreGuage from "~/components/ScoreGuage";
import ScoreBadge from "~/components/ScoreBadge";

const Category = ({ title, score, accent}: {title: string, score: number, accent: 'tone' | 'content' | 'structure' | 'skills'}) => {
    const textColor = score > 70 ? 'text-green-600'
        : score > 49 ? 'text-yellow-600' : 'text-red-600';

    const border = {
        tone: 'border-l-4 border-purple-400',
        content: 'border-l-4 border-blue-400',
        structure: 'border-l-4 border-emerald-400',
        skills: 'border-l-4 border-pink-400',
    }[accent];

    return (
        <div className="resume-summary">
            <div className={`category ${border}`}>
                <div className="flex flex-row gap-2 items-center justify-center">
                    <p className="text-2xl">{title}</p>
                    <ScoreBadge score={score} />
                </div>
                <p className="text-2xl">
                    <span className={textColor}>{score}</span>/100
                </p>
            </div>
        </div>
    )
}

const Summary = ({ feedback } : { feedback: Feedback }) => {
    return (
        <div className="bg-white rounded-2xl shadow-md w-full">
            <div className="flex flex-row items-center p-4 gap-8">
                <ScoreGuage score={feedback.overallScore} />

                <div className="flex flex-col gap-2">
                    <h2 className="text-2xl font-bold">Your Resume Score</h2>
                    <p className="text-sm text-gray-500">
                        This score is based on the variables listed below.
                    </p>
                </div>

            </div>

            <Category title="Tone & Style" score={feedback.toneAndStyle.score} accent="tone" />
            <Category title="Content" score={feedback.content.score} accent="content" />
            <Category title="Structure" score={feedback.structure.score} accent="structure" />
            <Category title="Skills" score={feedback.skills.score} accent="skills" />

        </div>
    )
}

export default Summary;
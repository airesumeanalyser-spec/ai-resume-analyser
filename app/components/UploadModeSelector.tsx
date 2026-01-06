import React from "react";

interface UploadModeSelectorProps {
    mode: 'manual' | 'upload';
    onModeChange: (mode: 'manual' | 'upload') => void;
}

const UploadModeSelector = ({ mode, onModeChange }: UploadModeSelectorProps) => {
    return (
        <div className="w-full mb-8">
            <div className="flex gap-4 justify-center">
                <button
                    onClick={() => onModeChange('manual')}
                    className={`flex-1 max-w-xs px-6 py-3 rounded-lg font-semibold transition-all ${
                        mode === 'manual'
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Manual JD
                    </div>
                </button>

                <button
                    onClick={() => onModeChange('upload')}
                    className={`flex-1 max-w-xs px-6 py-3 rounded-lg font-semibold transition-all ${
                        mode === 'upload'
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Upload JD & Resume
                    </div>
                </button>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-700">
                    {mode === 'manual'
                        ? '📝 Enter your Job Description manually for instant analysis'
                        : '📄 Upload your Job Description and Resume files for detailed comparison'}
                </p>
            </div>
        </div>
    );
};

export default UploadModeSelector;

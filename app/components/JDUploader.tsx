import React from "react";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import formatSize from "~/lib/formatSize";

interface JDUploaderProps {
    onFileSelect?: (file: File | null) => void;
    label?: string;
}

const JDUploader = ({ onFileSelect, label = "Upload Job Description" }: JDUploaderProps) => {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file: File = acceptedFiles[0] || null;
        onFileSelect?.(file);
    }, [onFileSelect]);

    const maxSize = 20 * 1024 * 1024;
    const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
        onDrop,
        multiple: false,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/msword': ['.doc'],
        },
        maxSize,
    });

    const file = acceptedFiles[0] || null;

    return (
        <div className="w-full gradient-booster">
            <div {...getRootProps()}>
                <input {...getInputProps()} />
                <div className="space-y-4 cursor-pointer">
                    {file ? (
                        <div className="uploader-selected-file" onClick={(e) => e.stopPropagation()}>
                            <div className="text-center">
                                <img
                                    src={
                                        file.type === 'application/pdf'
                                            ? '/images/pdf.png'
                                            : '/images/doc.png'
                                    }
                                    alt={file.type === 'application/pdf' ? 'pdf' : 'doc'}
                                    className="size-10"
                                />
                                <div>
                                    <p className="text-sm font-medium text-gray-700 truncate max-w-xs">
                                        {file.name}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {formatSize(file.size)}
                                    </p>
                                </div>
                            </div>
                            <button
                                className="p-2 cursor-pointer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onFileSelect?.(null);
                                }}
                                type="button"
                            >
                                <img src="/icons/cross.svg" alt="remove" className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div>
                            <div className="mx-auto w-16 h-16 flex items-center justify-center mb-2">
                                <img src="/icons/info.svg" alt="upload" className="size-20" />
                            </div>
                            <p className="text-lg text-gray-500">
                                <span className="font-semibold">Click or Upload</span> or drag and drop
                            </p>
                            <p className="text-lg text-gray-500">
                                PDF or DOCX (max {formatSize(maxSize)})
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JDUploader;

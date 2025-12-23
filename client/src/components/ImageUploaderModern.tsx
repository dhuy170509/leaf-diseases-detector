/**
 * Image Uploader Component
 * Drag-and-drop + click upload with image preview
 */

import React, { useState, useRef } from 'react';
import { Upload, X, Check } from 'lucide-react';

interface ImageUploaderProps {
    onUpload: (file: File, metadata: any) => void;
    loading: boolean;
    isDarkMode: boolean;
}

export default function ImageUploader({ onUpload, loading, isDarkMode }: ImageUploaderProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = (file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        setFileName(file.name);

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        // Upload with default metadata
        onUpload(file, {
            plantPart: 'leaves',
            environmentalCondition: 'normal',
            urgencyLevel: 'normal'
        });
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFile(files[0]);
        }
    };

    const handleClear = () => {
        setPreview(null);
        setFileName(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div>
            {/* Preview */}
            {preview ? (
                <div className="mb-4">
                    <div className="relative group">
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-64 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                                onClick={handleClear}
                                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                    <p className={`text-sm mt-2 truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {fileName}
                    </p>
                </div>
            ) : null}

            {/* Upload Area */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClick}
                className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragging ? (isDarkMode ? 'border-green-500 bg-green-500/10' : 'border-green-400 bg-green-50') : ''}
          ${isDarkMode ? 'border-gray-600 hover:border-green-500 hover:bg-green-500/5' : 'border-gray-300 hover:border-green-400 hover:bg-green-50'}
        `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleInputChange}
                    className="hidden"
                />

                <div className={`flex flex-col items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <Upload size={32} className="mb-2 text-green-500" />
                    <p className="font-medium">Drag and drop your image</p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        or click to select
                    </p>
                </div>
            </div>

            {/* Info */}
            <div className={`mt-4 p-3 rounded-lg text-sm ${isDarkMode ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
                <p>📸 Supported formats: JPEG, PNG, WebP</p>
                <p>📏 Recommended size: 224x224 or larger</p>
            </div>

            {loading && (
                <div className={`mt-4 p-3 rounded-lg text-sm ${isDarkMode ? 'bg-green-900/20 text-green-300' : 'bg-green-50 text-green-700'} flex items-center gap-2`}>
                    <div className="animate-spin h-4 w-4 border-2 border-green-500 border-t-transparent rounded-full"></div>
                    <p>Processing your image...</p>
                </div>
            )}
        </div>
    );
}

/**
 * Modern Disease Detection App - Main Component
 * Features: Image upload, real-time prediction, dark/light theme, responsive design
 */

import React, { useState, useEffect } from 'react';
import { Upload, Moon, Sun, Info, Settings } from 'lucide-react';
import ImageUploader from './components/ImageUploaderModern';
import PredictionResult from './components/PredictionResultModern';
import DiseaseDetails from './components/DiseaseDetailsModern';
import ModelSelector from './components/ModelSelectorModern';
import '../styles/app.css';

interface PredictionData {
    success: boolean;
    prediction: {
        disease: string;
        confidence: number;
        severity: string;
    };
    diseaseInfo: any;
    modelUsed: string;
    processingTime: number;
    confidenceLevel: string;
    modelBreakdown: any[];
}

export default function App() {
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [prediction, setPrediction] = useState<PredictionData | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedModel, setSelectedModel] = useState('best_model');
    const [showSettings, setShowSettings] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Apply theme
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    const handleImageUpload = async (file: File, metadata: any) => {
        setLoading(true);
        setError(null);
        setPrediction(null);

        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('plantPart', metadata.plantPart);
            formData.append('environmentalCondition', metadata.environmentalCondition);
            formData.append('urgencyLevel', metadata.urgencyLevel);

            const response = await fetch('/api/predict', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Prediction failed');
            }

            const data = await response.json();
            setPrediction(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            {/* Header */}
            <header className={`sticky top-0 z-50 border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-green-600' : 'bg-green-500'}`}>
                                <span className="text-white font-bold text-lg">🌿</span>
                            </div>
                            <div>
                                <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    Leaf Disease Detector
                                </h1>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    AI-Powered Plant Health Analysis
                                </p>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-3">
                            {/* Theme Toggle */}
                            <button
                                onClick={() => setIsDarkMode(!isDarkMode)}
                                className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                                aria-label="Toggle theme"
                            >
                                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                            </button>

                            {/* Settings */}
                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                                aria-label="Settings"
                            >
                                <Settings size={20} className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Panel - Upload & Settings */}
                    <div className="lg:col-span-1">
                        {/* Upload Section */}
                        <div className={`rounded-2xl p-6 mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                            <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Upload Image
                            </h2>
                            <ImageUploader
                                onUpload={handleImageUpload}
                                loading={loading}
                                isDarkMode={isDarkMode}
                            />
                        </div>

                        {/* Settings Panel */}
                        {showSettings && (
                            <div className={`rounded-2xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                                <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    Analysis Settings
                                </h3>

                                {/* Model Selector */}
                                <div className="mb-6">
                                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        AI Model
                                    </label>
                                    <select
                                        value={selectedModel}
                                        onChange={(e) => setSelectedModel(e.target.value)}
                                        className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                    >
                                        <option value="best_model">Best Model (257.7 MB)</option>
                                        <option value="best_mtl_model">MTL Model (67.1 MB)</option>
                                        <option value="efficientnetb0">EfficientNet B0 (16.7 MB)</option>
                                    </select>
                                </div>

                                {/* Environmental Condition */}
                                <div className="mb-4">
                                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Environmental Condition
                                    </label>
                                    <select className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                                        <option>Normal</option>
                                        <option>Humid</option>
                                        <option>Dry</option>
                                        <option>Hot</option>
                                        <option>Cold</option>
                                    </select>
                                </div>

                                {/* Urgency Level */}
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Urgency Level
                                    </label>
                                    <select className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                                        <option>Low</option>
                                        <option selected>Normal</option>
                                        <option>Urgent</option>
                                        <option>Critical</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Panel - Results */}
                    <div className="lg:col-span-2">
                        {error && (
                            <div className={`rounded-2xl p-6 mb-6 border-l-4 ${isDarkMode ? 'bg-red-900/20 border-red-600' : 'bg-red-50 border-red-500'}`}>
                                <p className={`${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
                                    {error}
                                </p>
                            </div>
                        )}

                        {loading && (
                            <div className={`rounded-2xl p-12 flex flex-col items-center justify-center ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-4"></div>
                                <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    Analyzing image...
                                </p>
                            </div>
                        )}

                        {prediction && !loading && (
                            <>
                                <PredictionResult
                                    prediction={prediction}
                                    isDarkMode={isDarkMode}
                                />
                                <DiseaseDetails
                                    diseaseInfo={prediction.diseaseInfo}
                                    isDarkMode={isDarkMode}
                                />
                            </>
                        )}

                        {!prediction && !loading && (
                            <div className={`rounded-2xl p-12 text-center ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                                <Upload size={48} className={`mx-auto mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                                <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    Upload an image to get started
                                </p>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Supported formats: JPEG, PNG, WebP
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className={`border-t mt-16 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                        <div>
                            <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>About</h3>
                            <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                AI-powered leaf disease detection using advanced neural networks
                            </p>
                        </div>
                        <div>
                            <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Features</h3>
                            <ul className={`text-sm mt-2 space-y-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                <li>• Real-time detection</li>
                                <li>• Multi-model support</li>
                                <li>• Detailed analysis</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Support</h3>
                            <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Need help? Check our documentation or contact support.
                            </p>
                        </div>
                    </div>
                    <div className={`text-center text-sm pt-8 border-t ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-600'}`}>
                        <p>© 2025 Leaf Disease Detector. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

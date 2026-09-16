/**
 * Prediction Result Component
 * Displays disease prediction with confidence and severity
 */

import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Activity } from 'lucide-react';

interface PredictionResultProps {
    prediction: any;
    isDarkMode: boolean;
}

export default function PredictionResult({ prediction, isDarkMode }: PredictionResultProps) {
    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'HIGH':
                return isDarkMode ? 'bg-red-900/20 border-red-600' : 'bg-red-50 border-red-300';
            case 'MEDIUM':
                return isDarkMode ? 'bg-yellow-900/20 border-yellow-600' : 'bg-yellow-50 border-yellow-300';
            case 'LOW':
                return isDarkMode ? 'bg-green-900/20 border-green-600' : 'bg-green-50 border-green-300';
            default:
                return isDarkMode ? 'bg-gray-900/20 border-gray-600' : 'bg-gray-50 border-gray-300';
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'HIGH':
                return <AlertCircle className="text-red-500" size={24} />;
            case 'MEDIUM':
                return <AlertTriangle className="text-yellow-500" size={24} />;
            case 'LOW':
                return <CheckCircle className="text-green-500" size={24} />;
            default:
                return <Activity className="text-gray-500" size={24} />;
        }
    };

    const confidencePercentage = Math.round(prediction.prediction.confidence * 100);

    return (
        <div className={`rounded-2xl p-8 mb-6 border ${getSeverityColor(prediction.prediction.severity)} shadow-lg`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                    {getSeverityIcon(prediction.prediction.severity)}
                    <div>
                        <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {prediction.prediction.disease}
                        </h2>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Severity: {prediction.prediction.severity}
                        </p>
                    </div>
                </div>
            </div>

            {/* Confidence Bar */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Confidence
                    </span>
                    <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {confidencePercentage}%
                    </span>
                </div>
                <div className={`w-full h-3 rounded-full overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div
                        className={`h-full transition-all duration-500 ${confidencePercentage >= 80 ? 'bg-green-500' :
                                confidencePercentage >= 60 ? 'bg-yellow-500' :
                                    'bg-red-500'
                            }`}
                        style={{ width: `${confidencePercentage}%` }}
                    ></div>
                </div>
            </div>

            {/* Confidence Level */}
            <div className={`p-4 rounded-lg mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Confidence Level: <span className="font-bold">{prediction.confidenceLevel}</span>
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Model: <span className="font-mono">{prediction.modelUsed}</span>
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Processing Time: <span className="font-mono">{prediction.processingTime}ms</span>
                </p>
            </div>

            {/* Disease Probabilities */}
            {prediction.modelBreakdown && prediction.modelBreakdown.length > 0 && prediction.modelBreakdown[0].diseaseProbabilities && (
                <div>
                    <h3 className={`font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Disease Probabilities
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {Object.entries(prediction.modelBreakdown[0].diseaseProbabilities)
                            .sort(([, a]: any, [, b]: any) => b - a)
                            .slice(0, 5)
                            .map(([disease, prob]: any) => (
                                <div key={disease} className="flex items-center gap-3">
                                    <span className={`text-sm flex-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        {disease}
                                    </span>
                                    <div className={`w-24 h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                        <div
                                            className="h-full bg-blue-500"
                                            style={{ width: `${Math.round(prob * 100)}%` }}
                                        ></div>
                                    </div>
                                    <span className={`text-sm font-medium w-12 text-right ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        {Math.round(prob * 100)}%
                                    </span>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Recommendation */}
            <div className={`mt-6 p-4 rounded-lg border-l-4 ${isDarkMode ? 'bg-blue-900/20 border-blue-500' : 'bg-blue-50 border-blue-400'}`}>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                    💡 Recommendation
                </p>
                <p className={`text-sm mt-2 ${isDarkMode ? 'text-blue-200' : 'text-blue-600'}`}>
                    {prediction.prediction.disease === 'Lá khỏe mạnh'
                        ? 'Your plant appears to be healthy! Continue regular monitoring and maintenance.'
                        : 'Please refer to the disease details below for recommended treatment options.'}
                </p>
            </div>
        </div>
    );
}

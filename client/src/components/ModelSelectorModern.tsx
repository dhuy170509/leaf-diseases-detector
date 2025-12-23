/**
 * Model Selector Component
 * Display and select different AI models
 */

import React from 'react';
import { Zap, Cpu, Leaf } from 'lucide-react';

interface Model {
    name: string;
    size: number;
    speed: string;
    accuracy: string;
    description: string;
}

interface ModelSelectorProps {
    onModelSelect: (model: string) => void;
    selectedModel: string;
    isDarkMode: boolean;
}

const MODELS: { [key: string]: Model } = {
    best_model: {
        name: 'Best Model',
        size: 257.7,
        speed: 'Standard',
        accuracy: '92-95%',
        description: 'Most accurate model for disease detection'
    },
    best_mtl_model: {
        name: 'Multi-Task Learning',
        size: 67.1,
        speed: 'Balanced',
        accuracy: '88-91%',
        description: 'Disease classification + segmentation'
    },
    efficientnetb0: {
        name: 'EfficientNet B0',
        size: 16.7,
        speed: 'Fast',
        accuracy: '85-88%',
        description: 'Lightweight model for quick inference'
    }
};

export default function ModelSelector({ onModelSelect, selectedModel, isDarkMode }: ModelSelectorProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(MODELS).map(([key, model]) => (
                <button
                    key={key}
                    onClick={() => onModelSelect(key)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${selectedModel === key
                            ? isDarkMode
                                ? 'border-green-500 bg-green-500/10'
                                : 'border-green-400 bg-green-50'
                            : isDarkMode
                                ? 'border-gray-700 hover:border-gray-600'
                                : 'border-gray-200 hover:border-gray-300'
                        }`}
                >
                    <div className="flex items-start justify-between mb-2">
                        <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {model.name}
                        </h3>
                        {selectedModel === key && (
                            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                <span className="text-white text-sm">✓</span>
                            </div>
                        )}
                    </div>

                    <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {model.description}
                    </p>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className={`p-2 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Size</p>
                            <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {model.size} MB
                            </p>
                        </div>
                        <div className={`p-2 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Speed</p>
                            <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {model.speed}
                            </p>
                        </div>
                        <div className={`p-2 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Accuracy</p>
                            <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {model.accuracy}
                            </p>
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
}

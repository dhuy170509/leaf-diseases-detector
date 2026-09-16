/**
 * Disease Details Component
 * Displays comprehensive disease information
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Leaf, Bug, Droplets, TrendingDown } from 'lucide-react';

interface DiseaseDetailsProps {
    diseaseInfo: any;
    isDarkMode: boolean;
}

export default function DiseaseDetails({ diseaseInfo, isDarkMode }: DiseaseDetailsProps) {
    const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
        symptoms: true,
        treatment: true,
        prevention: true,
        economic: false
    });

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    if (!diseaseInfo) {
        return null;
    }

    const SectionHeader = ({ icon: Icon, title, section }: any) => (
        <button
            onClick={() => toggleSection(section)}
            className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors ${isDarkMode
                    ? 'bg-gray-800 hover:bg-gray-700'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
        >
            <div className="flex items-center gap-3">
                <Icon className="text-green-500" size={20} />
                <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {title}
                </span>
            </div>
            {expandedSections[section] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
    );

    const SectionContent = ({ children }: any) => (
        <div className={`px-4 py-3 ${isDarkMode ? 'bg-gray-900 text-gray-300' : 'bg-gray-50 text-gray-700'}`}>
            {children}
        </div>
    );

    return (
        <div className={`rounded-2xl overflow-hidden shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            {/* Disease Header */}
            <div className={`px-6 py-4 border-b ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {diseaseInfo.name || 'Disease Information'}
                </h3>
                {diseaseInfo.commonNames && (
                    <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Common names: {diseaseInfo.commonNames}
                    </p>
                )}
            </div>

            {/* Disease Sections */}
            <div className="divide-y divide-gray-600">
                {/* Symptoms */}
                <div className={`${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <SectionHeader icon={Leaf} title="Symptoms" section="symptoms" />
                    {expandedSections.symptoms && (
                        <SectionContent>
                            <p className="leading-relaxed">{diseaseInfo.symptoms || 'No information available'}</p>
                        </SectionContent>
                    )}
                </div>

                {/* Causes */}
                <div className={`${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <SectionHeader icon={Bug} title="Causes" section="causes" />
                    {expandedSections.causes && (
                        <SectionContent>
                            <p className="leading-relaxed">{diseaseInfo.causes || 'No information available'}</p>
                        </SectionContent>
                    )}
                </div>

                {/* Treatment */}
                <div className={`${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <SectionHeader icon={Droplets} title="Treatment" section="treatment" />
                    {expandedSections.treatment && (
                        <SectionContent>
                            <p className="leading-relaxed">{diseaseInfo.treatment || 'No information available'}</p>
                        </SectionContent>
                    )}
                </div>

                {/* Prevention */}
                <div className={`${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <SectionHeader icon={TrendingDown} title="Prevention" section="prevention" />
                    {expandedSections.prevention && (
                        <SectionContent>
                            <p className="leading-relaxed">{diseaseInfo.prevention || 'No information available'}</p>
                        </SectionContent>
                    )}
                </div>

                {/* Economic Impact */}
                {diseaseInfo.economicImpact && (
                    <div className={`${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <SectionHeader icon={TrendingDown} title="Economic Impact" section="economic" />
                        {expandedSections.economic && (
                            <SectionContent>
                                <p className="leading-relaxed">{diseaseInfo.economicImpact}</p>
                            </SectionContent>
                        )}
                    </div>
                )}
            </div>

            {/* Affected Crops */}
            {diseaseInfo.affectedCrops && diseaseInfo.affectedCrops.length > 0 && (
                <div className={`px-6 py-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <h4 className={`font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Affected Crops
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {diseaseInfo.affectedCrops.map((crop: string, index: number) => (
                            <span
                                key={index}
                                className={`px-3 py-1 rounded-full text-sm font-medium ${isDarkMode
                                        ? 'bg-green-900/30 text-green-300'
                                        : 'bg-green-100 text-green-700'
                                    }`}
                            >
                                {crop}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

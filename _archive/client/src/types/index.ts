export interface DetailedAnalysisReport {
    summaryAnalysis: {
        healthStatus: string;
        diseaseUrgency: string;
        treatmentPriority: string;
        recoveryOutlook: string;
    };
    environmentalFactors: {
        currentCondition: string;
        riskContribution: number;
        recommendations: string[];
    };
    diseaseProgression: {
        currentStage: string;
        progressionSpeed: string;
        timeToSevere: string;
        transmissionRisk: string;
    };
    treatmentStrategy: {
        immediateSteps: string[];
        weeklyPlan: Array<{
            week: number;
            focus: string;
            actions: string[];
            expectedResult: string;
        }>;
        monthlyOutcome: string;
    };
    economicImpact: {
        potentialLoss: string;
        treatmentCost: string;
        roi: string;
        comparisonWithoutTreatment: string;
    };
    riskAssessment: {
        spreadRisk: number;
        deathRisk: number;
        resistanceCapacity: string;
        vulnerabilityFactors: string[];
    };
    historicalContext: {
        seasonalTrend: string;
        regionalPrevalence: string;
        treatmentSuccessRate: string;
    };
    expertRecommendation: string;
}

export interface PredictionResult {
    success: boolean;
    prediction: {
        prediction: string;
        confidence: number;
        severity: string;
        crop: string;
        originalPrediction: string;
        source: string;
        processingTime: number;
        detailedAnalysisReport: DetailedAnalysisReport;
        detailedAnalysisFormatted: string;
    };
    imageInfo: {
        filename: string;
        size: number;
        contentType: string;
    };
    timestamp: string;
}

export interface HistoryItem {
    id: number;
    timestamp: string;
    crop: string;
    disease: string;
    confidence: number;
    severity: string;
    imageFilename: string;
    predictionResult: string;
}

export interface AnalysisOptions {
    plantPart: string;
    environmentalCondition: string;
    diseaseHistory: string;
    treatmentAttempted: string;
    urgencyLevel: string;
    region: string;
}

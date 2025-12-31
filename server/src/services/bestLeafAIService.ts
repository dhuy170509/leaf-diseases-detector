// BestLeafAIService inert stub after HARD RESET
// All model loading and prediction logic removed.

const BestLeafAIService = {
    async initialize(): Promise<void> {
        return;
    },

    async predict(_imageBuffer: Buffer): Promise<{ status: string; message: string }> {
        return {
            status: 'NO_MODEL_INSTALLED',
            message: 'No AI model is currently installed.'
        };
    },

    getAvailableModels(): any[] {
        return [];
    }
};

export default BestLeafAIService;

// BestLeafAIPythonService inert stub after HARD RESET
// All Python model invocation and executable logic removed.

const BestLeafAIPythonService = {
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

export default BestLeafAIPythonService;

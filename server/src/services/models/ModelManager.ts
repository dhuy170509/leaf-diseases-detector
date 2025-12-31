// ModelManager stub after HARD RESET

// This module intentionally provides a minimal, non-executable stub
// to satisfy imports while ensuring no model logic runs.

export const modelManager = {
    async initialize(): Promise<void> {
        // No-op: models are not loaded
        return;
    },

    async predict(_imageBuffer: Buffer): Promise<{ status: string; message: string }> {
        return {
            status: 'NO_MODEL_INSTALLED',
            message: 'No AI model is currently installed.'
        };
    },

    getPrimaryModel(): null {
        return null;
    },

    getFallbackModels(): any[] {
        return [];
    },

    getAvailableModels(): any[] {
        return [];
    },

    getModelByName(_name: string): null {
        return null;
    },

    getAllModels(): any[] {
        return [];
    },

    async cleanup(): Promise<void> {
        return;
    }
};

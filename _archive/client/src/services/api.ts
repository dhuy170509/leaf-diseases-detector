import { PredictionResult, HistoryItem, AnalysisOptions } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8765';

export const apiService = {
    // Gửi ảnh để phân tích
    async predict(
        file: File,
        options: Partial<AnalysisOptions>
    ): Promise<PredictionResult> {
        const formData = new FormData();
        formData.append('file', file);

        // Thêm tất cả các tùy chỉnh
        Object.entries(options).forEach(([key, value]) => {
            if (value) formData.append(key, value as string);
        });

        const response = await fetch(`${API_BASE_URL}/api/predict`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }

        return response.json();
    },

    // Lấy lịch sử phân tích
    async getHistory(limit = 50): Promise<HistoryItem[]> {
        const response = await fetch(`${API_BASE_URL}/api/history?limit=${limit}`);

        if (!response.ok) {
            throw new Error('Failed to fetch history');
        }

        return response.json();
    },

    // Lấy danh sách bệnh
    async getDiseases() {
        const response = await fetch(`${API_BASE_URL}/api/diseases`);

        if (!response.ok) {
            throw new Error('Failed to fetch diseases');
        }

        return response.json();
    },

    // Tìm kiếm bệnh
    async searchDiseases(query: string) {
        const response = await fetch(`${API_BASE_URL}/api/diseases/search?q=${query}`);

        if (!response.ok) {
            throw new Error('Failed to search diseases');
        }

        return response.json();
    },

    // Health check
    async health() {
        const response = await fetch(`${API_BASE_URL}/health`);
        return response.ok;
    }
};

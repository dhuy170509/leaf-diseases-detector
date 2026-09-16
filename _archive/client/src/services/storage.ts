import { PredictionResult, HistoryItem } from '../types';

const STORAGE_KEYS = {
    HISTORY: 'leaf_disease_history',
    LAST_RESULT: 'leaf_disease_last_result',
    LAST_OPTIONS: 'leaf_disease_last_options'
};

export const storageService = {
    // Lịch sử
    getHistory(): HistoryItem[] {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    },

    addToHistory(item: HistoryItem) {
        const history = this.getHistory();
        const newHistory = [item, ...history].slice(0, 100); // Giữ 100 item mới nhất
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(newHistory));
    },

    clearHistory() {
        localStorage.removeItem(STORAGE_KEYS.HISTORY);
    },

    // Kết quả cuối cùng
    getLastResult(): PredictionResult | null {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.LAST_RESULT);
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    },

    setLastResult(result: PredictionResult) {
        localStorage.setItem(STORAGE_KEYS.LAST_RESULT, JSON.stringify(result));
    },

    // Tùy chỉnh cuối cùng
    getLastOptions() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.LAST_OPTIONS);
            return data ? JSON.parse(data) : {};
        } catch {
            return {};
        }
    },

    setLastOptions(options: Record<string, string>) {
        localStorage.setItem(STORAGE_KEYS.LAST_OPTIONS, JSON.stringify(options));
    }
};

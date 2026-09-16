import { useState, useEffect } from 'react';
import { storageService } from '../services/storage';
import { HistoryItem } from '../types';

export const useHistory = () => {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = () => {
        setLoading(true);
        try {
            const data = storageService.getHistory();
            setHistory(data);
        } finally {
            setLoading(false);
        }
    };

    const addItem = (item: HistoryItem) => {
        storageService.addToHistory(item);
        loadHistory();
    };

    const clearAll = () => {
        storageService.clearHistory();
        setHistory([]);
    };

    return {
        history,
        loading,
        addItem,
        clearAll,
        refresh: loadHistory
    };
};

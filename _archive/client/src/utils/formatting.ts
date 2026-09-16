// Format tệp về kích thước
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

// Format ngày
export const formatDate = (date: string | Date): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Xuất CSV
export const exportToCSV = (data: any[], filename: string) => {
    const headers = Object.keys(data[0] || {});
    const csv = [
        headers.join(','),
        ...data.map(row =>
            headers.map(h => {
                const val = row[h];
                return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
            }).join(',')
        )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
};

// Giá trị severity thành màu sắc
export const getSeverityColor = (severity: string): string => {
    const severities: Record<string, string> = {
        'Healthy': '#10b981',
        'Mild': '#f59e0b',
        'Moderate': '#f97316',
        'Severe': '#dc2626',
        'Critical': '#7c2d12'
    };
    return severities[severity] || '#6b7280';
};

// Severity thành label
export const getSeverityLabel = (severity: string): string => {
    const labels: Record<string, string> = {
        'Healthy': 'Khỏe mạnh ✓',
        'Mild': 'Nhẹ ⚠️',
        'Moderate': 'Trung bình ⚠️⚠️',
        'Severe': 'Nặng ⚠️⚠️⚠️',
        'Critical': 'Tới hạn 🚨'
    };
    return labels[severity] || severity;
};

// Confidence thành phần trăm
export const formatConfidence = (confidence: number): string => {
    return `${(confidence * 100).toFixed(1)}%`;
};

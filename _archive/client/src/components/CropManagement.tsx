/**
 * CropManagement Component - Quản lý hồ sơ cây trồng
 * Features: Create crop, view list, disease history, statistics
 */

import React, { useState, useEffect } from 'react';
import '../styles/cropManagement.css';

interface Crop {
    id: number;
    crop_name: string;
    crop_type: string;
    location: string;
    area_hectare: number;
    planting_date: string;
    variety: string;
    latitude?: number;
    longitude?: number;
    created_at: string;
}

interface DiseaseRecord {
    id: number;
    crop_id: number;
    disease_name: string;
    disease_severity: string;
    confidence_score: number;
    detected_date: string;
    treatment_given?: string;
    resolved: boolean;
}

interface CropStats {
    total_crops: number;
    total_diseases: number;
    avg_severity: string;
    resolved_count: number;
}

const CropManagement: React.FC = () => {
    const [crops, setCrops] = useState<Crop[]>([]);
    const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
    const [diseaseHistory, setDiseaseHistory] = useState<DiseaseRecord[]>([]);
    const [cropStats, setCropStats] = useState<CropStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [userId] = useState(1); // Demo: hardcoded user ID

    // Form state
    const [formData, setFormData] = useState({
        crop_name: '',
        crop_type: 'tomato',
        location: 'Hà Nội',
        area_hectare: 1,
        planting_date: new Date().toISOString().split('T')[0],
        variety: 'F1'
    });

    // Load crops on mount
    useEffect(() => {
        fetchCrops();
    }, []);

    const fetchCrops = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/crops/user/${userId}`);
            const data = await res.json();
            if (data.success) {
                setCrops(data.data);
            }
        } catch (error) {
            console.error('Error fetching crops:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCropDetail = async (cropId: number) => {
        setLoading(true);
        try {
            const [detailRes, historyRes, statsRes] = await Promise.all([
                fetch(`/api/crops/${cropId}`),
                fetch(`/api/crops/${cropId}/history`),
                fetch(`/api/crops/${cropId}/statistics`)
            ]);

            const detail = await detailRes.json();
            const history = await historyRes.json();
            const stats = await statsRes.json();

            if (detail.success) {
                setSelectedCrop(detail.data);
            }
            if (history.success) {
                setDiseaseHistory(history.data);
            }
            if (stats.success) {
                setCropStats(stats.data);
            }
        } catch (error) {
            console.error('Error fetching crop details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCrop = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/crops', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    ...formData
                })
            });

            const data = await res.json();
            if (data.success) {
                alert('✅ Tạo cây trồng thành công!');
                setFormData({
                    crop_name: '',
                    crop_type: 'tomato',
                    location: 'Hà Nội',
                    area_hectare: 1,
                    planting_date: new Date().toISOString().split('T')[0],
                    variety: 'F1'
                });
                setShowForm(false);
                fetchCrops();
            }
        } catch (error) {
            console.error('Error creating crop:', error);
            alert('❌ Lỗi khi tạo cây trồng');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCrop = async (cropId: number) => {
        if (!window.confirm('Bạn chắc chắn muốn xóa cây này?')) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/crops/${cropId}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                alert('✅ Xóa cây thành công!');
                setSelectedCrop(null);
                fetchCrops();
            }
        } catch (error) {
            console.error('Error deleting crop:', error);
            alert('❌ Lỗi khi xóa cây');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="crop-management">
            <h2>🌱 Quản lý cây trồng</h2>

            <div className="crop-container">
                {/* Left: Crop List */}
                <div className="crop-list-section">
                    <div className="section-header">
                        <h3>Danh sách cây ({crops.length})</h3>
                        <button
                            className="btn-primary"
                            onClick={() => setShowForm(!showForm)}
                            disabled={loading}
                        >
                            {showForm ? '❌ Hủy' : '➕ Thêm cây'}
                        </button>
                    </div>

                    {showForm && (
                        <form className="crop-form" onSubmit={handleCreateCrop}>
                            <h4>Tạo hồ sơ cây mới</h4>

                            <div className="form-group">
                                <label>Tên cây:</label>
                                <input
                                    type="text"
                                    value={formData.crop_name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, crop_name: e.target.value })
                                    }
                                    placeholder="VD: Cà chua #1"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Loại cây:</label>
                                <select
                                    value={formData.crop_type}
                                    onChange={(e) =>
                                        setFormData({ ...formData, crop_type: e.target.value })
                                    }
                                >
                                    <option value="tomato">Cà chua</option>
                                    <option value="pepper">Tiêu</option>
                                    <option value="potato">Khoai tây</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Vị trí:</label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) =>
                                        setFormData({ ...formData, location: e.target.value })
                                    }
                                    placeholder="VD: Hà Nội"
                                />
                            </div>

                            <div className="form-group">
                                <label>Diện tích (hecta):</label>
                                <input
                                    type="number"
                                    min="0.1"
                                    step="0.1"
                                    value={formData.area_hectare}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            area_hectare: parseFloat(e.target.value)
                                        })
                                    }
                                />
                            </div>

                            <div className="form-group">
                                <label>Ngày trồng:</label>
                                <input
                                    type="date"
                                    value={formData.planting_date}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            planting_date: e.target.value
                                        })
                                    }
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn-success"
                                disabled={loading}
                            >
                                {loading ? '⏳ Đang lưu...' : '✅ Tạo cây'}
                            </button>
                        </form>
                    )}

                    <div className="crop-list">
                        {loading && crops.length === 0 ? (
                            <div className="loading">⏳ Đang tải...</div>
                        ) : crops.length === 0 ? (
                            <div className="empty">
                                <p>📭 Chưa có cây nào</p>
                                <p className="hint">Nhấn "Thêm cây" để tạo hồ sơ mới</p>
                            </div>
                        ) : (
                            crops.map((crop) => (
                                <div
                                    key={crop.id}
                                    className={`crop-item ${selectedCrop?.id === crop.id ? 'active' : ''}`}
                                    onClick={() => fetchCropDetail(crop.id)}
                                >
                                    <div className="crop-info">
                                        <p className="crop-name">🌱 {crop.crop_name}</p>
                                        <p className="crop-type">Loại: {crop.crop_type}</p>
                                        <p className="crop-location">📍 {crop.location}</p>
                                        <p className="crop-area">{crop.area_hectare} ha</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right: Crop Details */}
                <div className="crop-details-section">
                    {selectedCrop ? (
                        <>
                            <div className="crop-header">
                                <h3>{selectedCrop.crop_name}</h3>
                                <button
                                    className="btn-danger"
                                    onClick={() => handleDeleteCrop(selectedCrop.id)}
                                    disabled={loading}
                                >
                                    🗑️ Xóa
                                </button>
                            </div>

                            {cropStats && (
                                <div className="crop-stats">
                                    <div className="stat-box">
                                        <span className="stat-label">Bệnh phát hiện:</span>
                                        <span className="stat-value">{cropStats.total_diseases}</span>
                                    </div>
                                    <div className="stat-box">
                                        <span className="stat-label">Đã khỏi:</span>
                                        <span className="stat-value">{cropStats.resolved_count}</span>
                                    </div>
                                    <div className="stat-box">
                                        <span className="stat-label">Mức độ tb:</span>
                                        <span className="stat-value">{cropStats.avg_severity}</span>
                                    </div>
                                </div>
                            )}

                            <div className="crop-info-detail">
                                <p>
                                    <strong>Loại cây:</strong> {selectedCrop.crop_type}
                                </p>
                                <p>
                                    <strong>Vị trí:</strong> {selectedCrop.location}
                                </p>
                                <p>
                                    <strong>Diện tích:</strong> {selectedCrop.area_hectare} ha
                                </p>
                                <p>
                                    <strong>Ngày trồng:</strong>{' '}
                                    {new Date(selectedCrop.planting_date).toLocaleDateString(
                                        'vi-VN'
                                    )}
                                </p>
                                <p>
                                    <strong>Giống:</strong> {selectedCrop.variety || 'N/A'}
                                </p>
                            </div>

                            <h4>📋 Lịch sử bệnh</h4>
                            <div className="disease-history">
                                {loading ? (
                                    <div className="loading">⏳ Đang tải...</div>
                                ) : diseaseHistory.length === 0 ? (
                                    <div className="empty">
                                        <p>✅ Không có bệnh phát hiện</p>
                                    </div>
                                ) : (
                                    diseaseHistory.map((record) => (
                                        <div
                                            key={record.id}
                                            className={`disease-record severity-${record.disease_severity}`}
                                        >
                                            <p className="disease-name">
                                                <strong>{record.disease_name}</strong>
                                                {record.resolved && (
                                                    <span className="badge-resolved">✅ Đã khỏi</span>
                                                )}
                                            </p>
                                            <p className="disease-date">
                                                📅 {new Date(record.detected_date).toLocaleDateString(
                                                    'vi-VN'
                                                )}
                                            </p>
                                            <p className="disease-severity">
                                                Mức độ: {record.disease_severity} | Độ tin cậy:{' '}
                                                {(record.confidence_score * 100).toFixed(1)}%
                                            </p>
                                            {record.treatment_given && (
                                                <p className="treatment">
                                                    💊 {record.treatment_given}
                                                </p>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="no-selection">
                            <p>👈 Chọn cây trồng để xem chi tiết</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CropManagement;

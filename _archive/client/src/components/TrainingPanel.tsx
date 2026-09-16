import React, { useState, useEffect } from 'react';
import '../styles/training.css';

interface TrainingData {
    diseaseLabel: string;
    imageFile: File | null;
}

interface TrainingStatus {
    training: boolean;
    progress: {
        status: string;
        model: string;
        progress: number;
        elapsedTime: number;
        remainingTime: number;
    };
}

interface DataCount {
    [key: string]: any;
    totalImages: number;
}

const TrainingPanel: React.FC = () => {
    const [formData, setFormData] = useState<TrainingData>({
        diseaseLabel: '',
        imageFile: null
    });

    const [trainingStatus, setTrainingStatus] = useState<TrainingStatus>({
        training: false,
        progress: {
            status: 'idle',
            model: '',
            progress: 0,
            elapsedTime: 0,
            remainingTime: 0
        }
    });

    const [dataCounts, setDataCounts] = useState<Record<string, number>>({
        totalImages: 0
    });

    const [epochs, setEpochs] = useState<number>(5);
    const [loading, setLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<string>('');

    // Fetch training data count on component mount
    useEffect(() => {
        fetchDataCount();
        const interval = setInterval(fetchDataCount, 5000);
        return () => clearInterval(interval);
    }, []);

    // Monitor training status
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (trainingStatus.training) {
            interval = setInterval(fetchTrainingStatus, 2000);
        }
        return () => clearInterval(interval);
    }, [trainingStatus.training]);

    const fetchDataCount = async () => {
        try {
            const response = await fetch('/api/training/data-count');
            const data = await response.json();
            if (data.success) {
                setDataCounts(data.dataCounts);
            }
        } catch (error) {
            console.error('Error fetching data count:', error);
        }
    };

    const fetchTrainingStatus = async () => {
        try {
            const response = await fetch('/api/training/status');
            const data = await response.json();
            if (data.success) {
                setTrainingStatus(data);
                if (!data.training) {
                    setMessage('✅ Training completed!');
                }
            }
        } catch (error) {
            console.error('Error fetching training status:', error);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData({
                ...formData,
                imageFile: file
            });
        }
    };

    const handleDiseaseLabel = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            diseaseLabel: e.target.value
        });
    };

    const uploadTrainingData = async () => {
        if (!formData.imageFile || !formData.diseaseLabel) {
            setMessage('❌ Please select image and enter disease label');
            return;
        }

        setLoading(true);
        setMessage('Uploading...');

        try {
            const formDataObj = new FormData();
            formDataObj.append('image', formData.imageFile);
            formDataObj.append('diseaseLabel', formData.diseaseLabel);

            const response = await fetch('/api/training/upload-data', {
                method: 'POST',
                body: formDataObj
            });

            const data = await response.json();

            if (data.success) {
                setMessage(`✅ ${data.message}`);
                setFormData({
                    diseaseLabel: '',
                    imageFile: null
                });
                // Reset file input
                const fileInput = document.getElementById('imageInput') as HTMLInputElement;
                if (fileInput) fileInput.value = '';

                // Refresh data count
                await fetchDataCount();
            } else {
                setMessage(`❌ ${data.error}`);
            }
        } catch (error) {
            setMessage(`❌ Upload failed: ${error}`);
        } finally {
            setLoading(false);
        }
    };

    const startTraining = async () => {
        if (dataCounts.totalImages === 0) {
            setMessage('❌ No training data. Please upload images first.');
            return;
        }

        if (!dataCounts.readyForTraining) {
            setMessage('⚠️ Minimum 5 images per disease needed. Current data insufficient.');
            return;
        }

        setLoading(true);
        setMessage('Starting training...');

        try {
            const response = await fetch('/api/training/retrain', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    epochs: epochs
                })
            });

            const data = await response.json();

            if (data.success) {
                setMessage(`🚀 ${data.message}`);
                setTrainingStatus({
                    ...trainingStatus,
                    training: true
                });
            } else {
                setMessage(`❌ ${data.error}`);
            }
        } catch (error) {
            setMessage(`❌ Failed to start training: ${error}`);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    };

    return (
        <div className="training-panel">
            <div className="training-container">
                {/* Header */}
                <div className="training-header">
                    <h2>🤖 AI Model Auto-Training</h2>
                    <p>Upload images to train and improve your AI models</p>
                </div>

                {/* Message */}
                {message && (
                    <div className={`message ${message.includes('❌') ? 'error' : message.includes('✅') ? 'success' : 'info'}`}>
                        {message}
                    </div>
                )}

                <div className="training-grid">
                    {/* Upload Section */}
                    <div className="training-section">
                        <div className="section-header">
                            <h3>📤 Step 1: Upload Training Data</h3>
                            <span className="badge">{dataCounts.totalImages || 0} images</span>
                        </div>

                        <div className="upload-area">
                            <div className="file-input-wrapper">
                                <input
                                    type="file"
                                    id="imageInput"
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                    disabled={loading || trainingStatus.training}
                                />
                                <label htmlFor="imageInput">
                                    📷 Click to select image
                                </label>
                            </div>

                            {formData.imageFile && (
                                <div className="selected-file">
                                    ✓ {formData.imageFile.name}
                                </div>
                            )}
                        </div>

                        <div className="disease-label">
                            <label htmlFor="diseaseInput">Disease Name/Label:</label>
                            <input
                                id="diseaseInput"
                                type="text"
                                placeholder="e.g., powdery_mildew, leaf_spot, rust"
                                value={formData.diseaseLabel}
                                onChange={handleDiseaseLabel}
                                disabled={loading || trainingStatus.training}
                                list="disease-suggestions"
                            />
                            <datalist id="disease-suggestions">
                                <option value="powdery_mildew" />
                                <option value="leaf_spot" />
                                <option value="rust" />
                                <option value="blight" />
                                <option value="anthracnose" />
                                <option value="canker" />
                                <option value="healthy" />
                            </datalist>
                        </div>

                        <button
                            className="btn btn-primary"
                            onClick={uploadTrainingData}
                            disabled={loading || trainingStatus.training || !formData.imageFile}
                        >
                            {loading ? 'Uploading...' : '⬆️ Upload Image'}
                        </button>
                    </div>

                    {/* Data Statistics */}
                    <div className="training-section">
                        <div className="section-header">
                            <h3>📊 Training Data Status</h3>
                        </div>

                        <div className="stats-grid">
                            {Object.entries(dataCounts).map(([disease, count]) => {
                                if (disease === 'totalImages' || disease === 'readyForTraining') return null;
                                return (
                                    <div key={disease} className="stat-card">
                                        <div className="stat-label">{disease}</div>
                                        <div className="stat-value">{count}</div>
                                        <div className="stat-bar">
                                            <div
                                                className="stat-fill"
                                                style={{ width: `${Math.min((count / 10) * 100, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="readiness-indicator">
                            {dataCounts.readyForTraining ? (
                                <div className="ready">✅ Ready for training!</div>
                            ) : (
                                <div className="not-ready">⏳ Need more data (min. 5 per class)</div>
                            )}
                        </div>
                    </div>

                    {/* Training Control */}
                    <div className="training-section">
                        <div className="section-header">
                            <h3>⚙️ Step 2: Start Training</h3>
                        </div>

                        <div className="epochs-control">
                            <label htmlFor="epochsInput">Number of Epochs:</label>
                            <div className="epoch-input-group">
                                <button
                                    className="btn-mini"
                                    onClick={() => setEpochs(Math.max(1, epochs - 1))}
                                    disabled={trainingStatus.training}
                                >
                                    −
                                </button>
                                <input
                                    id="epochsInput"
                                    type="number"
                                    min="1"
                                    max="50"
                                    value={epochs}
                                    onChange={(e) => setEpochs(Math.max(1, parseInt(e.target.value) || 5))}
                                    disabled={trainingStatus.training}
                                />
                                <button
                                    className="btn-mini"
                                    onClick={() => setEpochs(Math.min(50, epochs + 1))}
                                    disabled={trainingStatus.training}
                                >
                                    +
                                </button>
                            </div>
                            <small>More epochs = better accuracy but longer training</small>
                        </div>

                        <button
                            className="btn btn-success btn-large"
                            onClick={startTraining}
                            disabled={loading || trainingStatus.training || dataCounts.totalImages === 0}
                        >
                            {trainingStatus.training ? '⏳ Training...' : '🚀 Start Training'}
                        </button>
                    </div>

                    {/* Progress */}
                    {trainingStatus.training && (
                        <div className="training-section">
                            <div className="section-header">
                                <h3>📈 Training Progress</h3>
                            </div>

                            <div className="progress-card">
                                <div className="progress-header">
                                    <span>{trainingStatus.progress.status.toUpperCase()}</span>
                                    <span>{trainingStatus.progress.progress}%</span>
                                </div>

                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${trainingStatus.progress.progress}%` }}
                                    ></div>
                                </div>

                                <div className="progress-info">
                                    <div className="info-row">
                                        <span>Model:</span>
                                        <span>{trainingStatus.progress.model}</span>
                                    </div>
                                    <div className="info-row">
                                        <span>Elapsed:</span>
                                        <span>{formatTime(trainingStatus.progress.elapsedTime)}</span>
                                    </div>
                                    <div className="info-row">
                                        <span>Remaining:</span>
                                        <span>{formatTime(trainingStatus.progress.remainingTime)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Info Box */}
                <div className="info-box">
                    <h4>💡 Tips:</h4>
                    <ul>
                        <li>Collect diverse images from different angles and lighting</li>
                        <li>Use consistent disease names for better accuracy</li>
                        <li>Start with 5-10 epochs for testing</li>
                        <li>Monitor progress and stop if accuracy plateaus</li>
                        <li>Retrained models are saved automatically</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default TrainingPanel;

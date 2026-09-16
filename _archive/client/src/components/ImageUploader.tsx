import React, { useState } from 'react';

// Expert Explanation Data
const getExpertExplanation = (disease: string): string => {
  const explanations: { [key: string]: string } = {
    'healthy leaf': 'Lá cây hoàn toàn khỏe mạnh. Không phát hiện dấu hiệu bệnh hoặc tổn thương nào. Cây có khả năng quang hợp tốt và hấp thụ dinh dưỡng bình thường.',
    'healthy': 'Lá cây hoàn toàn khỏe mạnh. Không phát hiện dấu hiệu bệnh hoặc tổn thương nào. Cây có khả năng quang hợp tốt và hấp thụ dinh dưỡng bình thường.',
    'leaf spot': 'Đốm lá là bệnh phổ biến gây ra bởi các loại nấm hoặc vi khuẩn. Các vết tối hoặc nhạt xuất hiện trên lá, có thể lan rộng nếu không được xử lý. Bệnh thường phát triển trong điều kiện ẩm ướt.',
    'rust': 'Bệnh gỉ do nấm gây ra, tạo các vết màu nâu hoặc cam trên lá. Bệnh ảnh hưởng đến khả năng quang hợp và có thể làm cây yếu đi nếu lây lan rộng rãi.',
    'powdery mildew': 'Phấn trắng trên lá do nấm gây ra. Tạo lớp bột trắng trên bề mặt lá, ảnh hưởng đến quang hợp. Phát triển nhanh trong điều kiện nóng, khô.',
    'blight': 'Bệnh lở do nấm hoặc vi khuẩn gây ra, gây tổn thương nặng nề. Có thể làm chết nhanh các phần lá và lan rộng nếu không được kiểm soát.',
    'yellowing': 'Tình trạng lá vàng do thiếu dinh dưỡng, đặc biệt là thiếu nitơ. Cũng có thể do bệnh virus hoặc điều kiện đất xấu.',
  };

  const key = disease.toLowerCase();
  for (const [k, v] of Object.entries(explanations)) {
    if (key.includes(k.toLowerCase())) {
      return v;
    }
  }
  return `Lá cây bị ảnh hưởng bởi: ${disease}. Cần theo dõi và áp dụng biện pháp xử lý thích hợp.`;
};

// Recommendations Helper
interface Recommendation {
  icon: string;
  text: string;
}

const getRecommendations = (disease: string): Recommendation[] => {
  const recommendations: { [key: string]: Recommendation[] } = {
    'healthy leaf': [
      { icon: '✅', text: 'Cây đang khỏe mạnh, tiếp tục duy trì chăm sóc như hiện tại' },
      { icon: '💧', text: 'Tiếp tục tưới nước đều đặn, tránh tưới quá nhiều' },
      { icon: '☀️', text: 'Đảm bảo cây nhận đủ ánh sáng mặt trời' },
      { icon: '🌡️', text: 'Duy trì nhiệt độ phù hợp cho loại cây' },
    ],
    'leaf spot': [
      { icon: '🚜', text: 'Cắt bỏ các lá bị bệnh để ngăn chặn lây lan' },
      { icon: '💨', text: 'Cải thiện thông gió để giảm độ ẩm' },
      { icon: '💊', text: 'Sử dụng thuốc nấm (fungicide) chứa đồng hoặc lưu huỳnh' },
      { icon: '🚫', text: 'Tránh tưới nước vào lá, chỉ tưới gốc cây' },
    ],
    'rust': [
      { icon: '🎯', text: 'Loại bỏ lá bị gỉ để kiểm soát bệnh' },
      { icon: '💊', text: 'Sử dụng thuốc gỉ chuyên dùng' },
      { icon: '💨', text: 'Tăng cường thông gió quanh cây' },
      { icon: '🌡️', text: 'Giảm độ ẩm bằng cách giảm tần suất tưới nước' },
    ],
    'powdery mildew': [
      { icon: '🧹', text: 'Lau sạch lá bằng dung dịch xà phòng mềm' },
      { icon: '💨', text: 'Tăng cường thông gió xung quanh cây' },
      { icon: '💊', text: 'Phun thuốc chứa lưu huỳnh hoặc potassium bicarbonate' },
      { icon: '☀️', text: 'Tăng ánh sáng để cây khô nhanh hơn' },
    ],
    'default': [
      { icon: '🔍', text: 'Theo dõi chặt chẽ sự phát triển của bệnh' },
      { icon: '🚜', text: 'Loại bỏ các bộ phận bị hư hại nặng' },
      { icon: '💊', text: 'Áp dụng biện pháp xử lý phù hợp' },
      { icon: '📞', text: 'Tham khảo ý kiến chuyên gia nếu bệnh tiếp tục phát triển' },
    ],
  };

  const key = disease.toLowerCase();
  for (const [k, v] of Object.entries(recommendations)) {
    if (k !== 'default' && key.includes(k.toLowerCase())) {
      return v;
    }
  }
  return recommendations['default'];
};

// Treatment Methods
interface TreatmentMethod {
  name: string;
  description: string;
}

const getTreatmentMethods = (disease: string): TreatmentMethod[] => {
  const treatments: { [key: string]: TreatmentMethod[] } = {
    'healthy leaf': [
      { name: '🌿 Chăm sóc định kỳ', description: 'Tưới nước, bón phân, cắt tỉa đều đặn để duy trì sức khỏe' },
    ],
    'leaf spot': [
      { name: '🧪 Xử lý hóa học', description: 'Phun thuốc nấm như Mancozeb, Chlorothalonil 2 tuần một lần' },
      { name: '🌿 Xử lý hữu cơ', description: 'Sử dụng lưu huỳnh, dầu neem hoặc xà phòng hóa học' },
      { name: '✂️ Cắt bỏ', description: 'Loại bỏ lá bị bệnh nặng để ngăn lây lan' },
    ],
    'rust': [
      { name: '💊 Thuốc gỉ chuyên dùng', description: 'Phun Propiconazole hoặc Myclobutanil hàng tuần' },
      { name: '🌿 Lưu huỳnh', description: 'Phun lưu huỳnh 0.5% mỗi 10 ngày' },
      { name: '☀️ Cải thiện điều kiện', description: 'Tăng light, giảm humidity' },
    ],
    'powdery mildew': [
      { name: '🧴 Dung dịch xà phòng', description: 'Phun xà phòng mềm 1-2% phun 2-3 tuần một lần' },
      { name: '💊 Thuốc kháng nấm', description: 'Sử dụng potassium bicarbonate hoặc sulfur' },
      { name: '💨 Thông gió', description: 'Cải thiện tuần hoàn không khí quanh cây' },
    ],
    'default': [
      { name: '🔍 Chẩn đoán chính xác', description: 'Xác định loại bệnh chính xác trước khi xử lý' },
      { name: '💊 Xử lý', description: 'Áp dụng biện pháp xử lý phù hợp với loại bệnh' },
      { name: '📋 Theo dõi', description: 'Giám sát sự cải thiện và điều chỉnh phương pháp nếu cần' },
    ],
  };

  const key = disease.toLowerCase();
  for (const [k, v] of Object.entries(treatments)) {
    if (k !== 'default' && key.includes(k.toLowerCase())) {
      return v;
    }
  }
  return treatments['default'];
};

// Prevention Tips
const getPreventionTips = (disease: string): string[] => {
  const preventions: { [key: string]: string[] } = {
    'healthy leaf': [
      '✅ Duy trì cây khỏe mạnh với chăm sóc đều đặn',
      '✅ Tưới nước vừa đủ, tránh tưới thừa hoặc thiếu',
      '✅ Bón phân cân bằng để tăng sức đề kháng',
      '✅ Loại bỏ lá chết và vệ sinh khu vực xung quanh',
    ],
    'leaf spot': [
      '🛡️ Tránh tưới nước vào lá, chỉ tưới gốc cây',
      '🛡️ Cố định thêm không gian giữa các cây để thông gió',
      '🛡️ Loại bỏ lá bị bệnh ngay khi phát hiện',
      '🛡️ Không chạm vào lá ướt vì bệnh dễ lây lan',
      '🛡️ Khử trùng dụng cụ sau khi cắt lá bị bệnh',
    ],
    'rust': [
      '🛡️ Chọn giống cây có khả năng chống bệnh cao',
      '🛡️ Giữ độ ẩm tối thiểu, tránh sương sớm',
      '🛡️ Loại bỏ các mảnh lá rụng nhiễm bệnh',
      '🛡️ Cách xa các cây bị bệnh để ngăn chặn lây lan',
    ],
    'powdery mildew': [
      '🛡️ Tăng cường thông gió xung quanh cây',
      '🛡️ Tránh nước đọng trên lá lâu',
      '🛡️ Chọn giống cây chống bệnh phấn trắng',
      '🛡️ Vệ sinh khu vực trồng thường xuyên',
    ],
    'default': [
      '🛡️ Kiểm tra cây thường xuyên để phát hiện sớm',
      '🛡️ Duy trì vệ sinh khu vực trồng',
      '🛡️ Tránh điều kiện ẩm quá mức',
      '🛡️ Cách xa cây bệnh để ngăn lây lan',
      '🛡️ Sử dụng cây giống chất lượng từ nguồn đáng tin cậy',
    ],
  };

  const key = disease.toLowerCase();
  for (const [k, v] of Object.entries(preventions)) {
    if (k !== 'default' && key.includes(k.toLowerCase())) {
      return v;
    }
  }
  return preventions['default'];
};

interface PredictionResult {
  success: boolean;
  prediction: {
    prediction: string;
    confidence: number;
    originalPrediction: string;
    source: string;
    modelInfo?: {
      name: string;
      version: string;
      modelsUsed: number;
      totalModels: number;
    };
    processingTime: number;
    detailedAnalysisReport?: any;
    detailedAnalysisFormatted?: string;
  };
  imageInfo?: {
    filename: string;
    size: number;
    contentType: string;
  };
  timestamp: string;
}

const ImageUploader: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Analysis customization options
  const [plantPart, setPlantPart] = useState<string>('leaves');
  const [environmentalCondition, setEnvironmentalCondition] = useState<string>('normal');
  const [urgencyLevel, setUrgencyLevel] = useState<string>('normal');
  const [diseaseHistory, setDiseaseHistory] = useState<string>('none');
  const [treatmentAttempted, setTreatmentAttempted] = useState<string>('none');

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) {
      setError('Vui lòng chọn ảnh trước');
      return;
    }

    const formData = new FormData();
    formData.append('image', selectedImage);
    formData.append('plantPart', plantPart);
    formData.append('environmentalCondition', environmentalCondition);
    formData.append('urgencyLevel', urgencyLevel);
    formData.append('diseaseHistory', diseaseHistory);
    formData.append('treatmentAttempted', treatmentAttempted);

    setLoading(true);
    setError(null);

    try {
      console.log('[INFO] Gửi yêu cầu dự đoán...');
      console.log('[INFO] Tệp hình ảnh:', selectedImage.name, selectedImage.size, 'bytes');

      // Determine the API URL
      const apiUrl = window.location.origin + '/api/predict';
      console.log('[INFO] API URL:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type, browser will set it with boundary
        }
      });

      console.log('[INFO] Trạng thái phản hồi:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ERROR] Phản hồi lỗi:', errorText);
        throw new Error(`Không thể phân tích ảnh: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('[OK] Phản hồi API thô:', data);
      console.log('[DEBUG] Đối tượng dự đoán:', data.prediction);
      console.log('[DEBUG] Tên bệnh:', data.prediction?.prediction);
      console.log('[DEBUG] Độ tin cậy:', data.prediction?.confidence);
      setResult(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Lỗi không xác định';
      console.error('[ERROR]', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>🌿 Hệ Thống Nhận Diện Bệnh Lá Cây</h1>
        <p>Sử dụng AI tiên tiến để chẩn đoán bệnh cây trồng</p>
      </div>

      <div style={styles.content}>
        {/* Upload Section */}
        <div style={styles.section}>
          <h2>📸 Tải Ảnh Lá Cây</h2>

          <div style={styles.uploadBox}>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={styles.fileInput}
              id="imageInput"
            />
            <label htmlFor="imageInput" style={styles.uploadLabel}>
              {selectedImage ? '✅ Ảnh đã chọn: ' + selectedImage.name : '🖼️ Nhấp để chọn ảnh'}
            </label>
          </div>

          {preview && (
            <div style={styles.previewBox}>
              <img src={preview} alt="Preview" style={styles.previewImage} />
            </div>
          )}
        </div>

        {/* Options Section */}
        {selectedImage && (
          <div style={styles.section}>
            <h2>⚙️ Tùy Chỉnh Phân Tích</h2>

            <div style={styles.optionsGrid}>
              <div style={styles.optionGroup}>
                <label>🌱 Bộ Phận Cây:</label>
                <select
                  value={plantPart}
                  onChange={(e) => setPlantPart(e.target.value)}
                  style={styles.select}
                >
                  <option value="leaves">Lá</option>
                  <option value="stem">Thân</option>
                  <option value="root">Rễ</option>
                  <option value="flower">Hoa</option>
                  <option value="fruit">Quả</option>
                  <option value="whole">Toàn cây</option>
                </select>
              </div>

              <div style={styles.optionGroup}>
                <label>☀️ Điều Kiện Môi Trường:</label>
                <select
                  value={environmentalCondition}
                  onChange={(e) => setEnvironmentalCondition(e.target.value)}
                  style={styles.select}
                >
                  <option value="normal">Bình thường</option>
                  <option value="humid">Ẩm</option>
                  <option value="dry">Khô</option>
                  <option value="hot">Nóng</option>
                  <option value="cold">Lạnh</option>
                </select>
              </div>

              <div style={styles.optionGroup}>
                <label>⏰ Mức Độ Khẩn Cấp:</label>
                <select
                  value={urgencyLevel}
                  onChange={(e) => setUrgencyLevel(e.target.value)}
                  style={styles.select}
                >
                  <option value="low">Thấp</option>
                  <option value="normal">Bình thường</option>
                  <option value="urgent">Khẩn cấp</option>
                  <option value="critical">Rất khẩn cấp</option>
                </select>
              </div>

              <div style={styles.optionGroup}>
                <label>📜 Tiền Sử Bệnh:</label>
                <select
                  value={diseaseHistory}
                  onChange={(e) => setDiseaseHistory(e.target.value)}
                  style={styles.select}
                >
                  <option value="none">Không có</option>
                  <option value="past">Từng có</option>
                  <option value="current">Đang có</option>
                  <option value="recurring">Tái phát</option>
                </select>
              </div>

              <div style={styles.optionGroup}>
                <label>💊 Đã Điều Trị:</label>
                <select
                  value={treatmentAttempted}
                  onChange={(e) => setTreatmentAttempted(e.target.value)}
                  style={styles.select}
                >
                  <option value="none">Chưa điều trị</option>
                  <option value="organic">Có cơ</option>
                  <option value="chemical">Hóa chất</option>
                  <option value="both">Cả hai</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Upload Button */}
        {selectedImage && (
          <button
            onClick={handleUpload}
            disabled={loading}
            style={{ ...styles.button, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? '⏳ Đang phân tích...' : '🚀 Phân Tích Ảnh'}
          </button>
        )}

        {/* Error Section */}
        {error && (
          <div style={styles.errorBox}>
            <h3>❌ Lỗi:</h3>
            <p>{error}</p>
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div style={styles.section}>
            <h2>📊 Kết Quả Phân Tích</h2>

            <div style={styles.resultBox}>
              {/* Main Diagnosis Card */}
              <div style={{
                ...styles.predictionCard,
                borderLeft: '5px solid ' + (
                  result.prediction.prediction.toLowerCase().includes('healthy') ? '#10b981' :
                    result.prediction.prediction.toLowerCase().includes('mild') ? '#f59e0b' :
                      '#ef4444'
                )
              }}>
                <div style={styles.diagnosisHeader}>
                  <h3 style={styles.predictionTitle}>
                    📋 Chẩn Đoán: <span style={styles.diseaseName}>{result.prediction.prediction}</span>
                  </h3>
                </div>
              </div>

              {/* Expert Explanation Section */}
              <div style={styles.expertBox}>
                <h3 style={styles.expertTitle}>👨‍⚕️ Giải Thích Chuyên Gia</h3>
                <div style={styles.explanationText}>
                  {getExpertExplanation(result.prediction.prediction)}
                </div>
              </div>

              {/* Disease Details from Database */}
              {(result.prediction as any).diseaseInfo && (
                <div style={styles.diseaseDetailsBox}>
                  <h3 style={styles.diseaseDetailsTitle}>📚 Thông Tin Chi Tiết Về Bệnh</h3>

                  <div style={styles.diseaseDetailsSection}>
                    <h4 style={styles.diseaseSectionTitle}>🏥 Tên gọi khác:</h4>
                    <div style={styles.diseaseDetailsList}>
                      {(result.prediction as any).diseaseInfo.aliases && (result.prediction as any).diseaseInfo.aliases.length > 0 && (
                        <p>{(result.prediction as any).diseaseInfo.aliases.join(', ')}</p>
                      )}
                      {(result.prediction as any).diseaseInfo.commonNames && (result.prediction as any).diseaseInfo.commonNames.length > 0 && (
                        <p><strong>English names:</strong> {(result.prediction as any).diseaseInfo.commonNames.join(', ')}</p>
                      )}
                    </div>
                  </div>

                  <div style={styles.diseaseDetailsSection}>
                    <h4 style={styles.diseaseSectionTitle}>⚠️ Triệu chứng:</h4>
                    <ul style={styles.symptomsList}>
                      {(result.prediction as any).diseaseInfo.symptoms && (result.prediction as any).diseaseInfo.symptoms.map((symptom: string, idx: number) => (
                        <li key={idx}>{symptom}</li>
                      ))}
                    </ul>
                  </div>

                  <div style={styles.diseaseDetailsSection}>
                    <h4 style={styles.diseaseSectionTitle}>🧬 Nguyên nhân:</h4>
                    <p style={styles.diseaseDetailText}>{(result.prediction as any).diseaseInfo.causes}</p>
                  </div>

                  <div style={styles.diseaseDetailsSection}>
                    <h4 style={styles.diseaseSectionTitle}>💊 Cách chữa trị:</h4>
                    <ol style={styles.treatmentListDetailed}>
                      {(result.prediction as any).diseaseInfo.treatment && (result.prediction as any).diseaseInfo.treatment.map((treatment: string, idx: number) => (
                        <li key={idx}>{treatment}</li>
                      ))}
                    </ol>
                  </div>

                  <div style={styles.diseaseDetailsSection}>
                    <h4 style={styles.diseaseSectionTitle}>🛡️ Phòng ngừa:</h4>
                    <ol style={styles.treatmentListDetailed}>
                      {(result.prediction as any).diseaseInfo.prevention && (result.prediction as any).diseaseInfo.prevention.map((prev: string, idx: number) => (
                        <li key={idx}>{prev}</li>
                      ))}
                    </ol>
                  </div>

                  <div style={styles.diseaseDetailsSection}>
                    <h4 style={styles.diseaseSectionTitle}>📊 Thông tin bổ sung:</h4>
                    <div style={styles.diseaseDetailsList}>
                      <p><strong>Mức độ nghiêm trọng:</strong> {(result.prediction as any).diseaseInfo.severity}</p>
                      {(result.prediction as any).diseaseInfo.economicImpact && (
                        <p><strong>Ảnh hưởng kinh tế:</strong> {(result.prediction as any).diseaseInfo.economicImpact}</p>
                      )}
                      {(result.prediction as any).diseaseInfo.affectedCrops && (result.prediction as any).diseaseInfo.affectedCrops.length > 0 && (
                        <p><strong>Cây bị ảnh hưởng:</strong> {(result.prediction as any).diseaseInfo.affectedCrops.join(', ')}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Professional Recommendations */}
              <div style={styles.recommendationsBox}>
                <h3 style={styles.recommendationsTitle}>💡 Lời Góp Ý Chuyên Nghiệp</h3>
                <div style={styles.recommendationsList}>
                  {getRecommendations(result.prediction.prediction).map((rec, idx) => (
                    <div key={idx} style={styles.recommendationItem}>
                      <span style={styles.recommendationIcon}>{rec.icon}</span>
                      <span style={styles.recommendationText}>{rec.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Health Score and Severity */}
              {(result.prediction as any).analysisDetails && (
                <div style={styles.healthScoreBox}>
                  <div style={styles.scoreCard}>
                    <h4>� Chỉ Số Sức Khỏe</h4>
                    <div style={styles.scoreValue}>
                      {((result.prediction as any).analysisDetails.leafHealthScore * 100).toFixed(0)}%
                    </div>
                    <div style={styles.scoreBar}>
                      <div style={{
                        ...styles.scoreBarFill,
                        width: `${(result.prediction as any).analysisDetails.leafHealthScore * 100}%`,
                        backgroundColor: (result.prediction as any).analysisDetails.leafHealthScore >= 0.8 ? '#10b981' :
                          (result.prediction as any).analysisDetails.leafHealthScore >= 0.5 ? '#f59e0b' : '#ef4444'
                      }}></div>
                    </div>
                  </div>

                  <div style={styles.scoreCard}>
                    <h4>⚠️ Mức Độ Nghiêm Trọng</h4>
                    <div style={{
                      ...styles.severityBadge,
                      backgroundColor: (result.prediction as any).analysisDetails.severity === 'CRITICAL' ? '#dc2626' :
                        (result.prediction as any).analysisDetails.severity === 'SEVERE' ? '#ea580c' :
                          (result.prediction as any).analysisDetails.severity === 'MODERATE' ? '#f59e0b' :
                            (result.prediction as any).analysisDetails.severity === 'MILD' ? '#10b981' : '#6b7280'
                    }}>
                      {(result.prediction as any).analysisDetails.severity || 'UNKNOWN'}
                    </div>
                  </div>
                </div>
              )}

              {/* Treatment Section */}
              <div style={styles.treatmentBox}>
                <h3 style={styles.treatmentTitle}>💊 Phương Pháp Xử Lý</h3>
                <div style={styles.treatmentGrid}>
                  {getTreatmentMethods(result.prediction.prediction).map((method, idx) => (
                    <div key={idx} style={styles.treatmentCard}>
                      <h4>{method.name}</h4>
                      <p>{method.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prevention Tips */}
              <div style={styles.preventionBox}>
                <h3 style={styles.preventionTitle}>�️ Biện Pháp Phòng Ngừa</h3>
                <ul style={styles.preventionList}>
                  {getPreventionTips(result.prediction.prediction).map((tip, idx) => (
                    <li key={idx} style={styles.preventionItem}>{tip}</li>
                  ))}
                </ul>
              </div>

              {/* Processing Info */}
              <div style={styles.infoGrid}>
                <div style={styles.infoCard}>
                  <span style={styles.infoLabel}>⏱️ Thời gian xử lý:</span>
                  <span>{result.prediction.processingTime} ms</span>
                </div>
                <div style={styles.infoCard}>
                  <span style={styles.infoLabel}>🕐 Thời gian phân tích:</span>
                  <span>{new Date(result.timestamp).toLocaleString('vi-VN')}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedImage(null);
                setPreview(null);
                setResult(null);
                setError(null);
              }}
              style={styles.buttonSecondary}
            >
              🔄 Phân Tích Ảnh Khác
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  header: {
    textAlign: 'center',
    color: 'white',
    marginBottom: '30px',
  },
  content: {
    maxWidth: '900px',
    margin: '0 auto',
    background: 'white',
    borderRadius: '20px',
    padding: '40px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  section: {
    marginBottom: '30px',
  },
  uploadBox: {
    position: 'relative',
    border: '2px dashed #cbd5e1',
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s',
    background: '#f8fafc',
  },
  fileInput: {
    display: 'none',
  },
  uploadLabel: {
    display: 'block',
    cursor: 'pointer',
    padding: '20px',
    fontSize: '16px',
    color: '#475569',
  },
  previewBox: {
    marginTop: '20px',
    textAlign: 'center',
  },
  previewImage: {
    maxWidth: '100%',
    maxHeight: '300px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  optionsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
    marginBottom: '20px',
  },
  optionGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  select: {
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    cursor: 'pointer',
    background: 'white',
  },
  button: {
    width: '100%',
    padding: '15px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'white',
    background: 'linear-gradient(45deg, #667eea, #764ba2)',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    marginBottom: '20px',
  },
  buttonSecondary: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: 'white',
    background: '#10b981',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '15px',
  },
  errorBox: {
    background: '#fee2e2',
    color: '#991b1b',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    borderLeft: '4px solid #dc2626',
  },
  resultBox: {
    background: '#f1f5f9',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '20px',
  },
  predictionCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '20px',
    borderLeft: '5px solid #667eea',
  },
  predictionTitle: {
    fontSize: '24px',
    margin: '0 0 10px 0',
    color: '#1e293b',
  },

  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '20px',
  },
  infoCard: {
    background: 'white',
    padding: '15px',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  infoLabel: {
    fontWeight: 'bold',
    color: '#475569',
    fontSize: '14px',
  },
  analysisBox: {
    background: 'white',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '15px',
  },
  analysisText: {
    fontSize: '12px',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    maxHeight: '300px',
    overflow: 'auto',
    background: '#f8fafc',
    padding: '12px',
    borderRadius: '6px',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '15px',
    marginTop: '12px',
  },
  detailCard: {
    background: '#f8fafc',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  detailsList: {
    margin: '8px 0',
    paddingLeft: '20px',
    fontSize: '13px',
    lineHeight: '1.6',
  },
  diagnosisHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '15px',
    flexWrap: 'wrap',
  },
  diseaseName: {
    color: '#667eea',
    fontWeight: 'bold',
  },
  expertBox: {
    background: '#ecf0f1',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '15px',
    borderLeft: '4px solid #3498db',
  },
  expertTitle: {
    color: '#2c3e50',
    margin: '0 0 10px 0',
    fontSize: '18px',
  },
  explanationText: {
    lineHeight: '1.6',
    color: '#2c3e50',
    fontSize: '14px',
  },
  recommendationsBox: {
    background: '#f0f9ff',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '15px',
    borderLeft: '4px solid #0ea5e9',
  },
  recommendationsTitle: {
    color: '#0c4a6e',
    margin: '0 0 12px 0',
    fontSize: '18px',
  },
  recommendationsList: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '10px',
  },
  recommendationItem: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
    padding: '10px',
    background: 'white',
    borderRadius: '6px',
    border: '1px solid #dbeafe',
  },
  recommendationIcon: {
    fontSize: '18px',
    flexShrink: 0,
  },
  recommendationText: {
    fontSize: '14px',
    color: '#1e293b',
    lineHeight: '1.5',
  },
  healthScoreBox: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
    marginBottom: '15px',
  },
  scoreCard: {
    background: 'white',
    padding: '15px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  scoreValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#667eea',
    margin: '10px 0',
  },
  scoreBar: {
    width: '100%',
    height: '8px',
    background: '#e2e8f0',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    transition: 'width 0.3s ease',
  },
  severityBadge: {
    display: 'inline-block',
    padding: '10px 15px',
    borderRadius: '6px',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '14px',
    marginTop: '10px',
  },
  treatmentBox: {
    background: '#fef3c7',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '15px',
    borderLeft: '4px solid #f59e0b',
  },
  treatmentTitle: {
    color: '#92400e',
    margin: '0 0 12px 0',
    fontSize: '18px',
  },
  treatmentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '12px',
  },
  treatmentCard: {
    background: 'white',
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #fed7aa',
  },
  preventionBox: {
    background: '#dcfce7',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '15px',
    borderLeft: '4px solid #10b981',
  },
  preventionTitle: {
    color: '#065f46',
    margin: '0 0 12px 0',
    fontSize: '18px',
  },
  preventionList: {
    margin: '0',
    paddingLeft: '20px',
    lineHeight: '1.8',
  },
  preventionItem: {
    marginBottom: '8px',
    color: '#0f766e',
    fontSize: '14px',
  },
  diseaseDetailsBox: {
    background: '#ede9fe',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '20px',
    borderLeft: '4px solid #a78bfa',
  },
  diseaseDetailsTitle: {
    color: '#581c87',
    margin: '0 0 16px 0',
    fontSize: '20px',
  },
  diseaseDetailsSection: {
    marginBottom: '16px',
    background: 'white',
    padding: '12px',
    borderRadius: '8px',
  },
  diseaseSectionTitle: {
    color: '#6d28d9',
    margin: '0 0 8px 0',
    fontSize: '16px',
    fontWeight: '600',
  },
  diseaseDetailsList: {
    color: '#5b21b6',
    fontSize: '14px',
    lineHeight: '1.6',
  },
  diseaseDetailText: {
    color: '#5b21b6',
    fontSize: '14px',
    lineHeight: '1.6',
    margin: '0',
  },
  symptomsList: {
    margin: '0',
    paddingLeft: '20px',
    color: '#5b21b6',
    fontSize: '14px',
  },
  treatmentListDetailed: {
    margin: '0',
    paddingLeft: '20px',
    color: '#5b21b6',
    fontSize: '14px',
  },
};

export default ImageUploader;
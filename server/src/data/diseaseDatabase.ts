// Comprehensive Disease Database for Plant Disease Detection
export const COMPREHENSIVE_DISEASE_DB = {
    // ============ RICE DISEASES ============
    'Bệnh đạo ôn lúa': {
        keywords: ['đạo ôn', 'blast', 'pyricularia', 'rice blast'],
        aliases: ['Bệnh bản lá', 'Bệnh mễn lúa'],
        confidence: 0.92,
        commonNames: ['Rice Blast', 'Leaf Blast'],
        affectedCrops: ['Lúa'],
        symptoms: [
            'Các đốm lanceolate (hình mũi tên) trên lá',
            'Viền đốm màu nâu đỏ, tâm xám',
            'Đốm lan tỏa từ từ, có thể chết cả lá',
            'Trên thân cây: các vệ nâu, có thể làm gẫy thân'
        ],
        causes: 'Nấm Magnaporthe oryzae, thời tiết ẩm ướt (>90%), nhiệt độ 18-28°C',
        treatment: [
            'Phun Carbendazim 50% WP 1g/lít, 7-10 ngày/lần',
            'Phun Mancozeb 80% WP 3g/lít',
            'Phun Hexaconazole 5% EC 1ml/lít'
        ],
        prevention: [
            'Chọn giống kháng bệnh',
            'Tránh tưới lên lá buổi tối',
            'Giảm độ ẩm, tăng thông gió',
            'Hạn chế bón nitơ quá nhiều'
        ],
        severity: 'Rất cao',
        economicImpact: 'Có thể mất 50-100% năng suất'
    },

    'Bệnh đốm nâu lá lúa': {
        keywords: ['đốm nâu', 'brown spot', 'helminthosporium', 'cochliobolus'],
        aliases: ['Bệnh đốm nâu', 'Bipolaris'],
        confidence: 0.88,
        commonNames: ['Brown Leaf Spot', 'Helminthosporium'],
        affectedCrops: ['Lúa'],
        symptoms: [
            'Đốm nâu tròn trên lá',
            'Viền lá bị hỏng màu đỏ nâu',
            'Lá vàng từ từ rồi rụng',
            'Trên hạt: có đốm, làm giảm chất lượng'
        ],
        causes: 'Nấm Bipolaris oryzae, thời tiết ẩm ướt, thiếu kali, đất bị nhiễm',
        treatment: [
            'Phun Mancozeb 80% WP 3g/lít',
            'Bón phân kali bổ sung (KCl 60%)',
            'Phun Carbendazim 1g/lít'
        ],
        prevention: [
            'Tránh tưới lên lá',
            'Hạn chế độ ẩm',
            'Bón phân kali đủ lượng',
            'Tiêu hủy phế phụm lúa'
        ],
        severity: 'Trung bình',
        economicImpact: 'Mất 20-40% năng suất nếu không kiểm soát'
    },

    'Bệnh cháy lá sớm cà chua': {
        keywords: ['cháy lá', 'early blight', 'alteraria', 'solani'],
        aliases: ['Cháy lá sớm', 'Nốt thâm'],
        confidence: 0.87,
        commonNames: ['Early Blight', 'Alteraria'],
        affectedCrops: ['Cà chua', 'Khoai tây'],
        symptoms: [
            'Đốm tròn với các vành tay đàn',
            'Viền lá bị cháy nâu đỏ',
            'Lá héo, vàng, rụng',
            'Bắt đầu từ lá dưới cùng'
        ],
        causes: 'Nấm Alteraria solani, độ ẩm cao, nhiệt độ ấm',
        treatment: [
            'Phun Chlorothalonil 72% SC 2ml/lít',
            'Phun Mancozeb 80% WP 3g/lít',
            'Cắt bỏ lá bệnh'
        ],
        prevention: [
            'Loại bỏ lá dưới cùng sau khi cây lớn',
            'Tránh tưới lên lá',
            'Tăng thông gió'
        ],
        severity: 'Cao',
        economicImpact: 'Giảm 30-50% năng suất'
    },

    'Bệnh phấn trắng cây trồng': {
        keywords: ['phấn trắng', 'powder mildew', 'white powder', 'oidium'],
        aliases: ['Phấn trắng', 'Mốc trắng'],
        confidence: 0.91,
        commonNames: ['Powdery Mildew'],
        affectedCrops: ['Dưa', 'Bí', 'Hoa hồng', 'Nhiều loại'],
        symptoms: [
            'Lớp phấn trắng xuất hiện trên lá (cả 2 mặt)',
            'Lá cong nhăn lại',
            'Cây sinh trưởng chậm',
            'Hoa và quả cũng bị nhiễm'
        ],
        causes: 'Nấm Oidium, độ ẩm cao 60-90%, nhiệt độ 20-27°C',
        treatment: [
            'Phun Sulfur 75% WP 2-3g/lít',
            'Phun Karathane 18.5% EC 1ml/lít',
            'Phun Triazol 25% EC 1ml/lít'
        ],
        prevention: [
            'Tăng thông gió',
            'Giảm độ ẩm',
            'Tránh đâm cây quá dầy',
            'Loại bỏ cây bệnh'
        ],
        severity: 'Trung bình',
        economicImpact: 'Giảm 20-40% sản lượng'
    },

    'Bệnh héo xanh (Wilt)': {
        keywords: ['héo xanh', 'wilt', 'ralstonia', 'vascular'],
        aliases: ['Héo xanh', 'Héo vi khuẩn'],
        confidence: 0.85,
        commonNames: ['Bacterial Wilt', 'Vascular Wilt'],
        affectedCrops: ['Cà chua', 'Ớt', 'Cà phê', 'Dưa'],
        symptoms: [
            'Lá héo nhưng vẫn giữ màu xanh',
            'Thân cây mềm không cứng',
            'Rễ có mùi hôi',
            'Cây chết nhanh'
        ],
        causes: 'Vi khuẩn Ralstonia solanacearum, nước tưới bẩn, đất bị nhiễm',
        treatment: [
            'Cắt bỏ phần bệnh, cách ly cây',
            'Dùng nước sạch tưới',
            'Không có cách chữa trị hoàn toàn'
        ],
        prevention: [
            'Sử dụng nước sạch',
            'Tiệt trùng dụng cụ với ethanol 70%',
            'Chọn đất vô trùng',
            'Loại bỏ cây bệnh'
        ],
        severity: 'Rất cao',
        economicImpact: 'Có thể mất toàn bộ vụ'
    },

    'Thiếu dinh dưỡng (Chlorosis)': {
        keywords: ['vàng', 'chlorosis', 'yellow', 'nutrient deficiency', 'thiếu'],
        aliases: ['Vàng lá', 'Lá vàng'],
        confidence: 0.8,
        commonNames: ['Nutrient Deficiency', 'Chlorosis'],
        affectedCrops: ['Tất cả các loại'],
        symptoms: [
            'Lá vàng đều khắp cây',
            'Gân lá vẫn giữ màu xanh (thiếu sắt)',
            'Cây phát triển chậm',
            'Lá nhỏ hơn bình thường'
        ],
        causes: 'Thiếu N, K, Mg, Fe, Zn hoặc pH đất không phù hợp',
        treatment: [
            'Bón phân NPK cân đối (16-16-16)',
            'Phun lá bổ sung vi lượng Fe, Zn',
            'Điều chỉnh pH đất'
        ],
        prevention: [
            'Bón phân đủ lượng theo giai đoạn',
            'Định kỳ 2 tuần/lần kiểm tra',
            'Phân tích đất định kỳ'
        ],
        severity: 'Thấp đến trung bình',
        economicImpact: 'Giảm 10-30% năng suất'
    },

    'Bệnh thối rễ Pythium': {
        keywords: ['thối rễ', 'root rot', 'pythium', 'phytophthora', 'decay'],
        aliases: ['Thối rễ', 'Héo do nước'],
        confidence: 0.87,
        commonNames: ['Root Rot', 'Damping Off'],
        affectedCrops: ['Hầu hết các loại', 'Đặc biệt cây non'],
        symptoms: [
            'Rễ màu nâu đen thay vì trắng',
            'Rễ mềm dễ gãy',
            'Mùi hôi thối từ đất',
            'Cây tưới nước đủ nhưng vẫn héo'
        ],
        causes: 'Nấm Pythium/Phytophthora, nước ngập quá lâu, thoát nước kém',
        treatment: [
            'Cắt bỏ rễ bệnh',
            'Thay đất mới vô trùng',
            'Cải tạo thoát nước',
            'Giảm tần suất tưới'
        ],
        prevention: [
            'Đảm bảo thoát nước tốt',
            'Duy trì độ ẩm 60-70%',
            'Sử dụng đất vô trùng',
            'Không tưới quá nhiều'
        ],
        severity: 'Cao',
        economicImpact: 'Giảm 40-70% năng suất'
    },

    'Bệnh virus Mosaic': {
        keywords: ['virus', 'mosaic', 'tmv', 'cmv', 'lây', 'dị dạng', 'biến dạng'],
        aliases: ['Virus Mosaic', 'TMV', 'CMV'],
        confidence: 0.75,
        commonNames: ['Viral Mosaic', 'Tobacco Mosaic Virus'],
        affectedCrops: ['Cà chua', 'Ớt', 'Dưa', 'Hoa'],
        symptoms: [
            'Lá vàng không đều, lác mạch',
            'Lá biến dạng cong queo',
            'Lá có đốm hoặc vệ không đều',
            'Cây lùn hơn bình thường'
        ],
        causes: 'Virus TMV/CMV, lây nhiễm từ côn trùng (rầy), dụng cụ bẩn',
        treatment: [
            'Không có thuốc trị triệu chứng',
            'Cách ly cây bệnh',
            'Loại bỏ cây nặng bệnh'
        ],
        prevention: [
            'Kiểm soát rầy (vectơ lây)',
            'Tiệt trùng dụng cụ với chất tẩy rửa hoặc khiếc đặc',
            'Chọn giống kháng virus',
            'Trồng cách xa cây bệnh'
        ],
        severity: 'Trung bình đến cao',
        economicImpact: 'Giảm 20-50% năng suất'
    },

    'Bệnh cháy lá vi khuẩn': {
        keywords: ['cháy lá vi khuẩn', 'bacterial leaf scorch', 'xanthomonas'],
        aliases: ['Cháy lá', 'Xanthomonas'],
        confidence: 0.86,
        commonNames: ['Bacterial Leaf Scorch'],
        affectedCrops: ['Ớt', 'Cà chua', 'Dưa chuột'],
        symptoms: [
            'Các vệ nâu đỏ có halo vàng quanh',
            'Viền vệ ướt, mềm',
            'Lá có mùi lạ (do vi khuẩn)',
            'Lan nhanh trong thời tiết ấm ẩm'
        ],
        causes: 'Vi khuẩn Xanthomonas, độ ẩm cao, nước tưới bẩn',
        treatment: [
            'Phun Copper Oxychloride 50% WP 3g/lít',
            'Phun Streptomycin (nếu có)',
            'Cắt bỏ bộ phận bệnh'
        ],
        prevention: [
            'Sử dụng nước sạch',
            'Tránh tưới lên lá',
            'Loại bỏ cây bệnh',
            'Tiệt trùng dụng cụ'
        ],
        severity: 'Cao',
        economicImpact: 'Giảm 30-60% năng suất'
    },

    'Bệnh thối đen nho': {
        keywords: ['thối đen', 'black rot', 'guignardia', 'nho', 'grape'],
        aliases: ['Thối đen nho', 'Black Rot'],
        confidence: 0.84,
        commonNames: ['Black Rot', 'Grape Black Rot'],
        affectedCrops: ['Nho'],
        symptoms: [
            'Lá có đốm tròn màu nâu đỏ',
            'Quả bị thối đen, dập lệch',
            'Trên cành: có vệ dài hình tương',
            'Lan nhanh khi thời tiết ẩm'
        ],
        causes: 'Nấm Guignardia bidwellii, mưa, sương sớm',
        treatment: [
            'Phun Mancozeb 80% WP 3-4g/lít',
            'Phun Carbendazim 50% WP 1g/lít',
            'Cắt bỏ cành bệnh'
        ],
        prevention: [
            'Tỉa cây, tăng thông gió',
            'Loại bỏ lá bệnh',
            'Sử dụng giống kháng',
            'Phun phòng ngừa từ sớm'
        ],
        severity: 'Cao',
        economicImpact: 'Giảm 40-80% sản lượng'
    },

    'Bệnh đốm lá Septoria': {
        keywords: ['đốm septoria', 'septoria', 'leaf spot', 'nấm đốm'],
        aliases: ['Đốm lá', 'Septoria'],
        confidence: 0.82,
        commonNames: ['Septoria Leaf Spot'],
        affectedCrops: ['Lúa mì', 'Cây trồng'],
        symptoms: [
            'Đốm tròn hoặc elip có viền nâu',
            'Tâm đốm nhạt màu, có hệ thống vòng tròn',
            'Đốm lan tỏa, lá khô',
            'Có thể thấy các điểm đen (pycnidia)'
        ],
        causes: 'Nấm Septoria, độ ẩm cao, mưa',
        treatment: [
            'Phun Mancozeb 80% WP 3g/lít',
            'Phun Carbendazim 50% WP 1g/lít',
            'Loại bỏ lá bệnh'
        ],
        prevention: [
            'Tăng thông gió',
            'Giảm độ ẩm',
            'Tiêu hủy phế phụm lúa mì'
        ],
        severity: 'Trung bình',
        economicImpact: 'Giảm 15-30% năng suất'
    },

    'Bệnh mốc lá Downy Mildew': {
        keywords: ['mốc lá', 'downy mildew', 'peronospora', 'phytophthora'],
        aliases: ['Mốc lá', 'Downy Mildew'],
        confidence: 0.83,
        commonNames: ['Downy Mildew'],
        affectedCrops: ['Dưa', 'Rau cải', 'Hành'],
        symptoms: [
            'Các đốm vàng nhạt trên mặt lá trên',
            'Mốc gai trắng/xám trên mặt lá dưới',
            'Lá chảy nước, mềm yếu',
            'Lá khô và rụng'
        ],
        causes: 'Nấm Peronospora, độ ẩm cao, đêm lạnh',
        treatment: [
            'Phun Metalaxyl 8% + Mancozeb 64% WP',
            'Phun Ridomil 2.5% EC',
            'Cắt bỏ lá bệnh'
        ],
        prevention: [
            'Tránh tưới lên lá buổi tối',
            'Tăng thông gió',
            'Giảm độ ẩm trong nhà kính'
        ],
        severity: 'Cao',
        economicImpact: 'Giảm 50-100% năng suất nếu không kiểm soát'
    },

    'Lá khỏe mạnh (Healthy Leaf)': {
        keywords: ['khỏe', 'healthy', 'good', 'normal', 'bình thường', 'tốt', 'xanh', 'normal'],
        aliases: ['Lành lặn', 'Bình thường'],
        confidence: 0.95,
        commonNames: ['Healthy', 'Normal Leaf'],
        affectedCrops: ['Tất cả'],
        symptoms: [
            'Lá xanh tươi đều',
            'Không có đốm hoặc vệ bệnh',
            'Bề mặt lá bóng mịn',
            'Cây phát triển bình thường'
        ],
        causes: 'Cây khỏe mạnh, dinh dưỡng đủ, chăm sóc tốt, thời tiết thuận lợi',
        treatment: [
            'Tiếp tục chăm sóc bình thường theo qui trình'
        ],
        prevention: [
            'Duy trì tình trạng hiện tại',
            'Kiểm tra định kỳ',
            'Bón phân đủ lượng'
        ],
        severity: 'Không',
        economicImpact: 'Không có tác động âm tính'
    },

    // ============ PLUM DISEASES (MẬN) ============
    'Bệnh than đen trên mận': {
        keywords: ['than đen', 'anthracnose', 'plum anthracnose', 'colletotrichum', 'mận'],
        aliases: ['Cháy quả', 'Lún quả'],
        confidence: 0.87,
        commonNames: ['Anthracnose', 'Black Spot on Plum'],
        affectedCrops: ['Mận', 'Đào', 'Lê', 'Vải'],
        symptoms: [
            'Các đốm tròn đen trên quả',
            'Lún sâu ở giữa đốm',
            'Lá có đốm nâu với viền đỏ',
            'Quả sẽ rơi hoặc héo'
        ],
        causes: 'Nấm Colletotrichum gloeosporioides, độ ẩm cao, mưa lớn',
        treatment: [
            'Phun Carbendazim 1g/lít',
            'Phun Mancozeb 80% WP 3g/lít',
            'Loại bỏ quả bệnh, lá bệnh'
        ],
        prevention: [
            'Tỉa cành thường xuyên để thoáng gió',
            'Tránh tưới lên quả',
            'Nâng cao gốc để tránh ngập nước',
            'Tiêu hủy lá rụng bị bệnh'
        ],
        severity: 'Cao',
        economicImpact: 'Giảm 40-60% chất lượng quả'
    },

    'Bệnh phấn trắng trên mận': {
        keywords: ['phấn trắng mận', 'powdery mildew plum', 'erysiphe', 'phloem necrosis'],
        aliases: ['Phấn trắng lá', 'Mốc trắng'],
        confidence: 0.85,
        commonNames: ['Powdery Mildew on Plum'],
        affectedCrops: ['Mận', 'Đào', 'Nho'],
        symptoms: [
            'Lớp phấn trắng trên lá',
            'Lá cong nhăn, phát triển chậm',
            'Quả nhỏ, vỏ xấu',
            'Cành non bị bao phủ phấn trắng'
        ],
        causes: 'Nấm Podosphaera, độ ẩm 60-80%, buổi tối lạnh ngày nóng',
        treatment: [
            'Phun Hexaconazole 5% EC 1ml/lít',
            'Phun Sulfur 80% WP 2g/lít',
            'Tỉa cành để tăng thông gió'
        ],
        prevention: [
            'Chọn giống kháng bệnh',
            'Không bón nitơ quá nhiều',
            'Tối ưu hóa thông gió'
        ],
        severity: 'Trung bình',
        economicImpact: 'Giảm 20-30% năng suất'
    },

    'Bệnh rỉ sét lá mận': {
        keywords: ['rỉ sét', 'leaf rust', 'tranzschelia', 'rust disease', 'mận'],
        aliases: ['Lá rỉ', 'Bệnh rỉ'],
        confidence: 0.82,
        commonNames: ['Rust on Plum Leaves'],
        affectedCrops: ['Mận', 'Đào', 'Lê'],
        symptoms: [
            'Các đốm nhỏ màu cam/nâu đỏ dưới lá',
            'Lá vàng từ từ rồi rụng',
            'Quả nhỏ hơn bình thường',
            'Cây yếu, chậm phát triển'
        ],
        causes: 'Nấm Tranzschelia pruni-spinosae, độ ẩm cao, gió',
        treatment: [
            'Phun Mancozeb 80% WP 3g/lít',
            'Phun Hexaconazole 5% EC 1ml/lít',
            'Loại bỏ lá bệnh'
        ],
        prevention: [
            'Tỉa cành để thoáng gió',
            'Tránh tưới lên lá buổi tối',
            'Tiêu hủy lá rụng'
        ],
        severity: 'Trung bình',
        economicImpact: 'Giảm 15-25% năng suất'
    },

    // ============ PEACH DISEASES (ĐÀO) ============
    'Bệnh cháy lá đào': {
        keywords: ['cháy lá đào', 'leaf curl peach', 'taphrina deformans', 'đào'],
        aliases: ['Lá cong', 'Cháy lá'],
        confidence: 0.86,
        commonNames: ['Peach Leaf Curl'],
        affectedCrops: ['Đào', 'Mận'],
        symptoms: [
            'Lá cong, nhăn, dù già',
            'Màu lá hỗn loạn (đỏ, vàng, xanh)',
            'Lá sẽ rụng sớm',
            'Cây sẽ yếu đi'
        ],
        causes: 'Nấm Taphrina deformans, tác động lạnh mùa xuân',
        treatment: [
            'Phun Carbendazim trước khi lá nở',
            'Phun Hexaconazole',
            'Cắt bỏ cành bệnh nặng'
        ],
        prevention: [
            'Phun thuốc vào mùa đông (Bordeaux mixture)',
            'Tỉa cành để thoáng gió',
            'Chọn vị trí trồng ấm áp'
        ],
        severity: 'Cao',
        economicImpact: 'Giảm 30-40% năng suất'
    },

    // ============ GUAVA DISEASES (ổi) ============
    'Bệnh ghẻ trên ổi': {
        keywords: ['ghẻ ổi', 'guava scab', 'asperisporium', 'elsinoe', 'ổi'],
        aliases: ['Lỏi ổi', 'Bệnh ghẻ'],
        confidence: 0.84,
        commonNames: ['Guava Scab'],
        affectedCrops: ['Ổi', 'Xoài'],
        symptoms: [
            'Các vết ghẻ trên quả',
            'Lá có đốm lỏi xám',
            'Quả bị dị hình, không bán được',
            'Lá và quả cùng lúc bị bệnh'
        ],
        causes: 'Nấm Asperisporium guavas, độ ẩm cao, nhiệt độ 23-28°C',
        treatment: [
            'Phun Mancozeb 80% WP 3g/lít',
            'Phun Carbendazim 1g/lít',
            'Loại bỏ quả bệnh'
        ],
        prevention: [
            'Tỉa cành để giảm độ ẩm',
            'Tránh tưới lên quả',
            'Thu hoạch sớm'
        ],
        severity: 'Cao',
        economicImpact: 'Giảm 50-70% chất lượng quả'
    },

    // ============ POMEGRANATE DISEASES (LựU) ============
    'Bệnh sương muối trên lựu': {
        keywords: ['sương muối', 'sooty blotch', 'pomegranate', 'alternaria', 'lựu'],
        aliases: ['Tấy đen', 'Sương muối'],
        confidence: 0.83,
        commonNames: ['Sooty Blotch on Pomegranate'],
        affectedCrops: ['Lựu', 'Xoài'],
        symptoms: [
            'Đốm đen mờ trên quả',
            'Quả giống như bước đi qua tro',
            'Lá cũng có đốm đen mờ',
            'Không ảnh hưởng đến vị nhưng ảnh hưởng thẩm mỹ'
        ],
        causes: 'Nấm Alternaria, độ ẩm cao, nhiệt độ 25-30°C',
        treatment: [
            'Phun Chlorothalonil 72% SC 2ml/lít',
            'Phun Mancozeb 80% WP 3g/lít',
            'Thoáng gió để giảm độ ẩm'
        ],
        prevention: [
            'Tỉa cành thường xuyên',
            'Tránh bón nitơ quá nhiều',
            'Duy trì độ ẩm 60-70%'
        ],
        severity: 'Trung bình',
        economicImpact: 'Giảm 20-30% giá trị thương phẩm'
    },

    // ============ APPLE DISEASES (TÁO) ============
    'Bệnh scab trên táo': {
        keywords: ['scab táo', 'apple scab', 'venturia inaequalis', 'lỏi táo', 'táo'],
        aliases: ['Lỏi', 'Bệnh scab'],
        confidence: 0.88,
        commonNames: ['Apple Scab'],
        affectedCrops: ['Táo', 'Lê'],
        symptoms: [
            'Lá có các vệ xám nâu',
            'Quả bị lỏi, dàng dề',
            'Quả bị nứt ra',
            'Lá sẽ vàng rồi rụng'
        ],
        causes: 'Nấm Venturia inaequalis, độ ẩm 90%, nhiệt độ 7-24°C',
        treatment: [
            'Phun Carbendazim 1g/lít',
            'Phun Sulfur 80% WP 2g/lít',
            'Loại bỏ quả bệnh'
        ],
        prevention: [
            'Chọn giống kháng bệnh',
            'Tỉa cành để thoáng gió',
            'Tiêu hủy lá rụng'
        ],
        severity: 'Cao',
        economicImpact: 'Giảm 40-60% chất lượng quả'
    },

    // ============ COCONUT DISEASES (DỪA) ============
    'Bệnh lá vàng trên dừa': {
        keywords: ['lá vàng dừa', 'coconut leaf scorch', 'phomopsis', 'yellow leaf', 'dừa'],
        aliases: ['Lá vàng', 'Héo lá'],
        confidence: 0.8,
        commonNames: ['Coconut Leaf Scorch'],
        affectedCrops: ['Dừa'],
        symptoms: [
            'Lá ngắn nhất trên đỉnh vàng trước',
            'Dần dần các lá khác cũng vàng',
            'Lá héo, cây không sinh trưởng',
            'Có thể dẫn đến chết cây'
        ],
        causes: 'Vi khuẩn hoặc nấm Phomopsis, tác động stress nước',
        treatment: [
            'Tưới nước đúng lúc',
            'Phun Carbendazim định kỳ',
            'Cắt lá bệnh để giảm bớt'
        ],
        prevention: [
            'Tưới nước đủ lượng',
            'Bón phân cân bằng N-P-K',
            'Cải thiện thoáng gió'
        ],
        severity: 'Rất cao',
        economicImpact: 'Có thể làm cây chết nếu không xử lý'
    }
};

// Quick lookup by disease name
export const getDiseaseInfo = (diseaseName: string) => {
    return COMPREHENSIVE_DISEASE_DB[diseaseName as keyof typeof COMPREHENSIVE_DISEASE_DB];
};

// Search diseases by keyword
export const searchDiseasesByKeyword = (keyword: string): string[] => {
    const results: string[] = [];
    const searchTerm = keyword.toLowerCase();

    for (const [name, info] of Object.entries(COMPREHENSIVE_DISEASE_DB)) {
        for (const kw of info.keywords) {
            if (kw.toLowerCase().includes(searchTerm) || searchTerm.includes(kw.toLowerCase())) {
                results.push(name);
                break;
            }
        }
    }

    return results;
};

// Get all diseases
export const getAllDiseases = () => {
    return Object.keys(COMPREHENSIVE_DISEASE_DB);
};

// Format disease info for display
export const formatDiseaseInfo = (diseaseName: string): string => {
    const info = getDiseaseInfo(diseaseName);
    if (!info) return 'Không tìm thấy thông tin bệnh';

    let formatted = `🌿 **${diseaseName}**\n`;
    formatted += `📋 **Tên gọi khác:** ${info.aliases.join(', ')}\n`;
    formatted += `🌾 **Cây bị ảnh hưởng:** ${info.affectedCrops.join(', ')}\n`;
    formatted += `⚠️ **Mức độ nghiêm trọng:** ${info.severity}\n\n`;

    formatted += `🔍 **Triệu chứng:**\n`;
    for (const s of info.symptoms) {
        formatted += `• ${s}\n`;
    }

    formatted += `\n🧬 **Nguyên nhân:**\n${info.causes}\n\n`;

    formatted += `💊 **Cách chữa trị:**\n`;
    for (const t of info.treatment) {
        formatted += `• ${t}\n`;
    }

    formatted += `\n🛡️ **Phòng ngừa:**\n`;
    for (const p of info.prevention) {
        formatted += `• ${p}\n`;
    }

    return formatted;
};

export default COMPREHENSIVE_DISEASE_DB;

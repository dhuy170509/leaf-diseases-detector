// Comprehensive Vietnamese Agricultural Disease Database
// Tập trung vào các loại bệnh chính của cây trồng Việt Nam

export const VIETNAMESE_DISEASE_DB = {
    // ============ DISEASES FOR RICE (LÚA) ============
    'Bệnh đạo ôn lúa (Blast)': {
        crop: 'Lúa',
        keywords: ['đạo ôn', 'blast', 'pyricularia', 'rice blast', 'mễn lá'],
        vietnamese_names: ['Bệnh bản lá', 'Bệnh mễn lúa', 'Rice Blast'],
        confidence: 0.92,
        symptoms: [
            'Các đốm lanceolate (hình mũi tên) dài 3-5mm, viền nâu đỏ, tâm xám',
            'Trên lá: đốm lan tỏa có thể chết cả lá',
            'Trên thân cây: các vệ nâu, có thể làm gẫy thân (tại gốc)',
            'Trên bông: đốm nâu, bông khô và rụng',
            'Thường xuất hiện khi thời tiết ẩm ướt >90%, nhiệt độ 18-28°C'
        ],
        cause: 'Nấm Magnaporthe oryzae (Pyricularia oryzae)',
        conditions: ['Thời tiết ẩm ướt', 'Bón nitơ quá nhiều', 'Nước tưới kém', 'Giống nhạy cảm'],
        treatment: [
            'Phun Carbendazim 50% WP 1g/lít, 7-10 ngày/lần',
            'Phun Mancozeb 80% WP 3g/lít',
            'Phun Hexaconazole 5% EC 1ml/lít',
            'Bắt đầu phun từ giai đoạn cuống lá',
            'Phun khi phát hiện triệu chứng đầu tiên'
        ],
        prevention: [
            'Chọn giống kháng bệnh như VNR18, VNR20',
            'Tránh tưới lên lá buổi tối',
            'Giảm bón nitơ, bón kali và phốt phát đầy đủ',
            'Xát sạch bệnh trong vườn ươm',
            'Thông gió tốt, hạn chế độ ẩm'
        ],
        severity: 'RẤT CAO',
        risk_level: 5,
        economic_impact: 'Có thể mất 50-100% năng suất, là bệnh hạng A ở Việt Nam'
    },

    'Bệnh đốm nâu lá lúa (Brown Spot)': {
        crop: 'Lúa',
        keywords: ['đốm nâu', 'brown spot', 'helminthosporium', 'bipolaris', 'cochliobolus'],
        vietnamese_names: ['Bệnh đốm nâu', 'Helminthosporium', 'Bipolaris'],
        confidence: 0.88,
        symptoms: [
            'Đốm tròn hay elip màu nâu trên lá',
            'Viền lá bị hỏng màu đỏ nâu rõ rệt',
            'Tâm đốm có màu xám',
            'Lá vàng từ từ rồi rụng',
            'Trên hạt: có đốm đen, làm giảm chất lượng hạt',
            'Trên cơm: xuất hiện các vệ dài'
        ],
        cause: 'Nấm Bipolaris oryzae (Helminthosporium oryzae)',
        conditions: ['Thời tiết ẩm ướt', 'Thiếu kali', 'Đất bị nhiễm bệnh', 'Cây ốm yếu'],
        treatment: [
            'Phun Mancozeb 80% WP 3g/lít, 7-10 ngày/lần',
            'Phun Carbendazim 50% WP 1g/lít',
            'Bón phân kali bổ sung (KCl 60% nồng độ 3-5%)',
            'Phun lá phân bổ sung kali 1-2%',
            'Dùng thuốc sinh học từ Bacillus hoặc Trichoderma'
        ],
        prevention: [
            'Tránh tưới lên lá, tưới gốc',
            'Hạn chế độ ẩm, tăng thông gió',
            'Bón phân kali đầy đủ (K2O 8-10 kg/100m²)',
            'Tiêu hủy phế phụm lúa ngay',
            'Sử dụng hạt giống từ nơi không có bệnh'
        ],
        severity: 'CAO',
        risk_level: 4,
        economic_impact: 'Mất 20-40% năng suất nếu không kiểm soát, đặc biệt ở vùng Tây Nguyên'
    },

    'Bệnh lùn xoắn lá lúa (Tungro)': {
        crop: 'Lúa',
        keywords: ['tungro', 'lùn xoắn', 'virus lúa', 'leafhopper', 'rầy xanh'],
        vietnamese_names: ['Bệnh virus lúa', 'Lùn xoắn lá'],
        confidence: 0.85,
        symptoms: [
            'Lá lá vàng từ mép vào, sau vàng hẳn từ gốc',
            'Lá xoắn lại, bong bóng trên lá',
            'Cây lùn hơn bình thường 20-30cm',
            'Khổ hạt giảm, hạt chứa ít năng lượng',
            'Cây chết ở giai đoạn sớm'
        ],
        cause: 'Virus Rice Tungro (RTV), lây truyền bởi rầy xanh (Nephotettix lugens)',
        conditions: ['Mật độ rầy cao', 'Trồng liên tiếp', 'Không có cây chủ', 'Thời tiết ấm'],
        treatment: [
            'Không có cách chữa trị triệu chứng',
            'Cách ly cây bệnh, lấy ra khỏi ruộng',
            'Phun thuốc kiểm soát rầy: Imidacloprid 17.8% SL 0.5ml/lít',
            'Phun Lambda-cyhalothrin 5% EC 0.7ml/lít',
            'Loại bỏ cây bệnh hoàn toàn'
        ],
        prevention: [
            'Chọn giống kháng tungro như VNR10, VNR15',
            'Trồng rào cây lá nhỏ (bẫy rầy)',
            'Tiêu hủy cỏ dại, cây bệnh',
            'Cách lúa đến 1-2 km từ lúa cũ',
            'Không trồng lúa liên tiếp',
            'Kiểm soát rầy từ sớm'
        ],
        severity: 'CAO',
        risk_level: 4,
        economic_impact: 'Mất 30-80% năng suất, là bệnh báo động ở Mekong Delta'
    },

    'Bệnh đạo ôn cổ bông (Neck Blast)': {
        crop: 'Lúa',
        keywords: ['đạo ôn cổ', 'neck blast', 'panicle blast', 'pyricularia'],
        vietnamese_names: ['Bệnh mễn bông', 'Đạo ôn cổ bông'],
        confidence: 0.9,
        symptoms: [
            'Cổ bông (từng khoảng 1-2cm dưới hạt) có vệ nâu, cơ định',
            'Cổ bông bị chảy máu, phần trên héo, hạt khô',
            'Hạt không phát triển, bông bất định kỳ',
            'Gây tổn thất năng suất nặng nhất',
            'Xuất hiện khi giai đoạn bông tấp nắp, thời tiết ẩm'
        ],
        cause: 'Nấm Magnaporthe oryzae (chủng chuyên hóa trên cổ bông)',
        conditions: ['Giai đoạn bông tấp nắp', 'Thời tiết ẩm ướt, sương sớm', 'Bón nitơ quá nhiều'],
        treatment: [
            'Phun Carbendazim 50% WP 1g/lít',
            'Phun Propiconazole 25% EC 1ml/lít',
            'Phun lúc bông tấp nắp, tiếp tục 7 ngày phun 1 lần',
            'Dùng Tricyclazole 75% WP 0.6g/lít'
        ],
        prevention: [
            'Trồng vợt 7-10 ngày một lần để tránh cùng giai đoạn',
            'Tránh bón nitơ quá nước',
            'Tăng khoảng cách trồng để tăng thông gió',
            'Chọn giống kháng bệnh',
            'Phun phòng ngừa từ giai đoạn cuống lá'
        ],
        severity: 'RẤT CAO',
        risk_level: 5,
        economic_impact: 'Có thể mất 100% hạt trên cổ bị nhiễm'
    },

    // ============ DISEASES FOR COFFEE (CÀ PHÊ) ============
    'Bệnh nấm Rôi (Leaf Rust)': {
        crop: 'Cà phê',
        keywords: ['rôi', 'rust', 'hemileia vastatrix', 'cà phê lá rôi', 'ca phe'],
        vietnamese_names: ['Bệnh lá rôi', 'Leaf Rust', 'Rust'],
        confidence: 0.91,
        symptoms: [
            'Mặt dưới lá: sùi lên các điểm vàng cam (chứa bào tử)',
            'Mặt trên lá: có đốm vàng tương ứng',
            'Lá loang lổ, dần chuyển sang nâu đỏ',
            'Lá rụng sớm, cây trần trụi',
            'Thường bắt đầu từ lá dưới cùng rồi lên trên',
            'Nặng nhất khi thời tiết ẩm ướt 20-24°C'
        ],
        cause: 'Nấm Hemileia vastatrix',
        conditions: ['Thời tiết ẩm ướt, mưa liên tục', 'Cây trồng dầy', 'Thiếu kali', 'Đất chua'],
        treatment: [
            'Phun Sulfur 80% WP 2-3g/lít (phòng ngừa tốt)',
            'Phun Copper Oxychloride 50% WP 3g/lít',
            'Phun Hexaconazole 5% EC 1ml/lít khi phát hiện bệnh',
            'Phun mỗi 2-3 tuần trong mùa mưa',
            'Dùng Myclobutanil 20% EC 0.5ml/lít'
        ],
        prevention: [
            'Chọn giống kháng rôi như S795, Cathy',
            'Tỉa cây loại bỏ lá dưới, tăng thông gió',
            'Bón phân kali đầy đủ (K2O 150-200kg/ha)',
            'Tránh tưới lên lá buổi tối',
            'Loại bỏ lá bệnh nặng',
            'Trồng cây che bóng thích hợp'
        ],
        severity: 'RẤT CAO',
        risk_level: 5,
        economic_impact: 'Là bệnh chủ yếu gây tổn thất trên cà phê, có thể mất 50-80% năng suất'
    },

    'Bệnh nấm Tan (Anthracnose)': {
        crop: 'Cà phê',
        keywords: ['tan', 'anthracnose', 'colletotrichum', 'đốm lá cà phê'],
        vietnamese_names: ['Bệnh lá tan', 'Anthracnose'],
        confidence: 0.87,
        symptoms: [
            'Các đốm tròn hay elip màu nâu đỏ trên lá',
            'Tâm đốm có vòng tròn đồng tâm rõ rệt',
            'Viền đốm màu đỏ đậm, rõ rệt',
            'Trên quả: các vệ nâu, sâu vào trong quả',
            'Quả gặt sớm, bị khô cằn',
            'Lá khô, có thể rụng'
        ],
        cause: 'Nấm Colletotrichum kahawae',
        conditions: ['Mưa nhiều, độ ẩm cao >80%', 'Nước tưới kém', 'Cây trồng dầy'],
        treatment: [
            'Phun Mancozeb 80% WP 3-4g/lít',
            'Phun Copper Oxychloride 50% WP 3g/lít',
            'Carbendazim 50% WP 1g/lít',
            'Phun khi bắt đầu mùa mưa',
            'Loại bỏ lá bệnh'
        ],
        prevention: [
            'Tỉa cây tăng thông gió',
            'Tránh tưới lên lá',
            'Loại bỏ cây bệnh nặng',
            'Chọn giống ít nhạy cảm',
            'Sử dụng phân bón cân đối'
        ],
        severity: 'CAO',
        risk_level: 4,
        economic_impact: 'Có thể làm mất 20-50% năng suất cà phê'
    },

    // ============ DISEASES FOR PEPPER (TIÊU) ============
    'Bệnh héo xanh tiêu (Wilt)': {
        crop: 'Tiêu',
        keywords: ['héo xanh tiêu', 'pepper wilt', 'fusarium', 'ralstonia'],
        vietnamese_names: ['Héo xanh', 'Fusarium Wilt'],
        confidence: 0.88,
        symptoms: [
            'Cây héo từ từ dù tưới nước đủ',
            'Lá héo xanh, không chảy nước',
            'Thân cây mềm yếu, màu xám',
            'Rễ héo, thâm đen, mũi rễ thối',
            'Nếu cắt thân: có màu nâu trên mạch mạch',
            'Cây chết trong 2-4 tuần'
        ],
        cause: 'Nấm Fusarium solani hoặc Ralstonia solanacearum',
        conditions: ['Đất bị nhiễm', 'Thoát nước kém', 'Nước tưới không sạch', 'Cây bị thương tích'],
        treatment: [
            'Không có cách chữa trị hiệu quả',
            'Cách ly cây bệnh, lấy ra ngay',
            'Tiệt trùng đất bằng Chloropicrin hoặc hơi nước',
            'Thay đất mới vô trùng',
            'Phun Benomyl 50% WP từ sớm phòng ngừa'
        ],
        prevention: [
            'Sử dụng đất vô trùng hoặc sơ chế',
            'Đảm bảo thoát nước tốt',
            'Sử dụng nước sạch, không tưới nước bẩn',
            'Tiệt trùng dụng cụ, khay, xô',
            'Chọn giống kháng bệnh',
            'Tránh trồng tiêu lâu năm trên cùng mảnh đất'
        ],
        severity: 'RẤT CAO',
        risk_level: 5,
        economic_impact: 'Có thể làm mất toàn bộ cây, tổn thất kinh tế rất lớn'
    },

    'Bệnh đốm lá tiêu (Leaf Spot)': {
        crop: 'Tiêu',
        keywords: ['đốm lá tiêu', 'leaf spot', 'xanthomonas', 'pepper'],
        vietnamese_names: ['Đốm lá', 'Bacterial Leaf Spot'],
        confidence: 0.84,
        symptoms: [
            'Các vệ tròn hay elip, nhỏ (1-5mm)',
            'Viền vệ màu đỏ nâu, rõ rệt',
            'Tâm vệ bị xuyên thủng (lỗ hổng)',
            'Vệ có ẩm chất lầy dính',
            'Trên quả: vệ lồi lên, mực đen',
            'Lá bị rụng sớm khi bệnh nặng'
        ],
        cause: 'Vi khuẩn Xanthomonas',
        conditions: ['Độ ẩm cao >70%', 'Mưa lớn', 'Nước tưới lên lá', 'Cây bị thương'],
        treatment: [
            'Phun Copper Oxychloride 50% WP 3g/lít',
            'Phun Bordeaux mixture 1%',
            'Streptomycin 3% + Tetracycline 3% nếu có',
            'Cắt bỏ lá bệnh nặng',
            'Phun 2-3 lần, cách 7 ngày'
        ],
        prevention: [
            'Tránh tưới lên lá, tưới gốc',
            'Tăng thông gió, giảm độ ẩm',
            'Tiệt trùng dụng cụ với ethanol 70%',
            'Loại bỏ lá bệnh ngay',
            'Trồng ở vùng thoáng, không ẩm hơi'
        ],
        severity: 'CAO',
        risk_level: 4,
        economic_impact: 'Có thể làm mất 30-60% năng suất'
    },

    // ============ DISEASES FOR PEANUT (ĐẬU PHỘNG) ============
    'Bệnh lá tròn đậu phộng (Late Leaf Spot)': {
        crop: 'Đậu phộng',
        keywords: ['lá tròn', 'late leaf spot', 'phaeoisariopsis', 'đậu phộng'],
        vietnamese_names: ['Bệnh lá tròn', 'Late Leaf Spot'],
        confidence: 0.86,
        symptoms: [
            'Đốm tròn hoặc elip trên lá, đường kính 5-10mm',
            'Viền đốm nâu đỏ, tâm xám',
            'Dưới lá có nấm màu xám đen',
            'Lá vàng, héo, rụng sớm',
            'Bắt đầu từ lá dưới, lan lên trên',
            'Thường bắt đầu từ giai đoạn tấp nắp'
        ],
        cause: 'Nấm Phaeoisariopsis personata',
        conditions: ['Thời tiết ẩm ướt', 'Mưa liên tục', 'Cây trồng dầy', 'Thốc nước kém'],
        treatment: [
            'Phun Mancozeb 80% WP 3g/lít',
            'Phun Chlorothalonil 72% SC 2ml/lít',
            'Phun từ sớm khi bệnh bắt đầu xuất hiện',
            'Phun 2-3 lần, cách 7-10 ngày',
            'Dùng Difenconazole 25% EC 0.8ml/lít'
        ],
        prevention: [
            'Chọn giống kháng bệnh',
            'Tỉa cây loại bỏ lá dưới, tăng thông gió',
            'Tránh tưới lên lá buổi tối',
            'Hạn chế bón nitơ',
            'Tiêu hủy phế phụm sau gặt',
            'Xen canh với cây khác'
        ],
        severity: 'CAO',
        risk_level: 4,
        economic_impact: 'Có thể làm mất 40-70% năng suất'
    },

    'Bệnh thán thư đậu phộng (Rosette)': {
        crop: 'Đậu phộng',
        keywords: ['thán thư', 'rosette', 'virus', 'peanut rosette virus'],
        vietnamese_names: ['Bệnh thán thư', 'Rosette'],
        confidence: 0.83,
        symptoms: [
            'Lá non xoắn, nhăn nheo, bong bóng',
            'Cây lùn, bé hơn bình thường',
            'Lá có màu xanh đậm, mạch đỏ',
            'Cây bị dừng sinh trưởng',
            'Hạu phát triển chậm, hạt nhỏ, ít',
            'Có thể làm chết cây'
        ],
        cause: 'Virus Peanut Rosette (PRV), lây truyền bởi rầy',
        conditions: ['Mật độ rầy cao', 'Trồng liên tiếp', 'Thời tiết ấm'],
        treatment: [
            'Không có cách chữa trị',
            'Lấy cây bệnh ra ngay',
            'Phun thuốc kiểm soát rầy: Imidacloprid 0.5ml/lít',
            'Loại bỏ cây bệnh hoàn toàn'
        ],
        prevention: [
            'Chọn giống kháng bệnh',
            'Kiểm soát rầy từ sớm',
            'Trồng rào cây bẫy (cây lá nhỏ)',
            'Tiêu hủy cỏ dại',
            'Cách đậu phộng cũ 1-2 km',
            'Sử dụng hạt giống không bệnh'
        ],
        severity: 'CAO',
        risk_level: 4,
        economic_impact: 'Có thể làm mất toàn bộ vụ, bệnh báo động'
    },

    // ============ DISEASES FOR CASSAVA (KHOAI MÌ) ============
    'Bệnh nấm chuỗi khoai (Leaf Blight)': {
        crop: 'Khoai mì',
        keywords: ['chuỗi khoai', 'leaf blight', 'phaeoseptoria', 'cassava'],
        vietnamese_names: ['Bệnh lá chuỗi', 'Leaf Blight'],
        confidence: 0.85,
        symptoms: [
            'Các vệ chữ nhật, có hướng theo gân lá',
            'Viền vệ nâu đỏ, tâm nâu nhạt',
            'Vệ có thể nối liền thành dải dài',
            'Lá vàng, héo, rụng sớm',
            'Cây trần trụi nếu bệnh nặng',
            'Ảnh hưởng đến cây non hơn cây lớn'
        ],
        cause: 'Nấm Phaeoseptoria (=Ascochyta)',
        conditions: ['Mưa nhiều, độ ẩm cao', 'Cây trồng dầy', 'Cây ốm yếu'],
        treatment: [
            'Phun Mancozeb 80% WP 3g/lít',
            'Phun Copper Oxychloride 50% WP 3g/lít',
            'Carbendazim 50% WP 1g/lít',
            'Phun 2-3 lần khi phát hiện bệnh',
            'Cắt bỏ lá bệnh'
        ],
        prevention: [
            'Tỉa cây loại bỏ lá dưới, tăng thông gió',
            'Tránh tưới lên lá',
            'Bón phân cân đối',
            'Tiêu hủy phế phụm sau gặt',
            'Chọn đất không bệnh'
        ],
        severity: 'TRUNG BÌNH',
        risk_level: 3,
        economic_impact: 'Giảm năng suất 10-20%, không gây tổn thất quá nặng'
    },

    'Bệnh héo khoai (Wilt)': {
        crop: 'Khoai mì',
        keywords: ['héo khoai', 'wilt', 'cassava wilt', 'xanthomonas'],
        vietnamese_names: ['Bệnh héo', 'Cassava Wilt'],
        confidence: 0.8,
        symptoms: [
            'Cây héo từ từ, lá héo xanh',
            'Mạch mạch có màu nâu đỏ',
            'Nếu cắt ngang thân: thấy vòng nâu',
            'Rễ cuống héo, thâm đen',
            'Cây chết từ từ'
        ],
        cause: 'Vi khuẩn Xanthomonas axonopodis',
        conditions: ['Đất bị nhiễm', 'Thoát nước kém', 'Cây bị thương'],
        treatment: [
            'Không có cách chữa trị hiệu quả',
            'Tiêu hủy cây bệnh',
            'Thay đất mới vô trùng',
            'Sử dụng hạt giống không bệnh'
        ],
        prevention: [
            'Sử dụng hạt giống khoai từ nơi không bệnh',
            'Tiệt trùng dụng cụ cắt hạt',
            'Đảm bảo thoát nước tốt',
            'Tiêu hủy cây bệnh ngay'
        ],
        severity: 'CAO',
        risk_level: 4,
        economic_impact: 'Có thể làm mất 50-100% vụ'
    },

    // ============ DISEASES FOR SWEET POTATO (KHOAI LANG) ============
    'Bệnh héo khoai lang (Wilt)': {
        crop: 'Khoai lang',
        keywords: ['héo khoai lang', 'sweet potato wilt', 'fusarium'],
        vietnamese_names: ['Héo khoai lang', 'Fusarium Wilt'],
        confidence: 0.82,
        symptoms: [
            'Cây héo từ từ, lá héo xanh',
            'Thân cây yếu, vàng nhạt',
            'Rễ nứt, lóc vỏ, màu xám xanh',
            'Nếu cắt rễ: có vòng nâu bên trong',
            'Cây chết trong 2-4 tuần'
        ],
        cause: 'Nấm Fusarium solani hoặc F. oxysporum',
        conditions: ['Đất bị nhiễm', 'Nước tưới kém', 'Thoát nước không tốt'],
        treatment: [
            'Không có cách chữa trị',
            'Tiêu hủy cây bệnh',
            'Sơ chế đất bằng hơi nước hoặc hóa chất'
        ],
        prevention: [
            'Sử dụng hạt giống từ vùng không bệnh',
            'Chọn giống kháng bệnh',
            'Cách trồng khoai lang cũ 1-2 năm',
            'Đảm bảo thoát nước tốt',
            'Bón phân khoáng cân đối'
        ],
        severity: 'CAO',
        risk_level: 4,
        economic_impact: 'Có thể làm mất 40-100% vụ'
    },

    // ============ DISEASES FOR TOMATO (CÀ CHUA) ============
    'Bệnh cháy lá sớm cà chua (Early Blight)': {
        crop: 'Cà chua',
        keywords: ['cháy lá sớm', 'early blight', 'alteraria', 'ca chua'],
        vietnamese_names: ['Cháy lá sớm', 'Early Blight'],
        confidence: 0.87,
        symptoms: [
            'Đốm tròn với các vành tay đàn rõ (3-10mm)',
            'Viền lá bị cháy nâu đỏ',
            'Tâm đốm có vòng nâu vàng',
            'Lá héo, vàng, rụng',
            'Bắt đầu từ lá dưới cùng',
            'Ảnh hưởng từ giai đoạn hàng (6 tuần tuổi)'
        ],
        cause: 'Nấm Alternaria solani',
        conditions: ['Độ ẩm cao >70%', 'Mưa lớn', 'Nhiệt độ 20-25°C', 'Nước tưới lên lá'],
        treatment: [
            'Phun Chlorothalonil 72% SC 2ml/lít',
            'Phun Mancozeb 80% WP 3g/lít',
            'Cắt bỏ lá bệnh ngay',
            'Phun từ sớm, tiếp tục 7 ngày/lần',
            'Dùng Hexaconazole 5% EC 1ml/lít'
        ],
        prevention: [
            'Loại bỏ lá dưới khi cây lớn',
            'Tránh tưới lên lá',
            'Tăng thông gió',
            'Tiêu hủy phế phụm cà chua',
            'Xen canh với cây khác'
        ],
        severity: 'CAO',
        risk_level: 4,
        economic_impact: 'Có thể làm mất 30-50% năng suất'
    },

    'Bệnh héo xanh cà chua (Bacterial Wilt)': {
        crop: 'Cà chua',
        keywords: ['héo xanh cà chua', 'bacterial wilt', 'ralstonia', 'ca chua wilt'],
        vietnamese_names: ['Héo xanh', 'Bacterial Wilt'],
        confidence: 0.85,
        symptoms: [
            'Cây héo xanh đột ngột',
            'Lá xanh nhưng héo như không có nước',
            'Thân yếu, rễ mềm',
            'Nếu cắt ngang thân: có nhóc xanh lơ lửng',
            'Cây chết trong 7-10 ngày'
        ],
        cause: 'Vi khuẩn Ralstonia solanacearum',
        conditions: ['Nước tưới không sạch', 'Đất bị nhiễm', 'Cây bị thương'],
        treatment: [
            'Không có cách chữa trị',
            'Cách ly cây bệnh ngay',
            'Loại bỏ cây bệnh khỏi ruộng',
            'Sử dụng nước sạch'
        ],
        prevention: [
            'Sử dụng hạt giống/cây từ vùng không bệnh',
            'Tưới nước sạch',
            'Tiệt trùng dụng cụ với ethanol 70%',
            'Không tồn tại cây chủ của vi khuẩn',
            'Giữ ruộng sạch'
        ],
        severity: 'RẤT CAO',
        risk_level: 5,
        economic_impact: 'Có thể làm mất toàn bộ vụ'
    },

    // ============ DISEASES FOR LEAFY VEGETABLES (RAU CẢI) ============
    'Bệnh phấn trắng rau cải (Powdery Mildew)': {
        crop: 'Rau cải',
        keywords: ['phấn trắng rau', 'powdery mildew', 'oidium rau', 'rau cai'],
        vietnamese_names: ['Phấn trắng', 'Mốc trắng'],
        confidence: 0.9,
        symptoms: [
            'Lớp phấn trắng xuất hiện trên lá (cả 2 mặt)',
            'Lá cong nhăn lại, vàng',
            'Cây sinh trưởng chậm',
            'Hoa và quả cũng bị nhiễm',
            'Phấn thường xuất hiện khi độ ẩm 60-90%'
        ],
        cause: 'Nấm Oidium',
        conditions: ['Độ ẩm cao 60-90%', 'Nhiệt độ 20-27°C', 'Thông gió kém'],
        treatment: [
            'Phun Sulfur 75% WP 2-3g/lít',
            'Phun Karathane 18.5% EC 1ml/lít',
            'Triazol 25% EC 1ml/lít',
            'Phun 2-3 lần, cách 7 ngày'
        ],
        prevention: [
            'Tăng thông gió',
            'Giảm độ ẩm',
            'Tránh đâm cây quá dầy',
            'Loại bỏ cây bệnh'
        ],
        severity: 'TRUNG BÌNH',
        risk_level: 3,
        economic_impact: 'Giảm 20-40% sản lượng'
    },

    'Bệnh mốc lá rau (Downy Mildew)': {
        crop: 'Rau cải',
        keywords: ['mốc lá', 'downy mildew', 'peronospora', 'rau cai'],
        vietnamese_names: ['Mốc lá', 'Downy Mildew'],
        confidence: 0.88,
        symptoms: [
            'Các đốm vàng nhạt trên mặt lá trên',
            'Mốc gai trắng/xám trên mặt lá dưới',
            'Lá chảy nước, mềm yếu',
            'Lá khô và rụng',
            'Thường xuất hiện vào mưa hay buổi tối'
        ],
        cause: 'Nấm Peronospora',
        conditions: ['Độ ẩm cao >85%', 'Đêm lạnh', 'Thông gió kém'],
        treatment: [
            'Phun Metalaxyl 8% + Mancozeb 64% WP',
            'Phun Ridomil 2.5% EC',
            'Cắt bỏ lá bệnh',
            'Phun từ sớm'
        ],
        prevention: [
            'Tránh tưới lên lá buổi tối',
            'Tăng thông gió',
            'Giảm độ ẩm trong nhà kính',
            'Sử dụng đất vô trùng'
        ],
        severity: 'CAO',
        risk_level: 4,
        economic_impact: 'Có thể làm mất 50-100% sản lượng'
    },

    // ============ HEALTHY LEAF ============
    'Lá khỏe mạnh (Healthy)': {
        crop: 'Tất cả',
        keywords: ['khỏe', 'healthy', 'good', 'normal', 'bình thường', 'tốt', 'xanh'],
        vietnamese_names: ['Lành lặn', 'Bình thường', 'Healthy'],
        confidence: 0.95,
        symptoms: [
            'Lá xanh tươi đều',
            'Không có đốm, vệ, hay nấm',
            'Bề mặt lá bóng mịn',
            'Cây phát triển bình thường',
            'Hạu phát triển như bình thường'
        ],
        cause: 'Cây khỏe mạnh',
        conditions: ['Dinh dưỡng đủ', 'Thời tiết thuận lợi', 'Chăm sóc tốt'],
        treatment: [
            'Tiếp tục chăm sóc bình thường'
        ],
        prevention: [
            'Duy trì tình trạng hiện tại',
            'Kiểm tra định kỳ',
            'Bón phân đủ lượng',
            'Tưới nước thích hợp'
        ],
        severity: 'KHÔNG',
        risk_level: 0,
        economic_impact: 'Không có tác động âm tính'
    },

    // ============ DISEASES FOR DURIAN (SẦU RIÊNG) ============
    'Bệnh thối quả sầu riêng (Fruit Rot)': {
        crop: 'Sầu riêng',
        keywords: ['thối quả', 'fruit rot', 'sầu riêng', 'durian rot'],
        vietnamese_names: ['Thối quả', 'Sầu riêng thối'],
        confidence: 0.85,
        symptoms: ['Quả bị mềm, chảy nước', 'Mùi lạ hôi thúi', 'Nấm phát triển trên bề mặt', 'Quả khô cháy'],
        cause: 'Nấm Phytophthora, Fusarium, Botryodiplodia',
        conditions: ['Độ ẩm cao', 'Thời tiết mưa dài', 'Cây yếu'],
        treatment: ['Phun fungicide từ sớm', 'Cắt bỏ quả bệnh'],
        prevention: ['Tránh tưới lên quả', 'Hạn chế độ ẩm', 'Thu dọn lá rơi'],
        severity: 'CAO',
        risk_level: 4,
        economic_impact: 'Mất 30-50% sản lượng quả'
    },

    'Bệnh lá cháy sầu riêng (Leaf Burn)': {
        crop: 'Sầu riêng',
        keywords: ['lá cháy', 'leaf burn', 'cháy lá sầu riêng'],
        vietnamese_names: ['Lá cháy', 'Cháy lá'],
        confidence: 0.82,
        symptoms: ['Lá bị cháy từ mép vào', 'Màu nâu đỏ', 'Lá khô rụng'],
        cause: 'Khô hạn, thiếu nước, gió khô',
        conditions: ['Thời tiết khô nóng', 'Tưới nước không đủ'],
        treatment: ['Tăng tưới nước', 'Che nắng khi cần'],
        prevention: ['Tưới nước đều đặn', 'Phủ dâu lá phân hữu cơ'],
        severity: 'TRUNG BÌNH',
        risk_level: 2,
        economic_impact: 'Giảm 10-20% năng suất'
    },

    // ============ MORE COFFEE DISEASES (CÀ PHÊ) ============
    'Bệnh rôi lá cà phê (Leaf Rust)': {
        crop: 'Cà phê',
        keywords: ['rôi lá', 'leaf rust', 'rêu lá', 'cà phê'],
        vietnamese_names: ['Rôi lá', 'Bệnh rêu cà phê'],
        confidence: 0.88,
        symptoms: ['Vệ màu nâu đỏ trên mặt dưới lá', 'Lá vàng từ từ', 'Có bột nâu dưới lá'],
        cause: 'Nấm Hemileia vastatrix',
        conditions: ['Độ ẩm cao 90%+', 'Nhiệt độ 20-24°C', 'Cây trồng dày đặc'],
        treatment: ['Phun Sulfur 80% WP', 'Phun Myclobutanil', 'Cắt bỏ lá bệnh'],
        prevention: ['Tỉa cây thưa để thông gió', 'Tránh tưới lên lá', 'Thu dọn lá bệnh'],
        severity: 'RẤT CAO',
        risk_level: 5,
        economic_impact: 'Có thể mất 50-90% sản lượng'
    },

    'Bệnh nấm than cà phê (Anthracnose)': {
        crop: 'Cà phê',
        keywords: ['nấm than', 'anthracnose', 'cốm đen', 'cà phê'],
        vietnamese_names: ['Nấm than', 'Cốm đen cà phê'],
        confidence: 0.84,
        symptoms: ['Cốm bệnh trên trái non', 'Vết đen trên cành', 'Cốm rụng sớm'],
        cause: 'Nấm Colletotrichum',
        conditions: ['Mưa nhiều', 'Độ ẩm cao'],
        treatment: ['Phun Mancozeb 80% WP', 'Carbendazim 50% WP'],
        prevention: ['Cắt cành bệnh', 'Vệ sinh vườn ươm tốt'],
        severity: 'TRUNG BÌNH',
        risk_level: 3,
        economic_impact: 'Giảm 20-30% năng suất'
    },

    'Bệnh tàn lìm rau cải (Clubroot)': {
        crop: 'Rau cải',
        keywords: ['tàn lìm', 'clubroot', 'rau cải'],
        vietnamese_names: ['Tàn lìm', 'Bệnh polymorpha'],
        confidence: 0.82,
        symptoms: ['Rễ sưng phồng như câu cá', 'Rau héo giữa ngày', 'Rễ bị thối'],
        cause: 'Oomycete Plasmodiophora brassicae',
        conditions: ['Đất pH thấp <6', 'Đất ẩm bị nhiễm'],
        treatment: ['Cải tạo đất, nâng pH', 'Dùng phân bón Huyết cốt'],
        prevention: ['Cải tạo đất trước trồng', 'Luân canh 3-4 năm', 'Tránh cây họ cải liên tiếp'],
        severity: 'CAO',
        risk_level: 4,
        economic_impact: 'Giảm 30-60% sản lượng'
    },

    'Bệnh thối nham thừa (Black Rot of Cassava)': {
        crop: 'Khoai mì',
        keywords: ['thối nham', 'black rot', 'cassava', 'khoai mì'],
        vietnamese_names: ['Thối nham', 'Bệnh thối đen'],
        confidence: 0.84,
        symptoms: ['Vết thối đen trên sắn', 'Cắt ngang sắn có màu xám', 'Sắn bị khô cháy'],
        cause: 'Nấm Lasiodiplodia, Botryodiplodia',
        conditions: ['Độ ẩm cao khi bảo quản', 'Vết thương trên sắn'],
        treatment: ['Khô sắn tốt trước bảo quản', 'Kiểm soát độ ẩm'],
        prevention: ['Cắt sắn sạch', 'Bảo quản ở nơi khô mát'],
        severity: 'TRUNG BÌNH',
        risk_level: 3,
        economic_impact: 'Mất 15-25% trong bảo quản'
    },

    'Bệnh lá vàng rau muống (Leaf Yellowing)': {
        crop: 'Rau cải',
        keywords: ['lá vàng', 'yellowing', 'rau muống', 'lá non'],
        vietnamese_names: ['Lá vàng', 'Thiếu chất dinh dưỡng'],
        confidence: 0.78,
        symptoms: ['Lá non vàng', 'Gân lá vẫn xanh', 'Rau kém phát triển'],
        cause: 'Thiếu Nitrogen, Magnesium, hoặc Sắt',
        conditions: ['Đất xấu', 'Bón phân không đủ'],
        treatment: ['Bón nhanh Nitrogen', 'Phun urea 2% nhanh'],
        prevention: ['Bón phân NPK cân đối', 'Bón phân hữu cơ'],
        severity: 'THẤP',
        risk_level: 2,
        economic_impact: 'Giảm 10-20% sản lượng'
    },

    'Bệnh xoắn lá cà chua (Leaf Curl)': {
        crop: 'Cà chua',
        keywords: ['xoắn lá', 'leaf curl', 'cà chua', 'virus xoắn'],
        vietnamese_names: ['Xoắn lá', 'Virus xoắn lá cà chua'],
        confidence: 0.80,
        symptoms: ['Lá cuộn xoắn', 'Lá bị co rút', 'Cây lùn hơn bình thường'],
        cause: 'Virus TYLCV hoặc whitefly gây',
        conditions: ['Rầy trắng nhiều', 'Thời tiết nóng'],
        treatment: ['Phun thuốc trừ rầy', 'Loại bỏ cây bệnh'],
        prevention: ['Kiểm soát rầy trắng', 'Trồng rào bảo vệ'],
        severity: 'CAO',
        risk_level: 4,
        economic_impact: 'Mất 30-50% sản lượng'
    },

    'Bệnh héo héo khoai lang (Wilting)': {
        crop: 'Khoai lang',
        keywords: ['héo', 'wilting', 'khoai lang', 'héo héo'],
        vietnamese_names: ['Héo', 'Héo héo khoai lang'],
        confidence: 0.81,
        symptoms: ['Cây héo thỏ', 'Lá xanh nhưng héo', 'Cây chết từ từ'],
        cause: 'Vi khuẩn hoặc nấm gây héo',
        conditions: ['Đất bị nhiễm', 'Nước tưới kém'],
        treatment: ['Cắt bỏ cây bệnh', 'Tắm rễ Trichoderma'],
        prevention: ['Dùng giống kháng bệnh', 'Tiêu hủy cây bệnh', 'Luân canh'],
        severity: 'CAO',
        risk_level: 4,
        economic_impact: 'Mất 20-40% sản lượng'
    },

    'Bệnh bọ khoảng lúa (Rice Hispa)': {
        crop: 'Lúa',
        keywords: ['bọ khoảng', 'rice hispa', 'lúa', 'dicladispa'],
        vietnamese_names: ['Bọ khoảng', 'Bệnh bọ khoảng'],
        confidence: 0.80,
        symptoms: ['Lá bị cọt nước', 'Lá có vệ dài trắng', 'Lá bị khô cháy'],
        cause: 'Bọ Dicladispa armigera',
        conditions: ['Mùa mưa', 'Lúa 4-7 tuần tuổi'],
        treatment: ['Phun Permethrin 3% EC', 'Phun Carbofuran 5% GR'],
        prevention: ['Kiểm soát bọ từ sớm', 'Thu dọn cỏ dại'],
        severity: 'TRUNG BÌNH',
        risk_level: 3,
        economic_impact: 'Giảm 10-20% năng suất'
    },

    'Bệnh dịch bệnh lúa (Bacterial Leaf Blight)': {
        crop: 'Lúa',
        keywords: ['dịch bệnh', 'bacterial leaf blight', 'xanthomonas', 'lúa'],
        vietnamese_names: ['Dịch bệnh', 'Bệnh Xanthomonas'],
        confidence: 0.86,
        symptoms: ['Lá bị khô cháy từ mép', 'Lá vàng nhạt dần', 'Lá rơi sớm'],
        cause: 'Vi khuẩn Xanthomonas oryzae',
        conditions: ['Độ ẩm cao', 'Nước tưới không sạch'],
        treatment: ['Phun Streptomycin 500 ppm', 'Phun Kasugamycin'],
        prevention: ['Sử dụng giống kháng bệnh', 'Nước tưới sạch', 'Cách ly vùng bệnh'],
        severity: 'RẤT CAO',
        risk_level: 5,
        economic_impact: 'Mất 20-50% sản lượng'
    },

    'Bệnh còi xanh lúa (Green Leafhopper)': {
        crop: 'Lúa',
        keywords: ['còi xanh', 'green leafhopper', 'lúa', 'virus'],
        vietnamese_names: ['Bệnh còi xanh', 'Lùn xanh lúa'],
        confidence: 0.82,
        symptoms: ['Lá nhỏ, xanh hoạc vàng', 'Cây lùn hơn', 'Hạt không đủ'],
        cause: 'Virus lây truyền bởi rầy xanh nhỏ',
        conditions: ['Mật độ rầy cao', 'Thời tiết ấm'],
        treatment: ['Phun thuốc trừ rầy từ sớm', 'Loại bỏ cây bệnh'],
        prevention: ['Kiểm soát rầy xanh', 'Cây bẫy xung quanh'],
        severity: 'CAO',
        risk_level: 4,
        economic_impact: 'Giảm 15-40% năng suất'
    },

    'Bệnh dứa cà chua (Pineapple Disease)': {
        crop: 'Cà chua',
        keywords: ['bệnh dứa', 'pineapple', 'cà chua', 'bệnh sâu'],
        vietnamese_names: ['Bệnh dứa cà chua', 'Bệnh Eggplant'],
        confidence: 0.75,
        symptoms: ['Quả có vết lõm', 'Vết khô nâu', 'Quả không phát triển'],
        cause: 'Côn trùng hoặc nấm gây',
        conditions: ['Côn trùng nhiều', 'Thời tiết ẩm'],
        treatment: ['Phun insecticide', 'Cắt bỏ quả bệnh'],
        prevention: ['Trừ côn trùng từ sớm', 'Vệ sinh vườn tốt'],
        severity: 'TRUNG BÌNH',
        risk_level: 2,
        economic_impact: 'Giảm 10-15% sản lượng'
    },

    'Bệnh cháy lá khoai mì (Leaf Scorch)': {
        crop: 'Khoai mì',
        keywords: ['cháy lá', 'leaf scorch', 'khoai mì', 'sắn'],
        vietnamese_names: ['Cháy lá khoai mì', 'Lá cháy'],
        confidence: 0.79,
        symptoms: ['Lá bị cháy màu nâu đỏ', 'Lá rơi sớm', 'Cây yếu'],
        cause: 'Khô hạn, thiếu nước, gió khô',
        conditions: ['Thời tiết khô nóng', 'Tưới nước không đủ'],
        treatment: ['Tăng tưới nước', 'Phủ mulch'],
        prevention: ['Tưới nước đều', 'Che nắng nếu cần'],
        severity: 'THẤP',
        risk_level: 2,
        economic_impact: 'Giảm 5-10% sản lượng'
    },

    // ============ PLUM DISEASES (MẬN) ============
    'Bệnh than đen trên mận (Anthracnose)': {
        crop: 'Mận',
        keywords: ['than đen', 'anthracnose', 'colletotrichum', 'mận', 'black spot'],
        vietnamese_names: ['Cháy quả', 'Lún quả', 'Bệnh than đen'],
        confidence: 0.87,
        symptoms: [
            'Các đốm tròn đen trên quả',
            'Lún sâu ở giữa đốm, có thể có nhân buồn',
            'Lá có đốm nâu với viền đỏ',
            'Quả sẽ rơi sớm hoặc héo lẻo'
        ],
        cause: 'Nấm Colletotrichum gloeosporioides',
        conditions: ['Độ ẩm cao', 'Mưa lớn', 'Nhiệt độ 25-28°C'],
        treatment: [
            'Phun Carbendazim 1g/lít, 10-14 ngày/lần',
            'Phun Mancozeb 80% WP 3g/lít',
            'Loại bỏ quả bệnh, lá bệnh ngay'
        ],
        prevention: [
            'Tỉa cành thường xuyên để thoáng gió',
            'Tránh tưới lên quả',
            'Nâng cao gốc để tránh ngập nước',
            'Tiêu hủy lá rụng bị bệnh'
        ],
        severity: 'CAO',
        risk_level: 4,
        economic_impact: 'Giảm 40-60% chất lượng quả'
    },

    'Bệnh phấn trắng trên mận (Powdery Mildew)': {
        crop: 'Mận',
        keywords: ['phấn trắng', 'powdery mildew', 'mận', 'mốc trắng'],
        vietnamese_names: ['Phấn trắng lá', 'Mốc trắng'],
        confidence: 0.85,
        symptoms: [
            'Lớp phấn trắng trên lá, thường cả hai mặt',
            'Lá cong nhăn, phát triển chậm',
            'Quả nhỏ hơn bình thường, vỏ xấu',
            'Cành non bị bao phủ phấn trắng'
        ],
        cause: 'Nấm Podosphaera',
        conditions: ['Độ ẩm 60-80%', 'Buổi tối lạnh, ngày nóng', 'Bón nitơ quá nhiều'],
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
        severity: 'TRUNG BÌNH',
        risk_level: 3,
        economic_impact: 'Giảm 20-30% năng suất'
    },

    // ============ PEACH DISEASES (ĐÀO) ============
    'Bệnh cháy lá đào (Leaf Curl)': {
        crop: 'Đào',
        keywords: ['cháy lá', 'leaf curl', 'taphrina', 'đào'],
        vietnamese_names: ['Lá cong', 'Cháy lá'],
        confidence: 0.86,
        symptoms: [
            'Lá cong, nhăn, dù già',
            'Màu lá hỗn loạn (đỏ, vàng, xanh)',
            'Lá sẽ rụng sớm',
            'Cây sẽ yếu đi, năng suất giảm'
        ],
        cause: 'Nấm Taphrina deformans',
        conditions: ['Tác động lạnh mùa xuân', 'Độ ẩm cao'],
        treatment: [
            'Phun Carbendazim trước khi lá nở (quỹ đạo mầm)',
            'Phun Hexaconazole',
            'Cắt bỏ cành bệnh nặng'
        ],
        prevention: [
            'Phun thuốc vào mùa đông (Bordeaux mixture 1%) trước khi lá nở',
            'Tỉa cành để thoáng gió',
            'Chọn vị trí trồng ấm áp'
        ],
        severity: 'CAO',
        risk_level: 4,
        economic_impact: 'Giảm 30-40% năng suất'
    },

    // ============ GUAVA DISEASES (ỔI) ============
    'Bệnh ghẻ trên ổi (Scab)': {
        crop: 'Ổi',
        keywords: ['ghẻ', 'scab', 'asperisporium', 'ổi'],
        vietnamese_names: ['Lỏi ổi', 'Bệnh ghẻ'],
        confidence: 0.84,
        symptoms: [
            'Các vết ghẻ xám trên quả',
            'Lá có đốm lỏi xám',
            'Quả bị dị hình, không bán được',
            'Lá và quả cùng lúc bị bệnh'
        ],
        cause: 'Nấm Asperisporium guavas',
        conditions: ['Độ ẩm cao', 'Nhiệt độ 23-28°C', 'Mưa liên tục'],
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
        severity: 'CAO',
        risk_level: 4,
        economic_impact: 'Giảm 50-70% chất lượng quả'
    },

    // ============ POMEGRANATE DISEASES (LỰU) ============
    'Bệnh sương muối trên lựu (Sooty Blotch)': {
        crop: 'Lựu',
        keywords: ['sương muối', 'sooty blotch', 'alternaria', 'lựu'],
        vietnamese_names: ['Tấy đen', 'Sương muối'],
        confidence: 0.83,
        symptoms: [
            'Đốm đen mờ trên quả',
            'Quả giống như bước đi qua tro',
            'Lá cũng có đốm đen mờ',
            'Không ảnh hưởng đến vị nhưng ảnh hưởng thẩm mỹ'
        ],
        cause: 'Nấm Alternaria',
        conditions: ['Độ ẩm cao', 'Nhiệt độ 25-30°C'],
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
        severity: 'TRUNG BÌNH',
        risk_level: 3,
        economic_impact: 'Giảm 20-30% giá trị thương phẩm'
    },

    // ============ APPLE DISEASES (TÁO) ============
    'Bệnh scab trên táo (Apple Scab)': {
        crop: 'Táo',
        keywords: ['scab', 'venturia', 'apple scab', 'lỏi táo', 'táo'],
        vietnamese_names: ['Lỏi táo', 'Bệnh scab'],
        confidence: 0.88,
        symptoms: [
            'Lá có các vệ xám nâu',
            'Quả bị lỏi, bề mặt dàng dề',
            'Quả bị nứt ra, không bán được',
            'Lá sẽ vàng rồi rụng sớm'
        ],
        cause: 'Nấm Venturia inaequalis',
        conditions: ['Độ ẩm 90%', 'Nhiệt độ 7-24°C', 'Mưa xuân'],
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
        severity: 'CAO',
        risk_level: 4,
        economic_impact: 'Giảm 40-60% chất lượng quả'
    },

    // ============ COCONUT DISEASES (DỪA) ============
    'Bệnh lá vàng trên dừa (Coconut Leaf Scorch)': {
        crop: 'Dừa',
        keywords: ['lá vàng', 'leaf scorch', 'dừa', 'phomopsis'],
        vietnamese_names: ['Lá vàng dừa', 'Héo lá'],
        confidence: 0.8,
        symptoms: [
            'Lá ngắn nhất trên đỉnh vàng trước',
            'Dần dần các lá khác cũng vàng',
            'Lá héo, cây không sinh trưởng',
            'Có thể dẫn đến chết cây trong 2-3 năm'
        ],
        cause: 'Vi khuẩn hoặc nấm Phomopsis, tác động stress nước',
        conditions: ['Khô hạn', 'Thiếu nước', 'Tưới nước không đủ'],
        treatment: [
            'Tưới nước đúng lúc, đủ lượng',
            'Phun Carbendazim định kỳ',
            'Cắt lá bệnh để giảm bớt gánh nặng'
        ],
        prevention: [
            'Tưới nước đủ lượng, đều đặn',
            'Bón phân cân bằng N-P-K',
            'Cải thiện thoáng gió',
            'Trồng cây che nắng'
        ],
        severity: 'RẤT CAO',
        risk_level: 5,
        economic_impact: 'Có thể làm cây chết nếu không xử lý kịp'
    }
};

// Get all crops
export const getAllCrops = () => {
    const crops = new Set<string>();
    for (const disease of Object.values(VIETNAMESE_DISEASE_DB)) {
        crops.add(disease.crop);
    }
    return Array.from(crops);
};

// Get diseases by crop
export const getDiseasesByCrop = (crop: string) => {
    return Object.entries(VIETNAMESE_DISEASE_DB)
        .filter(([_, info]) => info.crop === crop)
        .map(([name]) => name);
};

// Get disease info
export const getDiseaseInfo = (diseaseName: string) => {
    return VIETNAMESE_DISEASE_DB[diseaseName as keyof typeof VIETNAMESE_DISEASE_DB];
};

// Search diseases
export const searchDiseases = (keyword: string): string[] => {
    const results: string[] = [];
    const searchTerm = keyword.toLowerCase();

    for (const [name, info] of Object.entries(VIETNAMESE_DISEASE_DB)) {
        for (const kw of info.keywords) {
            if (kw.toLowerCase().includes(searchTerm) || searchTerm.includes(kw.toLowerCase())) {
                results.push(name);
                break;
            }
        }
    }

    return results;
};

export default VIETNAMESE_DISEASE_DB;
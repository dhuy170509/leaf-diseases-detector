import React from 'react';

export const Footer: React.FC = () => {
    return (
        <footer style={styles.footer}>
            <div style={styles.container}>
                <div style={styles.footerContent}>
                    <div style={styles.footerSection}>
                        <h4>🌿 Về Chúng Tôi</h4>
                        <p>Hệ thống phân tích bệnh lá cây bằng AI, được phát triển đặc biệt cho nông dân Việt Nam nhằm giúp cải thiện năng suất và chất lượng cây trồng.</p>
                    </div>

                    <div style={styles.footerSection}>
                        <h4>🔗 Liên Kết Nhanh</h4>
                        <ul style={styles.linkList}>
                            <li><a href="#home" style={styles.link}>Trang Chủ</a></li>
                            <li><a href="#upload" style={styles.link}>Phân Tích Ảnh</a></li>
                            <li><a href="#dashboard" style={styles.link}>Lịch Sử</a></li>
                        </ul>
                    </div>

                    <div style={styles.footerSection}>
                        <h4>📞 Hỗ Trợ</h4>
                        <ul style={styles.linkList}>
                            <li><a href="mailto:support@agrodiseaseai.com" style={styles.link}>📧 Email</a></li>
                            <li><span style={styles.link}>📱 Hotline: 1900XXXX</span></li>
                            <li><span style={styles.link}>💬 Chat AI</span></li>
                        </ul>
                    </div>
                </div>

                <div style={styles.footerBottom}>
                    <p>&copy; 2025 AgroDiseaseAI - Phân tích bệnh lá cây cho nông dân Việt Nam</p>
                </div>
            </div>
        </footer>
    );
};

const styles = {
    footer: {
        background: 'white',
        padding: '40px 20px',
        marginTop: '80px',
        borderTop: '2px solid #e5e7eb'
    },
    container: {
        maxWidth: '1400px',
        margin: '0 auto'
    },
    footerContent: {
        display: 'grid' as const,
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '40px',
        marginBottom: '40px'
    },
    footerSection: {
        textAlign: 'left' as const
    },
    linkList: {
        listStyle: 'none' as const,
        padding: 0
    },
    link: {
        color: '#6b7280',
        textDecoration: 'none',
        display: 'block',
        marginBottom: '8px',
        transition: 'color 0.3s ease',
        cursor: 'pointer'
    },
    footerBottom: {
        color: '#6b7280',
        paddingTop: '20px',
        borderTop: '1px solid #e5e7eb',
        textAlign: 'center' as const
    }
};

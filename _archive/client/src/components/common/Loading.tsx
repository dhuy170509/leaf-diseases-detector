import React from 'react';

interface LoadingProps {
    message?: string;
}

export const Loading: React.FC<LoadingProps> = ({ message = 'Đang tải...' }) => {
    return (
        <div style={styles.container}>
            <div style={styles.spinner} />
            <p style={styles.text}>{message}</p>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        minHeight: '400px'
    },
    spinner: {
        border: '4px solid #e5e7eb',
        borderTop: '4px solid #059669',
        borderRadius: '50%',
        width: '50px',
        height: '50px',
        animation: 'spin 1s linear infinite'
    },
    text: {
        marginTop: '20px',
        fontSize: '1.1em',
        color: '#6b7280'
    }
};

// Add animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

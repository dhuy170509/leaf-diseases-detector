import React from 'react';

interface ErrorMessageProps {
    message: string;
    onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
    return (
        <div style={styles.container}>
            <div style={styles.icon}>⚠️</div>
            <h2 style={styles.title}>Đã Xảy Ra Lỗi</h2>
            <p style={styles.message}>{message}</p>
            {onRetry && (
                <button style={styles.button} onClick={onRetry}>
                    Thử Lại
                </button>
            )}
        </div>
    );
};

const styles = {
    container: {
        background: '#fef2f2',
        border: '2px solid #fca5a5',
        borderRadius: '15px',
        padding: '30px',
        textAlign: 'center' as const,
        margin: '20px 0'
    },
    icon: {
        fontSize: '3em',
        marginBottom: '15px'
    },
    title: {
        color: '#dc2626',
        fontSize: '1.5em',
        marginBottom: '10px'
    },
    message: {
        color: '#991b1b',
        marginBottom: '20px',
        lineHeight: '1.6'
    },
    button: {
        background: '#dc2626',
        color: 'white',
        border: 'none',
        padding: '12px 30px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '1em',
        fontWeight: 'bold',
        transition: 'background 0.3s ease'
    }
};

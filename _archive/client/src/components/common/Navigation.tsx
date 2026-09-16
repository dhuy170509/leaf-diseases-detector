import React, { useState } from 'react';

interface NavigationProps {
    currentPage: 'home' | 'upload' | 'results' | 'dashboard';
    onNavigate: (page: 'home' | 'upload' | 'results' | 'dashboard') => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentPage, onNavigate }) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <nav style={styles.nav}>
            <div style={styles.navContainer}>
                <div style={styles.logo} onClick={() => onNavigate('home')}>
                    🌿 AgroDiseaseAI
                </div>

                <div style={{ ...styles.navLinks, display: mobileMenuOpen ? 'flex' : 'none' }}>
                    <NavLink
                        label="Trang Chủ"
                        active={currentPage === 'home'}
                        onClick={() => {
                            onNavigate('home');
                            setMobileMenuOpen(false);
                        }}
                    />
                    <NavLink
                        label="Phân Tích"
                        active={currentPage === 'upload'}
                        onClick={() => {
                            onNavigate('upload');
                            setMobileMenuOpen(false);
                        }}
                    />
                    <NavLink
                        label="Lịch Sử"
                        active={currentPage === 'dashboard'}
                        onClick={() => {
                            onNavigate('dashboard');
                            setMobileMenuOpen(false);
                        }}
                    />
                </div>

                <button
                    style={styles.mobileMenuBtn}
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    ☰
                </button>
            </div>
        </nav>
    );
};

interface NavLinkProps {
    label: string;
    active: boolean;
    onClick: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        style={{
            ...styles.navLink,
            borderBottom: active ? '3px solid #059669' : 'none',
            color: active ? '#059669' : '#1f2937'
        }}
    >
        {label}
    </button>
);

const styles = {
    nav: {
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        padding: '15px 0',
        marginBottom: '40px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        position: 'sticky' as const,
        top: 0,
        zIndex: 100
    },
    navContainer: {
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    logo: {
        fontSize: '1.5em',
        fontWeight: 'bold',
        background: 'linear-gradient(135deg, #10b981, #059669)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        cursor: 'pointer',
        transition: 'opacity 0.3s ease'
    },
    navLinks: {
        display: 'flex',
        gap: '25px',
        listStyle: 'none' as const,
        flexDirection: 'row' as const
    },
    navLink: {
        background: 'none',
        border: 'none',
        textDecoration: 'none',
        color: '#1f2937',
        fontWeight: 500,
        cursor: 'pointer',
        padding: '10px 0',
        transition: 'all 0.3s ease',
        fontSize: '1em'
    },
    mobileMenuBtn: {
        background: 'none',
        border: 'none',
        fontSize: '1.5em',
        cursor: 'pointer',
        display: 'none'
    }
};

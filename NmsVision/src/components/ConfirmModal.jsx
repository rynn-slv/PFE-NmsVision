import React from 'react';
import { TriangleAlert, X, Trash2 } from 'lucide-react';

const ConfirmModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = "Confirm Action", 
    message = "Are you sure you want to proceed?", 
    confirmText = "Confirm", 
    cancelText = "Cancel",
    type = "danger" // danger, warning, info
}) => {
    if (!isOpen) return null;

    const getColorScheme = () => {
        switch (type) {
            case 'danger':
                return {
                    icon: <Trash2 size={32} strokeWidth={2.5} />,
                    bgColor: 'rgba(239, 68, 68, 0.1)',
                    textColor: '#ef4444',
                    btnGradient: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                    shadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
                };
            case 'warning':
                return {
                    icon: <TriangleAlert size={32} strokeWidth={2.5} />,
                    bgColor: 'rgba(245, 158, 11, 0.1)',
                    textColor: '#f59e0b',
                    btnGradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    shadow: '0 4px 15px rgba(245, 158, 11, 0.3)'
                };
            default:
                return {
                    icon: <TriangleAlert size={32} strokeWidth={2.5} />,
                    bgColor: 'rgba(56, 189, 248, 0.1)',
                    textColor: '#38bdf8',
                    btnGradient: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
                    shadow: '0 4px 15px rgba(56, 189, 248, 0.3)'
                };
        }
    };

    const scheme = getColorScheme();

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.3s ease-out'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '450px',
                background: 'rgba(17, 24, 39, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '24px',
                padding: '2rem',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(56, 189, 248, 0.05)',
                position: 'relative',
                animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '1.25rem',
                        right: '1.25rem',
                        background: 'transparent',
                        border: 'none',
                        color: 'rgba(255, 255, 255, 0.4)',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '8px',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'white'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)'}
                >
                    <X size={20} />
                </button>

                {/* Content */}
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '20px',
                        background: scheme.bgColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        color: scheme.textColor
                    }}>
                        {scheme.icon}
                    </div>

                    <h2 style={{
                        fontSize: '1.5rem',
                        fontWeight: '800',
                        color: 'white',
                        marginBottom: '0.75rem',
                        letterSpacing: '-0.02em'
                    }}>
                        {title}
                    </h2>
                    
                    <p style={{
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontSize: '0.95rem',
                        lineHeight: '1.6',
                        marginBottom: '2rem'
                    }}>
                        {message}
                    </p>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={onClose}
                            style={{
                                flex: 1,
                                padding: '0.8rem',
                                borderRadius: '12px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                background: 'rgba(255, 255, 255, 0.05)',
                                color: 'white',
                                fontSize: '0.95rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            style={{
                                flex: 1,
                                padding: '0.8rem',
                                borderRadius: '12px',
                                border: 'none',
                                background: scheme.btnGradient,
                                color: 'white',
                                fontSize: '0.95rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                boxShadow: scheme.shadow,
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.filter = 'brightness(1.1)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.filter = 'brightness(1)';
                            }}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
};

export default ConfirmModal;

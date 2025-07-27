import React, { useEffect, useState } from 'react';
import { Icon } from '@vaadin/react-components';
import type { Toast } from '../../hooks/useToast';
import './ToastComponent.css';

interface ToastItemProps {
    toast: Toast;
    onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    useEffect(() => {
        // Trigger enter animation
        const timer = setTimeout(() => setIsVisible(true), 10);
        return () => clearTimeout(timer);
    }, []);

    const handleRemove = () => {
        setIsLeaving(true);
        setTimeout(() => onRemove(toast.id), 300); // Wait for exit animation
    };

    const getIcon = () => {
        switch (toast.type) {
            case 'success':
                return 'vaadin:check-circle';
            case 'error':
                return 'vaadin:exclamation-circle';
            case 'warning':
                return 'vaadin:warning';
            case 'info':
                return 'vaadin:info-circle';
            default:
                return 'vaadin:info-circle';
        }
    };

    return (
        <div
            className={`toast-item toast-${toast.type} ${isVisible ? 'toast-visible' : ''} ${isLeaving ? 'toast-leaving' : ''}`}
            role="alert"
            aria-live="polite"
        >
            <div className="toast-content">
                <Icon icon={getIcon()} className="toast-icon" />
                <span className="toast-message">{toast.message}</span>
            </div>
            <button
                className="toast-close"
                onClick={handleRemove}
                aria-label="Close notification"
            >
                <Icon icon="vaadin:close-small" />
            </button>
        </div>
    );
};

interface ToastContainerProps {
    toasts: Toast[];
    onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
    if (toasts.length === 0) return null;

    return (
        <div className="toast-container">
            {toasts.map(toast => (
                <ToastItem
                    key={toast.id}
                    toast={toast}
                    onRemove={onRemove}
                />
            ))}
        </div>
    );
};
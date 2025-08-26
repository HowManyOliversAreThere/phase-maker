import React, { useState } from 'react';
import { CheckCircle, X } from 'lucide-react';

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error';
}

interface ToastContextType {
    showToast: (message: string, type?: 'success' | 'error') => void;
}

const ToastContext = React.createContext<ToastContextType>({
    showToast: () => { },
});

export const useToast = () => {
    const context = React.useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

interface ToastProviderProps {
    children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast: Toast = { id, message, type };

        setToasts(prev => [...prev, newToast]);

        // Auto-remove toast after 3 seconds
        setTimeout(() => {
            removeToast(id);
        }, 3000);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`
              flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg
              animate-in slide-in-from-right-full duration-300
              ${toast.type === 'success'
                                ? 'bg-emerald-500 text-white'
                                : 'bg-red-500 text-white'
                            }
              max-w-sm min-w-64
            `}
                    >
                        {toast.type === 'success' && <CheckCircle className="h-4 w-4" />}
                        <span className="flex-1 text-sm font-medium">{toast.message}</span>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="hover:bg-black/10 rounded p-1"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

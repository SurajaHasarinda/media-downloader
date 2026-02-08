import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type SnackbarType = 'success' | 'error' | 'warning' | 'info';

interface SnackbarProps {
    isOpen: boolean;
    message: string;
    type: SnackbarType;
    onClose: () => void;
    duration?: number;
}

const iconMap = {
    success: <CheckCircle size={20} />,
    error: <XCircle size={20} />,
    warning: <AlertTriangle size={20} />,
    info: <Info size={20} />,
};

const styleMap = {
    success: 'bg-emerald-900/90 border-emerald-500/50 text-emerald-100',
    error: 'bg-red-900/90 border-red-500/50 text-red-100',
    warning: 'bg-amber-900/90 border-amber-500/50 text-amber-100',
    info: 'bg-blue-900/90 border-blue-500/50 text-blue-100',
};

const iconStyleMap = {
    success: 'text-emerald-400',
    error: 'text-red-400',
    warning: 'text-amber-400',
    info: 'text-blue-400',
};

const Snackbar = ({ isOpen, message, type, onClose, duration = 4000 }: SnackbarProps) => {
    useEffect(() => {
        if (isOpen && duration > 0) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [isOpen, duration, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
            <div className={`flex items-center gap-3 px-5 py-4 rounded-xl border backdrop-blur-sm shadow-2xl ${styleMap[type]}`}>
                <span className={iconStyleMap[type]}>{iconMap[type]}</span>
                <p className="font-medium text-sm">{message}</p>
                <button
                    onClick={onClose}
                    className="ml-2 p-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                    <X size={16} />
                </button>
            </div>
            {/* Progress bar */}
            <div className="mt-1 h-1 rounded-full overflow-hidden bg-white/10">
                <div
                    className={`h-full ${type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-red-500' : type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`}
                    style={{
                        animation: `shrink ${duration}ms linear forwards`
                    }}
                />
            </div>
        </div>
    );
};

export default Snackbar;

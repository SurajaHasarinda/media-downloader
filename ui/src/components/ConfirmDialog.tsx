import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'default';
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmDialog = ({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'default',
    onConfirm,
    onCancel,
}: ConfirmDialogProps) => {
    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            icon: <Trash2 size={24} />,
            iconBg: 'bg-red-500/20 text-red-400',
            button: 'bg-red-600 hover:bg-red-700 text-white',
        },
        warning: {
            icon: <AlertTriangle size={24} />,
            iconBg: 'bg-amber-500/20 text-amber-400',
            button: 'bg-amber-600 hover:bg-amber-700 text-white',
        },
        default: {
            icon: <AlertTriangle size={24} />,
            iconBg: 'bg-violet-500/20 text-violet-400',
            button: 'bg-violet-600 hover:bg-violet-700 text-white',
        },
    };

    const styles = variantStyles[variant];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => {
                e.stopPropagation();
                onCancel();
            }}
        >
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Dialog */}
            <div
                className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in z-10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onCancel();
                    }}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <X size={18} />
                </button>

                <div className="p-6">
                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${styles.iconBg}`}>
                        {styles.icon}
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{message}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 p-4 border-t border-slate-800">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-3 text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl font-medium transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-colors ${styles.button}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;

import { useState, useEffect } from 'react';
import {
    HardDrive,
    Trash2,
    Loader2,
    RefreshCw,
    Folder
} from 'lucide-react';
import { api, FolderItem } from '../api';
import Snackbar, { SnackbarType } from '../components/Snackbar';
import ConfirmDialog from '../components/ConfirmDialog';

const StoragePage = () => {
    const [folders, setFolders] = useState<FolderItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingName, setDeletingName] = useState<string | null>(null);

    const [snackbar, setSnackbar] = useState<{ isOpen: boolean; message: string; type: SnackbarType }>({
        isOpen: false,
        message: '',
        type: 'success',
    });

    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        name: string;
    }>({
        isOpen: false,
        name: '',
    });

    const fetchFolders = async () => {
        setLoading(true);
        try {
            const data = await api.getStorageFolders();
            setFolders(data);
        } catch (error) {
            setSnackbar({ isOpen: true, message: 'Failed to load folders', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFolders();
    }, []);

    const handleDeleteClick = (name: string) => {
        setConfirmDialog({ isOpen: true, name });
    };

    const handleConfirmDelete = async () => {
        setDeletingName(confirmDialog.name);
        try {
            await api.deleteStorageFolder(confirmDialog.name);
            setSnackbar({ isOpen: true, message: 'Folder deleted', type: 'success' });
            fetchFolders();
        } catch (error) {
            setSnackbar({ isOpen: true, message: 'Failed to delete folder', type: 'error' });
        } finally {
            setDeletingName(null);
            setConfirmDialog({ isOpen: false, name: '' });
        }
    };

    const totalSize = folders.reduce((acc, f) => acc + f.size_gb, 0);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                        <HardDrive className="text-primary" size={24} />
                        Storage
                    </h1>
                    <p className="text-slate-400 mt-1 text-sm sm:text-base">
                        {folders.length} folders • {totalSize.toFixed(2)} GB
                    </p>
                </div>

                <button
                    onClick={fetchFolders}
                    disabled={loading}
                    className="self-start p-3 text-slate-400 hover:text-white bg-slate-900 border border-slate-700 rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50"
                    title="Refresh"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Folders List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={40} className="text-primary animate-spin" />
                </div>
            ) : folders.length === 0 ? (
                <div className="text-center py-16 sm:py-20 bg-slate-900/50 rounded-2xl border border-slate-800">
                    <Folder size={48} className="mx-auto text-slate-700 mb-4" />
                    <h3 className="text-lg font-medium text-slate-300">No folders found</h3>
                    <p className="text-sm text-slate-500 mt-1">Download directory is empty</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {folders.map((folder) => {
                        const isDeleting = deletingName === folder.name;

                        return (
                            <div
                                key={folder.name}
                                className={`bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-700 transition-all p-4 ${isDeleting ? 'opacity-50' : ''
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/20 text-primary flex-shrink-0">
                                        <Folder size={20} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-white truncate">{folder.name}</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">{folder.size_gb} GB</p>
                                    </div>

                                    <button
                                        onClick={() => handleDeleteClick(folder.name)}
                                        disabled={isDeleting}
                                        className="p-2.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-50 flex-shrink-0"
                                        title="Delete"
                                    >
                                        {isDeleting ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <Trash2 size={18} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title="Delete Folder"
                message={`Are you sure you want to delete "${confirmDialog.name}"? This cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmDialog({ isOpen: false, name: '' })}
            />

            {/* Snackbar */}
            <Snackbar
                isOpen={snackbar.isOpen}
                message={snackbar.message}
                type={snackbar.type}
                onClose={() => setSnackbar({ ...snackbar, isOpen: false })}
            />
        </div>
    );
};

export default StoragePage;

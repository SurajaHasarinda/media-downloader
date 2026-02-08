import { useState, useEffect } from 'react';
import {
    Download,
    Pause,
    Play,
    Trash2,
    RefreshCw,
    Loader2,
    WifiOff,
    HardDrive,
    Clock,
    ArrowDown,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import { api, Download as DownloadType } from '../api';
import Snackbar, { SnackbarType } from '../components/Snackbar';
import ConfirmDialog from '../components/ConfirmDialog';

const formatSpeed = (bytesPerSec: number): string => {
    if (bytesPerSec === 0) return '0 B/s';
    const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(bytesPerSec) / Math.log(1024));
    return `${(bytesPerSec / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
};

const formatEta = (seconds: number): string => {
    if (seconds <= 0 || seconds > 86400 * 7) return '--';
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
};

// Check if torrent can be resumed (is paused or stopped)
const canResume = (state: string): boolean => {
    const resumableStates = ['pausedDL', 'pausedUP', 'stoppedDL', 'stoppedUP', 'stalledDL', 'queuedDL', 'error'];
    return resumableStates.includes(state) || state.includes('paused') || state.includes('stopped');
};

// Check if torrent can be paused (is actively running)
const canPause = (state: string): boolean => {
    const pausableStates = ['downloading', 'uploading', 'stalledUP', 'forcedDL', 'forcedUP', 'moving'];
    return pausableStates.includes(state);
};

const getStateInfo = (state: string) => {
    const states: Record<string, { label: string; color: string; bg: string }> = {
        downloading: { label: 'Downloading', color: 'text-emerald-400', bg: 'bg-emerald-500' },
        pausedDL: { label: 'Paused', color: 'text-amber-400', bg: 'bg-amber-500' },
        pausedUP: { label: 'Paused', color: 'text-amber-400', bg: 'bg-amber-500' },
        stoppedDL: { label: 'Stopped', color: 'text-red-400', bg: 'bg-red-500' },
        stoppedUP: { label: 'Stopped', color: 'text-red-400', bg: 'bg-red-500' },
        stalledDL: { label: 'Stalled', color: 'text-orange-400', bg: 'bg-orange-500' },
        stalledUP: { label: 'Seeding', color: 'text-blue-400', bg: 'bg-blue-500' },
        uploading: { label: 'Seeding', color: 'text-blue-400', bg: 'bg-blue-500' },
        queuedDL: { label: 'Queued', color: 'text-slate-400', bg: 'bg-slate-500' },
        queuedUP: { label: 'Queued', color: 'text-slate-400', bg: 'bg-slate-500' },
        metaDL: { label: 'Metadata', color: 'text-violet-400', bg: 'bg-violet-500' },
        checkingDL: { label: 'Checking', color: 'text-violet-400', bg: 'bg-violet-500' },
        checkingUP: { label: 'Checking', color: 'text-violet-400', bg: 'bg-violet-500' },
        error: { label: 'Error', color: 'text-red-400', bg: 'bg-red-500' },
    };
    return states[state] || { label: state, color: 'text-slate-400', bg: 'bg-slate-500' };
};

const DownloadsPage = () => {
    const [downloads, setDownloads] = useState<DownloadType[]>([]);
    const [connected, setConnected] = useState(true);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const [snackbar, setSnackbar] = useState<{ isOpen: boolean; message: string; type: SnackbarType }>({
        isOpen: false,
        message: '',
        type: 'success',
    });

    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        hash: string;
        name: string;
    }>({
        isOpen: false,
        hash: '',
        name: '',
    });

    const fetchDownloads = async () => {
        try {
            const data = await api.getDownloadStatus();
            setDownloads(data.downloads);
            setConnected(data.connected);
        } catch (error) {
            setConnected(false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDownloads();
        const interval = setInterval(fetchDownloads, 3000);
        return () => clearInterval(interval);
    }, []);

    const handlePause = async (hash: string) => {
        setActionLoading(hash);
        try {
            await api.pauseDownload(hash);
            setSnackbar({ isOpen: true, message: 'Download paused', type: 'success' });
            await fetchDownloads();
        } catch (error) {
            setSnackbar({ isOpen: true, message: 'Failed to pause download', type: 'error' });
        } finally {
            setActionLoading(null);
        }
    };

    const handleResume = async (hash: string) => {
        setActionLoading(hash);
        try {
            await api.resumeDownload(hash);
            setSnackbar({ isOpen: true, message: 'Download resumed', type: 'success' });
            await fetchDownloads();
        } catch (error) {
            setSnackbar({ isOpen: true, message: 'Failed to resume download', type: 'error' });
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteClick = (hash: string, name: string) => {
        setConfirmDialog({ isOpen: true, hash, name });
    };

    const handleConfirmDelete = async () => {
        const { hash } = confirmDialog;
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        setActionLoading(hash);

        try {
            await api.deleteDownload(hash, false);
            setSnackbar({ isOpen: true, message: 'Download removed', type: 'success' });
            await fetchDownloads();
        } catch (error) {
            setSnackbar({ isOpen: true, message: 'Failed to remove download', type: 'error' });
        } finally {
            setActionLoading(null);
        }
    };

    const handlePauseAll = async () => {
        setActionLoading('all');
        try {
            await api.pauseAll();
            setSnackbar({ isOpen: true, message: 'All downloads paused', type: 'success' });
            await fetchDownloads();
        } catch (error) {
            setSnackbar({ isOpen: true, message: 'Failed to pause downloads', type: 'error' });
        } finally {
            setActionLoading(null);
        }
    };

    const handleResumeAll = async () => {
        setActionLoading('all');
        try {
            await api.resumeAll();
            setSnackbar({ isOpen: true, message: 'All downloads resumed', type: 'success' });
            await fetchDownloads();
        } catch (error) {
            setSnackbar({ isOpen: true, message: 'Failed to resume downloads', type: 'error' });
        } finally {
            setActionLoading(null);
        }
    };

    const activeDownloads = downloads.filter(d => d.state === 'downloading');
    const totalSpeed = activeDownloads.reduce((sum, d) => sum + d.download_speed, 0);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                        <Download className="text-primary" size={28} />
                        Downloads
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-sm">
                        <span className={`flex items-center gap-2 ${connected ? 'text-emerald-400' : 'text-red-400'}`}>
                            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            {connected ? 'Connected' : 'Disconnected'}
                        </span>
                        {connected && downloads.length > 0 && (
                            <>
                                <span className="text-slate-500">•</span>
                                <span className="text-slate-400">{downloads.length} torrents</span>
                                {totalSpeed > 0 && (
                                    <>
                                        <span className="text-slate-500">•</span>
                                        <span className="text-emerald-400 flex items-center gap-1">
                                            <ArrowDown size={14} />
                                            {formatSpeed(totalSpeed)}
                                        </span>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={fetchDownloads}
                        className="p-3 text-slate-400 hover:text-white bg-slate-900 border border-slate-700 rounded-xl hover:bg-slate-800 transition-all"
                        title="Refresh"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={handlePauseAll}
                        disabled={actionLoading === 'all' || downloads.length === 0}
                        className="flex items-center gap-2 px-4 py-3 bg-slate-900 border border-slate-700 text-slate-300 rounded-xl font-medium hover:bg-slate-800 transition-all disabled:opacity-50"
                    >
                        <Pause size={16} />
                        <span className="hidden sm:inline">Pause All</span>
                    </button>
                    <button
                        onClick={handleResumeAll}
                        disabled={actionLoading === 'all' || downloads.length === 0}
                        className="flex items-center gap-2 px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-all disabled:opacity-50"
                    >
                        <Play size={16} fill="white" />
                        <span className="hidden sm:inline">Resume All</span>
                    </button>
                </div>
            </div>

            {/* Content */}
            {!connected ? (
                <div className="text-center py-16 sm:py-20 bg-slate-900 rounded-2xl border border-red-500/30">
                    <WifiOff size={48} className="mx-auto text-red-500 mb-4" />
                    <h3 className="text-lg font-medium text-slate-300">qBittorrent Not Connected</h3>
                    <p className="text-sm text-slate-500 mt-1 px-4">Check that qBittorrent is running and settings are correct</p>
                </div>
            ) : loading ? (
                <div className="flex flex-col items-center justify-center py-16 sm:py-20">
                    <Loader2 size={40} className="text-primary animate-spin" />
                    <p className="text-slate-500 mt-4">Loading downloads...</p>
                </div>
            ) : downloads.length === 0 ? (
                <div className="text-center py-16 sm:py-20 bg-slate-900 rounded-2xl border border-slate-800">
                    <Download size={48} className="mx-auto text-slate-700 mb-4" />
                    <h3 className="text-lg font-medium text-slate-300">No Active Downloads</h3>
                    <p className="text-sm text-slate-500 mt-1 px-4">Process your wishlist to start downloading</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {downloads.map((download, index) => {
                        const stateInfo = getStateInfo(download.state);
                        const showResume = canResume(download.state);
                        const showPause = canPause(download.state);
                        const isComplete = download.progress >= 100;

                        return (
                            <div
                                key={download.hash}
                                className="group bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-700 transition-all p-4 sm:p-5 card-hover animate-fade-in"
                                style={{ animationDelay: `${index * 30}ms` }}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-white text-sm sm:text-base truncate pr-2">{download.name}</h3>
                                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm">
                                            <span className={`flex items-center gap-1.5 ${stateInfo.color}`}>
                                                {download.state === 'downloading' && <ArrowDown size={14} />}
                                                {showResume && !isComplete && <Pause size={14} />}
                                                {isComplete && <CheckCircle size={14} />}
                                                {download.state === 'error' && <AlertCircle size={14} />}
                                                {stateInfo.label}
                                            </span>
                                            <span className="text-slate-500 flex items-center gap-1.5">
                                                <HardDrive size={14} />
                                                {download.size_gb.toFixed(2)} GB
                                            </span>
                                            {download.download_speed > 0 && (
                                                <span className="text-emerald-400 flex items-center gap-1.5">
                                                    <ArrowDown size={14} />
                                                    {formatSpeed(download.download_speed)}
                                                </span>
                                            )}
                                            {download.eta > 0 && download.eta < 86400 * 7 && (
                                                <span className="text-slate-500 flex items-center gap-1.5">
                                                    <Clock size={14} />
                                                    {formatEta(download.eta)}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 self-end sm:self-start">
                                        {/* Resume Button */}
                                        {showResume && (
                                            <button
                                                onClick={() => handleResume(download.hash)}
                                                disabled={actionLoading === download.hash}
                                                className="p-2.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all disabled:opacity-50"
                                                title="Resume"
                                            >
                                                {actionLoading === download.hash ? (
                                                    <Loader2 size={18} className="animate-spin" />
                                                ) : (
                                                    <Play size={18} fill="currentColor" />
                                                )}
                                            </button>
                                        )}
                                        {/* Pause Button */}
                                        {showPause && (
                                            <button
                                                onClick={() => handlePause(download.hash)}
                                                disabled={actionLoading === download.hash}
                                                className="p-2.5 text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all disabled:opacity-50"
                                                title="Pause"
                                            >
                                                {actionLoading === download.hash ? (
                                                    <Loader2 size={18} className="animate-spin" />
                                                ) : (
                                                    <Pause size={18} />
                                                )}
                                            </button>
                                        )}
                                        {/* Delete Button */}
                                        <button
                                            onClick={() => handleDeleteClick(download.hash, download.name)}
                                            className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                            title="Remove"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${stateInfo.bg}`}
                                        style={{ width: `${Math.min(download.progress, 100)}%` }}
                                    />
                                </div>
                                <div className="flex justify-between mt-2 text-xs text-slate-500">
                                    <span>{download.progress.toFixed(1)}%</span>
                                    <span>
                                        {(download.size_gb * download.progress / 100).toFixed(2)} / {download.size_gb.toFixed(2)} GB
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title="Remove Download"
                message={`Remove "${confirmDialog.name}" from qBittorrent? The downloaded files will be kept.`}
                confirmText="Remove"
                cancelText="Cancel"
                variant="danger"
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
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

export default DownloadsPage;

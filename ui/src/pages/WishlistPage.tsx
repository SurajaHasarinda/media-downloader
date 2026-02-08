import { useState, useEffect } from 'react';
import {
    Heart,
    Trash2,
    Loader2,
    Clock,
    CheckCircle,
    XCircle,
    Download,
    Film,
    RefreshCw,
    Zap,
    Info
} from 'lucide-react';
import { api, WishlistItem, ProcessResult } from '../api';
import Snackbar, { SnackbarType } from '../components/Snackbar';
import ConfirmDialog from '../components/ConfirmDialog';
import MovieDetailModal from '../components/MovieDetailModal';

const statusConfig = {
    pending: {
        icon: <Clock size={12} />,
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        text: 'text-amber-400',
        label: 'Pending'
    },
    queued: {
        icon: <Download size={12} />,
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
        text: 'text-blue-400',
        label: 'Queued'
    },
    downloading: {
        icon: <Loader2 size={12} className="animate-spin" />,
        bg: 'bg-violet-500/10',
        border: 'border-violet-500/30',
        text: 'text-violet-400',
        label: 'Downloading'
    },
    completed: {
        icon: <CheckCircle size={12} />,
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400',
        label: 'Completed'
    },
    not_found: {
        icon: <XCircle size={12} />,
        bg: 'bg-red-500/10',
        border: 'border-red-500/30',
        text: 'text-red-400',
        label: 'Not Found'
    },
};

const WishlistPage = () => {
    const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [filter, setFilter] = useState<string>('all');
    const [processResult, setProcessResult] = useState<ProcessResult | null>(null);

    const [snackbar, setSnackbar] = useState<{ isOpen: boolean; message: string; type: SnackbarType }>({
        isOpen: false,
        message: '',
        type: 'success',
    });

    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        tmdbId: number;
        title: string;
    }>({
        isOpen: false,
        tmdbId: 0,
        title: '',
    });

    const [selectedMovie, setSelectedMovie] = useState<WishlistItem | null>(null);

    const fetchWishlist = async () => {
        setLoading(true);
        try {
            const data = await api.getWishlist();
            setWishlist(data);
        } catch (error) {
            setSnackbar({ isOpen: true, message: 'Failed to load wishlist', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWishlist();
    }, []);

    const handleRemoveClick = (tmdbId: number, title: string) => {
        setConfirmDialog({ isOpen: true, tmdbId, title });
    };

    const handleConfirmRemove = async () => {
        const { tmdbId, title } = confirmDialog;
        setConfirmDialog({ ...confirmDialog, isOpen: false });

        try {
            await api.removeFromWishlist(tmdbId);
            setWishlist(prev => prev.filter(m => m.tmdb_id !== tmdbId));
            setSnackbar({ isOpen: true, message: `"${title}" removed from wishlist`, type: 'success' });
        } catch (error) {
            setSnackbar({ isOpen: true, message: 'Failed to remove movie', type: 'error' });
        }
    };

    const handleProcess = async () => {
        setProcessing(true);
        setProcessResult(null);
        try {
            const result = await api.processWishlist(3, 720);
            setProcessResult(result);
            fetchWishlist();

            if (result.queued > 0) {
                setSnackbar({ isOpen: true, message: `${result.queued} movie(s) queued for download`, type: 'success' });
            } else if (result.not_found > 0) {
                setSnackbar({ isOpen: true, message: `No torrents found for ${result.not_found} movie(s)`, type: 'warning' });
            } else {
                setSnackbar({ isOpen: true, message: 'No pending movies to process', type: 'info' });
            }
        } catch (error) {
            setSnackbar({ isOpen: true, message: 'Failed to process wishlist', type: 'error' });
        } finally {
            setProcessing(false);
        }
    };

    const filteredWishlist = filter === 'all'
        ? wishlist
        : wishlist.filter(m => m.status === filter);

    // Count movies that can be processed (pending + not_found for retry)
    const processableCount = wishlist.filter(m => m.status === 'pending' || m.status === 'not_found').length;

    const statusCounts = {
        all: wishlist.length,
        pending: wishlist.filter(m => m.status === 'pending').length,
        queued: wishlist.filter(m => m.status === 'queued').length,
        downloading: wishlist.filter(m => m.status === 'downloading').length,
        completed: wishlist.filter(m => m.status === 'completed').length,
        not_found: wishlist.filter(m => m.status === 'not_found').length,
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                        <Heart className="text-red-500" fill="currentColor" size={24} />
                        Wishlist
                    </h1>
                    <p className="text-slate-400 mt-1 text-sm sm:text-base">
                        {wishlist.length} movies • {processableCount} to process
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={fetchWishlist}
                        disabled={loading}
                        className="p-3 text-slate-400 hover:text-white bg-slate-900 border border-slate-700 rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50"
                        title="Refresh"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={handleProcess}
                        disabled={processing || processableCount === 0}
                        className="flex items-center gap-2 px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                    >
                        {processing ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                <span className="hidden sm:inline">Processing...</span>
                                <span className="sm:hidden">...</span>
                            </>
                        ) : (
                            <>
                                <Zap size={18} />
                                <span className="hidden sm:inline">Process Downloads ({processableCount})</span>
                                <span className="sm:hidden">Process ({processableCount})</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Process Result */}
            {processResult && (
                <div className="bg-slate-900 rounded-xl p-4 border border-slate-700 animate-slide-up">
                    <div className="flex items-center gap-6 text-sm">
                        <span className="text-slate-400">
                            Processed: <span className="text-white font-semibold">{processResult.processed}</span>
                        </span>
                        <span className="text-emerald-400">
                            Queued: <span className="font-semibold">{processResult.queued}</span>
                        </span>
                        <span className="text-red-400">
                            Not Found: <span className="font-semibold">{processResult.not_found}</span>
                        </span>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
                {(['all', 'pending', 'queued', 'downloading', 'completed', 'not_found'] as const).map((status) => {
                    const count = statusCounts[status];
                    const config = status === 'all' ? null : statusConfig[status];

                    return (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === status
                                ? 'bg-primary text-white'
                                : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                                }`}
                        >
                            {config?.icon}
                            <span>{status === 'all' ? 'All' : config?.label}</span>
                            <span className={`text-xs ${filter === status ? 'text-white/70' : 'text-slate-500'}`}>
                                ({count})
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Wishlist Items */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 size={40} className="text-primary animate-spin" />
                    <p className="text-slate-500 mt-4">Loading wishlist...</p>
                </div>
            ) : filteredWishlist.length === 0 ? (
                <div className="text-center py-20 bg-slate-900 rounded-2xl border border-slate-800">
                    <Heart size={48} className="mx-auto text-slate-700 mb-4" />
                    <h3 className="text-lg font-medium text-slate-300">
                        {filter === 'all' ? 'Your wishlist is empty' : `No ${filter} movies`}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">Search and add movies to get started</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredWishlist.map((movie, index) => {
                        const config = statusConfig[movie.status] || statusConfig.pending;

                        return (
                            <div
                                key={movie.tmdb_id}
                                className="group bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-700 transition-all card-hover animate-fade-in"
                                style={{ animationDelay: `${index * 30}ms` }}
                            >
                                <div className="flex gap-3 sm:gap-4 p-3 sm:p-4">
                                    {/* Poster - Clickable */}
                                    <div
                                        className="w-12 h-18 sm:w-16 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden bg-slate-800 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                                        onClick={() => setSelectedMovie(movie)}
                                    >
                                        {movie.poster_url ? (
                                            <img
                                                src={movie.poster_url}
                                                alt={movie.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                                                <Film size={20} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info - Clickable */}
                                    <div
                                        className="flex-1 min-w-0 cursor-pointer"
                                        onClick={() => setSelectedMovie(movie)}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <h3 className="font-semibold text-white text-sm sm:text-base truncate hover:text-primary transition-colors">{movie.title}</h3>
                                                <div className="flex items-center gap-2 sm:gap-3 mt-1 text-xs sm:text-sm text-slate-500">
                                                    {movie.release_date && <span>{movie.release_date.substring(0, 4)}</span>}
                                                    {movie.genres && (
                                                        <span className="truncate max-w-[120px] sm:max-w-[200px]">{movie.genres}</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            <span className={`self-start flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium border ${config.bg} ${config.border} ${config.text}`}>
                                                {config.icon}
                                                <span className="hidden sm:inline">{config.label}</span>
                                            </span>
                                        </div>

                                        {/* Overview - hidden on mobile */}
                                        {movie.overview && (
                                            <p className="hidden sm:block text-sm text-slate-500 mt-2 line-clamp-1">{movie.overview}</p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setSelectedMovie(movie)}
                                            className="p-2 sm:p-3 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
                                            title="View Details"
                                        >
                                            <Info size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleRemoveClick(movie.tmdb_id, movie.title)}
                                            className="p-2 sm:p-3 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                                            title="Remove"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title="Remove from Wishlist"
                message={`Are you sure you want to remove "${confirmDialog.title}" from your wishlist?`}
                confirmText="Remove"
                cancelText="Cancel"
                variant="danger"
                onConfirm={handleConfirmRemove}
                onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
            />

            {/* Movie Detail Modal */}
            <MovieDetailModal
                isOpen={!!selectedMovie}
                movie={selectedMovie}
                onClose={() => setSelectedMovie(null)}
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

export default WishlistPage;

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
    Info,
    Star,
    Calendar,
    Tag,
    ExternalLink,
    ThumbsUp,
    Sparkles,
    Settings,
    X,
    Monitor
} from 'lucide-react';
import { api, WishlistItem, FavoriteItem, ProcessResult } from '../api';
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

type ActiveTab = 'wishlist' | 'favorites';

const WishlistPage = () => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('wishlist');

    // Wishlist state
    const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
    const [loadingWishlist, setLoadingWishlist] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [filter, setFilter] = useState<string>('all');
    const [maxSizeGb, setMaxSizeGb] = useState(1.5);
    const [minQuality, setMinQuality] = useState(720);
    const [showSettings, setShowSettings] = useState(false);
    const [processResult, setProcessResult] = useState<ProcessResult | null>(null);

    // Favorites state
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
    const [loadingFavorites, setLoadingFavorites] = useState(false);
    const [favoritesLoaded, setFavoritesLoaded] = useState(false);

    const [snackbar, setSnackbar] = useState<{ isOpen: boolean; message: string; type: SnackbarType }>({
        isOpen: false,
        message: '',
        type: 'success',
    });

    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        tmdbId: number;
        title: string;
        mode: 'wishlist' | 'favorite';
    }>({
        isOpen: false,
        tmdbId: 0,
        title: '',
        mode: 'wishlist',
    });

    const [selectedMovie, setSelectedMovie] = useState<WishlistItem | FavoriteItem | null>(null);

    // ============ Wishlist Logic ============

    const fetchWishlist = async () => {
        setLoadingWishlist(true);
        try {
            const data = await api.getWishlist();
            setWishlist(data);
        } catch (error) {
            setSnackbar({ isOpen: true, message: 'Failed to load wishlist', type: 'error' });
        } finally {
            setLoadingWishlist(false);
        }
    };

    useEffect(() => {
        fetchWishlist();
    }, []);

    // ============ Favorites Logic ============

    const fetchFavorites = async () => {
        setLoadingFavorites(true);
        try {
            const data = await api.getFavorites();
            setFavorites(data);
            setFavoritesLoaded(true);
        } catch (error) {
            setSnackbar({ isOpen: true, message: 'Failed to load favorites', type: 'error' });
        } finally {
            setLoadingFavorites(false);
        }
    };

    // Lazy-load favorites only when tab is switched
    useEffect(() => {
        if (activeTab === 'favorites' && !favoritesLoaded) {
            fetchFavorites();
        }
    }, [activeTab]);

    // ============ Handlers ============

    const handleRemoveClick = (tmdbId: number, title: string) => {
        setConfirmDialog({ isOpen: true, tmdbId, title, mode: activeTab === 'favorites' ? 'favorite' : 'wishlist' });
    };

    const handleConfirmRemove = async () => {
        const { tmdbId, title, mode } = confirmDialog;
        setConfirmDialog({ ...confirmDialog, isOpen: false });

        try {
            if (mode === 'favorite') {
                await api.removeFromFavorites(tmdbId);
                setFavorites(prev => prev.filter(f => f.tmdb_id !== tmdbId));
                setSnackbar({ isOpen: true, message: `"${title}" removed from favorites`, type: 'success' });
            } else {
                await api.removeFromWishlist(tmdbId);
                setWishlist(prev => prev.filter(m => m.tmdb_id !== tmdbId));
                setSnackbar({ isOpen: true, message: `"${title}" removed from wishlist`, type: 'success' });
            }
        } catch (error) {
            setSnackbar({ isOpen: true, message: 'Failed to remove movie', type: 'error' });
        }
    };

    const handleProcess = async () => {
        setProcessing(true);
        setProcessResult(null);
        try {
            const result = await api.processWishlist(maxSizeGb, minQuality);
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

    const handleViewDetails = async (movie: WishlistItem | FavoriteItem) => {
        setSelectedMovie(movie);
        try {
            const details = await api.getMovieDetails(movie.tmdb_id);
            setSelectedMovie({ ...movie, ...details });
        } catch (error) {
            console.error('Failed to fetch details:', error);
        }
    };

    const filteredWishlist = filter === 'all'
        ? wishlist
        : wishlist.filter(m => m.status === filter);

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
            {/* Tab Switcher */}
            <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 w-fit">
                <button
                    onClick={() => setActiveTab('wishlist')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'wishlist'
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                >
                    <Heart size={16} className={activeTab === 'wishlist' ? 'fill-white' : ''} />
                    Wishlist
                    <span className={`text-xs px-1.5 py-0.5 rounded-md ${activeTab === 'wishlist' ? 'bg-white/20' : 'bg-slate-800 text-slate-500'
                        }`}>
                        {wishlist.length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('favorites')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'favorites'
                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                >
                    <ThumbsUp size={16} />
                    Favorites
                    {favoritesLoaded && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-md ${activeTab === 'favorites' ? 'bg-white/20' : 'bg-slate-800 text-slate-500'
                            }`}>
                            {favorites.length}
                        </span>
                    )}
                </button>
            </div>

            {/* ==================== WISHLIST TAB ==================== */}
            {activeTab === 'wishlist' && (
                <>
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
                                disabled={loadingWishlist}
                                className="p-3 text-slate-400 hover:text-white bg-slate-900 border border-slate-700 rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50"
                                title="Refresh"
                            >
                                <RefreshCw size={18} className={loadingWishlist ? 'animate-spin' : ''} />
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
                            <button
                                onClick={() => setShowSettings(true)}
                                className={`p-3 rounded-xl border transition-all ${showSettings
                                    ? 'bg-primary/20 text-primary border-primary/30'
                                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'
                                    }`}
                                title="Process Settings"
                            >
                                <Settings size={18} />
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
                    {loadingWishlist ? (
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
                                            {/* Poster */}
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

                                            {/* Info */}
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

                                                {/* Overview */}
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
                </>
            )}

            {/* ==================== FAVORITES TAB ==================== */}
            {activeTab === 'favorites' && (
                <>
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                                    <ThumbsUp className="text-rose-400" size={24} />
                                    Favorites
                                </h1>
                            </div>
                            <p className="text-slate-400 text-sm sm:text-base">
                                Movies you've liked — used for future recommendations
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={fetchFavorites}
                                disabled={loadingFavorites}
                                className="p-3 text-slate-400 hover:text-white bg-slate-900 border border-slate-700 rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50"
                                title="Refresh"
                            >
                                <RefreshCw size={18} className={loadingFavorites ? 'animate-spin' : ''} />
                            </button>
                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800">
                                <Sparkles size={16} className="text-amber-400" />
                                <span className="text-sm font-medium text-slate-300">
                                    {favorites.length} {favorites.length === 1 ? 'movie' : 'movies'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Favorites Grid */}
                    {loadingFavorites ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 animate-pulse">
                                    <div className="flex">
                                        <div className="w-28 aspect-[2/3] bg-slate-800/50 flex-shrink-0" />
                                        <div className="flex-1 p-4 space-y-3">
                                            <div className="h-5 bg-slate-800 rounded w-3/4" />
                                            <div className="h-3 bg-slate-800 rounded w-1/2" />
                                            <div className="h-3 bg-slate-800 rounded w-full" />
                                            <div className="h-3 bg-slate-800 rounded w-2/3" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : favorites.length === 0 ? (
                        <div className="text-center py-16 sm:py-24 bg-slate-900/50 rounded-2xl border border-slate-800">
                            <div className="relative inline-block mb-6">
                                <ThumbsUp size={64} className="text-slate-700" />
                            </div>
                            <h3 className="text-xl font-semibold text-slate-300 mb-2">No favorites yet</h3>
                            <p className="text-sm text-slate-500 max-w-sm mx-auto">
                                Like movies from the Discover page to build your taste profile for better recommendations
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {favorites.map((movie, index) => (
                                <div
                                    key={movie.tmdb_id}
                                    className="group bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 hover:border-rose-500/30 transition-all duration-300 card-hover animate-fade-in"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className="flex h-full">
                                        {/* Poster */}
                                        <div
                                            className="w-28 flex-shrink-0 bg-slate-800 cursor-pointer relative overflow-hidden"
                                            onClick={() => handleViewDetails(movie)}
                                        >
                                            {movie.poster_url ? (
                                                <img
                                                    src={movie.poster_url}
                                                    alt={movie.title}
                                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="w-full h-full min-h-[168px] flex items-center justify-center text-slate-600">
                                                    <Film size={32} />
                                                </div>
                                            )}
                                            {/* Heart overlay */}
                                            <div className="absolute top-2 left-2 p-1 rounded-full bg-rose-500/20 backdrop-blur-sm border border-rose-500/30">
                                                <Heart size={12} className="text-rose-400 fill-rose-400" />
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 p-4 flex flex-col min-w-0">
                                            <h3
                                                className="font-semibold text-white text-sm truncate cursor-pointer hover:text-rose-300 transition-colors"
                                                onClick={() => handleViewDetails(movie)}
                                            >
                                                {movie.title}
                                            </h3>

                                            {/* Meta */}
                                            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                                                {movie.release_date && (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={11} />
                                                        {movie.release_date.substring(0, 4)}
                                                    </span>
                                                )}
                                                {movie.vote_average !== undefined && movie.vote_average > 0 && (
                                                    <span className="flex items-center gap-1">
                                                        <Star size={11} className="text-amber-400 fill-amber-400" />
                                                        <span className="text-white font-medium">{movie.vote_average.toFixed(1)}</span>
                                                    </span>
                                                )}
                                            </div>

                                            {/* Genres */}
                                            {movie.genres && (
                                                <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                                                    <Tag size={10} />
                                                    <span className="truncate">{movie.genres}</span>
                                                </div>
                                            )}

                                            {/* IMDB Badge */}
                                            {movie.imdb_id && (
                                                <a
                                                    href={`https://www.imdb.com/title/${movie.imdb_id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 mt-2 text-xs text-amber-400/80 hover:text-amber-300 transition-colors"
                                                >
                                                    <ExternalLink size={10} />
                                                    <span className="font-mono">{movie.imdb_id}</span>
                                                </a>
                                            )}

                                            <div className="flex-1" />

                                            {/* Actions */}
                                            <div className="flex items-center justify-end mt-3 pt-3 border-t border-slate-800">
                                                <button
                                                    onClick={() => handleRemoveClick(movie.tmdb_id, movie.title)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                                    title="Remove from favorites"
                                                >
                                                    <Trash2 size={13} />
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Process Settings Modal */}
            {showSettings && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowSettings(false);
                    }}
                >
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
                    <div
                        className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in z-10 p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Settings className="text-primary" size={24} />
                                Process Settings
                            </h2>
                            <button
                                onClick={() => setShowSettings(false)}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Max Size */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Max Size: {maxSizeGb} GB
                                </label>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="10"
                                    step="0.5"
                                    value={maxSizeGb}
                                    onChange={(e) => setMaxSizeGb(parseFloat(e.target.value))}
                                    className="w-full accent-primary"
                                />
                                <div className="flex justify-between text-xs text-slate-500 mt-1">
                                    <span>0.5 GB</span>
                                    <span>10 GB</span>
                                </div>
                            </div>

                            {/* Quality */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Minimum Quality</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { value: 480, label: '480p' },
                                        { value: 720, label: '720p' },
                                        { value: 1080, label: '1080p' },
                                        { value: 2160, label: '4K' }
                                    ].map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setMinQuality(opt.value)}
                                            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${minQuality === opt.value
                                                ? 'bg-primary/10 border-primary text-primary ring-1 ring-primary/50'
                                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                                                }`}
                                        >
                                            <Monitor size={20} className="mb-2" />
                                            <span className="font-semibold">{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 mt-8 pt-4 border-t border-slate-800">
                            <button
                                type="button"
                                onClick={() => setShowSettings(false)}
                                className="w-full px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                            >
                                <CheckCircle size={18} />
                                Apply & Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.mode === 'favorite' ? 'Remove from Favorites' : 'Remove from Wishlist'}
                message={`Are you sure you want to remove "${confirmDialog.title}" from your ${confirmDialog.mode === 'favorite' ? 'favorites' : 'wishlist'}?`}
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

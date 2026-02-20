import { useState, useEffect } from 'react';
import {
    Heart,
    Trash2,
    Film,
    Star,
    Calendar,
    Tag,
    ExternalLink,
    Sparkles
} from 'lucide-react';
import { api, FavoriteItem } from '../api';
import Snackbar, { SnackbarType } from '../components/Snackbar';
import ConfirmDialog from '../components/ConfirmDialog';
import MovieDetailModal from '../components/MovieDetailModal';

const FavoritesPage = () => {
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMovie, setSelectedMovie] = useState<FavoriteItem | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        tmdbId: number | null;
        title: string;
    }>({ isOpen: false, tmdbId: null, title: '' });
    const [snackbar, setSnackbar] = useState<{ isOpen: boolean; message: string; type: SnackbarType }>({
        isOpen: false,
        message: '',
        type: 'success',
    });

    const fetchFavorites = async () => {
        setLoading(true);
        try {
            const data = await api.getFavorites();
            setFavorites(data);
        } catch (error) {
            console.error('Failed to fetch favorites:', error);
            setSnackbar({
                isOpen: true,
                message: 'Failed to load favorites',
                type: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFavorites();
    }, []);

    const handleRemoveClick = (tmdbId: number, title: string) => {
        setConfirmDialog({ isOpen: true, tmdbId, title });
    };

    const handleConfirmRemove = async () => {
        if (!confirmDialog.tmdbId) return;
        try {
            await api.removeFromFavorites(confirmDialog.tmdbId);
            setFavorites(prev => prev.filter(f => f.tmdb_id !== confirmDialog.tmdbId));
            setSnackbar({
                isOpen: true,
                message: `"${confirmDialog.title}" removed from favorites`,
                type: 'success',
            });
        } catch (error) {
            setSnackbar({
                isOpen: true,
                message: 'Failed to remove from favorites',
                type: 'error',
            });
        } finally {
            setConfirmDialog({ isOpen: false, tmdbId: null, title: '' });
        }
    };

    const handleViewDetails = async (movie: FavoriteItem) => {
        setSelectedMovie(movie);
        try {
            const details = await api.getMovieDetails(movie.tmdb_id);
            setSelectedMovie({ ...movie, ...details });
        } catch (error) {
            console.error('Failed to fetch details:', error);
        }
    };

    return (
        <div className="space-y-6 sm:space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 border border-rose-500/30">
                            <Heart size={24} className="text-rose-400 fill-rose-400" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white">Favorites</h1>
                    </div>
                    <p className="text-slate-400 text-sm sm:text-base">
                        Movies you've liked — used for future recommendations
                    </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800">
                    <Sparkles size={16} className="text-amber-400" />
                    <span className="text-sm font-medium text-slate-300">
                        {favorites.length} {favorites.length === 1 ? 'movie' : 'movies'}
                    </span>
                </div>
            </div>

            {/* Favorites Grid */}
            {loading ? (
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
                        <Heart size={64} className="text-slate-700" />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center">
                            <span className="text-slate-500 text-xs">0</span>
                        </div>
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
                                    {/* Title */}
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

                                    {/* Spacer */}
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

            {/* Movie Detail Modal */}
            <MovieDetailModal
                isOpen={!!selectedMovie}
                movie={selectedMovie}
                onClose={() => setSelectedMovie(null)}
            />

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title="Remove from Favorites"
                message={`Are you sure you want to remove "${confirmDialog.title}" from your favorites?`}
                confirmText="Remove"
                onConfirm={handleConfirmRemove}
                onCancel={() => setConfirmDialog({ isOpen: false, tmdbId: null, title: '' })}
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

export default FavoritesPage;

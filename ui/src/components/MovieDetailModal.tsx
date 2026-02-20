import { X, Star, Calendar, Tag, ExternalLink, Film, Heart } from 'lucide-react';
import { Movie } from '../api';

interface MovieDetailModalProps {
    isOpen: boolean;
    movie: Movie | null;
    onClose: () => void;
    onAddToWishlist?: (movie: Movie) => void;
    isAdded?: boolean;
    isAdding?: boolean;
    onToggleFavorite?: (movie: Movie) => void;
    isFavorite?: boolean;
    isTogglingFavorite?: boolean;
}

const MovieDetailModal = ({
    isOpen,
    movie,
    onClose,
    onAddToWishlist,
    isAdded = false,
    isAdding = false,
    onToggleFavorite,
    isFavorite = false,
    isTogglingFavorite = false
}: MovieDetailModalProps) => {
    if (!isOpen || !movie) return null;

    const year = movie.release_date?.substring(0, 4) || 'N/A';

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => {
                e.stopPropagation();
                onClose();
            }}
        >
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" />

            {/* Modal */}
            <div
                className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-scale-in z-10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Top-right action buttons */}
                <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                    {/* Favorite Button */}
                    {onToggleFavorite && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleFavorite(movie);
                            }}
                            disabled={isTogglingFavorite}
                            className={`p-2 backdrop-blur-sm rounded-full transition-all duration-300 ${isFavorite
                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30'
                                    : 'bg-slate-800/80 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                                }`}
                            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                            <Heart
                                size={18}
                                className={`transition-all duration-300 ${isFavorite ? 'fill-rose-400 scale-110' : ''} ${isTogglingFavorite ? 'animate-pulse' : ''}`}
                            />
                        </button>
                    )}

                    {/* Close Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        className="p-2 text-slate-400 hover:text-white bg-slate-800/80 backdrop-blur-sm rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex flex-col sm:flex-row">
                    {/* Poster */}
                    <div className="w-full sm:w-64 flex-shrink-0 bg-slate-800 relative">
                        {movie.poster_url ? (
                            <img
                                src={movie.poster_url}
                                alt={movie.title}
                                className="w-full h-64 sm:h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-64 sm:h-96 flex items-center justify-center text-slate-600">
                                <Film size={64} />
                            </div>
                        )}

                        {/* Favorite badge on poster */}
                        {isFavorite && (
                            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/20 backdrop-blur-sm border border-rose-500/30">
                                <Heart size={12} className="text-rose-400 fill-rose-400" />
                                <span className="text-xs font-medium text-rose-300">Liked</span>
                            </div>
                        )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 p-6 overflow-y-auto max-h-[60vh] sm:max-h-[80vh] custom-scrollbar">
                        {/* Title */}
                        <h2 className="text-2xl font-bold text-white mb-2">{movie.title}</h2>

                        {/* Meta Info */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-4">
                            {/* Year */}
                            <span className="flex items-center gap-1.5">
                                <Calendar size={14} />
                                {year}
                            </span>

                            {/* Rating */}
                            {movie.vote_average !== undefined && movie.vote_average > 0 && (
                                <span className="flex items-center gap-1.5">
                                    <Star size={14} className="text-amber-400 fill-amber-400" />
                                    <span className="text-white font-medium">{movie.vote_average.toFixed(1)}</span>
                                    <span>/10</span>
                                </span>
                            )}

                            {/* Genres */}
                            {movie.genres && (
                                <span className="flex items-center gap-1.5">
                                    <Tag size={14} />
                                    {movie.genres}
                                </span>
                            )}
                        </div>

                        {/* Overview */}
                        {movie.overview && (
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2">Overview</h3>
                                <p className="text-slate-400 leading-relaxed text-sm">{movie.overview}</p>
                            </div>
                        )}

                        {/* IMDB Link */}
                        {movie.imdb_id && (
                            <a
                                href={`https://www.imdb.com/title/${movie.imdb_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors mb-6"
                            >
                                <ExternalLink size={14} />
                                View on IMDB
                                <span className="text-xs text-slate-500 font-mono">({movie.imdb_id})</span>
                            </a>
                        )}

                        {/* Action Buttons */}
                        <div className="space-y-2">
                            {/* Wishlist Button */}
                            {onAddToWishlist && (
                                <button
                                    onClick={() => onAddToWishlist(movie)}
                                    disabled={isAdding || isAdded}
                                    className={`w-full py-3 rounded-xl font-semibold transition-all ${isAdded
                                        ? 'bg-emerald-600 text-white cursor-default'
                                        : 'bg-primary hover:bg-primary/90 text-white'
                                        } disabled:opacity-60`}
                                >
                                    {isAdding ? 'Adding...' : isAdded ? '✓ Added to Wishlist' : '+ Add to Wishlist'}
                                </button>
                            )}

                            {/* Inline Favorite Button (for when onToggleFavorite is available) */}
                            {onToggleFavorite && (
                                <button
                                    onClick={() => onToggleFavorite(movie)}
                                    disabled={isTogglingFavorite}
                                    className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${isFavorite
                                            ? 'bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25'
                                            : 'bg-slate-800 border border-slate-700 text-slate-300 hover:border-rose-500/30 hover:text-rose-400'
                                        }`}
                                >
                                    <Heart size={16} className={isFavorite ? 'fill-rose-400' : ''} />
                                    {isTogglingFavorite ? 'Updating...' : isFavorite ? 'Liked' : 'Like for Recommendations'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MovieDetailModal;

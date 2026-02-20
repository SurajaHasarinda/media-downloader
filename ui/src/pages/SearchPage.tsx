import { useState, useEffect } from 'react';
import { Search, Plus, Star, Calendar, TrendingUp, Loader2, Film, Check, Info, Heart } from 'lucide-react';
import { api, Movie } from '../api';
import Snackbar, { SnackbarType } from '../components/Snackbar';
import MovieDetailModal from '../components/MovieDetailModal';

const SearchPage = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Movie[]>([]);
    const [popular, setPopular] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingPopular, setLoadingPopular] = useState(true);
    const [addingId, setAddingId] = useState<number | null>(null);
    const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
    const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
    const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
    const [togglingFavoriteId, setTogglingFavoriteId] = useState<number | null>(null);
    const [snackbar, setSnackbar] = useState<{ isOpen: boolean; message: string; type: SnackbarType }>({
        isOpen: false,
        message: '',
        type: 'success',
    });

    // Fetch popular movies and favorite IDs on mount
    useEffect(() => {
        const fetchPopular = async () => {
            setLoadingPopular(true);
            try {
                const data = await api.getPopularMovies(12);
                setPopular(data);
            } catch (error) {
                console.error('Failed to fetch popular:', error);
            } finally {
                setLoadingPopular(false);
            }
        };

        const fetchFavoriteIds = async () => {
            try {
                const ids = await api.getFavoriteIds();
                setFavoriteIds(new Set(ids));
            } catch (error) {
                console.error('Failed to fetch favorite IDs:', error);
            }
        };

        fetchPopular();
        fetchFavoriteIds();
    }, []);

    // Debounced search
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const data = await api.searchMovies(query, 12);
                setResults(data);
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setLoading(false);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [query]);

    const handleAddToWishlist = async (movie: Movie) => {
        setAddingId(movie.tmdb_id);
        try {
            await api.addToWishlist(movie.tmdb_id);
            setAddedIds(prev => new Set(prev).add(movie.tmdb_id));
            setSnackbar({
                isOpen: true,
                message: `"${movie.title}" added to wishlist`,
                type: 'success',
            });
        } catch (error: any) {
            const msg = error.response?.data?.detail || 'Failed to add movie';
            setSnackbar({
                isOpen: true,
                message: msg,
                type: 'error',
            });
        } finally {
            setAddingId(null);
        }
    };

    const handleToggleFavorite = async (movie: Movie) => {
        setTogglingFavoriteId(movie.tmdb_id);
        try {
            const result = await api.toggleFavorite(movie.tmdb_id);
            if (result.action === 'added') {
                setFavoriteIds(prev => new Set(prev).add(movie.tmdb_id));
                setSnackbar({
                    isOpen: true,
                    message: `"${movie.title}" added to favorites ❤️`,
                    type: 'success',
                });
            } else {
                setFavoriteIds(prev => {
                    const next = new Set(prev);
                    next.delete(movie.tmdb_id);
                    return next;
                });
                setSnackbar({
                    isOpen: true,
                    message: `"${movie.title}" removed from favorites`,
                    type: 'success',
                });
            }
        } catch (error: any) {
            const msg = error.response?.data?.detail || 'Failed to update favorite';
            setSnackbar({
                isOpen: true,
                message: msg,
                type: 'error',
            });
        } finally {
            setTogglingFavoriteId(null);
        }
    };

    const handleViewDetails = async (movie: Movie) => {
        setSelectedMovie(movie);
        try {
            // Fetch full details including IMDB ID
            const details = await api.getMovieDetails(movie.tmdb_id);
            setSelectedMovie({ ...movie, ...details });
        } catch (error) {
            console.error('Failed to fetch details:', error);
        }
    };

    const displayMovies = query.trim() ? results : popular;
    const isSearching = query.trim().length > 0;

    return (
        <div className="space-y-6 sm:space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Discover Movies</h1>
                <p className="text-slate-400 text-sm sm:text-base">Search and add movies to your wishlist</p>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-2xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Search for movies..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white pl-12 pr-12 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-slate-500"
                />
                {loading && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                    </div>
                )}
            </div>

            {/* Section Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {isSearching ? (
                        <Film className="text-primary" size={22} />
                    ) : (
                        <TrendingUp className="text-amber-500" size={22} />
                    )}
                    <div>
                        <h2 className="text-lg sm:text-xl font-semibold text-white">
                            {isSearching ? 'Search Results' : 'Trending Now'}
                        </h2>
                        {isSearching && results.length > 0 && !loading && (
                            <p className="text-sm text-slate-500">{results.length} movies found</p>
                        )}
                        {loading && (
                            <p className="text-sm text-slate-500 animate-pulse">Searching...</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Movie Grid */}
            {(loading || (loadingPopular && !isSearching)) ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 animate-pulse">
                            <div className="aspect-[2/3] bg-slate-800/50" />
                            <div className="p-3 space-y-2">
                                <div className="h-4 bg-slate-800 rounded w-3/4" />
                                <div className="h-3 bg-slate-800 rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : displayMovies.length === 0 ? (
                <div className="text-center py-16 sm:py-20 bg-slate-900/50 rounded-2xl border border-slate-800">
                    <Film size={48} className="mx-auto text-slate-700 mb-4" />
                    <h3 className="text-lg font-medium text-slate-300">
                        {isSearching ? 'No movies found' : 'No trending movies available'}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1 px-4">
                        {isSearching ? 'Try a different search term' : 'Check back later'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                    {displayMovies.map((movie, index) => {
                        const isAdded = addedIds.has(movie.tmdb_id);
                        const isAdding = addingId === movie.tmdb_id;
                        const isFav = favoriteIds.has(movie.tmdb_id);
                        const isTogglingFav = togglingFavoriteId === movie.tmdb_id;

                        return (
                            <div
                                key={movie.tmdb_id}
                                className="group bg-slate-900 rounded-xl overflow-hidden border border-slate-800 hover:border-slate-700 card-hover animate-fade-in"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                {/* Poster */}
                                <div className="relative aspect-[2/3] bg-slate-800 overflow-hidden">
                                    {movie.poster_url ? (
                                        <img
                                            src={movie.poster_url}
                                            alt={movie.title}
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                                            <Film size={40} />
                                        </div>
                                    )}

                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-end p-3 gap-2">
                                        {/* Info Button */}
                                        <button
                                            onClick={() => handleViewDetails(movie)}
                                            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg font-medium text-sm bg-slate-700 hover:bg-slate-600 text-white transition-all"
                                        >
                                            <Info size={14} />
                                            Details
                                        </button>
                                        {/* Add Button */}
                                        <button
                                            onClick={() => handleAddToWishlist(movie)}
                                            disabled={isAdding || isAdded}
                                            className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg font-medium text-sm transition-all ${isAdded
                                                ? 'bg-emerald-600 text-white cursor-default'
                                                : 'bg-primary hover:bg-primary/90 text-white'
                                                }`}
                                        >
                                            {isAdding ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : isAdded ? (
                                                <>
                                                    <Check size={14} />
                                                    Added
                                                </>
                                            ) : (
                                                <>
                                                    <Plus size={14} />
                                                    Wishlist
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {/* Rating Badge */}
                                    {movie.vote_average !== undefined && movie.vote_average > 0 && (
                                        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg">
                                            <Star size={12} className="text-amber-400 fill-amber-400" />
                                            <span className="text-xs font-semibold text-white">{movie.vote_average.toFixed(1)}</span>
                                        </div>
                                    )}

                                    {/* Favorite Heart Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleFavorite(movie);
                                        }}
                                        disabled={isTogglingFav}
                                        className={`absolute top-2 left-2 p-1.5 rounded-full backdrop-blur-sm transition-all duration-300 ${isFav
                                                ? 'bg-rose-500/30 border border-rose-500/40 text-rose-400'
                                                : 'bg-black/40 border border-transparent text-slate-400 opacity-0 group-hover:opacity-100 hover:text-rose-400 hover:bg-rose-500/20'
                                            }`}
                                        title={isFav ? 'Unlike' : 'Like'}
                                    >
                                        <Heart
                                            size={14}
                                            className={`transition-all duration-300 ${isFav ? 'fill-rose-400' : ''} ${isTogglingFav ? 'animate-pulse' : ''}`}
                                        />
                                    </button>

                                    {/* Favorited badge - visible when not hovered */}
                                    {isFav && (
                                        <div className="absolute top-2 left-2 p-1.5 rounded-full bg-rose-500/30 border border-rose-500/40 text-rose-400 group-hover:hidden pointer-events-none">
                                            <Heart size={14} className="fill-rose-400" />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div
                                    className="p-3 cursor-pointer hover:bg-slate-800/50 transition-colors"
                                    onClick={() => handleViewDetails(movie)}
                                >
                                    <h3 className="font-medium text-white text-sm truncate">{movie.title}</h3>
                                    {movie.release_date && (
                                        <div className="flex items-center gap-1.5 mt-1.5 text-slate-500">
                                            <Calendar size={12} />
                                            <span className="text-xs">{movie.release_date.substring(0, 4)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Movie Detail Modal */}
            <MovieDetailModal
                isOpen={!!selectedMovie}
                movie={selectedMovie}
                onClose={() => setSelectedMovie(null)}
                onAddToWishlist={handleAddToWishlist}
                isAdded={selectedMovie ? addedIds.has(selectedMovie.tmdb_id) : false}
                isAdding={selectedMovie ? addingId === selectedMovie.tmdb_id : false}
                onToggleFavorite={handleToggleFavorite}
                isFavorite={selectedMovie ? favoriteIds.has(selectedMovie.tmdb_id) : false}
                isTogglingFavorite={selectedMovie ? togglingFavoriteId === selectedMovie.tmdb_id : false}
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

export default SearchPage;

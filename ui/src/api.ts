import axios, { AxiosInstance } from 'axios';

const API_BASE = '/api';

// Types
export interface Movie {
    tmdb_id: number;
    title: string;
    release_date?: string;
    vote_average?: number;
    overview?: string;
    poster_url?: string;
    imdb_id?: string;
    genres?: string;
}

export interface WishlistItem extends Movie {
    id?: number;
    status: 'pending' | 'queued' | 'downloading' | 'completed' | 'not_found';
    created_at?: string;
}

export interface Download {
    name: string;
    hash: string;
    progress: number;
    state: string;
    size_gb: number;
    download_speed: number;
    eta: number;
}

export interface ProcessResult {
    processed: number;
    queued: number;
    not_found: number;
    results: Array<{
        tmdb_id: number;
        title: string;
        status: string;
        message: string;
    }>;
}

export interface Schedule {
    id: number;
    name: string;
    cron_hour: number;
    cron_minute: number;
    max_size_gb: number;
    min_quality: number;
    enabled: boolean;
    last_run?: string;
    next_run?: string;
    created_at?: string;
}

export interface ScheduleCreate {
    name: string;
    hour: number;
    minute: number;
    max_size_gb?: number;
    min_quality?: number;
    enabled?: boolean;
}

export interface ScheduleUpdate {
    name?: string;
    hour?: number;
    minute?: number;
    max_size_gb?: number;
    min_quality?: number;
    enabled?: boolean;
}

export interface FolderItem {
    name: string;
    size_gb: number;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
}

export interface ServiceSettings {
    tmdb_api_key?: string;
    prowlarr_url?: string;
    prowlarr_api_key?: string;
    qbittorrent_host?: string;
    qbittorrent_username?: string;
    qbittorrent_password?: string;
    download_path?: string;
}

class ApiService {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: API_BASE,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Add request interceptor to include auth token
        this.client.interceptors.request.use(
            (config) => {
                const token = this.getToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Add response interceptor for error handling
        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    this.logout();
                    window.location.href = '/#/login';
                }
                return Promise.reject(error);
            }
        );
    }

    private getToken(): string | null {
        return localStorage.getItem('media_downloader_token');
    }

    private setToken(token: string) {
        localStorage.setItem('media_downloader_token', token);
    }

    private removeToken() {
        localStorage.removeItem('media_downloader_token');
        localStorage.removeItem('media_downloader_user');
    }

    // Auth
    async login(username: string, password: string): Promise<void> {
        try {
            const response = await this.client.post('/auth/login', {
                username,
                password,
            });

            const { access_token } = response.data;
            this.setToken(access_token);
            localStorage.setItem('media_downloader_user', username);
        } catch (error: any) {
            throw new Error(error.response?.data?.detail || 'Login failed');
        }
    }

    logout() {
        this.removeToken();
    }

    isAuthenticated(): boolean {
        return !!this.getToken();
    }

    getCurrentUser(): string {
        return localStorage.getItem('media_downloader_user') || 'Guest';
    }

    async changePassword(currentPassword: string, newPassword: string): Promise<void> {
        try {
            await this.client.post('/auth/change-password', {
                current_password: currentPassword,
                new_password: newPassword,
            });
        } catch (error: any) {
            throw new Error(error.response?.data?.detail || 'Failed to change password');
        }
    }

    async changeUsername(newUsername: string, password: string): Promise<void> {
        try {
            await this.client.post('/auth/change-username', {
                new_username: newUsername,
                password: password,
            });
            localStorage.setItem('media_downloader_user', newUsername);
        } catch (error: any) {
            throw new Error(error.response?.data?.detail || 'Failed to change username');
        }
    }

    // Movies
    async searchMovies(query: string, limit: number = 10): Promise<Movie[]> {
        const res = await this.client.get('/movies/search', {
            params: { query, limit }
        });
        return res.data;
    }

    async getPopularMovies(limit: number = 20): Promise<Movie[]> {
        const res = await this.client.get('/movies/popular', {
            params: { limit }
        });
        return res.data;
    }

    async getMovieDetails(tmdbId: number): Promise<Movie> {
        const res = await this.client.get(`/movies/${tmdbId}`);
        return res.data;
    }

    // Wishlist
    async getWishlist(status?: string): Promise<WishlistItem[]> {
        const res = await this.client.get('/wishlist', {
            params: status ? { status } : {}
        });
        return res.data;
    }

    async addToWishlist(tmdbId: number): Promise<WishlistItem> {
        const res = await this.client.post(`/wishlist/${tmdbId}`);
        return res.data;
    }

    async removeFromWishlist(tmdbId: number): Promise<void> {
        await this.client.delete(`/wishlist/${tmdbId}`);
    }

    // Downloads
    async processWishlist(maxSizeGb: number = 3, minQuality: number = 720): Promise<ProcessResult> {
        const res = await this.client.post('/download/process', null, {
            params: { max_size_gb: maxSizeGb, min_quality: minQuality }
        });
        return res.data;
    }

    async getDownloadStatus(): Promise<{ connected: boolean; count: number; downloads: Download[] }> {
        const res = await this.client.get('/download/status');
        return res.data;
    }

    async pauseDownload(hash: string): Promise<void> {
        await this.client.post(`/download/pause/${hash}`);
    }

    async resumeDownload(hash: string): Promise<void> {
        await this.client.post(`/download/resume/${hash}`);
    }

    async deleteDownload(hash: string, deleteFiles: boolean = false): Promise<void> {
        await this.client.delete(`/download/${hash}`, {
            params: { delete_files: deleteFiles }
        });
    }

    async pauseAll(): Promise<void> {
        await this.client.post('/download/pause-all');
    }

    async resumeAll(): Promise<void> {
        await this.client.post('/download/resume-all');
    }

    // Schedules
    async getSchedules(): Promise<Schedule[]> {
        const res = await this.client.get('/schedules');
        return res.data;
    }

    async getSchedule(id: number): Promise<Schedule> {
        const res = await this.client.get(`/schedules/${id}`);
        return res.data;
    }

    async createSchedule(data: ScheduleCreate): Promise<Schedule> {
        const res = await this.client.post('/schedules', data);
        return res.data;
    }

    async updateSchedule(id: number, data: ScheduleUpdate): Promise<Schedule> {
        const res = await this.client.put(`/schedules/${id}`, data);
        return res.data;
    }

    async deleteSchedule(id: number): Promise<void> {
        await this.client.delete(`/schedules/${id}`);
    }

    async toggleSchedule(id: number): Promise<Schedule> {
        const res = await this.client.post(`/schedules/${id}/toggle`);
        return res.data;
    }

    async runScheduleNow(id: number): Promise<void> {
        await this.client.post(`/schedules/${id}/run`);
    }

    // Storage
    async getStorageFolders(): Promise<FolderItem[]> {
        const res = await this.client.get('/storage');
        return res.data;
    }

    async deleteStorageFolder(name: string): Promise<{ success: boolean; message: string }> {
        const res = await this.client.delete(`/storage/${encodeURIComponent(name)}`);
        return res.data;
    }

    // Health
    async healthCheck(): Promise<{ status: string; qbittorrent_connected: boolean }> {
        const res = await this.client.get('/health');
        return res.data;
    }

    // Service Settings
    async getServiceSettings(): Promise<ServiceSettings> {
        const res = await this.client.get('/settings');
        return res.data;
    }

    async updateServiceSettings(settings: ServiceSettings): Promise<void> {
        try {
            await this.client.put('/settings', settings);
        } catch (error: any) {
            throw new Error(error.response?.data?.detail || 'Failed to update settings');
        }
    }
}

export const api = new ApiService();

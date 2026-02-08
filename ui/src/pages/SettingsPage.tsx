import React, { useState, useEffect } from 'react';
import { Key, Save, Loader2, CheckCircle, XCircle, User, Settings2, Film, Search, Download, FolderOpen, Eye, EyeOff } from 'lucide-react';
import { api, ServiceSettings } from '../api';

const SettingsPage: React.FC = () => {
    // Password change state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Username change state
    const [newUsername, setNewUsername] = useState('');
    const [usernamePassword, setUsernamePassword] = useState('');
    const [usernameLoading, setUsernameLoading] = useState(false);
    const [usernameMessage, setUsernameMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Service settings state
    const [serviceSettings, setServiceSettings] = useState<ServiceSettings>({});
    const [serviceLoading, setServiceLoading] = useState(false);
    const [serviceMessage, setServiceMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [loadingSettings, setLoadingSettings] = useState(true);

    // Visibility toggles for sensitive fields
    const [showTmdbKey, setShowTmdbKey] = useState(false);
    const [showProwlarrKey, setShowProwlarrKey] = useState(false);
    const [showQbtPassword, setShowQbtPassword] = useState(false);

    // Load service settings on mount
    useEffect(() => {
        loadServiceSettings();
    }, []);

    const loadServiceSettings = async () => {
        try {
            const settings = await api.getServiceSettings();
            setServiceSettings(settings);
        } catch (error) {
            console.error('Failed to load settings:', error);
        } finally {
            setLoadingSettings(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
            return;
        }

        setLoading(true);

        try {
            await api.changePassword(currentPassword, newPassword);
            setMessage({ type: 'success', text: 'Password changed successfully' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to change password' });
        } finally {
            setLoading(false);
        }
    };

    const handleUsernameChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setUsernameMessage(null);

        if (!newUsername.trim()) {
            setUsernameMessage({ type: 'error', text: 'Username cannot be empty' });
            return;
        }

        if (newUsername.length < 3) {
            setUsernameMessage({ type: 'error', text: 'Username must be at least 3 characters long' });
            return;
        }

        setUsernameLoading(true);

        try {
            await api.changeUsername(newUsername, usernamePassword);
            setUsernameMessage({ type: 'success', text: 'Username changed successfully' });
            setNewUsername('');
            setUsernamePassword('');
        } catch (error: any) {
            setUsernameMessage({ type: 'error', text: error.message || 'Failed to change username' });
        } finally {
            setUsernameLoading(false);
        }
    };

    const handleServiceSettingsSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setServiceMessage(null);
        setServiceLoading(true);

        try {
            await api.updateServiceSettings(serviceSettings);
            setServiceMessage({ type: 'success', text: 'Service settings saved successfully' });
        } catch (error: any) {
            setServiceMessage({ type: 'error', text: error.message || 'Failed to save settings' });
        } finally {
            setServiceLoading(false);
        }
    };

    const updateServiceSetting = (key: keyof ServiceSettings, value: string) => {
        setServiceSettings(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h2 className="text-2xl font-bold text-white">Settings</h2>
                <p className="text-slate-400 text-sm">Manage your account and service configurations.</p>
            </div>

            {/* Service Configuration Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Settings2 size={20} className="text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Service Configuration</h3>
                        <p className="text-xs text-slate-500">Configure external service connections</p>
                    </div>
                </div>

                {loadingSettings ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 size={24} className="animate-spin text-primary" />
                    </div>
                ) : (
                    <form onSubmit={handleServiceSettingsSave} className="space-y-6">
                        {serviceMessage && (
                            <div className={`px-4 py-3 rounded-xl flex items-center gap-3 ${serviceMessage.type === 'success'
                                ? 'bg-green-500/10 border border-green-500/50 text-green-500'
                                : 'bg-red-500/10 border border-red-500/50 text-red-500'
                                }`}>
                                {serviceMessage.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                                <span className="text-sm font-medium">{serviceMessage.text}</span>
                            </div>
                        )}

                        {/* TMDB Section */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-slate-300">
                                <Film size={16} />
                                <span className="text-sm font-semibold">TMDB (The Movie Database)</span>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-slate-400">API Key</label>
                                <div className="relative">
                                    <input
                                        type={showTmdbKey ? 'text' : 'password'}
                                        value={serviceSettings.tmdb_api_key || ''}
                                        onChange={(e) => updateServiceSetting('tmdb_api_key', e.target.value)}
                                        placeholder="Enter TMDB API key"
                                        className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 pr-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowTmdbKey(!showTmdbKey)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                    >
                                        {showTmdbKey ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Prowlarr Section */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-slate-300">
                                <Search size={16} />
                                <span className="text-sm font-semibold">Prowlarr (Torrent Search)</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm text-slate-400">URL</label>
                                    <input
                                        type="text"
                                        value={serviceSettings.prowlarr_url || ''}
                                        onChange={(e) => updateServiceSetting('prowlarr_url', e.target.value)}
                                        placeholder="http://localhost:9696"
                                        className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm text-slate-400">API Key</label>
                                    <div className="relative">
                                        <input
                                            type={showProwlarrKey ? 'text' : 'password'}
                                            value={serviceSettings.prowlarr_api_key || ''}
                                            onChange={(e) => updateServiceSetting('prowlarr_api_key', e.target.value)}
                                            placeholder="Enter Prowlarr API key"
                                            className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 pr-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowProwlarrKey(!showProwlarrKey)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                        >
                                            {showProwlarrKey ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* qBittorrent Section */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-slate-300">
                                <Download size={16} />
                                <span className="text-sm font-semibold">qBittorrent (Download Client)</span>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm text-slate-400">Host URL</label>
                                    <input
                                        type="text"
                                        value={serviceSettings.qbittorrent_host || ''}
                                        onChange={(e) => updateServiceSetting('qbittorrent_host', e.target.value)}
                                        placeholder="http://localhost:8080"
                                        className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm text-slate-400">Username</label>
                                        <input
                                            type="text"
                                            value={serviceSettings.qbittorrent_username || ''}
                                            onChange={(e) => updateServiceSetting('qbittorrent_username', e.target.value)}
                                            placeholder="Enter username"
                                            className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-slate-400">Password</label>
                                        <div className="relative">
                                            <input
                                                type={showQbtPassword ? 'text' : 'password'}
                                                value={serviceSettings.qbittorrent_password || ''}
                                                onChange={(e) => updateServiceSetting('qbittorrent_password', e.target.value)}
                                                placeholder="Enter password"
                                                className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 pr-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowQbtPassword(!showQbtPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                            >
                                                {showQbtPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Download Path Section */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-slate-300">
                                <FolderOpen size={16} />
                                <span className="text-sm font-semibold">Download Path</span>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-slate-400">Path</label>
                                <input
                                    type="text"
                                    value={serviceSettings.download_path || ''}
                                    onChange={(e) => updateServiceSetting('download_path', e.target.value)}
                                    placeholder="/downloads or D:/Downloads"
                                    className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={serviceLoading}
                            className="w-full md:w-auto px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {serviceLoading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                            {serviceLoading ? 'Saving...' : 'Save Configuration'}
                        </button>
                    </form>
                )}
            </div>

            {/* Password Change Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Key size={20} className="text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Change Password</h3>
                        <p className="text-xs text-slate-500">Update your account password</p>
                    </div>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-4">
                    {message && (
                        <div className={`px-4 py-3 rounded-xl flex items-center gap-3 ${message.type === 'success'
                            ? 'bg-green-500/10 border border-green-500/50 text-green-500'
                            : 'bg-red-500/10 border border-red-500/50 text-red-500'
                            }`}>
                            {message.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                            <span className="text-sm font-medium">{message.text}</span>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-300">Current Password</label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password"
                            className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-300">New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-300">Confirm New Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full md:w-auto px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>

            {/* Username Change Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <User size={20} className="text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Change Username</h3>
                        <p className="text-xs text-slate-500">Update your account username</p>
                    </div>
                </div>

                <form onSubmit={handleUsernameChange} className="space-y-4">
                    {usernameMessage && (
                        <div className={`px-4 py-3 rounded-xl flex items-center gap-3 ${usernameMessage.type === 'success'
                            ? 'bg-green-500/10 border border-green-500/50 text-green-500'
                            : 'bg-red-500/10 border border-red-500/50 text-red-500'
                            }`}>
                            {usernameMessage.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                            <span className="text-sm font-medium">{usernameMessage.text}</span>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-300">New Username</label>
                        <input
                            type="text"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            placeholder="Enter new username"
                            className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-300">Confirm Password</label>
                        <input
                            type="password"
                            value={usernamePassword}
                            onChange={(e) => setUsernamePassword(e.target.value)}
                            placeholder="Enter your password to confirm"
                            className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={usernameLoading}
                        className="w-full md:w-auto px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {usernameLoading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                        {usernameLoading ? 'Saving...' : 'Change Username'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SettingsPage;

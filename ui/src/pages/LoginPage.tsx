import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../api';

interface LoginPageProps {
    onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await api.login(username, password);
            onLogin();
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Failed to login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md animate-fade-in">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="mb-6 inline-block">
                        <img src="/media-downloader.svg" alt="Media Downloader" className="w-16 h-16" />
                    </div>
                    <h1 className="text-4xl font-extrabold text-white mb-2">Media Downloader</h1>
                    <p className="text-slate-400">Your personal media automation center.</p>
                </div>

                <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-xl flex items-center gap-3 animate-shake">
                                <AlertCircle size={20} />
                                <span className="text-sm font-medium">{error}</span>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-300 ml-1">Username</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="admin"
                                    className="w-full bg-slate-800 border border-slate-700 text-white pl-12 pr-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-slate-600"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-300 ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-800 border border-slate-700 text-white pl-12 pr-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-slate-600"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                        >
                            {loading ? <Loader2 size={24} className="animate-spin" /> : 'Sign In'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;

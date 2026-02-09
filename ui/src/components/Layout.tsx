import { useState, ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import {
    Search,
    Heart,
    Download,
    ChevronRight,
    Calendar,
    HardDrive,
    Settings,
    LogOut,
    User,
    Menu,
    X
} from 'lucide-react';
import { api } from '../api';

interface LayoutProps {
    children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const username = api.getCurrentUser();

    const handleLogout = () => {
        api.logout();
        window.location.href = '/#/login';
        window.location.reload();
    };

    const navItems = [
        { name: 'Discover', path: '/', icon: <Search size={20} />, description: 'Search movies' },
        { name: 'Wishlist', path: '/wishlist', icon: <Heart size={20} />, description: 'Saved movies' },
        { name: 'Downloads', path: '/downloads', icon: <Download size={20} />, description: 'Active downloads' },
        { name: 'Schedules', path: '/schedules', icon: <Calendar size={20} />, description: 'Automation' },
        { name: 'Storage', path: '/storage', icon: <HardDrive size={20} />, description: 'Manage files' },
        { name: 'Settings', path: '/settings', icon: <Settings size={20} />, description: 'Account settings' },
    ];

    return (
        <div className="flex h-screen text-slate-100 overflow-hidden bg-slate-950">
            {/* Desktop Sidebar - hidden on mobile */}
            <aside className="w-72 bg-slate-900 border-r border-slate-800 flex-col hidden lg:flex flex-shrink-0">
                {/* Logo */}
                <div className="p-6 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <img src="/media-downloader.svg" alt="Logo" className="w-10 h-10" />
                        <div>
                            <h1 className="text-lg font-bold text-white tracking-tight">Media Downloader</h1>
                            <p className="text-xs text-slate-500">Auto-Download Manager</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-3">Menu</p>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                                }`
                            }
                        >
                            <span className="group-hover:scale-110 transition-transform duration-200">{item.icon}</span>
                            <div className="flex-1">
                                <span className="font-medium text-sm">{item.name}</span>
                                <p className="text-[10px] text-slate-500 group-hover:text-slate-400">{item.description}</p>
                            </div>
                            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </NavLink>
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 mb-3">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300">
                            <User size={16} />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-white truncate">{username}</span>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">User</span>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Menu Drawer */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />

                    {/* Sidebar */}
                    <div className="absolute left-0 top-0 bottom-0 w-72 bg-slate-900 border-r border-slate-800 flex flex-col shadow-2xl animate-slide-in-left">
                        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <img src="/media-downloader.svg" alt="Logo" className="w-8 h-8 rounded-lg" />
                                <span className="font-bold text-white">Menu</span>
                            </div>
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="p-1 text-slate-400 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                                        }`
                                    }
                                >
                                    <span className="group-hover:scale-110 transition-transform duration-200">{item.icon}</span>
                                    <div className="flex-1">
                                        <span className="font-medium text-sm">{item.name}</span>
                                        <p className="text-[10px] text-slate-500 group-hover:text-slate-400">{item.description}</p>
                                    </div>
                                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </NavLink>
                            ))}
                        </nav>

                        <div className="p-4 border-t border-slate-800">
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 mb-3">
                                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300">
                                    <User size={16} />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-semibold text-white truncate">{username}</span>
                                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">User</span>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                            >
                                <LogOut size={20} />
                                <span className="font-medium">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile Header - fixed at top, only visible on mobile */}
                <header className="lg:hidden bg-slate-900 border-b border-slate-800 flex-shrink-0 sticky top-0 z-30">
                    <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="p-1 -ml-1 text-slate-400 hover:text-white transition-colors"
                            >
                                <Menu size={24} />
                            </button>
                            <div className="flex items-center gap-2">
                                <img src="/media-downloader.svg" alt="Logo" className="w-8 h-8 rounded-lg object-contain" />
                                <span className="font-bold text-white">Media Downloader</span>
                            </div>
                        </div>
                        <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-400">
                            <LogOut size={20} />
                        </button>
                    </div>
                </header>

                {/* Scrollable Content */}
                <main className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950">
                    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;

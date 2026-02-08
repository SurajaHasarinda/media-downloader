import { ReactNode } from 'react';
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
    User
} from 'lucide-react';
import { api } from '../api';

interface LayoutProps {
    children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
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
                        <img src="/media-downloader.png" alt="Logo" className="w-10 h-10" />
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

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile Header - fixed at top, only visible on mobile */}
                <header className="lg:hidden bg-slate-900 border-b border-slate-800 flex-shrink-0">
                    {/* Top bar with logo and logout */}
                    <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-2">
                            <img src="/media-downloader.png" alt="Logo" className="w-8 h-8 rounded-lg object-contain" />
                            <span className="font-bold text-white">Media Downloader</span>
                        </div>
                        <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-400">
                            <LogOut size={20} />
                        </button>
                    </div>

                    {/* Bottom nav */}
                    <div className="flex border-t border-slate-800 overflow-x-auto">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors min-w-[70px] ${isActive ? 'text-primary bg-primary/5' : 'text-slate-400'
                                    }`
                                }
                            >
                                {item.icon}
                                <span className="whitespace-nowrap">{item.name}</span>
                            </NavLink>
                        ))}
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

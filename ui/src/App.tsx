import { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { api } from './api';
import Layout from './components/Layout';
import SearchPage from './pages/SearchPage';
import WishlistPage from './pages/WishlistPage';
import DownloadsPage from './pages/DownloadsPage';
import SchedulesPage from './pages/SchedulesPage';
import StoragePage from './pages/StoragePage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    if (!api.isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(api.isAuthenticated());

    return (
        <HashRouter>
            <Routes>
                <Route path="/login" element={
                    isAuthenticated ? <Navigate to="/" /> : <LoginPage onLogin={() => setIsAuthenticated(true)} />
                } />
                <Route path="/" element={
                    <ProtectedRoute>
                        <Layout>
                            <SearchPage />
                        </Layout>
                    </ProtectedRoute>
                } />
                <Route path="/wishlist" element={
                    <ProtectedRoute>
                        <Layout>
                            <WishlistPage />
                        </Layout>
                    </ProtectedRoute>
                } />
                <Route path="/downloads" element={
                    <ProtectedRoute>
                        <Layout>
                            <DownloadsPage />
                        </Layout>
                    </ProtectedRoute>
                } />
                <Route path="/schedules" element={
                    <ProtectedRoute>
                        <Layout>
                            <SchedulesPage />
                        </Layout>
                    </ProtectedRoute>
                } />
                <Route path="/storage" element={
                    <ProtectedRoute>
                        <Layout>
                            <StoragePage />
                        </Layout>
                    </ProtectedRoute>
                } />
                <Route path="/settings" element={
                    <ProtectedRoute>
                        <Layout>
                            <SettingsPage />
                        </Layout>
                    </ProtectedRoute>
                } />
            </Routes>
        </HashRouter>
    );
}

export default App;

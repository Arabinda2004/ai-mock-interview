import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const getFullName = () => {
        if (user?.name) return user.name;
        if (user?.firstName && user?.lastName) return `${user.firstName} ${user.lastName}`;
        return user?.email || 'User';
    };

    const getUserSubtitle = () => {
        return user?.primaryRole || 'Interview Candidate';
    };

    const getInitials = () => {
        const fullName = getFullName();
        const chunks = fullName.trim().split(' ').filter(Boolean);

        if (chunks.length <= 1) {
            return chunks[0]?.charAt(0)?.toUpperCase() || 'U';
        }

        return `${chunks[0].charAt(0)}${chunks[chunks.length - 1].charAt(0)}`.toUpperCase();
    };

    const isActiveRoute = (path) => location.pathname === path;

    const navLinkClasses = (path) =>
        `pb-1 text-sm font-semibold transition ${isActiveRoute(path)
            ? 'border-b-2 border-blue-600 text-blue-600'
            : 'border-b-2 border-transparent text-slate-500 hover:text-blue-600'
        }`;

    return (
        <div className="min-h-screen bg-[#f1f3f8] text-slate-900">
            <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
                <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-8">
                        <Link to="/dashboard" className="text-lg font-semibold text-slate-900">
                            AI Interview Platform
                        </Link>

                        <nav className="hidden items-center gap-6 md:flex">
                            <Link to="/dashboard" className={navLinkClasses('/dashboard')}>
                                Dashboard
                            </Link>
                            <Link to="/history" className={navLinkClasses('/history')}>
                                History
                            </Link>
                            <Link to="/profile" className={navLinkClasses('/profile')}>
                                Profile
                            </Link>
                        </nav>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/interview-setup')}
                            className="hidden rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 md:inline-flex"
                        >
                            New Interview
                        </button>

                        <div className="hidden h-8 w-px bg-slate-200 md:block" />

                        <div className="hidden text-right sm:block">
                            <p className="text-xs font-semibold text-slate-800">{getFullName()}</p>
                            <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">{getUserSubtitle()}</p>
                        </div>

                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white shadow-sm">
                            {getInitials()}
                        </div>

                        <button
                            onClick={handleLogout}
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-red-600"
                            aria-label="Logout"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                {children}
            </main>

            <footer className="mt-14 px-4 pb-7 sm:px-6 lg:px-8">
                <div className="mx-auto flex w-full max-w-[1500px] flex-col items-start justify-between gap-4 border-t border-slate-200 pt-6 text-xs text-slate-500 md:flex-row md:items-center">
                    <div>
                        <p className="text-base font-semibold text-slate-800">AI Interview Platform</p>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.14em]">© 2026 AI Interview Platform. All rights reserved.</p>
                    </div>

                    <div className="flex items-center gap-6">
                        <Link to="#" className="transition hover:text-slate-700">Privacy Policy</Link>
                        <Link to="#" className="transition hover:text-slate-700">Terms of Service</Link>
                        <Link to="#" className="transition hover:text-slate-700">Support</Link>
                        <Link to="#" className="transition hover:text-slate-700">Contact</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Layout;

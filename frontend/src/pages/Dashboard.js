import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Award,
    BarChart3,
    BrainCircuit,
    Briefcase,
    Calendar,
    ChevronRight,
    History,
    PlusCircle,
    Sparkles,
    Target,
    User,
} from 'lucide-react';
import interviewService from '../services/interviewService';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        totalInterviews: 0,
        avgScore: 0,
        highestScore: 0,
        thisWeek: 0,
    });
    const [recentInterviews, setRecentInterviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            const statsResponse = await interviewService.getInterviewStatistics();
            if (statsResponse?.success) {
                setStats({
                    totalInterviews: Number(statsResponse?.data?.totalInterviews || 0),
                    avgScore: Number(statsResponse?.data?.avgScore || 0),
                    highestScore: Number(statsResponse?.data?.highestScore || 0),
                    thisWeek: Number(statsResponse?.data?.thisWeek || 0),
                });
            }

            const historyResponse = await interviewService.getInterviewHistory(1, 3);
            if (historyResponse?.success) {
                setRecentInterviews(Array.isArray(historyResponse?.data?.interviews) ? historyResponse.data.interviews : []);
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            loadDashboardDataFromLocalStorage();
        } finally {
            setLoading(false);
        }
    };

    const loadDashboardDataFromLocalStorage = () => {
        try {
            const history = JSON.parse(localStorage.getItem('interviewHistory') || '[]');
            const totalInterviews = history.length;
            const scores = history.map((item) => Number(item?.overallScore || 0));
            const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
            const highestScore = scores.length > 0 ? Math.max(...scores) : 0;

            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            const thisWeek = history.filter((item) => new Date(item?.date) > oneWeekAgo).length;

            setStats({ totalInterviews, avgScore, highestScore, thisWeek });
            setRecentInterviews(history.slice(0, 3));
        } catch (error) {
            console.error('Error loading fallback dashboard data:', error);
            setStats({ totalInterviews: 0, avgScore: 0, highestScore: 0, thisWeek: 0 });
            setRecentInterviews([]);
        }
    };

    const getFullName = () => {
        if (user?.name) return user.name;
        if (user?.firstName && user?.lastName) return `${user.firstName} ${user.lastName}`;
        return user?.email || 'User';
    };

    const getInitials = () => {
        const fullName = getFullName();
        if (!fullName) return 'U';

        const chunks = fullName.trim().split(' ').filter(Boolean);
        if (chunks.length === 1) {
            return chunks[0].charAt(0).toUpperCase();
        }

        return `${chunks[0].charAt(0)}${chunks[chunks.length - 1].charAt(0)}`.toUpperCase();
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const formatInterviewDate = (value) => {
        if (!value) return 'Unknown date';
        const date = new Date(value);

        return date.toLocaleString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    const getInterviewScore = (interview) => {
        const score = Number(interview?.overallScore || interview?.score || 0);
        if (Number.isNaN(score)) return 0;
        return Math.max(0, Math.min(100, score));
    };

    const getScoreBadgeClasses = (score) => {
        if (score >= 85) return 'bg-emerald-100 text-emerald-700';
        if (score >= 70) return 'bg-cyan-100 text-cyan-700';
        return 'bg-amber-100 text-amber-700';
    };

    const openInterviewResult = (interview) => {
        const interviewId = interview?.interviewId || interview?.id;
        if (interviewId) {
            navigate(`/interview/results/${interviewId}`);
            return;
        }

        navigate('/results', { state: { results: interview } });
    };

    const memberSince = useMemo(() => {
        if (!user?.createdAt) return 'Recently joined';
        return new Date(user.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
        });
    }, [user]);

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-56 rounded-3xl bg-blue-200/60" />
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="h-36 rounded-3xl bg-white border border-slate-200" />
                    ))}
                </div>
                <div className="h-44 rounded-3xl bg-white border border-slate-200" />
                <div className="grid gap-6 lg:grid-cols-[1.8fr,0.9fr]">
                    <div className="h-72 rounded-3xl bg-white border border-slate-200" />
                    <div className="h-72 rounded-3xl bg-white border border-slate-200" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 px-7 py-7 text-white shadow-xl shadow-blue-400/15 sm:px-8 sm:py-9">
                <div className="absolute -right-8 top-1/2 hidden h-40 w-40 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 lg:flex">
                    <BrainCircuit className="h-16 w-16 text-white/80" />
                </div>

                <span className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]">
                    <Sparkles className="mr-2 h-3.5 w-3.5" />
                    {stats.thisWeek} Interviews This Week
                </span>

                <h1 className="mt-5 text-3xl font-semibold sm:text-5xl">
                    {getGreeting()}, {getFullName()}.
                </h1>
                <p className="mt-4 max-w-2xl text-sm text-blue-100 sm:text-xl sm:leading-8">
                    Ready to master your next interview? Keep building momentum with your AI-guided practice sessions.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                    <button
                        onClick={() => navigate('/interview-setup')}
                        className="inline-flex items-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white/80"
                    >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Start New Interview
                    </button>
                    <button
                        onClick={() => navigate('/history')}
                        className="inline-flex items-center rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/80"
                    >
                        <History className="mr-2 h-4 w-4" />
                        View History
                    </button>
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-5 flex items-start justify-between">
                        <span className="rounded-xl bg-blue-100 p-3 text-blue-700">
                            <BarChart3 className="h-5 w-5" />
                        </span>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Total</p>
                    </div>
                    <p className="text-4xl font-semibold text-slate-900">{stats.totalInterviews}</p>
                    <p className="mt-1 text-sm text-slate-500">Interviews Completed</p>
                </article>

                <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-5 flex items-start justify-between">
                        <span className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
                            <Target className="h-5 w-5" />
                        </span>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-500">Success</p>
                    </div>
                    <p className="text-4xl font-semibold text-emerald-700">{stats.avgScore}%</p>
                    <p className="mt-1 text-sm text-slate-500">Average Score</p>
                </article>

                <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-5 flex items-start justify-between">
                        <span className="rounded-xl bg-cyan-100 p-3 text-cyan-700">
                            <Award className="h-5 w-5" />
                        </span>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-500">Peak</p>
                    </div>
                    <p className="text-4xl font-semibold text-blue-700">{stats.highestScore}%</p>
                    <p className="mt-1 text-sm text-slate-500">Highest Score</p>
                </article>

                <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-5 flex items-start justify-between">
                        <span className="rounded-xl bg-amber-100 p-3 text-amber-700">
                            <Calendar className="h-5 w-5" />
                        </span>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-500">Current</p>
                    </div>
                    <p className="text-4xl font-semibold text-slate-900">{stats.thisWeek}</p>
                    <p className="mt-1 text-sm text-slate-500">Interviews This Week</p>
                </article>
            </section>

            <section>
                <div className="mb-4 flex items-center gap-3">
                    <h2 className="text-2xl font-semibold text-slate-900">Quick Actions</h2>
                    <div className="h-px flex-1 bg-slate-300" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <button
                        onClick={() => navigate('/interview-setup')}
                        className="rounded-3xl border border-slate-200 bg-[#eef2ff] p-5 text-left transition hover:border-blue-300 hover:shadow-sm"
                    >
                        <span className="inline-flex rounded-xl bg-blue-600 p-3 text-white">
                            <PlusCircle className="h-5 w-5" />
                        </span>
                        <p className="mt-4 text-xl font-semibold text-slate-900">Start New Interview</p>
                        <p className="mt-2 text-sm text-slate-600">Launch a tailored AI coaching session now.</p>
                    </button>

                    <button
                        onClick={() => navigate('/history')}
                        className="rounded-3xl border border-slate-200 bg-[#eef2ff] p-5 text-left transition hover:border-blue-300 hover:shadow-sm"
                    >
                        <span className="inline-flex rounded-xl bg-blue-100 p-3 text-blue-700">
                            <History className="h-5 w-5" />
                        </span>
                        <p className="mt-4 text-xl font-semibold text-slate-900">Interview History</p>
                        <p className="mt-2 text-sm text-slate-600">Review past transcripts and feedback scores.</p>
                    </button>

                    <button
                        onClick={() => navigate('/profile')}
                        className="rounded-3xl border border-slate-200 bg-[#eef2ff] p-5 text-left transition hover:border-blue-300 hover:shadow-sm"
                    >
                        <span className="inline-flex rounded-xl bg-blue-100 p-3 text-blue-700">
                            <User className="h-5 w-5" />
                        </span>
                        <p className="mt-4 text-xl font-semibold text-slate-900">View Profile</p>
                        <p className="mt-2 text-sm text-slate-600">Manage your career goals and preferences.</p>
                    </button>
                </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.8fr,0.9fr]">
                <div>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-2xl font-semibold text-slate-900">Recent Interviews</h2>
                        <button
                            onClick={() => navigate('/history')}
                            className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
                        >
                            View All
                        </button>
                    </div>

                    <div className="space-y-3">
                        {recentInterviews.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
                                <p className="text-lg font-medium text-slate-700">No interviews yet</p>
                                <p className="mt-2 text-sm text-slate-500">Start your first session to see your progress timeline.</p>
                                <button
                                    onClick={() => navigate('/interview-setup')}
                                    className="mt-5 inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                                >
                                    Start First Interview
                                </button>
                            </div>
                        ) : (
                            recentInterviews.map((interview, index) => {
                                const score = getInterviewScore(interview);

                                return (
                                    <button
                                        key={interview?.interviewId || interview?.id || index}
                                        onClick={() => openInterviewResult(interview)}
                                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-blue-300 hover:shadow-sm"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="rounded-full bg-blue-100 p-2 text-blue-700">
                                                <Briefcase className="h-4 w-4" />
                                            </span>

                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-base font-semibold text-slate-900">
                                                    {interview?.jobRole || interview?.role || 'Interview Session'}
                                                </p>
                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    {formatInterviewDate(interview?.date || interview?.createdAt)}
                                                    {' • '}
                                                    {interview?.interviewType || 'Mixed'}
                                                    {' • '}
                                                    {interview?.totalQuestions || 0} Questions
                                                </p>
                                            </div>

                                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getScoreBadgeClasses(score)}`}>
                                                {score}%
                                            </span>
                                            <ChevronRight className="h-4 w-4 text-slate-400" />
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                <aside>
                    <h2 className="mb-4 text-2xl font-semibold text-slate-900">Executive Profile</h2>
                    <div className="rounded-3xl border border-slate-200 bg-[#eef2ff] p-6">
                        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-slate-900 text-3xl font-bold text-white">
                            {getInitials()}
                        </div>

                        <p className="mt-5 text-center text-3xl font-semibold text-slate-900">{getFullName()}</p>
                        <p className="mt-1 text-center text-sm text-slate-600">{user?.email || 'No email available'}</p>

                        <div className="mt-7 space-y-3 text-sm">
                            <div className="flex items-center justify-between text-slate-500">
                                <span className="uppercase tracking-[0.14em]">Status</span>
                                <span className="font-medium text-blue-700">Member since {memberSince}</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-500">
                                <span className="uppercase tracking-[0.14em]">Level</span>
                                <span className="font-medium text-slate-700">{user?.experienceLevel || 'Professional Tier'}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/profile')}
                            className="mt-6 flex w-full items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                            <User className="mr-2 h-4 w-4" />
                            Edit Career Goals
                        </button>
                    </div>
                </aside>
            </section>
        </div>
    );
};

export default Dashboard;

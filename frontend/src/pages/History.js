import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    Award,
    BarChart3,
    Calendar,
    ChevronDown,
    Clock,
    Download,
    Eye,
    Search,
    Target,
    Trash2,
} from 'lucide-react';
import interviewService from '../services/interviewService';
import { useConfirmationDialog } from '../context/ConfirmationDialogContext';

const History = () => {
    const navigate = useNavigate();
    const { confirm } = useConfirmationDialog();
    const [history, setHistory] = useState([]);
    const [filteredHistory, setFilteredHistory] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [sortBy, setSortBy] = useState('date');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalInterviews: 0,
        avgScore: 0,
        highestScore: 0,
        totalTime: 0,
    });

    useEffect(() => {
        loadHistory();
    }, []);

    useEffect(() => {
        filterAndSortHistory();
    }, [history, searchTerm, filterType, sortBy]);

    const loadHistory = async () => {
        try {
            setLoading(true);
            const response = await interviewService.getInterviewHistory(1, 100);

            if (response?.success) {
                const interviews = Array.isArray(response?.data?.interviews) ? response.data.interviews : [];
                setHistory(interviews);
                calculateStats(interviews);
            }
        } catch (error) {
            console.error('Error loading history from API:', error);
            loadHistoryFromLocalStorage();
        } finally {
            setLoading(false);
        }
    };

    const loadHistoryFromLocalStorage = () => {
        try {
            const savedHistory = JSON.parse(localStorage.getItem('interviewHistory') || '[]');
            setHistory(savedHistory);
            calculateStats(savedHistory);
        } catch (error) {
            console.error('Error loading history from localStorage:', error);
            setHistory([]);
            calculateStats([]);
        }
    };

    const parseMinutes = (value) => {
        if (!value) return 30;

        if (typeof value === 'number') {
            return value;
        }

        const text = String(value).toLowerCase();
        const minutesMatch = text.match(/(\d+)\s*m/);
        const secondsMatch = text.match(/(\d+)\s*s/);

        const minutes = minutesMatch ? Number(minutesMatch[1]) : 0;
        const seconds = secondsMatch ? Number(secondsMatch[1]) : 0;

        if (minutes === 0 && seconds === 0) {
            return 30;
        }

        return minutes + Math.ceil(seconds / 60);
    };

    const calculateStats = (historyData) => {
        if (!Array.isArray(historyData) || historyData.length === 0) {
            setStats({ totalInterviews: 0, avgScore: 0, highestScore: 0, totalTime: 0 });
            return;
        }

        const totalInterviews = historyData.length;
        const scores = historyData.map((item) => Number(item?.overallScore || item?.score || 0));
        const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / totalInterviews);
        const highestScore = Math.max(...scores);
        const totalTime = historyData.reduce((acc, item) => acc + parseMinutes(item?.timeTaken), 0);

        setStats({
            totalInterviews,
            avgScore,
            highestScore,
            totalTime,
        });
    };

    const normalizeType = (value) => {
        const text = (value || 'mixed').toString().toLowerCase();
        if (text.includes('tech')) return 'technical';
        if (text.includes('behavior')) return 'behavioral';
        return 'mixed';
    };

    const filterAndSortHistory = () => {
        const filtered = [...history]
            .filter((item) => {
                if (!searchTerm.trim()) return true;
                const query = searchTerm.toLowerCase();
                return (
                    item?.jobRole?.toLowerCase().includes(query) ||
                    item?.interviewType?.toLowerCase().includes(query)
                );
            })
            .filter((item) => {
                if (filterType === 'all') return true;
                return normalizeType(item?.interviewType) === filterType;
            })
            .sort((a, b) => {
                if (sortBy === 'score') {
                    return Number(b?.overallScore || b?.score || 0) - Number(a?.overallScore || a?.score || 0);
                }

                if (sortBy === 'questions') {
                    return Number(b?.totalQuestions || 0) - Number(a?.totalQuestions || 0);
                }

                const dateA = new Date(a?.date || a?.createdAt || 0).getTime();
                const dateB = new Date(b?.date || b?.createdAt || 0).getTime();
                return dateB - dateA;
            });

        setFilteredHistory(filtered);
    };

    const getInterviewId = (interview) => interview?.interviewId || interview?.id;

    const deleteInterview = async (interview) => {
        const interviewId = getInterviewId(interview);

        const confirmed = await confirm({
            title: 'Delete Interview Record?',
            message: 'Are you sure you want to delete this interview record? This action cannot be undone.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            intent: 'danger',
        });

        if (!confirmed) {
            return;
        }

        try {
            if (interviewId) {
                await interviewService.deleteInterview(interviewId);
                await loadHistory();
                toast.success('Interview record deleted.');
                return;
            }

            const updated = history.filter((item) => item !== interview);
            localStorage.setItem('interviewHistory', JSON.stringify(updated));
            setHistory(updated);
            calculateStats(updated);
            toast.success('Interview record deleted.');
        } catch (error) {
            console.error('Error deleting interview:', error);
            toast.error('Failed to delete interview. Please try again.');
        }
    };

    const clearAllHistory = async () => {
        const count = history.length;
        const confirmed = await confirm({
            title: 'Clear All Interview History?',
            message: `Are you sure you want to delete all ${count} interview record${count === 1 ? '' : 's'}? This cannot be undone.`,
            confirmText: 'Delete All',
            cancelText: 'Cancel',
            intent: 'danger',
        });

        if (!confirmed) {
            return;
        }

        try {
            const ids = history.map(getInterviewId).filter(Boolean);
            if (ids.length > 0) {
                const results = await Promise.allSettled(ids.map((id) => interviewService.deleteInterview(id)));
                const failedDeletes = results.filter((result) => result.status === 'rejected');

                if (failedDeletes.length > 0) {
                    console.error(`Failed to delete ${failedDeletes.length} interviews`, failedDeletes);
                    await loadHistory();
                    toast.error(`Could not delete ${failedDeletes.length} interview(s). Please try again.`);
                    return;
                }
            }

            localStorage.removeItem('interviewHistory');
            setHistory([]);
            setFilteredHistory([]);
            calculateStats([]);
            toast.success('Interview history cleared.');
        } catch (error) {
            console.error('Error clearing history:', error);
            toast.error('Failed to clear interview history. Please try again.');
        }
    };

    const exportHistory = () => {
        const payload = JSON.stringify(history, null, 2);
        const blob = new Blob([payload], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `interview-history-${Date.now()}.json`;
        link.click();
    };

    const viewDetails = (interview) => {
        const interviewId = getInterviewId(interview);
        if (interviewId) {
            navigate(`/interview/results/${interviewId}`);
            return;
        }

        navigate('/results', { state: { results: interview } });
    };

    const formatDate = (dateValue) => {
        if (!dateValue) return 'Unknown date';
        const date = new Date(dateValue);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    const getScore = (interview) => {
        const score = Number(interview?.overallScore || interview?.score || 0);
        if (Number.isNaN(score)) return 0;
        return Math.max(0, Math.min(100, score));
    };

    const getScoreBadgeClass = (score) => {
        if (score >= 85) return 'bg-teal-200 text-teal-900';
        if (score >= 70) return 'bg-amber-200 text-amber-900';
        return 'bg-rose-200 text-rose-900';
    };

    const getTypeBadgeClass = (type) => {
        if (type === 'technical') return 'bg-blue-100 text-blue-700';
        if (type === 'behavioral') return 'bg-emerald-100 text-emerald-700';
        return 'bg-purple-100 text-purple-700';
    };

    const getDurationLabel = (interview) => {
        const raw = interview?.timeTaken;
        if (typeof raw === 'string' && raw.trim()) return raw;

        const minutes = parseMinutes(raw);
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;

        if (hours > 0) return `${hours}h ${remainingMinutes}m`;
        return `${remainingMinutes}m`;
    };

    const getAccuracyLabel = (interview) => {
        const answered = Number(interview?.answeredQuestions || 0);
        const total = Number(interview?.totalQuestions || 0);
        if (total <= 0) return '0/0 Qs';
        return `${answered}/${total} Qs`;
    };

    const cards = useMemo(
        () => [
            {
                key: 'total',
                label: 'Month Growth',
                value: stats.totalInterviews,
                sub: 'Total Interviews',
                icon: BarChart3,
                iconClass: 'bg-blue-100 text-blue-700',
            },
            {
                key: 'avg',
                label: 'Top 10%',
                value: `${stats.avgScore}%`,
                sub: 'Average Score',
                icon: Target,
                iconClass: 'bg-emerald-100 text-emerald-700',
            },
            {
                key: 'high',
                label: 'Peak Record',
                value: `${stats.highestScore}%`,
                sub: 'Highest Score',
                icon: Award,
                iconClass: 'bg-amber-100 text-amber-700',
            },
            {
                key: 'time',
                label: 'Active Time',
                value: `${stats.totalTime}m`,
                sub: 'Practice Time',
                icon: Clock,
                iconClass: 'bg-blue-100 text-blue-700',
            },
        ],
        [stats],
    );

    if (loading) {
        return (
            <div className="space-y-7 animate-pulse">
                <div className="flex items-end justify-between">
                    <div className="space-y-2">
                        <div className="h-10 w-72 rounded-xl bg-slate-200" />
                        <div className="h-5 w-80 rounded-xl bg-slate-200" />
                    </div>
                    <div className="flex gap-3">
                        <div className="h-11 w-28 rounded-xl bg-slate-200" />
                        <div className="h-11 w-28 rounded-xl bg-slate-200" />
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="h-36 rounded-3xl border border-slate-200 bg-white" />
                    ))}
                </div>

                <div className="h-16 rounded-3xl border border-slate-200 bg-white" />

                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="h-24 rounded-3xl border border-slate-200 bg-white" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-7">
            <section className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-5xl font-semibold text-slate-900">Interview History</h1>
                    <p className="mt-2 text-lg text-slate-600">Track your progress and review past interviews</p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={exportHistory}
                        disabled={history.length === 0}
                        className="inline-flex items-center rounded-xl bg-blue-100 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </button>
                    <button
                        onClick={clearAllHistory}
                        disabled={history.length === 0}
                        className="inline-flex items-center rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear All
                    </button>
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {cards.map((card) => {
                    const Icon = card.icon;

                    return (
                        <article key={card.key} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-5 flex items-start justify-between">
                                <span className={`rounded-xl p-3 ${card.iconClass}`}>
                                    <Icon className="h-5 w-5" />
                                </span>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{card.label}</p>
                            </div>
                            <p className="text-4xl font-semibold text-slate-900">{card.value}</p>
                            <p className="mt-1 text-sm text-slate-500">{card.sub}</p>
                        </article>
                    );
                })}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-3.5">
                <div className="grid gap-3 md:grid-cols-[1.8fr,0.48fr,0.48fr]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by job role..."
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            className="h-12 w-full rounded-xl border border-transparent bg-slate-100 pl-10 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>

                    <div className="relative">
                        <select
                            value={filterType}
                            onChange={(event) => setFilterType(event.target.value)}
                            className="h-12 w-full appearance-none rounded-xl border border-transparent bg-slate-100 px-4 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                            <option value="all">All Types</option>
                            <option value="technical">Technical</option>
                            <option value="behavioral">Behavioral</option>
                            <option value="mixed">Mixed</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    </div>

                    <div className="relative">
                        <select
                            value={sortBy}
                            onChange={(event) => setSortBy(event.target.value)}
                            className="h-12 w-full appearance-none rounded-xl border border-transparent bg-slate-100 px-4 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                            <option value="date">Sort: Date</option>
                            <option value="score">Sort: Score</option>
                            <option value="questions">Sort: Questions</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    </div>
                </div>
            </section>

            <section className="space-y-3">
                {filteredHistory.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
                        <Calendar className="mx-auto h-12 w-12 text-slate-400" />
                        <h2 className="mt-4 text-2xl font-semibold text-slate-900">
                            {history.length === 0 ? 'No Interview History Yet' : 'No Matches Found'}
                        </h2>
                        <p className="mt-2 text-slate-600">
                            {history.length === 0
                                ? 'Start your first interview to build your history timeline.'
                                : 'Try a different search keyword or filter option.'}
                        </p>
                        {history.length === 0 && (
                            <button
                                onClick={() => navigate('/interview-setup')}
                                className="mt-6 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                            >
                                Start First Interview
                            </button>
                        )}
                    </div>
                ) : (
                    filteredHistory.map((interview, index) => {
                        const score = getScore(interview);
                        const type = normalizeType(interview?.interviewType);

                        return (
                            <article
                                key={getInterviewId(interview) || index}
                                className="rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                            >
                                <div className="grid items-center gap-4 md:grid-cols-[auto,1.5fr,0.8fr,0.8fr,0.8fr,0.8fr,auto]">
                                    <div className={`rounded-2xl px-3 py-2 text-2xl font-semibold ${getScoreBadgeClass(score)}`}>
                                        {score}%
                                    </div>

                                    <button onClick={() => viewDetails(interview)} className="text-left">
                                        <p className="text-2xl font-semibold text-slate-900">{interview?.jobRole || 'Interview Session'}</p>
                                        <p className="mt-1 text-sm text-slate-500">{formatDate(interview?.date || interview?.createdAt)}</p>
                                    </button>

                                    <div>
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Type</p>
                                        <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getTypeBadgeClass(type)}`}>
                                            {type}
                                        </span>
                                    </div>

                                    <div>
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Duration</p>
                                        <p className="mt-1 text-sm font-semibold text-slate-700">{getDurationLabel(interview)}</p>
                                    </div>

                                    <div>
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Accuracy</p>
                                        <p className="mt-1 text-sm font-semibold text-slate-700">{getAccuracyLabel(interview)}</p>
                                    </div>

                                    <div>
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Difficulty</p>
                                        <p className="mt-1 text-sm font-semibold capitalize text-slate-700">{interview?.difficulty || 'Medium'}</p>
                                    </div>

                                    <div className="flex items-center gap-2 md:justify-end">
                                        <button
                                            onClick={() => viewDetails(interview)}
                                            className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                                        >
                                            <Eye className="mr-2 h-4 w-4" />
                                            View Details
                                        </button>
                                        <button
                                            onClick={() => deleteInterview(interview)}
                                            className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                                            aria-label="Delete Interview"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </article>
                        );
                    })
                )}

                {filteredHistory.length > 0 && (
                    <div className="h-24 rounded-3xl border border-slate-200 bg-slate-100" />
                )}
            </section>
        </div>
    );
};

export default History;

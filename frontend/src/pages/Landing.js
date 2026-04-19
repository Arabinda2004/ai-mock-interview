import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  LockKeyhole,
  Mic,
  Sparkles,
  Target,
  UserRound,
} from 'lucide-react';

const Landing = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const trustPills = [
    'Role-Specific Questions',
    'Instant AI Scoring',
    'Growth Tracking',
    'Encrypted and Private',
  ];

  const methodologySteps = [
    {
      title: 'Create Profile',
      description:
        'Define your target role, experience, and technical focus to personalize interview depth.',
      icon: UserRound,
    },
    {
      title: 'Set Target Role',
      description:
        'Select role-specific skills, interview type, and difficulty so each session matches real hiring expectations.',
      icon: Target,
    },
    {
      title: 'Practice with AI',
      description:
        'Answer technical and behavioral prompts using text or voice and receive actionable feedback instantly.',
      icon: Sparkles,
    },
  ];

  const testimonials = [
    {
      quote:
        'The session quality felt close to real interview loops. The feedback on missing points helped me improve faster each week.',
      role: 'Senior Software Engineer',
      company: 'Fortune 500 Tech Team',
    },
    {
      quote:
        'I used the platform for leadership and system design prep. The structured scoring gave me confidence before final rounds.',
      role: 'Director of Product',
      company: 'Series B Startup',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-sm font-semibold text-white">
                AI
              </div>
              <div>
                <p className="text-sm font-semibold leading-none text-slate-900">AI Interview Platform</p>
                <p className="text-[10px] uppercase tracking-wider text-slate-500">Interview Practice Suite</p>
              </div>
            </Link>

            <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
              <a href="#methodology" className="transition hover:text-blue-700">Methodology</a>
              <a href="#features" className="transition hover:text-blue-700">Features</a>
              <a href="#success" className="transition hover:text-blue-700">Success Stories</a>
            </nav>

            <div className="flex items-center gap-3">
              <Link to="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
                Login
              </Link>
              <Link to="/register" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-slate-200 bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50/70 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 lg:grid-cols-[1.08fr,0.92fr] lg:items-center">
              <div>
                <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI Interview Platform
                </p>
                <h1 className="max-w-xl text-4xl font-bold leading-tight text-slate-900 md:text-6xl">
                  Master every interview with
                  <span className="text-blue-700"> AI-powered </span>
                  precision.
                </h1>
                <p className="mt-5 max-w-xl text-base text-slate-600 md:text-lg">
                  Prepare for technical and behavioral interviews with role-specific simulations, voice and text answering, and instant multi-criteria feedback that improves your next round performance.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link to="/register" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
                    Start Free Practice
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link to="/login" className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                    Sign In
                  </Link>
                </div>
                <Link to="/login" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-700 transition hover:text-blue-800">
                  See sample dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <aside className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
                  <p className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-blue-700">
                    <Target className="h-3.5 w-3.5" />
                    Session Blueprint
                  </p>
                  <div className="mt-4 space-y-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Target Role</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">Senior Backend Engineer</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Interview Mix</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">Technical + Behavioral</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Skills Focus</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">System Design, APIs, Ownership</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <BarChart3 className="h-4 w-4 text-blue-700" />
                    <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">Score Dimensions</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">Accuracy, Clarity, Completeness</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <Mic className="h-4 w-4 text-blue-700" />
                    <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">Answer Modes</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">Voice and Text Practice</p>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-900 p-5 text-slate-100 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">After Each Interview</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-200">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
                      Personalized strengths and improvement points
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
                      Role-wise progress trends in your dashboard
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
                      Actionable coaching tips for your next round
                    </li>
                  </ul>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-slate-100/80 py-6">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-center justify-center gap-3">
              {trustPills.map((pill) => (
                <span key={pill} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                  {pill}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section id="methodology" className="py-14 md:py-16">
          <div className="container mx-auto px-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">The Methodology</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl">Accelerate your interview readiness</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {methodologySteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <article key={step.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
                    <div className="mb-5 flex items-center justify-between">
                      <span className="text-5xl font-bold text-blue-100">0{index + 1}</span>
                      <div className="rounded-full bg-blue-100 p-2 text-blue-700">
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900">{step.title}</h3>
                    <p className="mt-3 text-sm text-slate-600">{step.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="features" className="bg-slate-100/70 py-14 md:py-16">
          <div className="container mx-auto px-4">
            <div className="grid gap-6 lg:grid-cols-3">
              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                <p className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Next Gen Interview Tech
                </p>
                <h3 className="mt-4 text-2xl font-semibold text-slate-900">AI-driven simulations tailored to your goals</h3>
                <p className="mt-3 max-w-2xl text-sm text-slate-600">
                  Every question is generated from your target role, selected skills, experience level, and interview type to mimic real hiring conversations.
                </p>
                <div className="mt-6 h-28 rounded-xl bg-gradient-to-r from-blue-900/90 via-cyan-700/80 to-blue-500/80" />
              </article>

              <article className="rounded-2xl bg-blue-700 p-6 text-white shadow-sm">
                <Mic className="h-5 w-5" />
                <h3 className="mt-5 text-2xl font-semibold">Multimodal practice</h3>
                <p className="mt-3 text-sm text-blue-100">
                  Switch between voice and text modes. Practice concise speaking and refine written technical explanations simultaneously.
                </p>
                <div className="mt-10 flex items-center gap-2 text-xs text-blue-100">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white" />
                  <span className="ml-2">Live interaction</span>
                </div>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <BarChart3 className="h-5 w-5 text-blue-700" />
                <h3 className="mt-4 text-xl font-semibold text-slate-900">Deep analytics</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Track technical accuracy, communication quality, and consistency through history and trend views.
                </p>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border-[10px] border-blue-600 text-2xl font-bold text-slate-900">
                  92%
                </div>
                <p className="mt-4 text-center text-sm font-medium text-slate-600">Improvement visibility across sessions</p>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-slate-900">Tailored coaching tips</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Receive specific, practical advice after each session so your next interview answer is clearer, sharper, and higher scoring.
                </p>
                <Link to="/register" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
                  View sample report
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            </div>
          </div>
        </section>

        <section id="success" className="py-14 md:py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">Proven by interview candidates and teams</h2>
            <div className="mx-auto mt-6 flex max-w-xl flex-wrap items-center justify-center gap-3">
              <div className="rounded-xl border border-blue-200 bg-blue-50 px-6 py-3">
                <p className="text-2xl font-bold text-blue-700">50,000+</p>
                <p className="text-xs uppercase tracking-wider text-blue-700/80">Interviews completed</p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-3">
                <p className="text-2xl font-bold text-emerald-700">40%</p>
                <p className="text-xs uppercase tracking-wider text-emerald-700/80">Avg score improvement</p>
              </div>
            </div>

            <div className="mt-10 grid gap-6 text-left md:grid-cols-2">
              {testimonials.map((item) => (
                <article key={item.role} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-sm leading-relaxed text-slate-600">"{item.quote}"</p>
                  <div className="mt-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200">
                      <UserRound className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.role}</p>
                      <p className="text-xs text-slate-500">{item.company}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-r from-blue-700 to-blue-600 px-6 py-12 text-center text-white shadow-xl md:px-10">
              <h2 className="text-3xl font-bold md:text-4xl">Your next career milestone starts with one practice session</h2>
              <p className="mx-auto mt-4 max-w-2xl text-blue-100">
                Join candidates using AI evaluation, skill tracking, and realistic interview simulation to turn preparation into confident performance.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link to="/register" className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50">
                  Create Free Account
                </Link>
                <Link to="/login" className="rounded-lg border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20">
                  Login
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">AI Interview Platform</p>
              <p className="text-xs uppercase tracking-wider text-slate-500">Interview Practice Suite</p>
              <p className="mt-3 text-sm text-slate-600">
                Master technical and behavioral interviews with AI-led coaching and transparent scoring insights.
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-900">Product</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li><a href="#features" className="transition hover:text-blue-700">Features</a></li>
                <li><a href="#methodology" className="transition hover:text-blue-700">Methodology</a></li>
                <li><Link to="/register" className="transition hover:text-blue-700">Start Practice</Link></li>
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-900">Resources</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li><Link to="/login" className="transition hover:text-blue-700">Support</Link></li>
                <li><a href="#success" className="transition hover:text-blue-700">Success Stories</a></li>
                <li><Link to="/register" className="transition hover:text-blue-700">AI Evaluation</Link></li>
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-900">Company</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li><Link to="/login" className="transition hover:text-blue-700">Legal</Link></li>
                <li><Link to="/login" className="transition hover:text-blue-700">Privacy</Link></li>
                <li><Link to="/login" className="transition hover:text-blue-700">Terms</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-slate-200 pt-6 text-xs text-slate-500 md:flex-row md:items-center">
            <p>© 2026 AI Interview Platform. All rights reserved.</p>
            <p className="inline-flex items-center gap-2">
              <LockKeyhole className="h-3.5 w-3.5 text-emerald-600" />
              System status: optimal
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  Sparkles,
  Mail,
  BrainCircuit,
} from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        toast.success('Welcome back!');
        navigate('/dashboard');
      } else {
        toast.error(result.error || 'Login failed');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-200 text-slate-900">
      <div className="flex min-h-screen flex-col">
        <main className="flex flex-1 flex-col xl:grid xl:grid-cols-[1.05fr,1fr]">
          <section className="relative hidden overflow-hidden bg-gradient-to-b from-slate-900 via-blue-950 to-blue-900 xl:block">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.3),transparent_45%),radial-gradient(circle_at_80%_75%,rgba(14,165,233,0.25),transparent_40%)]" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-950/80 via-blue-900/70 to-blue-800/60" />
            <div className="absolute inset-y-0 left-24 w-px bg-white/10" />
            <div className="absolute inset-y-0 left-48 w-px bg-white/5" />

            <div className="relative flex h-full flex-col justify-center px-12 py-16 text-white lg:px-16">
              <Link to="/" className="mb-12 inline-flex w-fit items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-blue-100/90">
                <span className="rounded-md border border-blue-200/40 bg-white/10 px-2 py-1 text-[10px] tracking-[0.25em]">
                  AI
                </span>
                Interview Platform
              </Link>

              <div className="max-w-xl animate-slide-up">
                <h1 className="text-5xl font-semibold leading-tight">
                  Pick up where
                  <br />
                  you left off.
                </h1>
                <p className="mt-6 max-w-lg text-lg text-blue-100/90">
                  Continue your interview preparation with AI-driven simulations, detailed score trends, and role-specific coaching.
                </p>
              </div>

              <div className="mt-12 grid max-w-2xl gap-4 sm:grid-cols-2">
                <article className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm animate-fade-in">
                  <Sparkles className="h-5 w-5 text-cyan-200" />
                  <h3 className="mt-4 text-base font-semibold">Smart practice loops</h3>
                  <p className="mt-2 text-sm text-blue-100/85">Adaptive follow-up questions tailored to your strengths and blind spots.</p>
                </article>

                <article className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm animate-fade-in">
                  <ShieldCheck className="h-5 w-5 text-emerald-200" />
                  <h3 className="mt-4 text-base font-semibold">Secure by default</h3>
                  <p className="mt-2 text-sm text-blue-100/85">Your data is protected with encrypted sessions and private analytics.</p>
                </article>
              </div>

              <div className="mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs text-blue-100/85">
                <BrainCircuit className="h-3.5 w-3.5" />
                AI scoring + personalized improvement guidance
              </div>
            </div>
          </section>

          <section className="flex items-center justify-center bg-slate-100 px-4 py-8 sm:px-8 sm:py-10 lg:px-12">
            <div className="w-full max-w-xl animate-fade-in rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
              <div className="mb-8">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Welcome Back</p>
                <h2 className="text-3xl font-semibold text-slate-900">Sign in to your account</h2>
                <p className="mt-2 text-sm text-slate-600">Continue your path to interview mastery.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Email
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="jane.doe@company.com"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label htmlFor="password" className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Password
                    </label>
                    <span className="text-[11px] text-slate-400">Use your existing credentials</span>
                  </div>

                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-3 flex items-center text-slate-400 transition hover:text-slate-600"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 flex h-12 w-full items-center justify-center rounded-lg bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? <div className="spinner" /> : 'Sign In'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-600">
                New here?{' '}
                <Link to="/register" className="font-semibold text-blue-600 transition hover:text-blue-700">
                  Create Account
                </Link>
              </p>

              <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-center text-xs text-blue-800">
                Demo mode is enabled in development. Use any valid email and password.
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-slate-300 bg-slate-200 px-4 py-5 text-xs text-slate-600 sm:px-6 lg:px-10">
          <div className="mx-auto flex w-full max-w-[1600px] flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm font-semibold tracking-wide text-slate-800">AI Interview Platform</p>
            <nav className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              <Link to="/privacy" className="transition hover:text-slate-900">Privacy Policy</Link>
              <Link to="/terms" className="transition hover:text-slate-900">Terms of Service</Link>
              <Link to="/contact" className="transition hover:text-slate-900">Contact</Link>
            </nav>
            <p className="text-[11px] uppercase tracking-[0.15em] text-slate-500">© 2026 AI Interview Platform</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Login;
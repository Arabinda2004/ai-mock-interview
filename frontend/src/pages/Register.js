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
  User,
  Check,
  Circle,
  BrainCircuit,
} from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register: registerUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const getPasswordChecks = (password) => ({
    minLength: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    numberOrSymbol: /\d/.test(password) || /[^A-Za-z0-9]/.test(password),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const passwordChecks = getPasswordChecks(formData.password);
  const passwordScore = Object.values(passwordChecks).filter(Boolean).length;
  const passwordCriteria = [
    { key: 'minLength', label: 'Min. 8 characters' },
    { key: 'lowercase', label: 'Lowercase letters' },
    { key: 'uppercase', label: 'Uppercase letters' },
    { key: 'numberOrSymbol', label: 'Numbers & symbols' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      setLoading(false);
      return;
    }

    if (passwordScore < 4) {
      toast.error('Password must satisfy all password rules');
      setLoading(false);
      return;
    }

    try {
      const result = await registerUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      });

      if (result.success) {
        toast.success('Account created successfully! Welcome aboard!');
        navigate('/dashboard');
      } else {
        toast.error(result.error || 'Registration failed');
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch =
    formData.confirmPassword.length > 0 &&
    formData.password === formData.confirmPassword;

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
                  Master your
                  <br />
                  next interview.
                </h1>
                <p className="mt-6 max-w-lg text-lg text-blue-100/90">
                  Practice technical and behavioral rounds with role-aware AI coaching, private sessions, and detailed growth feedback.
                </p>
              </div>

              <div className="mt-12 grid max-w-2xl gap-4 sm:grid-cols-2">
                <article className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm animate-fade-in">
                  <Sparkles className="h-5 w-5 text-cyan-200" />
                  <h3 className="mt-4 text-base font-semibold">Behavioral analysis</h3>
                  <p className="mt-2 text-sm text-blue-100/85">Real-time feedback on communication, confidence, and leadership tone.</p>
                </article>

                <article className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm animate-fade-in">
                  <ShieldCheck className="h-5 w-5 text-emerald-200" />
                  <h3 className="mt-4 text-base font-semibold">Secure insights</h3>
                  <p className="mt-2 text-sm text-blue-100/85">Encrypted sessions and private-by-default interview analytics.</p>
                </article>
              </div>

              <div className="mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs text-blue-100/85">
                <BrainCircuit className="h-3.5 w-3.5" />
                Powered by AI scoring + personalized coaching
              </div>
            </div>
          </section>

          <section className="flex items-center justify-center bg-slate-100 px-4 py-8 sm:px-8 sm:py-10 lg:px-12">
            <div className="w-full max-w-xl animate-fade-in rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
              <div className="mb-8">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Start Free</p>
                <h2 className="text-3xl font-semibold text-slate-900">Create your account</h2>
                <p className="mt-2 text-sm text-slate-600">Begin your journey to interview mastery today.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      First Name
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                        <User className="h-4 w-4" />
                      </span>
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        required
                        className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        placeholder="Jane"
                        value={formData.firstName}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="lastName" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Last Name
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                        <User className="h-4 w-4" />
                      </span>
                      <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        required
                        className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="jane.doe@company.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Password
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Create a strong password"
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

                  <div className="mt-3 h-1.5 w-full rounded-full bg-slate-200">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-300"
                      style={{ width: `${(passwordScore / 4) * 100}%` }}
                    />
                  </div>

                  <ul className="mt-3 grid gap-2 text-[11px] text-slate-600 sm:grid-cols-2">
                    {passwordCriteria.map((item) => {
                      const isPassed = passwordChecks[item.key];
                      return (
                        <li key={item.key} className="flex items-center gap-2">
                          {isPassed ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 text-slate-400" />
                          )}
                          <span className={isPassed ? 'text-slate-800' : 'text-slate-500'}>{item.label}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-24 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                    <div className="absolute inset-y-0 right-3 flex items-center gap-2">
                      {passwordsMatch && (
                        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-600">
                          Match
                        </span>
                      )}
                      <button
                        type="button"
                        className="text-slate-400 transition hover:text-slate-600"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {formData.confirmPassword && !passwordsMatch && (
                    <p className="mt-2 text-xs text-red-600">Passwords do not match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 flex h-12 w-full items-center justify-center rounded-lg bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? <div className="spinner" /> : 'Create Account'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-600">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-blue-600 transition hover:text-blue-700">
                  Sign In
                </Link>
              </p>

              <p className="mt-8 text-center text-[11px] leading-5 text-slate-500">
                By creating an account, you agree to our{' '}
                <Link to="/terms" className="font-medium text-slate-600 underline-offset-4 hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="font-medium text-slate-600 underline-offset-4 hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
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

export default Register;
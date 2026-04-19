import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import interviewService from '../services/interviewService';
import {
  Award,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Mail,
  Phone,
  Plus,
  Sparkles,
  Target,
  Trophy,
  UserRound,
  X
} from 'lucide-react';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    experienceLevel: '',
    primaryRole: '',
    skills: []
  });
  const [newSkill, setNewSkill] = useState('');
  const [interviewStats, setInterviewStats] = useState({
    totalInterviews: 0,
    avgScore: 0,
    highestScore: 0,
    thisWeek: 0
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        experienceLevel: user.experienceLevel || 'Entry Level (0-2 years)',
        primaryRole: user.primaryRole || 'Software Engineer',
        skills: Array.isArray(user.skills) ? user.skills : []
      });
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    const loadInterviewStats = async () => {
      try {
        const response = await interviewService.getInterviewStatistics();
        if (isMounted && response?.success) {
          setInterviewStats({
            totalInterviews: Number(response?.data?.totalInterviews || 0),
            avgScore: Number(response?.data?.avgScore || 0),
            highestScore: Number(response?.data?.highestScore || 0),
            thisWeek: Number(response?.data?.thisWeek || 0)
          });
        }
      } catch (error) {
        if (isMounted) {
          const fallbackHistory = JSON.parse(localStorage.getItem('interviewHistory') || '[]');
          const scores = fallbackHistory.map((item) => Number(item?.overallScore || item?.score || 0));
          const avgScore = scores.length > 0
            ? Math.round(scores.reduce((acc, score) => acc + score, 0) / scores.length)
            : 0;

          setInterviewStats({
            totalInterviews: fallbackHistory.length,
            avgScore,
            highestScore: scores.length > 0 ? Math.max(...scores) : 0,
            thisWeek: 0
          });
        }
      }
    };

    if (user) {
      loadInterviewStats();
    }

    return () => {
      isMounted = false;
    };
  }, [user]);

  const experienceLevels = [
    'Entry Level (0-2 years)',
    'Mid Level (2-5 years)',
    'Senior Level (5-10 years)',
    'Lead Level (10+ years)'
  ];

  const roles = [
    'Full Stack Developer',
    'Frontend Developer',
    'Backend Developer',
    'Data Scientist',
    'DevOps Engineer',
    'Mobile Developer',
    'Software Engineer',
    'Product Manager',
    'UI/UX Designer',
    'Other'
  ];

  const availableSkills = [
    // Programming Languages
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'Dart',
    // Frontend
    'React', 'Angular', 'Vue.js', 'Next.js', 'Svelte', 'HTML', 'CSS', 'Tailwind CSS', 'Bootstrap', 'Material-UI',
    // Backend
    'Node.js', 'Express.js', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'ASP.NET', 'Ruby on Rails', 'Laravel',
    // Databases
    'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'SQLite', 'Oracle', 'Cassandra', 'DynamoDB', 'Elasticsearch',
    // Cloud & DevOps
    'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'CI/CD', 'Jenkins', 'GitHub Actions', 'Terraform', 'Ansible',
    // Mobile
    'React Native', 'Flutter', 'iOS Development', 'Android Development', 'Xamarin',
    // Data & AI
    'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Data Analysis', 'Pandas', 'NumPy', 'Scikit-learn',
    // Tools & Others
    'Git', 'REST API', 'GraphQL', 'Microservices', 'Agile', 'Scrum', 'JIRA', 'Linux', 'Testing', 'Jest', 'Pytest'
  ].sort();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (newSkill && !formData.skills.includes(newSkill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill]
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await authAPI.updateProfile({
        name: formData.name,
        phone: formData.phone,
        experienceLevel: formData.experienceLevel,
        primaryRole: formData.primaryRole,
        skills: formData.skills
      });

      if (result.success) {
        if (updateUser) {
          updateUser(result.data.user);
        }
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setIsEditing(false);
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        experienceLevel: user.experienceLevel || 'Entry Level (0-2 years)',
        primaryRole: user.primaryRole || 'Software Engineer',
        skills: user.skills || []
      });
    }
    setIsEditing(false);
    setMessage({ type: '', text: '' });
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAccountAge = () => {
    if (!user?.createdAt) return 'Recently joined';
    const created = new Date(user.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) return `Joined ${diffDays} days ago`;
    if (diffDays < 365) return `Joined ${Math.floor(diffDays / 30)} months ago`;
    return `Joined ${Math.floor(diffDays / 365)} years ago`;
  };

  const getMemberSince = () => {
    if (!user?.createdAt) return 'Recently';
    return new Date(user.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });
  };

  const profileCompletion = useMemo(() => {
    const checks = [
      Boolean(formData.name?.trim()),
      Boolean(formData.phone?.trim()),
      Boolean(formData.experienceLevel?.trim()),
      Boolean(formData.primaryRole?.trim()),
      Array.isArray(formData.skills) && formData.skills.length > 0
    ];
    const completeCount = checks.filter(Boolean).length;
    return Math.round((completeCount / checks.length) * 100);
  }, [formData]);

  const renderReadOnlyValue = (value, fallback = 'Not provided') => (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800">
      {value || fallback}
    </div>
  );

  return (
    <div className="relative mx-auto max-w-[1120px] space-y-7 pb-4">
      <div className="pointer-events-none absolute -left-24 top-20 hidden text-[82px] font-semibold leading-[0.9] tracking-[0.08em] text-slate-200/70 xl:block">
        <p>PROFILE</p>
        <p>CAREER</p>
        <p>GROWTH</p>
      </div>

      <section className="relative z-10 overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-blue-900 to-blue-700 p-6 text-white shadow-xl shadow-blue-300/25 sm:p-7">
        <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-cyan-300/10" />

        <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 text-2xl font-bold shadow-lg ring-1 ring-white/30 backdrop-blur-sm">
              {getInitials(formData.name || user?.name || '')}
            </div>

            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-100">
                <Sparkles className="h-3.5 w-3.5" />
                Professional Profile
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
                {formData.name || user?.name || 'Your Profile'}
              </h1>
              <p className="mt-1 text-sm text-blue-100">{formData.email || user?.email || 'No email available'}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.14em] text-blue-200">
                {getAccountAge()} · Member since {getMemberSince()}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => (isEditing ? handleCancel() : setIsEditing(true))}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-white/30 bg-white/10 px-5 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isEditing ? 'Cancel Editing' : 'Edit Profile'}
          </button>
        </div>

        <div className="relative mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-100">Interviews</p>
            <p className="mt-2 flex items-center gap-2 text-2xl font-semibold">
              <Trophy className="h-5 w-5 text-blue-100" />
              {interviewStats.totalInterviews}
            </p>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-100">Average Score</p>
            <p className="mt-2 flex items-center gap-2 text-2xl font-semibold">
              <Target className="h-5 w-5 text-blue-100" />
              {interviewStats.avgScore}%
            </p>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-100">Best Score</p>
            <p className="mt-2 flex items-center gap-2 text-2xl font-semibold">
              <Award className="h-5 w-5 text-blue-100" />
              {interviewStats.highestScore}%
            </p>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-100">Profile Completion</p>
            <p className="mt-2 flex items-center gap-2 text-2xl font-semibold">
              <CheckCircle2 className="h-5 w-5 text-blue-100" />
              {profileCompletion}%
            </p>
          </div>
        </div>
      </section>

      {message.text && (
        <div
          className={`relative z-10 rounded-2xl border px-4 py-3 text-sm ${message.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
        >
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/80 text-xs font-bold">
              {message.type === 'success' ? 'OK' : '!'}
            </span>
            <span>{message.text}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <header className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900">Identity & Contact</h2>
            </header>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Enter your full name"
                  />
                ) : (
                  renderReadOnlyValue(formData.name)
                )}
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Email Address
                </label>
                <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <span className="inline-flex items-center gap-2 font-medium text-slate-800">
                    <Mail className="h-4 w-4 text-slate-500" />
                    {formData.email || 'Not provided'}
                  </span>
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                    Locked
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Enter your phone number"
                    pattern="[0-9]{10,15}"
                  />
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">
                    <span className="inline-flex items-center gap-2 font-medium">
                      <Phone className="h-4 w-4 text-slate-500" />
                      {formData.phone || 'Not provided'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <header className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900">Career Configuration</h2>
            </header>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Experience Level
                </label>
                {isEditing ? (
                  <div className="relative">
                    <select
                      name="experienceLevel"
                      value={formData.experienceLevel}
                      onChange={handleChange}
                      className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-10 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      {experienceLevels.map((level) => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  </div>
                ) : (
                  renderReadOnlyValue(formData.experienceLevel)
                )}
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Primary Role
                </label>
                {isEditing ? (
                  <div className="relative">
                    <select
                      name="primaryRole"
                      value={formData.primaryRole}
                      onChange={handleChange}
                      className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-10 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      {roles.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  </div>
                ) : (
                  renderReadOnlyValue(formData.primaryRole)
                )}
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Account Signals</p>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <p className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      Membership
                    </span>
                    <span className="font-semibold">{getMemberSince()}</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-blue-600" />
                      This week activity
                    </span>
                    <span className="font-semibold">{interviewStats.thisWeek} interviews</span>
                  </p>
                </div>
              </div>
            </div>
          </article>
        </div>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <header className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900">Skill Matrix</h2>
            </div>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              {formData.skills.length} skills
            </span>
          </header>

          <div className="mt-4 flex min-h-[48px] flex-wrap gap-2">
            {formData.skills.length > 0 ? (
              formData.skills.map((skill, index) => (
                <span
                  key={`${skill}-${index}`}
                  className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700"
                >
                  {skill}
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-blue-500 transition hover:text-rose-600"
                      aria-label={`Remove ${skill}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))
            ) : (
              <p className="text-sm text-slate-500">No skills added yet</p>
            )}
          </div>

          {isEditing && (
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <select
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-10 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">Select a skill to add...</option>
                  {availableSkills
                    .filter((skill) => !formData.skills.includes(skill))
                    .map((skill) => (
                      <option key={skill} value={skill}>{skill}</option>
                    ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              </div>

              <button
                type="button"
                onClick={handleAddSkill}
                disabled={!newSkill}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
                Add Skill
              </button>
            </div>
          )}
        </article>

        {isEditing && (
          <div className="flex flex-col-reverse gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 px-6 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default Profile;
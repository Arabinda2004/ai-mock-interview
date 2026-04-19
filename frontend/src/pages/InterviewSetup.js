import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import interviewService from '../services/interviewService';
import {
  Briefcase,
  Code,
  Target,
  ChevronRight,
  ChevronLeft,
  Plus,
  X,
  User,
  FileText,
  BarChart3,
  Sparkles,
  Settings2
} from 'lucide-react';

const InterviewSetup = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    jobRole: '',
    customJobRole: '',
    skills: [],
    experienceLevel: '',
    interviewType: '',
    duration: 30,
    difficulty: 'medium'
  });

  // Predefined job roles with their relevant skills and experience expectations
  const jobRoleConfig = {
    'Frontend Developer': {
      skills: {
        'Frontend Technologies': ['React', 'Vue.js', 'Angular', 'JavaScript', 'TypeScript', 'HTML/CSS', 'Sass/SCSS'],
        'Styling & Design': ['Tailwind CSS', 'Bootstrap', 'Styled Components', 'CSS Grid/Flexbox', 'Responsive Design'],
        'Build Tools': ['Webpack', 'Vite', 'Parcel', 'npm/yarn', 'Babel', 'ESLint', 'Prettier'],
        'Testing': ['Jest', 'Cypress', 'React Testing Library', 'Enzyme', 'Playwright']
      },
      experienceLevels: [
        { value: 'junior', label: 'Junior (0-2 years)', desc: 'Basic HTML/CSS/JS, learning React/Vue' },
        { value: 'mid', label: 'Mid-Level (2-4 years)', desc: 'Framework expertise, state management' },
        { value: 'senior', label: 'Senior (4+ years)', desc: 'Architecture, performance optimization, team leadership' }
      ]
    },
    'Backend Developer': {
      skills: {
        'Backend Languages': ['Node.js', 'Python', 'Java', 'C#', 'Go', 'PHP', 'Ruby'],
        'Frameworks': ['Express.js', 'Django', 'Flask', 'Spring Boot', 'ASP.NET', 'Gin', 'Laravel'],
        'Databases': ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'Cassandra'],
        'DevOps & Cloud': ['Docker', 'Kubernetes', 'AWS', 'Azure', 'Google Cloud', 'CI/CD', 'Linux']
      },
      experienceLevels: [
        { value: 'junior', label: 'Junior (0-3 years)', desc: 'API development, basic database operations' },
        { value: 'mid', label: 'Mid-Level (3-5 years)', desc: 'System design, optimization, microservices' },
        { value: 'senior', label: 'Senior (5+ years)', desc: 'Architecture, scalability, distributed systems' }
      ]
    },
    'Full Stack Developer': {
      skills: {
        'Frontend': ['React', 'Vue.js', 'Angular', 'JavaScript', 'TypeScript', 'HTML/CSS'],
        'Backend': ['Node.js', 'Python', 'Java', 'Express.js', 'Django', 'Spring Boot'],
        'Database': ['PostgreSQL', 'MongoDB', 'MySQL', 'Redis'],
        'DevOps': ['Docker', 'AWS', 'CI/CD', 'Git', 'Linux']
      },
      experienceLevels: [
        { value: 'junior', label: 'Junior (1-3 years)', desc: 'Basic full-stack development, CRUD operations' },
        { value: 'mid', label: 'Mid-Level (3-5 years)', desc: 'End-to-end development, API integration' },
        { value: 'senior', label: 'Senior (5+ years)', desc: 'System architecture, technical leadership' }
      ]
    },
    'Data Scientist': {
      skills: {
        'Programming': ['Python', 'R', 'SQL', 'Scala', 'Julia'],
        'ML/AI': ['Scikit-learn', 'TensorFlow', 'PyTorch', 'Keras', 'XGBoost', 'Pandas', 'NumPy'],
        'Visualization': ['Matplotlib', 'Seaborn', 'Plotly', 'Tableau', 'Power BI'],
        'Big Data': ['Spark', 'Hadoop', 'Kafka', 'Airflow', 'Databricks']
      },
      experienceLevels: [
        { value: 'junior', label: 'Junior (0-2 years)', desc: 'Basic ML, data analysis, Python/R' },
        { value: 'mid', label: 'Mid-Level (2-4 years)', desc: 'Model development, feature engineering' },
        { value: 'senior', label: 'Senior (4+ years)', desc: 'ML strategy, model deployment, team leadership' }
      ]
    },
    'DevOps Engineer': {
      skills: {
        'Cloud Platforms': ['AWS', 'Azure', 'Google Cloud', 'DigitalOcean'],
        'Containerization': ['Docker', 'Kubernetes', 'Podman', 'Docker Swarm'],
        'CI/CD': ['Jenkins', 'GitLab CI', 'GitHub Actions', 'CircleCI', 'Azure DevOps'],
        'Infrastructure': ['Terraform', 'Ansible', 'CloudFormation', 'Pulumi', 'Linux', 'Monitoring']
      },
      experienceLevels: [
        { value: 'junior', label: 'Junior (0-2 years)', desc: 'Basic CI/CD, Docker, cloud services' },
        { value: 'mid', label: 'Mid-Level (2-4 years)', desc: 'Infrastructure automation, monitoring' },
        { value: 'senior', label: 'Senior (4+ years)', desc: 'Platform architecture, team leadership' }
      ]
    },
    'Mobile Developer': {
      skills: {
        'Cross-Platform': ['React Native', 'Flutter', 'Xamarin', 'Ionic'],
        'Native iOS': ['Swift', 'Objective-C', 'Xcode', 'UIKit', 'SwiftUI'],
        'Native Android': ['Kotlin', 'Java', 'Android Studio', 'Jetpack Compose'],
        'Backend Integration': ['REST APIs', 'GraphQL', 'Firebase', 'Push Notifications']
      },
      experienceLevels: [
        { value: 'junior', label: 'Junior (0-2 years)', desc: 'Basic app development, UI implementation' },
        { value: 'mid', label: 'Mid-Level (2-4 years)', desc: 'Performance optimization, platform-specific features' },
        { value: 'senior', label: 'Senior (4+ years)', desc: 'Architecture, app store optimization, team leadership' }
      ]
    },
    'Product Manager': {
      skills: {
        'Strategy & Planning': ['Product Strategy', 'Roadmapping', 'Market Research', 'Competitive Analysis'],
        'Analytics & Metrics': ['Google Analytics', 'Mixpanel', 'Amplitude', 'A/B Testing', 'KPIs'],
        'Design & UX': ['User Research', 'Wireframing', 'Prototyping', 'Figma', 'User Stories'],
        'Technical': ['SQL', 'API Understanding', 'Agile/Scrum', 'JIRA', 'Git basics']
      },
      experienceLevels: [
        { value: 'junior', label: 'Junior (0-2 years)', desc: 'Feature development, basic analytics' },
        { value: 'mid', label: 'Mid-Level (2-5 years)', desc: 'Product strategy, stakeholder management' },
        { value: 'senior', label: 'Senior (5+ years)', desc: 'Product vision, P&L ownership, team leadership' }
      ]
    },
    'UI/UX Designer': {
      skills: {
        'Design Tools': ['Figma', 'Sketch', 'Adobe XD', 'Adobe Creative Suite', 'InVision'],
        'User Research': ['User Interviews', 'Usability Testing', 'Surveys', 'Analytics', 'Personas'],
        'Prototyping': ['Interactive Prototypes', 'Wireframing', 'User Flows', 'Information Architecture'],
        'Frontend Basics': ['HTML/CSS', 'JavaScript basics', 'Responsive Design', 'Design Systems']
      },
      experienceLevels: [
        { value: 'junior', label: 'Junior (0-2 years)', desc: 'Visual design, basic user research' },
        { value: 'mid', label: 'Mid-Level (2-4 years)', desc: 'User experience, interaction design' },
        { value: 'senior', label: 'Senior (4+ years)', desc: 'Design strategy, team leadership, design systems' }
      ]
    },
    'Software Engineer': {
      skills: {
        'Programming Languages': ['JavaScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust'],
        'Frameworks & Libraries': ['React', 'Node.js', 'Express.js', 'Django', 'Spring Boot', 'Angular'],
        'System Design': ['Algorithms', 'Data Structures', 'Design Patterns', 'System Architecture'],
        'Tools & Practices': ['Git', 'Docker', 'Testing', 'CI/CD', 'Code Review', 'Agile']
      },
      experienceLevels: [
        { value: 'junior', label: 'Junior (0-2 years)', desc: 'Programming fundamentals, debugging' },
        { value: 'mid', label: 'Mid-Level (2-5 years)', desc: 'System design, code quality, mentoring' },
        { value: 'senior', label: 'Senior (5+ years)', desc: 'Architecture, technical leadership, strategy' }
      ]
    }
  };

  const [customSkill, setCustomSkill] = useState('');
  const [showCustomJobRole, setShowCustomJobRole] = useState(false);

  // Clear errors whenever step changes
  useEffect(() => {
    setError('');
  }, [currentStep]);

  // Get available job roles (keys from jobRoleConfig + 'Other')
  const availableJobRoles = [...Object.keys(jobRoleConfig), 'Other'];

  const handleJobRoleChange = (role) => {
    setError(''); // Clear error when user makes a change
    setFormData({
      ...formData,
      jobRole: role,
      skills: [], // Reset skills when job role changes
      experienceLevel: '' // Reset experience level when job role changes
    });
    setShowCustomJobRole(role === 'Other');
  };

  const getCurrentSkillCategories = () => {
    if (formData.jobRole === 'Other' || !jobRoleConfig[formData.jobRole]) {
      // Return all categories for 'Other' or fallback
      return {
        'Frontend': ['React', 'Vue.js', 'Angular', 'JavaScript', 'TypeScript', 'HTML/CSS'],
        'Backend': ['Node.js', 'Python', 'Java', 'C#', 'PHP', 'Go', 'Ruby'],
        'Database': ['MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite'],
        'Cloud': ['AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes'],
        'Mobile': ['React Native', 'Flutter', 'iOS/Swift', 'Android/Kotlin'],
        'Tools': ['Git', 'Jenkins', 'Docker', 'Linux', 'Agile', 'Scrum']
      };
    }
    return jobRoleConfig[formData.jobRole].skills;
  };

  const getCurrentExperienceLevels = () => {
    if (formData.jobRole === 'Other' || !jobRoleConfig[formData.jobRole]) {
      // Return generic experience levels for 'Other' or fallback
      return [
        { value: 'junior', label: 'Junior (0-2 years)', desc: 'Entry-level questions' },
        { value: 'mid', label: 'Mid-Level (3-5 years)', desc: 'Intermediate concepts' },
        { value: 'senior', label: 'Senior (5+ years)', desc: 'Advanced topics & leadership' }
      ];
    }
    return jobRoleConfig[formData.jobRole].experienceLevels;
  };

  const addSkill = (skill) => {
    if (!formData.skills.includes(skill)) {
      setError(''); // Clear error when user makes a change
      setFormData({
        ...formData,
        skills: [...formData.skills, skill]
      });
    }
  };

  const removeSkill = (skillToRemove) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(skill => skill !== skillToRemove)
    });
  };

  const addCustomSkill = () => {
    if (customSkill.trim() && !formData.skills.includes(customSkill.trim())) {
      addSkill(customSkill.trim());
      setCustomSkill('');
    }
  };

  const nextStep = () => {
    setError(''); // Clear any previous errors

    // Allow progression through all steps without validation errors
    // Only validate on final submission
    const newStep = currentStep + 1;
    setCurrentStep(newStep);

    // Clear error when reaching Step 4 to ensure clean slate
    if (newStep === 4) {
      setTimeout(() => setError(''), 100); // Clear any lingering errors
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = async () => {
    setError(''); // Clear any previous errors

    // Only validate and submit when user is on Step 4 AND actually submitting
    if (currentStep !== 4) {
      return; // Don't submit if not on final step
    }

    // Final validation only when actually submitting
    if (!formData.jobRole || (!formData.customJobRole && formData.jobRole === 'Other')) {
      setError('Please select or enter a job role');
      return;
    }

    if (formData.skills.length === 0) {
      setError('Please select at least one skill');
      return;
    }

    if (!formData.experienceLevel) {
      setError('Please select your experience level');
      return;
    }

    if (!formData.interviewType) {
      setError('Please select an interview type');
      return;
    }

    try {
      setIsGenerating(true);

      // Prepare interview setup data
      const interviewSetup = {
        jobRole: formData.jobRole,
        customJobRole: formData.customJobRole,
        skills: formData.skills,
        experienceLevel: formData.experienceLevel,
        interviewType: formData.interviewType,
        difficulty: formData.difficulty,
        duration: formData.duration
      };

      // Validate setup data
      const validation = interviewService.validateInterviewSetup(interviewSetup);
      if (!validation.isValid) {
        setError(validation.errors[0]);
        return;
      }

      // Generate questions using AI service
      const response = await interviewService.generateQuestions(interviewSetup);

      if (!response.success) {
        throw new Error(response.message || 'Failed to generate questions');
      }

      // Navigate to interview session with generated data
      navigate('/interview-session', {
        state: {
          interview: response.data
        }
      });

    } catch (error) {
      console.error('Error starting interview:', error);

      // Check if it's an authentication error
      if (error.message.includes('401') || error.message.includes('Unauthorized') || error.message.includes('User not found')) {
        setError('❌ Authentication expired. Please log out and log back in, or click the button below to clear your session.');
      } else {
        setError(error.message || 'Failed to start interview. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const steps = [
    { number: 1, title: 'Role', icon: Briefcase },
    { number: 2, title: 'Skills', icon: Code },
    { number: 3, title: 'Experience', icon: User },
    { number: 4, title: 'Config', icon: Settings2 }
  ];

  const stepHeading = {
    1: {
      title: 'Targeting Your Future.',
      subtitle: 'Select the professional role you are preparing for. Our AI will calibrate the interview environment based on industry standards.'
    },
    2: {
      title: 'Define Your Skill Stack.',
      subtitle: 'Choose the exact technologies and competencies you want to be assessed on for this session.'
    },
    3: {
      title: 'Calibrate Experience.',
      subtitle: 'Pick the level that best reflects your current stage so question depth and complexity stay realistic.'
    },
    4: {
      title: 'Finalize Configuration.',
      subtitle: 'Set interview mode and difficulty, then generate your tailored interview session.'
    }
  };

  const featuredRoles = ['Software Engineer', 'Product Manager', 'Data Scientist'];
  const extraRoles = availableJobRoles.filter((role) => !featuredRoles.includes(role) && role !== 'Other');

  const roleMeta = {
    'Software Engineer': {
      description: 'Backend, frontend, fullstack systems and algorithmic architecture.',
      icon: Code
    },
    'Product Manager': {
      description: 'Strategic roadmapping, user experience, and business logic execution.',
      icon: Briefcase
    },
    'Data Scientist': {
      description: 'Statistical modeling, ML pipelines, and quantitative insights.',
      icon: BarChart3
    }
  };

  const selectedRoleLabel = formData.jobRole === 'Other'
    ? (formData.customJobRole.trim() || 'Custom Role')
    : (formData.jobRole || 'your target role');

  const progressWidth = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="relative mx-auto max-w-[1120px] space-y-8 pb-6">
      <div className="pointer-events-none absolute -left-20 top-28 hidden text-[92px] font-semibold leading-[0.92] tracking-[0.1em] text-slate-200/70 xl:block">
        <p>PREP</p>
        <p>GROW</p>
        <p>WIN</p>
      </div>

      <div className="relative z-10 rounded-3xl border border-slate-200 bg-[#f5f7fc] px-5 py-6 shadow-sm sm:px-8 sm:py-8">
        <div className="mx-auto max-w-3xl">
          <div className="relative px-2 sm:px-6">
            <div className="absolute left-[30px] right-[30px] top-4 h-[2px] bg-blue-100 sm:left-[48px] sm:right-[48px]" />
            <div
              className="absolute left-[30px] top-4 h-[2px] bg-blue-600 transition-all duration-300 sm:left-[48px]"
              style={{ width: `calc((100% - 60px) * ${progressWidth / 100})` }}
            />

            <div className="relative flex items-start justify-between">
              {steps.map((step) => {
                const isCompleted = currentStep > step.number;
                const isActive = currentStep === step.number;

                return (
                  <div key={step.number} className="flex w-20 flex-col items-center gap-2 text-center sm:w-24">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition sm:h-9 sm:w-9 ${isCompleted || isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-400/40'
                        : 'bg-blue-100 text-slate-600'
                        }`}
                    >
                      {step.number}
                    </div>
                    <p className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${isCompleted || isActive ? 'text-blue-700' : 'text-slate-500'
                      }`}>
                      {step.title}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8 text-center sm:mt-10">
            <h1 className="text-3xl font-semibold text-slate-900 sm:text-5xl">{stepHeading[currentStep].title}</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-xl sm:leading-8">
              {stepHeading[currentStep].subtitle}
            </p>
          </div>

          {error && (
            <div className="mx-auto mt-6 max-w-2xl space-y-3">
              <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-rose-500" />
                <p className="flex-1 text-sm text-rose-700">{error}</p>
                <button
                  type="button"
                  onClick={() => setError('')}
                  className="text-rose-400 transition hover:text-rose-600"
                  aria-label="Dismiss error"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {error.includes('Authentication expired') && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem('token');
                      setError('');
                      window.location.href = '/login';
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    <Sparkles className="h-4 w-4" />
                    Clear Session & Login Again
                  </button>
                </div>
              )}
            </div>
          )}

          <form
            onKeyDown={(e) => {
              if (e.key === 'Enter' && currentStep !== 4) {
                e.preventDefault();
                nextStep();
              }
            }}
            className="mt-8 space-y-8"
          >
            {currentStep === 1 && (
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-3">
                  {featuredRoles.map((role) => {
                    const meta = roleMeta[role];
                    const Icon = meta?.icon || Briefcase;
                    const isSelected = formData.jobRole === role;

                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => handleJobRoleChange(role)}
                        className={`rounded-2xl border bg-white px-5 py-5 text-left transition ${isSelected
                          ? 'border-blue-500 shadow-lg shadow-blue-100'
                          : 'border-slate-200 hover:border-blue-300 hover:shadow-sm'
                          }`}
                      >
                        <div className="mb-4 flex items-start justify-between gap-3">
                          <h3 className="text-2xl font-semibold leading-tight text-slate-900">{role}</h3>
                          <span className={`rounded-xl p-2 ${isSelected ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                            <Icon className="h-4 w-4" />
                          </span>
                        </div>
                        <p className="text-sm leading-6 text-slate-500">{meta?.description || 'Role-specific interview simulation.'}</p>
                        <p className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
                          Select Role
                          <ChevronRight className="h-3 w-3" />
                        </p>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => handleJobRoleChange('Other')}
                  className={`flex w-full items-center justify-between rounded-2xl border border-dashed bg-white px-4 py-4 text-left transition ${formData.jobRole === 'Other'
                    ? 'border-blue-500 bg-blue-50/40'
                    : 'border-slate-300 hover:border-blue-400'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-blue-600 p-1.5 text-white">
                      <Plus className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <p className="text-base font-semibold text-slate-900">Custom Role</p>
                      <p className="text-sm text-slate-500">Define your own specific position or specialized niche.</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>

                {showCustomJobRole && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Enter Custom Role
                    </label>
                    <input
                      type="text"
                      placeholder="Machine Learning Engineer, QA Lead, Cloud Security Engineer..."
                      value={formData.customJobRole}
                      onChange={(e) => {
                        setError('');
                        setFormData({ ...formData, customJobRole: e.target.value });
                      }}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                )}

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">More Roles</p>
                  <div className="flex flex-wrap gap-2">
                    {extraRoles.map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => handleJobRoleChange(role)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${formData.jobRole === role
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-700'
                          }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Selected Role</p>
                    <h2 className="mt-1 text-xl font-semibold text-slate-900">{selectedRoleLabel}</h2>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                    {formData.skills.length} skills selected
                  </span>
                </div>

                {formData.skills.length > 0 && (
                  <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50/60 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">Your Stack</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.map((skill) => (
                        <span key={skill} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
                          {skill}
                          <button type="button" onClick={() => removeSkill(skill)} className="text-slate-400 transition hover:text-rose-600" aria-label={`Remove ${skill}`}>
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {Object.entries(getCurrentSkillCategories()).map(([category, skills]) => (
                    <div key={category} className="rounded-2xl border border-slate-200 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-800">{category}</h3>
                        <span className="text-xs text-slate-500">
                          {skills.filter((skill) => !formData.skills.includes(skill)).length} available
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {skills.map((skill) => {
                          const selected = formData.skills.includes(skill);
                          return (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => addSkill(skill)}
                              disabled={selected}
                              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${selected
                                ? 'cursor-not-allowed border-blue-200 bg-blue-50 text-blue-700'
                                : 'border-slate-300 text-slate-600 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700'
                                }`}
                            >
                              {skill}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Add Custom Skill</p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      placeholder="Domain architecture, GraphQL federation, data storytelling..."
                      value={customSkill}
                      onChange={(e) => setCustomSkill(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomSkill();
                        }
                      }}
                      className="h-11 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <button
                      type="button"
                      onClick={addCustomSkill}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Role Context</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900">{selectedRoleLabel}</h2>
                </div>

                <div className="grid gap-3">
                  {getCurrentExperienceLevels().map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => {
                        setError('');
                        setFormData({ ...formData, experienceLevel: level.value });
                      }}
                      className={`rounded-2xl border p-4 text-left transition ${formData.experienceLevel === level.value
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-slate-200 hover:border-blue-300'
                        }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-base font-semibold text-slate-900">{level.label}</p>
                        <span className={`h-3 w-3 rounded-full ${formData.experienceLevel === level.value ? 'bg-blue-600' : 'bg-slate-300'
                          }`}
                        />
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{level.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <h2 className="text-base font-semibold text-slate-900">Interview Type</h2>
                  </div>
                  <div className="space-y-3">
                    {[
                      { value: 'technical', label: 'Technical Interview', desc: 'Coding, architecture, and engineering judgment.' },
                      { value: 'behavioral', label: 'Behavioral Interview', desc: 'Leadership, collaboration, and communication depth.' },
                      { value: 'mixed', label: 'Mixed Interview', desc: 'Balanced technical and behavioral progression.' }
                    ].map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => {
                          setError('');
                          setFormData({ ...formData, interviewType: type.value });
                        }}
                        className={`w-full rounded-2xl border p-3 text-left transition ${formData.interviewType === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-blue-300'
                          }`}
                      >
                        <p className="text-sm font-semibold text-slate-900">{type.label}</p>
                        <p className="mt-1 text-xs text-slate-500">{type.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    <h2 className="text-base font-semibold text-slate-900">Configuration</h2>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Difficulty</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'easy', label: 'Easy' },
                        { value: 'medium', label: 'Medium' },
                        { value: 'hard', label: 'Hard' }
                      ].map((diff) => (
                        <button
                          key={diff.value}
                          type="button"
                          onClick={() => {
                            setError('');
                            setFormData({ ...formData, difficulty: diff.value });
                          }}
                          className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${formData.difficulty === diff.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-200 text-slate-600 hover:border-blue-300'
                            }`}
                        >
                          {diff.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Duration</p>
                    <div className="grid grid-cols-4 gap-2">
                      {[20, 30, 45, 60].map((minutes) => (
                        <button
                          key={minutes}
                          type="button"
                          onClick={() => setFormData({ ...formData, duration: minutes })}
                          className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${formData.duration === minutes
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-200 text-slate-600 hover:border-blue-300'
                            }`}
                        >
                          {minutes}m
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/70 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Session Summary</p>
                    <p className="mt-2 text-sm text-slate-700"><span className="font-semibold">Role:</span> {selectedRoleLabel}</p>
                    <p className="mt-1 text-sm text-slate-700"><span className="font-semibold">Skills:</span> {formData.skills.length || 0} selected</p>
                    <p className="mt-1 text-sm text-slate-700"><span className="font-semibold">Level:</span> {formData.experienceLevel || 'Not selected'}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-200 pt-6">
              <button
                type="button"
                onClick={prevStep}
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900 ${currentStep === 1 ? 'invisible' : ''
                  }`}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-300/40 transition hover:bg-blue-700"
                >
                  Next Step
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-300/40 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isGenerating && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                  {isGenerating ? 'Generating Questions...' : 'Start Interview'}
                  {!isGenerating && <ChevronRight className="h-4 w-4" />}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InterviewSetup;
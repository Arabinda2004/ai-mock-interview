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
  FileText
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
  
  const handleSubmit = async (e) => {
    e.preventDefault();
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

  // Step indicator
  const steps = [
    { number: 1, title: 'Job Role', icon: Briefcase },
    { number: 2, title: 'Skills', icon: Code },
    { number: 3, title: 'Experience', icon: User },
    { number: 4, title: 'Settings', icon: Target }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Set Up Your Interview</h1>
        <p className="text-gray-600">Configure your interview session to get personalized questions</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center space-x-8 mb-8">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div key={step.number} className="flex items-center space-x-2">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                currentStep >= step.number 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep > step.number ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <span className={`text-sm font-medium ${
                currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {step.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-md mx-auto space-y-3">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <div className="flex-shrink-0">
              <button
                type="button"
                onClick={() => setError('')}
                className="inline-flex text-red-400 hover:text-red-600"
              >
                <span className="sr-only">Dismiss</span>
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* Clear Session Button for Auth Errors */}
          {error.includes('Authentication expired') && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('token');
                  setError('');
                  window.location.href = '/login';
                }}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Clear Session & Login Again</span>
              </button>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} onKeyDown={(e) => {
        // Prevent form submission on Enter key unless on Step 4
        if (e.key === 'Enter' && currentStep !== 4) {
          e.preventDefault();
          nextStep(); // Move to next step instead
        }
      }} className="space-y-8">
        {/* Step 1: Job Role Selection */}
        {currentStep === 1 && (
          <div className="card">
            <div className="flex items-center space-x-2 mb-6">
              <Briefcase className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Select Your Job Role</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableJobRoles.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleJobRoleChange(role)}
                  className={`p-4 text-left border rounded-lg transition-all hover:shadow-md ${
                    formData.jobRole === role
                      ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{role}</div>
                  {role !== 'Other' && jobRoleConfig[role] && (
                    <div className="text-sm text-gray-500 mt-1">
                      {Object.keys(jobRoleConfig[role].skills).length} skill categories
                    </div>
                  )}
                </button>
              ))}
            </div>

            {showCustomJobRole && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter your job role:
                </label>
                <input
                  type="text"
                  placeholder="e.g., Machine Learning Engineer, QA Engineer..."
                  value={formData.customJobRole}
                  onChange={(e) => {
                    setError(''); // Clear error when user makes a change
                    setFormData({ ...formData, customJobRole: e.target.value });
                  }}
                  className="input-field"
                />
              </div>
            )}
          </div>
        )}

        {/* Step 2: Skills Selection */}
        {currentStep === 2 && (
          <div className="card">
            <div className="flex items-center space-x-2 mb-6">
              <Code className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Select Skills for {formData.jobRole === 'Other' ? formData.customJobRole : formData.jobRole}
              </h2>
            </div>

            {/* Selected Skills */}
            {formData.skills.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Selected Skills ({formData.skills.length}):</h3>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-2 hover:text-blue-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Skill Categories */}
            <div className="space-y-6">
              {Object.entries(getCurrentSkillCategories()).map(([category, skills]) => (
                <div key={category}>
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    {category}
                    <span className="ml-2 text-xs text-gray-500">
                      ({skills.filter(skill => !formData.skills.includes(skill)).length} available)
                    </span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => addSkill(skill)}
                        className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                          formData.skills.includes(skill)
                            ? 'border-blue-500 bg-blue-50 text-blue-700 cursor-not-allowed'
                            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                        }`}
                        disabled={formData.skills.includes(skill)}
                      >
                        {skill}
                        {formData.skills.includes(skill) && <span className="ml-1">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Custom Skill Input */}
            <div className="mt-8 border-t pt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Add Custom Skill</h3>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Enter a custom skill..."
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSkill())}
                  className="flex-1 input-field"
                />
                <button
                  type="button"
                  onClick={addCustomSkill}
                  className="btn-secondary flex items-center space-x-1"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Experience Level */}
        {currentStep === 3 && (
          <div className="card">
            <div className="flex items-center space-x-2 mb-6">
              <User className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Experience Level for {formData.jobRole === 'Other' ? formData.customJobRole : formData.jobRole}
              </h2>
            </div>

            <div className="space-y-4">
              {getCurrentExperienceLevels().map((level) => (
                <label key={level.value} className="flex items-start space-x-3 cursor-pointer p-4 border rounded-lg hover:bg-gray-50">
                  <input
                    type="radio"
                    name="experienceLevel"
                    value={level.value}
                    checked={formData.experienceLevel === level.value}
                    onChange={(e) => {
                      setError(''); // Clear error when user makes a change
                      setFormData({ ...formData, experienceLevel: e.target.value });
                    }}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{level.label}</div>
                    <div className="text-sm text-gray-600 mt-1">{level.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Interview Settings */}
        {currentStep === 4 && (
          <div className="space-y-8">
            {/* Interview Type */}
            <div className="card">
              <div className="flex items-center space-x-2 mb-6">
                <FileText className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Interview Type</h2>
              </div>

              <div className="space-y-3">
                {[
                  { value: 'technical', label: 'Technical Interview', desc: 'Coding & problem solving' },
                  { value: 'behavioral', label: 'Behavioral Interview', desc: 'Soft skills & experience' },
                  { value: 'mixed', label: 'Mixed Interview', desc: 'Technical + behavioral questions' }
                ].map((type) => (
                  <label key={type.value} className="flex items-start space-x-3 cursor-pointer p-4 border rounded-lg hover:bg-gray-50">
                    <input
                      type="radio"
                      name="interviewType"
                      value={type.value}
                      checked={formData.interviewType === type.value}
                      onChange={(e) => {
                        setError(''); // Clear error when user makes a change
                        setFormData({ ...formData, interviewType: e.target.value });
                      }}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{type.label}</div>
                      <div className="text-sm text-gray-500">{type.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div className="card">
              <div className="flex items-center space-x-2 mb-6">
                <Target className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Difficulty Level</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { value: 'easy', label: 'Easy', color: 'border-green-200 bg-green-50 text-green-800', desc: 'Basic concepts and straightforward questions' },
                  { value: 'medium', label: 'Medium', color: 'border-yellow-200 bg-yellow-50 text-yellow-800', desc: 'Standard interview questions' },
                  { value: 'hard', label: 'Hard', color: 'border-red-200 bg-red-50 text-red-800', desc: 'Challenging problems and advanced topics' }
                ].map((diff) => (
                  <label key={diff.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="difficulty"
                      value={diff.value}
                      checked={formData.difficulty === diff.value}
                      onChange={(e) => {
                        setError(''); // Clear error when user makes a change
                        setFormData({ ...formData, difficulty: e.target.value });
                      }}
                      className="sr-only"
                    />
                    <div className={`p-4 border-2 rounded-lg transition-all ${
                      formData.difficulty === diff.value
                        ? `${diff.color} border-opacity-100`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <div className={`font-semibold ${formData.difficulty === diff.value ? '' : 'text-gray-700'}`}>
                        {diff.label}
                      </div>
                      <div className={`text-sm mt-1 ${formData.difficulty === diff.value ? 'opacity-80' : 'text-gray-500'}`}>
                        {diff.desc}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={prevStep}
            className={`flex items-center space-x-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 ${
              currentStep === 1 ? 'invisible' : ''
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              className="btn-primary flex items-center space-x-2 px-6 py-2"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isGenerating}
              className="btn-primary flex items-center space-x-2 px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating && (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              )}
              <span>{isGenerating ? 'Generating Questions...' : 'Start Interview'}</span>
              {!isGenerating && <ChevronRight className="h-5 w-5" />}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default InterviewSetup;
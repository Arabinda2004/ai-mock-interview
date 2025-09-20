import React, { createContext, useContext, useState } from 'react';

const InterviewContext = createContext();

export const useInterview = () => {
  const context = useContext(InterviewContext);
  if (!context) {
    throw new Error('useInterview must be used within an InterviewProvider');
  }
  return context;
};

export const InterviewProvider = ({ children }) => {
  const [currentInterview, setCurrentInterview] = useState(null);
  const [interviewHistory, setInterviewHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const createInterview = async (interviewData) => {
    setIsLoading(true);
    try {
      // TODO: Implement actual API call
      console.log('Creating interview:', interviewData);
      
      const newInterview = {
        id: Date.now(),
        ...interviewData,
        status: 'created',
        createdAt: new Date().toISOString(),
        questions: [],
        answers: [],
      };
      
      setCurrentInterview(newInterview);
      return { success: true, interview: newInterview };
    } catch (error) {
      console.error('Create interview error:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const startInterview = (interviewId) => {
    // TODO: Implement interview start logic
    console.log('Starting interview:', interviewId);
  };

  const submitAnswer = async (questionId, answer) => {
    // TODO: Implement answer submission
    console.log('Submitting answer:', { questionId, answer });
  };

  const completeInterview = async (interviewId) => {
    setIsLoading(true);
    try {
      // TODO: Implement actual API call
      console.log('Completing interview:', interviewId);
      
      if (currentInterview && currentInterview.id === interviewId) {
        const completedInterview = {
          ...currentInterview,
          status: 'completed',
          completedAt: new Date().toISOString(),
        };
        
        setInterviewHistory(prev => [...prev, completedInterview]);
        setCurrentInterview(null);
        
        return { success: true, interview: completedInterview };
      }
      
      return { success: false, error: 'Interview not found' };
    } catch (error) {
      console.error('Complete interview error:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    currentInterview,
    interviewHistory,
    isLoading,
    createInterview,
    startInterview,
    submitAnswer,
    completeInterview,
    setCurrentInterview,
  };

  return (
    <InterviewContext.Provider value={value}>
      {children}
    </InterviewContext.Provider>
  );
};
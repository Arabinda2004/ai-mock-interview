import React, { useState, useEffect } from 'react';

const AuthDebugComponent = () => {
  const [debugInfo, setDebugInfo] = useState({});
  const [testResults, setTestResults] = useState({});

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      const info = {
        hasToken: !!token,
        hasUser: !!user,
        tokenLength: token ? token.length : 0,
        userInfo: user ? JSON.parse(user) : null
      };

      if (token) {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            info.tokenPayload = payload;
            info.tokenExpired = payload.exp * 1000 < Date.now();
            info.tokenExpiresAt = new Date(payload.exp * 1000).toString();
          }
        } catch (error) {
          info.tokenParseError = error.message;
        }
      }

      setDebugInfo(info);

      // Test API calls
      if (token) {
        try {
          // Test profile endpoint
          const profileResponse = await fetch('http://localhost:5001/api/auth/profile', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          const profileData = profileResponse.ok 
            ? await profileResponse.json() 
            : await profileResponse.text();
          
          setTestResults(prev => ({
            ...prev,
            profileStatus: profileResponse.status,
            profileResponse: profileData
          }));

          // Test interview endpoint
          const interviewResponse = await fetch('http://localhost:5001/api/interviews/questions/generate', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              jobRole: 'Software Engineer',
              skills: ['JavaScript', 'React'],
              experienceLevel: 'mid',
              interviewType: 'technical',
              difficulty: 'medium',
              duration: 30
            })
          });

          const interviewData = interviewResponse.ok 
            ? await interviewResponse.json() 
            : await interviewResponse.text();

          setTestResults(prev => ({
            ...prev,
            interviewStatus: interviewResponse.status,
            interviewResponse: interviewData
          }));

        } catch (error) {
          setTestResults(prev => ({
            ...prev,
            error: error.message
          }));
        }
      }
    };

    checkAuth();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Token Info</h2>
          <pre className="text-sm bg-gray-100 p-3 rounded overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">API Test Results</h2>
          <pre className="text-sm bg-gray-100 p-3 rounded overflow-auto">
            {JSON.stringify(testResults, null, 2)}
          </pre>
        </div>
      </div>

      <div className="mt-6">
        <button 
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Clear Storage & Reload
        </button>
      </div>
    </div>
  );
};

export default AuthDebugComponent;
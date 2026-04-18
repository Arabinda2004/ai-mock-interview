import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const hasCheckedAuth = useRef(false); // Prevent multiple auth checks
  const isChecking = useRef(false); // Prevent concurrent checks

  // Initialize auth state by checking with server (ONLY ONCE)
  useEffect(() => {
    // Prevent multiple calls - handle React Strict Mode
    if (hasCheckedAuth.current || isChecking.current) {
      return;
    }
    
    isChecking.current = true;
    
    const checkAuth = async () => {
      try {
        const result = await authAPI.getCurrentUser();
        if (result.success && result.data.user) {
          setUser(result.data.user);
          setIsAuthenticated(true);
        } else {
          // Not logged in - this is normal
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        // User not authenticated or token expired - this is normal for logged out users
        // Silently handle the error without logging
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
        hasCheckedAuth.current = true;
        isChecking.current = false;
      }
    };
    
    checkAuth();
    
    // Cleanup function for React Strict Mode
    return () => {
      // Don't reset flags on cleanup in Strict Mode
      // The flags should persist across mounts
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const result = await authAPI.login(email, password);
      
      if (result.success) {
        const { user } = result.data;
        
        // No localStorage - data is in HTTP-only cookie
        setUser(user);
        setIsAuthenticated(true);
        
        return { success: true, user };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const result = await authAPI.register(userData);
      
      if (result.success) {
        const { user } = result.data;
        
        // No localStorage - data is in HTTP-only cookie
        setUser(user);
        setIsAuthenticated(true);
        
        return { success: true, user };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: error.message || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call API to clear HTTP-only cookie on server
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with client-side logout even if server call fails
    }
    
    // Clear state (no localStorage to clear)
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (updatedUserData) => {
    setUser(updatedUserData);
  };

  const updateProfile = async (profileData) => {
    setLoading(true);
    try {
      const result = await authAPI.updateProfile(profileData);
      
      if (result.success) {
        const updatedUser = result.data.user;
        setUser(updatedUser);
        return { success: true, user: updatedUser };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: error.message || 'Failed to update profile' };
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    setLoading(true);
    try {
      const result = await authAPI.changePassword(currentPassword, newPassword);
      
      if (result.success) {
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, error: error.message || 'Failed to change password' };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateUser,
    updateProfile,
    changePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
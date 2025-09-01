// context/UserContext.tsx
'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

type UserAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOGOUT' }
  | { type: 'SET_AUTHENTICATED'; payload: boolean };

const initialState: UserState = {
  user: null,
  isLoading: true,
  error: null,
  isAuthenticated: false,
};

function userReducer(state: UserState, action: UserAction): UserState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isLoading: false,
        error: null,
        isAuthenticated: true,
      };
    
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        error: null,
        isLoading: false,
      };
    
    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload };
    
    default:
      return state;
  }
}

interface UserContextType {
  state: UserState;
  dispatch: React.Dispatch<UserAction>;
  fetchUser: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<boolean>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(userReducer, initialState);

  const fetchUser = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await fetch('/api/user/profile', {
        headers: {
          'x-user-id': '1' // Mock user ID - in real app this would come from auth token
        }
      });

      if (response.ok) {
        const userData = await response.json();
        dispatch({ type: 'SET_USER', payload: userData });
      } else if (response.status === 401) {
        // User not authenticated
        dispatch({ type: 'SET_AUTHENTICATED', payload: false });
        dispatch({ type: 'SET_LOADING', payload: false });
      } else {
        throw new Error('Failed to fetch user profile');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load user profile' });
    }
  };

  const updateUser = async (userData: Partial<User>): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': '1' // Mock user ID
        },
        body: JSON.stringify(userData)
      });

      const result = await response.json();

      if (response.ok) {
        dispatch({ type: 'SET_USER', payload: result.user });
        return true;
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to update profile' });
        return false;
      }
    } catch (error) {
      console.error('Error updating user:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error updating profile' });
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const logout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        dispatch({ type: 'LOGOUT' });
        // In a real app, you might want to redirect here or let the component handle it
      } else {
        throw new Error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Logout failed' });
    }
  };

  // Load user on mount
  useEffect(() => {
    fetchUser();
  }, []);

  const value: UserContextType = {
    state,
    dispatch,
    fetchUser,
    updateUser,
    logout,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// HOC for protected routes
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  const AuthenticatedComponent: React.FC<P> = (props) => {
    const { state } = useUser();

    if (state.isLoading) {
      return (
        <div className="flex h-screen bg-gray-900 text-white items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Authenticating...</h2>
            <p className="text-gray-400">Please wait...</p>
          </div>
        </div>
      );
    }

    if (!state.isAuthenticated) {
      // In a real app, redirect to login
      return (
        <div className="flex h-screen bg-gray-900 text-white items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-400">Please log in to continue</p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };

  return AuthenticatedComponent;
};
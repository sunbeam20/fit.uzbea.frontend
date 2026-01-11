// components/AuthInitializer.tsx
'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/redux';
import { fetchUserData } from '@/state/authSlice';

const AuthInitializer = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Check if user is authenticated on every page load
    const token = localStorage.getItem('token');
    
    if (token && !isAuthenticated) {
      // If we have a token but Redux says we're not authenticated, fetch user data
      dispatch(fetchUserData());
    }
  }, [dispatch, isAuthenticated]);

  // Optional: Show loading state while checking auth
  // if (isLoading && localStorage.getItem('token')) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen">
  //       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  //     </div>
  //   );
  // }

  return <>{children}</>;
};

export default AuthInitializer;
// app/(components)/AuthInitializer.tsx
"use client";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useGetMeQuery } from "@/state/api";
import { setCredentials, setLoading } from "@/state/authSlice";

interface AuthInitializerProps {
  children: React.ReactNode;
}

const AuthInitializer = ({ children }: AuthInitializerProps) => {
  const dispatch = useDispatch();
  
  // Only run getMe if we have a token
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const { data, error, isLoading } = useGetMeQuery(undefined, {
    skip: !token, // Only skip if no token exists
  });

  console.log('🔐 AuthInitializer:', { 
    hasToken: !!token, 
    isLoading, 
    data: !!data,
    error: !!error 
  });

  useEffect(() => {
    if (data && token) {
      console.log('🔐 Setting credentials with user data');
      dispatch(setCredentials({ user: data, token }));
    } else if (error) {
      console.log('🔐 Auth error, clearing token');
      localStorage.removeItem('token');
      dispatch(setLoading(false));
    }
  }, [data, error, token, dispatch]);

  // Don't show loading if we're skipping the query (no token)
  if (!token) {
    console.log('🔐 No token, rendering children immediately');
    dispatch(setLoading(false));
    return <>{children}</>;
  }

  if (isLoading) {
    console.log('🔐 Checking authentication, showing loading');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  console.log('🔐 AuthInitializer rendering children');
  return <>{children}</>;
};

export default AuthInitializer;
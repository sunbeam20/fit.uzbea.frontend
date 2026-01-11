// app/hooks/useAuth.ts
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/redux';
import { fetchUserData } from '@/state/authSlice';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, token, isAuthenticated, isLoading, initialized, error } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const loadUser = async () => {
      if (token && !user && initialized) {
        try {
          await dispatch(fetchUserData()).unwrap();
        } catch (error) {
          console.error('Failed to load user:', error);
        }
      }
    };

    loadUser();
  }, [dispatch, token, user, initialized]);

  return {
    user,
    token,
    isAuthenticated,
    isLoading: isLoading || (token && !user && initialized),
    initialized,
    error,
  };
};
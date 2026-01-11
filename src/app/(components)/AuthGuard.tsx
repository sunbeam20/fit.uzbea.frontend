"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/app/redux";

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);
  const [isChecking, setIsChecking] = useState(true);

  console.log('🔐 AuthGuard state:', { 
    isAuthenticated, 
    isLoading, 
    pathname,
    isChecking 
  });

  // Define public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/forgot-password'];
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    console.log('🔐 AuthGuard useEffect triggered');
    

    // Don't do anything while still loading
    if (!isAuthenticated) {
      console.log('🔐 Still loading auth state...');
      router.push("/");
      return;
    }

    setIsChecking(false);
    
    const checkAuth = () => {
      console.log('🔐 Checking auth with:', { isAuthenticated, isPublicRoute });
      
      // If not authenticated AND not on a public route, redirect to login
      if (!isAuthenticated && !isPublicRoute) {
        console.log('🔐 Not authenticated and not on public route, redirecting to login');
        router.push("/login");
        return;
      }

      // If authenticated AND on a public route (like login/register), redirect to dashboard
      if (isAuthenticated && isPublicRoute) {
        console.log('🔐 Already authenticated on public route, redirecting to dashboard');
        router.push("/");
        return;
      }

      console.log('🔐 Auth check passed');
    };

    // Small delay to ensure state is settled
    const timer = setTimeout(checkAuth, 100);
    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading, isPublicRoute, pathname, router]);

  // Show loading state while checking
  if (isChecking) {
    console.log('🔐 AuthGuard showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If not authenticated and not on public route, show nothing (redirect will happen)
  if (!isAuthenticated && !isPublicRoute) {
    console.log('🔐 Not authenticated and not on public route, showing nothing');
    return null;
  }

  console.log('🔐 AuthGuard rendering children');
  return <>{children}</>;
};

export default AuthGuard;
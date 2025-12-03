// app/(components)/AuthGuard.tsx
"use client";
import { useEffect } from "react";
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

  console.log('🔐 AuthGuard:', { isAuthenticated, isLoading, pathname });

  // Define public routes that don't require authentication
  const publicRoutes = ['/login', '/register'];
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    // Don't do anything while still loading
    if (isLoading) return;

    console.log('🔐 AuthGuard useEffect - checking authentication...');

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
  }, [isAuthenticated, isLoading, isPublicRoute, pathname, router]);

  // Show loading state while checking authentication
  if (isLoading) {
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
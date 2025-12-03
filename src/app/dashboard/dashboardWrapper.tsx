"use client";

import React, { useEffect } from "react";
import Navbar from "@/app/(components)/Navbar";
import Sidebar from "@/app/(components)/Sidebar";
import StoreProvider, { useAppSelector } from "../redux";
import Footer from "../Footer/page";
import AuthGuard from "../(components)/AuthGuard";
import { useSelector } from "react-redux";
import { RootState } from "@/app/redux";
import { usePathname } from "next/navigation"; // Add this import

interface DashboardWrapperProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed
  );
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  const pathname = usePathname(); // Add this hook

  console.log("🔐 DashboardWrapper:", { isAuthenticated, pathname });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.add("light");
    }
  });

  // Fix: Use pathname instead of window.location for Next.js compatibility
  const publicRoutes = ["/login", "/register"];
  const isPublicRoute = publicRoutes.includes(pathname) || !isAuthenticated;

  if (isPublicRoute) {
    console.log(
      "🔐 Public route or not authenticated, rendering without dashboard layout"
    );
    return <>{children}</>;
  }

  return (
    <div
      className={`${
        isDarkMode ? "bg-black text-white" : "bg-white text-black"
      } flex w-full min-h-screen`}
    >
      <Sidebar />
      <main
        className={`flex flex-col w-full h-full py-7 px-9 ${
          isSidebarCollapsed ? "md:pl-24" : "md:pl-72"
        }`}
      >
        <Navbar />
        {children}
        {/* <ProductsPage /> */}
        <Footer />
      </main>
    </div>
  );
};

const DashboardWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthGuard>
      <DashboardLayout>{children}</DashboardLayout>
    </AuthGuard>
  );
};

export default DashboardWrapper;

"use client";

import React, { useEffect } from "react";
import Navbar from "@/app/(components)/Navbar";
import Sidebar from "@/app/(components)/Sidebar";
import StoreProvider, { useAppSelector } from "../redux";
import Footer from "../Footer/page";
import AuthGuard from "../(components)/AuthGuard";
import { useSelector } from "react-redux";
import { RootState } from "@/app/redux";
import { usePathname } from "next/navigation";

interface DashboardWrapperProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed
  );
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  const showPanel = useAppSelector((state) => state.global.isPOSPanelOpen);
  const pathname = usePathname();

  // console.log("🔐 DashboardWrapper:", { isAuthenticated, pathname });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.add("light");
    }
  }, [isDarkMode]);

  const publicRoutes = ["/login", "/register"];
  const isPublicRoute = publicRoutes.includes(pathname);

  if (isPublicRoute || !isAuthenticated) {
    console.log(
      "🔐 Public route or not authenticated, rendering without dashboard layout"
    );
    return <>{children}</>;
  }

  return (
    <div
      className={`${
        isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      } flex w-full min-h-screen transition-colors`}
    >
      {!showPanel && <Sidebar />}
      <main
        className={`flex flex-col w-full h-full transition-all duration-300 ${
          isSidebarCollapsed ? "md:pl-12" : "md:pl-60"
        }`}
      >
        <Navbar />
        <div className="flex-1 p-6">{children}</div>
        {!showPanel && <Footer />}
      </main>
    </div>
  );
};

const DashboardWrapper = ({ children }: { children: React.ReactNode }) => {
  console.log("🔐 DashboardWrapper rendered");
  return (
    <AuthGuard>
      <DashboardLayout>{children}</DashboardLayout>
    </AuthGuard>
  );
};

export default DashboardWrapper;

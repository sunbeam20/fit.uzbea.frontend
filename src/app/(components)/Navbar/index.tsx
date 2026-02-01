"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sun,
  Search,
  User,
  Bell,
  Menu,
  Moon,
  ArrowLeft,
  ArrowRight,
  Settings,
  LogOut,
  User as UserIcon,
  CreditCard,
  HelpCircle,
} from "lucide-react";
import Image from "next/image";
import logo from "../../../../public/floppy.jpg";
import { useAppDispatch, useAppSelector } from "@/app/redux";
import {
  setIsDarkMode,
  setIsSidebarCollapsed,
  setIsPOSPanelOpen,
} from "@/state";
import { logout } from "@/state/authSlice";

const Navbar = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed
  );
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  const isPOSPanelOpen = useAppSelector((state) => state.global.isPOSPanelOpen);

  // Get auth state from Redux
  const { user, isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  // Profile modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileModalOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleSidebar = () => {
    dispatch(setIsSidebarCollapsed(!isSidebarCollapsed));
  };
  const toggleDarkMode = () => {
    dispatch(setIsDarkMode(!isDarkMode));
  };
  const togglePOSPanel = () => {
    dispatch(setIsPOSPanelOpen(!isPOSPanelOpen));
  };

  const handleProfileClick = () => {
    setIsProfileModalOpen(!isProfileModalOpen);
  };

  const handleLogout = async () => {
    try {
      // Call logout API endpoint
      const token = localStorage.getItem('token');
      if (token) {
        await fetch('/api/auth/logout', { 
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Dispatch logout action to clear Redux state
      dispatch(logout());
      
      // Clear all storage
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear cookies
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
      }
      
      // Redirect to login page
      router.push('/login');
      router.refresh();
      
      setIsProfileModalOpen(false);
    }
  };

  const handleProfileOption = (option: string) => {
    switch (option) {
      case "Settings":
        router.push("/settings");
        break;
      case "Help":
        router.push("/help");
        break;
      default:
        break;
    }
    setIsProfileModalOpen(false);
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.name) {
      const nameParts = user.name.split(' ');
      const firstName = nameParts[0].toUpperCase();
      return firstName[0];
    }
    return "U";
  };

  // Get user role - role is a string from backend
  const getUserRole = () => {
    return user?.Roles?.name;
  };

  // Show loading skeleton only when loading and no user
  if (isLoading && !user) {
    return (
      <nav className={`fixed top-0 left-0 right-0 flex items-center backdrop-blur-3xl justify-between w-full h-12 px-2 shadow-sm z-51 border-b ${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/50 border-gray-200"}`}>
        <div className="flex items-center gap-4">
          <div className="animate-pulse bg-gray-300 dark:bg-gray-700 h-8 w-32 rounded"></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="animate-pulse bg-gray-300 dark:bg-gray-700 h-8 w-24 rounded"></div>
        </div>
      </nav>
    );
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 flex items-center backdrop-blur-3xl justify-between w-full h-12 px-2 shadow-sm z-51 border-b ${
        isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/50 border-gray-200"
      }`}
    >
      {/* LEFT SECTION - Logo & Navigation */}
      <div className="flex items-center gap-4">
        {/* Sidebar Toggle */}
        <button
          onClick={toggleSidebar}
          className={`p-2 rounded-lg transition-colors ${
            isDarkMode
              ? "hover:bg-gray-700 text-gray-300"
              : "hover:bg-gray-100 text-gray-600"
          } ${isPOSPanelOpen ? "hidden" : ""}`}
        >
          <Menu className="w-5 h-5" />
        </button>
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <Image
            src={logo}
            alt="logo"
            className="rounded w-8 h-8 flex-shrink-0"
          />
          <h1
            className={`font-bold text-lg whitespace-nowrap transition-all duration-300 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            FLOPPY IT
          </h1>
        </div>
      </div>

      {/* RIGHT SECTION - Actions & User */}
      <div className="flex items-center gap-3">
        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode
                ? "hover:bg-gray-700 text-yellow-400"
                : "hover:bg-gray-100 text-gray-600"
            }`}
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {/* Notifications */}
          {/* <div className={`relative ${isPOSPanelOpen ? "hidden" : ""}`}>
            <button
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? "hover:bg-gray-700 text-gray-300"
                  : "hover:bg-gray-100 text-gray-600"
              }`}
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
            </button>
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-red-500 rounded-full border-2 border-white dark:border-gray-900">
              3
            </span>
          </div> */}

          {/* User Profile with Modal - Only show if user exists */}
          {user && (
            <div className="relative" ref={profileRef}>
              <button
                onClick={handleProfileClick}
                className={`flex items-center gap-2 pl-2 rounded-lg transition-colors ${
                  isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                } ${
                  isProfileModalOpen
                    ? isDarkMode
                      ? "bg-gray-700"
                      : "bg-gray-100"
                    : ""
                }`}
              >
                <div
                  className={`w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold border-2 ${
                    isDarkMode ? "border-gray-700" : "border-white"
                  }`}
                >
                  {getUserInitials()}
                </div>
                <span
                  className={`font-medium text-sm ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {user?.name || "User"}
                </span>
              </button>

              {/* Profile Modal */}
              {isProfileModalOpen && (
                <div
                  className={`absolute top-full right-0 mt-2 w-64 rounded-lg shadow-lg z-100 border ${
                    isDarkMode
                      ? "bg-gray-950/90 border-gray-700"
                      : "bg-white/90 border-gray-200"
                  }`}
                >
                  <div className="rounded-lg p-2 space-y-1">
                    {/* User Info */}
                    <div className="px-3 py-2 border-b border-gray-700 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {getUserInitials()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">
                            {user?.name || "User"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user?.email || "user@example.com"}
                          </p>
                          <p className="text-xs text-blue-500 dark:text-blue-400 capitalize">
                            {getUserRole()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Profile Options */}
                    <button
                      onClick={() => handleProfileOption("Settings")}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                        isDarkMode
                          ? "hover:bg-gray-700 text-gray-200"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </button>

                    <button
                      onClick={() => handleProfileOption("Help")}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                        isDarkMode
                          ? "hover:bg-gray-700 text-gray-200"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span>Help & Support</span>
                    </button>

                    {/* Divider */}
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

                    {/* Logout */}
                    <button
                      onClick={handleLogout}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                        isDarkMode
                          ? "hover:bg-red-600 text-red-200"
                          : "hover:bg-red-50 text-red-600"
                      }`}
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Actions */}
        <div className="flex md:hidden items-center gap-1">
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-lg ${
              isDarkMode
                ? "hover:bg-gray-700 text-yellow-400"
                : "hover:bg-gray-100 text-gray-600"
            }`}
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
          <button
            className={`p-2 rounded-lg relative ${
              isDarkMode
                ? "hover:bg-gray-700 text-gray-300"
                : "hover:bg-gray-100 text-gray-600"
            }`}
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 text-xs font-semibold text-white bg-red-500 rounded-full border border-white dark:border-gray-900">
              3
            </span>
          </button>
        </div>

        {/* POS Button */}
        <button
          onClick={togglePOSPanel}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm min-w-[80px] justify-center cursor-pointer ${
            isPOSPanelOpen
              ? "bg-blue-700 text-white hover:bg-blue-600 shadow-md"
              : "bg-blue-600 text-white hover:bg-blue-500"
          }`}
        >
          <span>POS</span>
          {isPOSPanelOpen ? (
            <ArrowRight className="w-4 h-4" />
          ) : (
            <ArrowLeft className="w-4 h-4" />
          )}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
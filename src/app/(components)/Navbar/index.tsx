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
import { logout } from "@/state/authSlice"; // Import your logout action

const Navbar = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  
  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed
  );
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  const isPOSPanelOpen = useAppSelector((state) => state.global.isPOSPanelOpen);
  
  // Get auth state from Redux
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  // Profile modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
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
      // Optional: Call your logout API endpoint if you have one
      // await fetch('/api/auth/logout', { method: 'POST' });
      
      // Dispatch logout action to clear Redux state
      dispatch(logout());
      
      // Clear any additional storage
      localStorage.removeItem('user');
      sessionStorage.clear();
      
      // Clear cookies if you're using them
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      
      // Redirect to login page
      router.push("/login");
      router.refresh(); // Refresh to ensure auth state is cleared
      
      console.log('Logged out successfully');
      
    } catch (error) {
      console.error("Logout error:", error);
      // Even if there's an error, clear client-side state
      dispatch(logout());
      router.push("/login");
    } finally {
      setIsProfileModalOpen(false);
    }
  };

  const handleProfileOption = (option: string) => {
    console.log(`Selected: ${option}`);
    // Add navigation or actions for other profile options
    switch (option) {
      case "Profile":
        router.push("/profile");
        break;
      case "Billing":
        router.push("/billing");
        break;
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
      const firstName = user.name.split(' ')[0].toUpperCase();
      return firstName[0];
    }
    return 'U';
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 flex items-center justify-between w-full h-16 px-4 lg:px-6 shadow-sm z-50 border-b ${
        isDarkMode ? "bg-black border-gray-700" : "bg-white border-gray-200"
      }`}
    >
      {/* LEFT SECTION - Logo & Navigation */}
      <div className="flex items-center gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <Image
            src={logo}
            alt="logo"
            className="rounded w-8 h-8 flex-shrink-0"
          />
          <h1
            className={`font-bold text-lg whitespace-nowrap transition-all duration-300 ${
              isSidebarCollapsed
                ? "opacity-0 scale-95 w-0 overflow-hidden"
                : "opacity-100 scale-100 w-auto"
            } ${isDarkMode ? "text-white" : "text-gray-900"}`}
          >
            FLOPPY IT
          </h1>
        </div>

        {/* Sidebar Toggle */}
        <button
          onClick={toggleSidebar}
          className={`p-2 rounded-lg transition-colors ${
            isDarkMode
              ? "hover:bg-gray-700 text-gray-300"
              : "hover:bg-gray-100 text-gray-600"
          }`}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search - Products (Desktop) */}
        <div className="hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="search"
              placeholder="Search Products..."
              className={`w-64 pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                isDarkMode
                  ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
              }`}
            />
          </div>
        </div>
      </div>

      {/* CENTER SECTION - Mobile Search */}
      <div className="absolute left-1/2 transform -translate-x-1/2 md:hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="search"
            placeholder="Search..."
            className={`w-48 pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              isDarkMode
                ? "bg-gray-800 border-gray-600 text-white"
                : "bg-gray-50 border-gray-300"
            }`}
          />
        </div>
      </div>

      {/* RIGHT SECTION - Actions & User */}
      <div className="flex items-center gap-3">
        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          {/* Customer Search */}
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="search"
              placeholder="Search Customers..."
              className={`w-48 pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                isDarkMode
                  ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
              }`}
            />
          </div>

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
          <div className="relative">
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
          </div>

          {/* User Profile with Modal */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={handleProfileClick}
              className={`flex items-center gap-2 pl-2 rounded-lg transition-colors ${
                isDarkMode
                  ? "hover:bg-gray-700"
                  : "hover:bg-gray-100"
              } ${isProfileModalOpen ? (isDarkMode ? "bg-gray-700" : "bg-gray-100") : ""}`}
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
                {user?.name.split(" ")[0] || 'User'}
              </span>
            </button>

            {/* Profile Modal */}
            {isProfileModalOpen && (
              <div className="absolute top-full right-0 mt-2 w-64 rounded-lg shadow-lg border z-50 animate-in fade-in-0 zoom-in-95">
                <div className={`
                  rounded-lg p-2 space-y-1
                  ${isDarkMode 
                    ? "bg-gray-800 border-gray-700 text-white" 
                    : "bg-white border-gray-200 text-gray-900"
                  }
                `}>
                  {/* User Info */}
                  <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {getUserInitials()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{user?.name || 'User'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user?.email || 'user@example.com'}
                        </p>
                        <p className="text-xs text-blue-500 dark:text-blue-400 capitalize">
                          {user?.role || 'User'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Profile Options */}
                  <button
                    onClick={() => handleProfileOption("Profile")}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                      isDarkMode
                        ? "hover:bg-gray-700 text-gray-200"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    <UserIcon className="w-4 h-4" />
                    <span>My Profile</span>
                  </button>

                  <button
                    onClick={() => handleProfileOption("Billing")}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                      isDarkMode
                        ? "hover:bg-gray-700 text-gray-200"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Billing & Plans</span>
                  </button>

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
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm min-w-[80px] justify-center ${
            isPOSPanelOpen
              ? "bg-blue-700 text-white shadow-md"
              : "bg-blue-600 text-white hover:bg-blue-700"
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
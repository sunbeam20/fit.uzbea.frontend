"use client";

import { useState, useEffect } from "react";
import { useAppSelector } from "@/app/redux";
import {
  User,
  Bell,
  Settings,
  Users,
  Save,
  Mail,
  Phone,
  MapPin,
  Lock,
  Shield,
  Database,
  RefreshCw,
  Globe,
  Calendar,
  Clock,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Download,
  Plus,
  Edit,
  Trash2,
  X,
} from "lucide-react";
import {
  useGetMeQuery,
  useUpdateProfileMutation,
  useGetAllUsersQuery,
  useGetUserStatsQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useDeactivateUserMutation,
  useActivateUserMutation,
  useGetRolesQuery,
  useGetPermissionsQuery,
  useUpdateRolePermissionsMutation,
  useUpdateUserPermissionsMutation,
} from "@/state/api";
import type { User as UserType } from "@/state/api";
import { Provider } from "react-redux";
import ProviderWrapper from "../(components)/ProviderWrapper";

const SettingsPage = () => {
  const isSidebarCollapsed = useAppSelector(
    (state) => (state as any).global?.isSidebarCollapsed ?? false
  );
  const isDarkMode = useAppSelector(
    (state) => (state as any).global?.isDarkMode ?? false
  );
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [isUserLoading, setIsUserLoading] = useState(false);

  // Alert modal state
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertType, setAlertType] = useState<"success" | "error" | "info">(
    "success"
  );
  const [alertMessage, setAlertMessage] = useState("");

  // Get current user
  const {
    data: currentUser,
    refetch: refetchProfile,
    isLoading: profileLoading,
  } = useGetMeQuery();

  // User management API calls
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");

  const {
    data: usersData,
    refetch: refetchUsers,
    isLoading: usersLoading,
  } = useGetAllUsersQuery({
    page,
    limit,
    search,
    role,
    status,
  });
  const { data: permissions, isLoading: permissionsLoading } =
    useGetPermissionsQuery();

  const { data: userStats, isLoading: statsLoading } = useGetUserStatsQuery();
  const { data: roles, isLoading: rolesLoading } = useGetRolesQuery();

  const [updateProfile] = useUpdateProfileMutation();
  const [createUser] = useCreateUserMutation();
  const [updateUser] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [deactivateUser] = useDeactivateUserMutation();
  const [activateUser] = useActivateUserMutation();
  const [updateRolePermissions] = useUpdateRolePermissionsMutation();
  const [updateUserPermissions] = useUpdateUserPermissionsMutation();

  // Profile state
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    lowStockAlerts: true,
    lowStockThreshold: 10,
    salesNotifications: true,
    purchaseNotifications: true,
    returnNotifications: true,
    dueDateReminders: true,
    reminderDays: 3,
  });

  // System settings state
  const [systemSettings, setSystemSettings] = useState({
    timezone: "Asia/Dhaka",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12h",
    autoBackup: true,
    backupFrequency: "daily",
    dataRetention: 365,
    maxFileSize: 10,
    logLevel: "info",
    maintenanceMode: false,
  });

  // User management state
  const [showPassword, setShowPassword] = useState(false);

  // New user modal state
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role_id: 2,
    phone: "",
    address: "",
    status: "Active" as "Active" | "Inactive",
  });

  // Edit user modal state
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editUserData, setEditUserData] = useState<UserType | null>(null);

  // Show alert function
  const showAlert = (type: "success" | "error" | "info", message: string) => {
    setAlertType(type);
    setAlertMessage(message);
    setShowAlertModal(true);
  };

  // Initialize data from API
  useEffect(() => {
    if (currentUser) {
      setProfileData((prev) => ({
        ...prev,
        name: currentUser.name || "",
        email: currentUser.email || "",
        phone: (currentUser as any).phone || "",
        address: (currentUser as any).address || "",
      }));
    }
  }, [currentUser]);

  // Filter users for user management
  const filteredUsers = (usersData?.users || []).filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      (user.userId && user.userId.toLowerCase().includes(search.toLowerCase()))
  );

  // Handle profile save
  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      await updateProfile({
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        address: profileData.address,
        ...(profileData.newPassword &&
          profileData.newPassword === profileData.confirmPassword && {
            currentPassword: profileData.currentPassword,
            newPassword: profileData.newPassword,
          }),
      }).unwrap();

      showAlert("success", "Profile updated successfully!");
      refetchProfile();

      // Clear password fields
      setProfileData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (error: any) {
      showAlert("error", error?.data?.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle notification settings save
  const handleSaveNotifications = async () => {
    setIsLoading(true);
    try {
      // In a real app, you would have an API endpoint for notification settings
      // For now, we'll simulate an API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showAlert("success", "Notification settings saved successfully!");
    } catch (error) {
      showAlert("error", "Failed to save notification settings");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle system settings save
  const handleSaveSystem = async () => {
    setIsLoading(true);
    try {
      // In a real app, you would have an API endpoint for system settings
      // For now, we'll simulate an API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showAlert("success", "System settings saved successfully!");
    } catch (error) {
      showAlert("error", "Failed to save system settings");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle create new user
  const handleCreateUser = async () => {
    if (newUserData.password !== newUserData.confirmPassword) {
      showAlert("error", "Passwords do not match");
      return;
    }

    if (newUserData.password.length < 6) {
      showAlert("error", "Password must be at least 6 characters");
      return;
    }

    setIsUserLoading(true);
    try {
      await createUser({
        name: newUserData.name,
        email: newUserData.email,
        password: newUserData.password,
        role_id: newUserData.role_id,
        phone: newUserData.phone,
        address: newUserData.address,
        status: newUserData.status,
      }).unwrap();

      showAlert("success", "User created successfully!");
      setShowNewUserModal(false);
      refetchUsers();

      // Reset form
      setNewUserData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role_id: 2,
        phone: "",
        address: "",
        status: "Active",
      });
    } catch (error: any) {
      showAlert("error", error?.data?.message || "Failed to create user");
    } finally {
      setIsUserLoading(false);
    }
  };

  // Handle edit user
  const handleEditUser = (user: UserType) => {
    setEditUserData(user);
    setShowEditUserModal(true);
  };

  const handleUpdateUser = async () => {
    if (!editUserData) return;

    setIsUserLoading(true);
    try {
      await updateUser({
        id: editUserData.id,
        userData: {
          name: editUserData.name,
          email: editUserData.email,
          role_id: editUserData.role_id,
          phone: editUserData.phone || "",
          address: editUserData.address || "",
          status: editUserData.status,
        },
      }).unwrap();

      showAlert("success", "User updated successfully!");
      setShowEditUserModal(false);
      refetchUsers();
    } catch (error: any) {
      showAlert("error", error?.data?.message || "Failed to update user");
    } finally {
      setIsUserLoading(false);
    }
  };

  // Handle delete user
  const handleDeleteUser = async (id: number) => {
    if (id === currentUser?.id) {
      showAlert("error", "You cannot delete your own account");
      return;
    }

    if (confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteUser(id).unwrap();
        showAlert("success", "User deleted successfully!");
        refetchUsers();
      } catch (error: any) {
        showAlert("error", error?.data?.message || "Failed to delete user");
      }
    }
  };

  // Handle activate/deactivate user
  const handleToggleUserStatus = async (user: UserType) => {
    if (user.id === currentUser?.id) {
      showAlert("error", "You cannot change your own status");
      return;
    }

    try {
      if (user.status === "Active") {
        await deactivateUser(user.id).unwrap();
        showAlert("success", "User deactivated successfully!");
      } else {
        await activateUser(user.id).unwrap();
        showAlert("success", "User activated successfully!");
      }
      refetchUsers();
    } catch (error: any) {
      showAlert(
        "error",
        error?.data?.message || "Failed to update user status"
      );
    }
  };

  const handleClearCache = () => {
    if (confirm("Are you sure you want to clear all cache?")) {
      // In a real app, you would call an API endpoint
      showAlert("success", "Cache cleared successfully!");
    }
  };

  const handleRunBackup = () => {
    // In a real app, you would call an API endpoint
    showAlert("success", "Backup initiated successfully!");
  };

  const getContentMargin = () => {
    return isSidebarCollapsed ? "ml-0" : "ml-0";
  };

  const tabs = [
    { id: "profile", label: "My Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "system", label: "System", icon: Settings },
    { id: "users", label: "User Management", icon: Users },
  ];

  // Handle search with debounce
  const handleSearchChange = (value: string) => {
    setSearch(value);
    // Reset to first page when searching
    setPage(1);
  };

  // user management need to update later to api call
  // ##################################################################################################################################
  // ##################################################################################################################################
  // ##################################################################################################################################
  // ##################################################################################################################################

  // State for permissions
  const [selectedPages, setSelectedPages] = useState<string[]>([
    "dashboard",
    "settings",
  ]);
  const [selectedDataPermissions, setSelectedDataPermissions] = useState<
    Record<string, boolean>
  >({
    viewPurchasePrice: false,
    viewCostPrice: false,
    editPurchasePrice: false,
    viewAllSales: true,
    viewAllPurchases: false,
    manageUsers: false,
    manageSettings: true,
  });

  // Define available pages and permissions
  const availablePages = [
    { id: "dashboard", name: "Dashboard" },
    { id: "sales", name: "Sales" },
    { id: "products", name: "Products" },
    { id: "purchases", name: "Purchases" },
    { id: "customers", name: "Customers" },
    { id: "suppliers", name: "Suppliers" },
    { id: "settings", name: "Settings" },
    { id: "reports", name: "Reports" },
    { id: "inventory", name: "Inventory" },
    { id: "pos", name: "POS" },
  ];

  const dataPermissions = [
    { id: "viewPurchasePrice", name: "View Purchase Price" },
    { id: "viewCostPrice", name: "View Cost Price" },
    { id: "editPurchasePrice", name: "Edit Purchase Price" },
    { id: "viewAllSales", name: "View All Sales" },
    { id: "viewAllPurchases", name: "View All Purchases" },
    { id: "manageUsers", name: "Manage Users" },
    { id: "manageSettings", name: "Manage System Settings" },
    { id: "viewFinancialReports", name: "View Financial Reports" },
    { id: "exportData", name: "Export Data" },
    { id: "deleteRecords", name: "Delete Records" },
  ];

  // Preset permissions
  const permissionPresets = {
    sales: {
      pages: ["dashboard", "sales", "customers", "pos", "settings"],
      dataPermissions: {
        viewPurchasePrice: false,
        viewCostPrice: false,
        editPurchasePrice: false,
        viewAllSales: true,
        viewAllPurchases: false,
        manageUsers: false,
        manageSettings: true,
      },
    },
    manager: {
      pages: [
        "dashboard",
        "sales",
        "products",
        "customers",
        "inventory",
        "pos",
        "settings",
      ],
      dataPermissions: {
        viewPurchasePrice: false, // Managers cannot see purchase price
        viewCostPrice: false,
        editPurchasePrice: false,
        viewAllSales: true,
        viewAllPurchases: true,
        manageUsers: false,
        manageSettings: true,
      },
    },
    admin: {
      pages: [
        "dashboard",
        "sales",
        "products",
        "purchases",
        "customers",
        "suppliers",
        "settings",
        "reports",
        "inventory",
        "pos",
      ],
      dataPermissions: {
        viewPurchasePrice: true,
        viewCostPrice: true,
        editPurchasePrice: true,
        viewAllSales: true,
        viewAllPurchases: true,
        manageUsers: true,
        manageSettings: true,
        viewFinancialReports: true,
        exportData: true,
        deleteRecords: true,
      },
    },
  };

  // Apply preset function
  const applyPreset = (presetType: "sales" | "manager" | "admin") => {
    const preset = permissionPresets[presetType];
    setSelectedPages(preset.pages);
    setSelectedDataPermissions(preset.dataPermissions);

    // Show notification
    showAlert(
      "success",
      `${
        presetType.charAt(0).toUpperCase() + presetType.slice(1)
      } preset applied!`
    );
  };

  // Load user permissions when editing
  useEffect(() => {
    if (editUserData) {
      // Fetch user permissions from API
      const loadUserPermissions = async () => {
        try {
          // This would be your API call to get user permissions
          // const response = await fetchUserPermissions(editUserData.id);
          // setSelectedPages(response.pageAccess);
          // setSelectedDataPermissions(response.dataPermissions);

          // For now, set defaults based on role
          if (editUserData.Roles?.name === "Sales") {
            applyPreset("sales");
          } else if (editUserData.Roles?.name === "Manager") {
            applyPreset("manager");
          } else if (editUserData.Roles?.name === "Admin") {
            applyPreset("admin");
          }
        } catch (error) {
          console.error("Failed to load user permissions:", error);
        }
      };

      loadUserPermissions();
    }
  }, [editUserData]);

  // Updated handle update function
  const handleUpdateUserWithPermissions = async () => {
    if (!editUserData) return;

    setIsUserLoading(true);
    try {
      // Update basic user info
      await updateUser({
        id: editUserData.id,
        userData: {
          name: editUserData.name,
          email: editUserData.email,
          role_id: editUserData.role_id,
          phone: editUserData.phone || "",
          address: editUserData.address || "",
          status: editUserData.status,
        },
      }).unwrap();

      // Update user permissions (custom overrides)
      await updateUserPermissions({
        userId: editUserData.id,
        overrides: {
          pageAccess: selectedPages,
          dataPermissions: selectedDataPermissions,
        },
      }).unwrap();

      showAlert("success", "User and permissions updated successfully!");
      setShowEditUserModal(false);
      refetchUsers();
    } catch (error: any) {
      showAlert("error", error?.data?.message || "Failed to update user");
    } finally {
      setIsUserLoading(false);
    }
  };
  function loadRolePermissions(roleId: number) {
    throw new Error("Function not implemented.");
  }

  // ##################################################################################################################################
  // ##################################################################################################################################
  // ##################################################################################################################################
  // ##################################################################################################################################

  return (
    <ProviderWrapper>
      <div
        className={`${getContentMargin()} p-6 min-h-full border rounded-xl shadow-2xl transition-all duration-300 mt-12 ${
          isDarkMode
            ? "bg-gray-800/50 border-gray-700"
            : "bg-white/50 border-gray-200"
        }`}
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
                <Settings className="w-8 h-8" />
                Settings
              </h1>
              <p
                className={`text-lg ${
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Manage your account and system preferences
              </p>
            </div>

            {/* System Actions */}
            <div className="flex gap-3 mt-4 md:mt-0">
              <button
                onClick={handleClearCache}
                className={`px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors ${
                  isDarkMode
                    ? "bg-gray-800 hover:bg-gray-700 border border-gray-700"
                    : "bg-white hover:bg-gray-100 border border-gray-200"
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                Clear Cache
              </button>
              <button
                onClick={handleRunBackup}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <Database className="w-4 h-4" />
                Run Backup
              </button>
            </div>
          </div>
        </div>
        {/* Tabs */}
        <div
          className={`border-b mb-8 ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-4 px-1 border-b-2 font-medium transition-colors cursor-pointer flex items-center gap-2 ${
                    activeTab === tab.id
                      ? isDarkMode
                        ? "border-blue-500 text-blue-400"
                        : "border-blue-600 text-blue-600"
                      : isDarkMode
                      ? "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
        {/* My Profile Tab */}
        {activeTab === "profile" && (
          <div className="space-y-8">
            {/* Personal Information Card */}
            <div
              className={`rounded-xl shadow-lg border ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <div
                className={`p-6 border-b ${
                  isDarkMode ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </h2>
                <p
                  className={`text-sm mt-1 ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Update your personal details
                </p>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Full Name *
                    </label>
                    <div className="relative">
                      <User
                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                          isDarkMode ? "text-gray-500" : "text-gray-400"
                        }`}
                      />
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail
                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                          isDarkMode ? "text-gray-500" : "text-gray-400"
                        }`}
                      />
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone
                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                          isDarkMode ? "text-gray-500" : "text-gray-400"
                        }`}
                      />
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Address
                    </label>
                    <div className="relative">
                      <MapPin
                        className={`absolute left-3 top-3 w-5 h-5 ${
                          isDarkMode ? "text-gray-500" : "text-gray-400"
                        }`}
                      />
                      <textarea
                        value={profileData.address}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            address: e.target.value,
                          }))
                        }
                        rows={3}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                        placeholder="Enter your address"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Change Password Card */}
            <div
              className={`rounded-xl shadow-lg border ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <div
                className={`p-6 border-b ${
                  isDarkMode ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Change Password
                </h2>
                <p
                  className={`text-sm mt-1 ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Update your password for enhanced security
                </p>
              </div>

              <div className="p-6">
                <div className="space-y-4 max-w-lg">
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Current Password
                    </label>
                    <div className="relative">
                      <Lock
                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                          isDarkMode ? "text-gray-500" : "text-gray-400"
                        }`}
                      />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={profileData.currentPassword}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            currentPassword: e.target.value,
                          }))
                        }
                        className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {showPassword ? (
                          <EyeOff
                            className={`w-5 h-5 ${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          />
                        ) : (
                          <Eye
                            className={`w-5 h-5 ${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <Lock
                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                          isDarkMode ? "text-gray-500" : "text-gray-400"
                        }`}
                      />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={profileData.newPassword}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            newPassword: e.target.value,
                          }))
                        }
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                        placeholder="Enter new password"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock
                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                          isDarkMode ? "text-gray-500" : "text-gray-400"
                        }`}
                      />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={profileData.confirmPassword}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            confirmPassword: e.target.value,
                          }))
                        }
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                        placeholder="Confirm new password"
                      />
                    </div>
                    {profileData.newPassword !==
                      profileData.confirmPassword && (
                      <p className="text-red-500 text-sm mt-1">
                        Passwords don't match
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div
                className={`flex justify-end gap-3 p-6 border-t ${
                  isDarkMode
                    ? "bg-gray-800/50 border-gray-700"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <button
                  onClick={handleSaveProfile}
                  disabled={isLoading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div className="space-y-8">
            <div
              className={`rounded-xl shadow-lg border ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <div
                className={`p-6 border-b ${
                  isDarkMode ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Preferences
                </h2>
                <p
                  className={`text-sm mt-1 ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Configure how you receive notifications
                </p>
              </div>

              <div className="p-6 space-y-8">
                {/* Email Notifications */}
                <div>
                  <h3
                    className={`font-medium text-lg mb-4 ${
                      isDarkMode ? "text-gray-300" : "text-gray-900"
                    }`}
                  >
                    Email Notifications
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label
                          className={`text-sm font-medium ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Enable Email Notifications
                        </label>
                        <p
                          className={`text-sm ${
                            isDarkMode ? "text-gray-500" : "text-gray-500"
                          }`}
                        >
                          Receive notifications via email
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.emailNotifications}
                          onChange={(e) =>
                            setNotificationSettings((prev) => ({
                              ...prev,
                              emailNotifications: e.target.checked,
                            }))
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label
                          className={`text-sm font-medium ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Low Stock Alerts
                        </label>
                        <p
                          className={`text-sm ${
                            isDarkMode ? "text-gray-500" : "text-gray-500"
                          }`}
                        >
                          Get notified when inventory is low
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.lowStockAlerts}
                          onChange={(e) =>
                            setNotificationSettings((prev) => ({
                              ...prev,
                              lowStockAlerts: e.target.checked,
                            }))
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {notificationSettings.lowStockAlerts && (
                      <div>
                        <label
                          className={`block text-sm font-medium mb-2 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Low Stock Threshold
                        </label>
                        <input
                          type="number"
                          value={notificationSettings.lowStockThreshold}
                          onChange={(e) =>
                            setNotificationSettings((prev) => ({
                              ...prev,
                              lowStockThreshold: parseInt(e.target.value) || 0,
                            }))
                          }
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isDarkMode
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          }`}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Event Notifications */}
                <div>
                  <h3
                    className={`font-medium text-lg mb-4 ${
                      isDarkMode ? "text-gray-300" : "text-gray-900"
                    }`}
                  >
                    Event Notifications
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label
                          className={`text-sm font-medium ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          New Sales
                        </label>
                        <p
                          className={`text-sm ${
                            isDarkMode ? "text-gray-500" : "text-gray-500"
                          }`}
                        >
                          Notify when new sales are made
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.salesNotifications}
                          onChange={(e) =>
                            setNotificationSettings((prev) => ({
                              ...prev,
                              salesNotifications: e.target.checked,
                            }))
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label
                          className={`text-sm font-medium ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          New Purchases
                        </label>
                        <p
                          className={`text-sm ${
                            isDarkMode ? "text-gray-500" : "text-gray-500"
                          }`}
                        >
                          Notify when new purchases are made
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.purchaseNotifications}
                          onChange={(e) =>
                            setNotificationSettings((prev) => ({
                              ...prev,
                              purchaseNotifications: e.target.checked,
                            }))
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label
                          className={`text-sm font-medium ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Returns & Exchanges
                        </label>
                        <p
                          className={`text-sm ${
                            isDarkMode ? "text-gray-500" : "text-gray-500"
                          }`}
                        >
                          Notify when products are returned or exchanged
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.returnNotifications}
                          onChange={(e) =>
                            setNotificationSettings((prev) => ({
                              ...prev,
                              returnNotifications: e.target.checked,
                            }))
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Reminder Settings */}
                <div>
                  <h3
                    className={`font-medium text-lg mb-4 ${
                      isDarkMode ? "text-gray-300" : "text-gray-900"
                    }`}
                  >
                    Reminders
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label
                          className={`text-sm font-medium ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Due Date Reminders
                        </label>
                        <p
                          className={`text-sm ${
                            isDarkMode ? "text-gray-500" : "text-gray-500"
                          }`}
                        >
                          Remind about upcoming due dates
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.dueDateReminders}
                          onChange={(e) =>
                            setNotificationSettings((prev) => ({
                              ...prev,
                              dueDateReminders: e.target.checked,
                            }))
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {notificationSettings.dueDateReminders && (
                      <div>
                        <label
                          className={`block text-sm font-medium mb-2 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Reminder Days Before Due
                        </label>
                        <input
                          type="number"
                          value={notificationSettings.reminderDays}
                          onChange={(e) =>
                            setNotificationSettings((prev) => ({
                              ...prev,
                              reminderDays: parseInt(e.target.value) || 0,
                            }))
                          }
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isDarkMode
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          }`}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div
                className={`flex justify-end gap-3 p-6 border-t ${
                  isDarkMode ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <button
                  onClick={handleSaveNotifications}
                  disabled={isLoading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* System Tab */}
        {activeTab === "system" && (
          <div className="space-y-8">
            {/* Date & Time Settings */}
            <div
              className={`rounded-xl shadow-lg border ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <div
                className={`p-6 border-b ${
                  isDarkMode ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Date & Time Settings
                </h2>
                <p
                  className={`text-sm mt-1 ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Configure date, time, and regional settings
                </p>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Timezone *
                    </label>
                    <div className="relative">
                      <Globe
                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                          isDarkMode ? "text-gray-500" : "text-gray-400"
                        }`}
                      />
                      <select
                        value={systemSettings.timezone}
                        onChange={(e) =>
                          setSystemSettings((prev) => ({
                            ...prev,
                            timezone: e.target.value,
                          }))
                        }
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                      >
                        <option value="Asia/Dhaka">
                          Bangladesh Time (GMT+6)
                        </option>
                        <option value="America/New_York">
                          Eastern Time (ET)
                        </option>
                        <option value="Europe/London">London (GMT)</option>
                        <option value="Asia/Dubai">Dubai (GST)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Date Format *
                    </label>
                    <div className="relative">
                      <Calendar
                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                          isDarkMode ? "text-gray-500" : "text-gray-400"
                        }`}
                      />
                      <select
                        value={systemSettings.dateFormat}
                        onChange={(e) =>
                          setSystemSettings((prev) => ({
                            ...prev,
                            dateFormat: e.target.value,
                          }))
                        }
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Time Format *
                    </label>
                    <div className="relative">
                      <Clock
                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                          isDarkMode ? "text-gray-500" : "text-gray-400"
                        }`}
                      />
                      <select
                        value={systemSettings.timeFormat}
                        onChange={(e) =>
                          setSystemSettings((prev) => ({
                            ...prev,
                            timeFormat: e.target.value,
                          }))
                        }
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                      >
                        <option value="12h">12-hour format</option>
                        <option value="24h">24-hour format</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* System Configuration */}
            <div
              className={`rounded-xl shadow-lg border ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <div
                className={`p-6 border-b ${
                  isDarkMode ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  System Configuration
                </h2>
                <p
                  className={`text-sm mt-1 ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Advanced system settings and maintenance
                </p>
              </div>

              <div className="p-6">
                <div className="space-y-8">
                  {/* Backup Settings */}
                  <div>
                    <h3
                      className={`font-medium text-lg mb-4 ${
                        isDarkMode ? "text-gray-300" : "text-gray-900"
                      }`}
                    >
                      Backup Settings
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label
                            className={`text-sm font-medium ${
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Auto Backup
                          </label>
                          <p
                            className={`text-sm ${
                              isDarkMode ? "text-gray-500" : "text-gray-500"
                            }`}
                          >
                            Automatically backup database
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={systemSettings.autoBackup}
                            onChange={(e) =>
                              setSystemSettings((prev) => ({
                                ...prev,
                                autoBackup: e.target.checked,
                              }))
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      {systemSettings.autoBackup && (
                        <>
                          <div>
                            <label
                              className={`block text-sm font-medium mb-2 ${
                                isDarkMode ? "text-gray-300" : "text-gray-700"
                              }`}
                            >
                              Backup Frequency
                            </label>
                            <select
                              value={systemSettings.backupFrequency}
                              onChange={(e) =>
                                setSystemSettings((prev) => ({
                                  ...prev,
                                  backupFrequency: e.target.value,
                                }))
                              }
                              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                isDarkMode
                                  ? "bg-gray-700 border-gray-600 text-white"
                                  : "bg-white border-gray-300 text-gray-900"
                              }`}
                            >
                              <option value="daily">Daily</option>
                              <option value="weekly">Weekly</option>
                              <option value="monthly">Monthly</option>
                            </select>
                          </div>

                          <div>
                            <label
                              className={`block text-sm font-medium mb-2 ${
                                isDarkMode ? "text-gray-300" : "text-gray-700"
                              }`}
                            >
                              Data Retention (days)
                            </label>
                            <input
                              type="number"
                              value={systemSettings.dataRetention}
                              onChange={(e) =>
                                setSystemSettings((prev) => ({
                                  ...prev,
                                  dataRetention: parseInt(e.target.value) || 0,
                                }))
                              }
                              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                isDarkMode
                                  ? "bg-gray-700 border-gray-600 text-white"
                                  : "bg-white border-gray-300 text-gray-900"
                              }`}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* File Settings */}
                  <div>
                    <h3
                      className={`font-medium text-lg mb-4 ${
                        isDarkMode ? "text-gray-300" : "text-gray-900"
                      }`}
                    >
                      File Settings
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label
                          className={`block text-sm font-medium mb-2 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Maximum File Size (MB)
                        </label>
                        <input
                          type="number"
                          value={systemSettings.maxFileSize}
                          onChange={(e) =>
                            setSystemSettings((prev) => ({
                              ...prev,
                              maxFileSize: parseInt(e.target.value) || 0,
                            }))
                          }
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isDarkMode
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Maintenance */}
                  <div>
                    <h3
                      className={`font-medium text-lg mb-4 ${
                        isDarkMode ? "text-gray-300" : "text-gray-900"
                      }`}
                    >
                      Maintenance
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label
                            className={`text-sm font-medium ${
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Maintenance Mode
                          </label>
                          <p
                            className={`text-sm ${
                              isDarkMode ? "text-gray-500" : "text-gray-500"
                            }`}
                          >
                            Put system in maintenance mode
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={systemSettings.maintenanceMode}
                            onChange={(e) =>
                              setSystemSettings((prev) => ({
                                ...prev,
                                maintenanceMode: e.target.checked,
                              }))
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={`flex justify-end gap-3 p-6 border-t ${
                  isDarkMode
                    ? "border-gray-700 bg-gray-800"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <button
                  onClick={handleSaveSystem}
                  disabled={isLoading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* User Management Tab */}
        {activeTab === "users" && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div
                className={`rounded-xl p-6 shadow-lg border ${
                  isDarkMode
                    ? "bg-blue-900/30 border-blue-800 text-white"
                    : "bg-blue-50 border-blue-200 text-blue-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Total Users</p>
                    <p className="text-3xl font-bold mt-2">
                      {userStats?.stats?.totalUsers || 0}
                    </p>
                  </div>
                  <div
                    className={`p-3 rounded-lg ${
                      isDarkMode ? "bg-blue-800/50" : "bg-blue-100"
                    }`}
                  >
                    <Users
                      className={`w-6 h-6 ${
                        isDarkMode ? "text-blue-300" : "text-blue-600"
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div
                className={`rounded-xl p-6 shadow-lg border ${
                  isDarkMode
                    ? "bg-green-900/30 border-green-800 text-white"
                    : "bg-green-50 border-green-200 text-green-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Active Users</p>
                    <p className="text-3xl font-bold mt-2">
                      {userStats?.stats?.activeUsers || 0}
                    </p>
                  </div>
                  <div
                    className={`p-3 rounded-lg ${
                      isDarkMode ? "bg-green-800/50" : "bg-green-100"
                    }`}
                  >
                    <CheckCircle
                      className={`w-6 h-6 ${
                        isDarkMode ? "text-green-300" : "text-green-600"
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div
                className={`rounded-xl p-6 shadow-lg border ${
                  isDarkMode
                    ? "bg-red-900/30 border-red-800 text-white"
                    : "bg-red-50 border-red-200 text-red-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Inactive Users</p>
                    <p className="text-3xl font-bold mt-2">
                      {userStats?.stats?.inactiveUsers || 0}
                    </p>
                  </div>
                  <div
                    className={`p-3 rounded-lg ${
                      isDarkMode ? "bg-red-800/50" : "bg-red-100"
                    }`}
                  >
                    <XCircle
                      className={`w-6 h-6 ${
                        isDarkMode ? "text-red-300" : "text-red-600"
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div
                className={`rounded-xl p-6 shadow-lg border ${
                  isDarkMode
                    ? "bg-purple-900/30 border-purple-800 text-white"
                    : "bg-purple-50 border-purple-200 text-purple-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Admin Users</p>
                    <p className="text-3xl font-bold mt-2">
                      {userStats?.stats?.adminUsers || 0}
                    </p>
                  </div>
                  <div
                    className={`p-3 rounded-lg ${
                      isDarkMode ? "bg-purple-800/50" : "bg-purple-100"
                    }`}
                  >
                    <Shield
                      className={`w-6 h-6 ${
                        isDarkMode ? "text-purple-300" : "text-purple-600"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Filters and Search */}
            <div
              className={`rounded-xl shadow-lg border ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <div
                className={`p-6 ${
                  isDarkMode ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search
                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                          isDarkMode ? "text-gray-500" : "text-gray-400"
                        }`}
                      />
                      <input
                        type="text"
                        placeholder="Search users by name, email, or ID..."
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className={`px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    >
                      <option value="all">All Roles</option>
                      <option value="Admin">Admin</option>
                      <option value="Manager">Manager</option>
                      <option value="Sales">Sales</option>
                      <option value="Inventory">Inventory</option>
                    </select>

                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className={`px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    >
                      <option value="all">All Status</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => refetchUsers()}
                      className={`px-4 py-3 border rounded-lg flex items-center gap-2 transition-colors ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 hover:bg-gray-600"
                          : "bg-white border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <Filter className="w-4 h-4" />
                      Refresh
                    </button>
                    <button
                      className={`px-4 py-3 border rounded-lg flex items-center gap-2 transition-colors ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 hover:bg-gray-600"
                          : "bg-white border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                    <button
                      onClick={() => setShowNewUserModal(true)}
                      className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      New User
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div
              className={`rounded-xl shadow-lg border overflow-hidden ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="overflow-x-auto">
                {usersLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <>
                    <table className="w-full">
                      <thead
                        className={`border-b ${
                          isDarkMode ? "border-gray-700" : "border-gray-200"
                        }`}
                      >
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                            User ID
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                            Role
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                            Created
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody
                        className={`divide-y ${
                          isDarkMode ? "divide-gray-700" : "divide-gray-200"
                        }`}
                      >
                        {filteredUsers.map((user) => (
                          <tr
                            key={user.id}
                            className={`hover:bg-opacity-50 ${
                              isDarkMode
                                ? "hover:bg-gray-700"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium">
                                {user.userId ||
                                  `USR-${user.id.toString().padStart(5, "0")}`}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium">
                                {user.name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div
                                className={`text-sm ${
                                  isDarkMode ? "text-gray-300" : "text-gray-500"
                                }`}
                              >
                                {user.email}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  user.Roles?.name === "Admin"
                                    ? "bg-red-100 text-red-800"
                                    : user.Roles?.name === "Manager"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : user.Roles?.name === "Sales"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {user.Roles?.name || "No Role"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => handleToggleUserStatus(user)}
                                disabled={user.id === currentUser?.id}
                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                                  user.status === "Active"
                                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                                } ${
                                  user.id === currentUser?.id
                                    ? "opacity-50 cursor-not-allowed"
                                    : "cursor-pointer"
                                }`}
                              >
                                {user.status === "Active" ? (
                                  <CheckCircle className="w-3 h-3" />
                                ) : (
                                  <XCircle className="w-3 h-3" />
                                )}
                                {user.status}
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div
                                className={`text-sm ${
                                  isDarkMode ? "text-gray-300" : "text-gray-500"
                                }`}
                              >
                                {user.createdAt
                                  ? new Date(user.createdAt).toLocaleDateString(
                                      "en-GB"
                                    )
                                  : "N/A"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleEditUser(user)}
                                  className={`p-2 rounded transition-colors ${
                                    isDarkMode
                                      ? "text-blue-400 hover:text-blue-300 hover:bg-gray-700"
                                      : "text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                  }`}
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  disabled={user.id === currentUser?.id}
                                  className={`p-2 rounded transition-colors ${
                                    user.id === currentUser?.id
                                      ? "text-gray-400 cursor-not-allowed"
                                      : isDarkMode
                                      ? "text-red-400 hover:text-red-300 hover:bg-gray-700"
                                      : "text-red-600 hover:text-red-800 hover:bg-red-50"
                                  }`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {filteredUsers.length === 0 && (
                      <div className="text-center py-12">
                        <Users
                          className={`w-16 h-16 mx-auto mb-4 ${
                            isDarkMode ? "text-gray-600" : "text-gray-400"
                          }`}
                        />
                        <h3
                          className={`text-lg font-medium mb-2 ${
                            isDarkMode ? "text-gray-300" : "text-gray-900"
                          }`}
                        >
                          {usersLoading ? "Loading users..." : "No users found"}
                        </h3>
                        <p
                          className={`mb-6 ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {search || role !== "all" || status !== "all"
                            ? "Try adjusting your search or filters"
                            : "Get started by creating your first user"}
                        </p>
                        {!search && role === "all" && status === "all" && (
                          <button
                            onClick={() => setShowNewUserModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 mx-auto"
                          >
                            <Plus className="w-4 h-4" />
                            New User
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        {/* New User Modal */}
        {showNewUserModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black bg-opacity-50">
            <div
              className={`rounded-xl border w-full max-w-md transform transition-all duration-300 ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-6 border-b">
                <h3
                  className={`text-lg font-bold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Create New User
                </h3>
                <button
                  onClick={() => setShowNewUserModal(false)}
                  className={`p-1 rounded-full ${
                    isDarkMode
                      ? "text-gray-400 hover:text-gray-300 hover:bg-gray-700"
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={newUserData.name}
                    onChange={(e) =>
                      setNewUserData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={newUserData.email}
                    onChange={(e) =>
                      setNewUserData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newUserData.password}
                      onChange={(e) =>
                        setNewUserData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showPassword ? (
                        <EyeOff
                          className={`w-5 h-5 ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        />
                      ) : (
                        <Eye
                          className={`w-5 h-5 ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Confirm Password *
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newUserData.confirmPassword}
                    onChange={(e) =>
                      setNewUserData((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                    placeholder="Confirm password"
                  />
                  {newUserData.password !== newUserData.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">
                      Passwords don't match
                    </p>
                  )}
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Role *
                  </label>
                  <select
                    value={newUserData.role_id}
                    onChange={(e) =>
                      setNewUserData((prev) => ({
                        ...prev,
                        role_id: parseInt(e.target.value),
                      }))
                    }
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                  >
                    {rolesLoading ? (
                      <option value="">Loading roles...</option>
                    ) : (
                      <>
                        <option value="">Select Role</option>
                        {roles?.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={newUserData.phone}
                      onChange={(e) =>
                        setNewUserData((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div className="flex-1">
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Status
                    </label>
                    <div className="flex gap-3 mt-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={newUserData.status === "Active"}
                          onChange={() =>
                            setNewUserData((prev) => ({
                              ...prev,
                              status: "Active",
                            }))
                          }
                          className="mr-2"
                        />
                        <span
                          className={
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }
                        >
                          Active
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={newUserData.status === "Inactive"}
                          onChange={() =>
                            setNewUserData((prev) => ({
                              ...prev,
                              status: "Inactive",
                            }))
                          }
                          className="mr-2"
                        />
                        <span
                          className={
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }
                        >
                          Inactive
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t">
                <button
                  onClick={() => setShowNewUserModal(false)}
                  className={`px-4 py-2.5 border rounded-lg transition-colors ${
                    isDarkMode
                      ? "border-gray-600 hover:bg-gray-700"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateUser}
                  disabled={
                    isUserLoading ||
                    !newUserData.name ||
                    !newUserData.email ||
                    !newUserData.password ||
                    newUserData.password !== newUserData.confirmPassword ||
                    newUserData.password.length < 6
                  }
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUserLoading ? "Creating..." : "Create User"}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Edit User Modal */}
        {showEditUserModal && editUserData && (
          <div className="fixed inset-0 flex items-center justify-center backdrop-blur-xs z-50 p-4">
            <div
              className={`rounded-xl border w-full max-w-4xl transform transition-all duration-300 ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-6 border-b">
                <h3
                  className={`text-lg font-bold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Edit User & Permissions
                </h3>
                <button
                  onClick={() => setShowEditUserModal(false)}
                  className={`p-1 rounded-full ${
                    isDarkMode
                      ? "text-gray-400 hover:text-gray-300 hover:bg-gray-700"
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Basic Information Column */}
                  <div className="space-y-6">
                    <h4
                      className={`text-lg font-semibold ${
                        isDarkMode ? "text-gray-300" : "text-gray-900"
                      }`}
                    >
                      Basic Information
                    </h4>

                    <div>
                      <label
                        className={`block text-sm font-medium mb-2 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={editUserData.name}
                        onChange={(e) =>
                          setEditUserData((prev) =>
                            prev ? { ...prev, name: e.target.value } : null
                          )
                        }
                        className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                      />
                    </div>

                    <div>
                      <label
                        className={`block text-sm font-medium mb-2 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={editUserData.email}
                        onChange={(e) =>
                          setEditUserData((prev) =>
                            prev ? { ...prev, email: e.target.value } : null
                          )
                        }
                        className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                      />
                    </div>

                    <div>
                      <label
                        className={`block text-sm font-medium mb-2 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Role *
                      </label>
                      <select
                        value={editUserData.role_id}
                        onChange={(e) => {
                          const roleId = parseInt(e.target.value);
                          setEditUserData((prev) =>
                            prev ? { ...prev, role_id: roleId } : null
                          );
                          // Load permissions for selected role
                          loadRolePermissions(roleId);
                        }}
                        className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                      >
                        {rolesLoading ? (
                          <option value="">Loading roles...</option>
                        ) : (
                          <>
                            <option value="">Select Role</option>
                            {roles?.map((role) => (
                              <option key={role.id} value={role.id}>
                                {role.name}
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                    </div>

                    <div>
                      <label
                        className={`block text-sm font-medium mb-3 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Status
                      </label>
                      <div className="flex gap-6">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            checked={editUserData.status === "Active"}
                            onChange={() =>
                              setEditUserData((prev) =>
                                prev ? { ...prev, status: "Active" } : null
                              )
                            }
                            className="mr-2"
                          />
                          <span
                            className={
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }
                          >
                            Active
                          </span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            checked={editUserData.status === "Inactive"}
                            onChange={() =>
                              setEditUserData((prev) =>
                                prev ? { ...prev, status: "Inactive" } : null
                              )
                            }
                            className="mr-2"
                          />
                          <span
                            className={
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }
                          >
                            Inactive
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Permissions Column */}
                  <div className="space-y-6">
                    <h4
                      className={`text-lg font-semibold ${
                        isDarkMode ? "text-gray-300" : "text-gray-900"
                      }`}
                    >
                      Permissions & Access Control
                    </h4>

                    {/* Page Access */}
                    <div>
                      <h5
                        className={`text-sm font-medium mb-3 ${
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Page Access
                      </h5>
                      <div className="space-y-2">
                        {availablePages.map((page) => (
                          <label key={page.id} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedPages.includes(page.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedPages([...selectedPages, page.id]);
                                } else {
                                  setSelectedPages(
                                    selectedPages.filter((p) => p !== page.id)
                                  );
                                }
                              }}
                              className="mr-2"
                            />
                            <span
                              className={
                                isDarkMode ? "text-gray-300" : "text-gray-700"
                              }
                            >
                              {page.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Data Permissions */}
                    <div>
                      <h5
                        className={`text-sm font-medium mb-3 ${
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Data Permissions
                      </h5>
                      <div className="space-y-2">
                        {dataPermissions.map((permission) => (
                          <div
                            key={permission.id}
                            className="flex items-center justify-between"
                          >
                            <span
                              className={
                                isDarkMode ? "text-gray-300" : "text-gray-700"
                              }
                            >
                              {permission.name}
                            </span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={
                                  selectedDataPermissions[permission.id] ||
                                  false
                                }
                                onChange={(e) => {
                                  setSelectedDataPermissions({
                                    ...selectedDataPermissions,
                                    [permission.id]: e.target.checked,
                                  });
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Preset Role Permissions */}
                    <div>
                      <h5
                        className={`text-sm font-medium mb-3 ${
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Role Presets
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => applyPreset("sales")}
                          className="px-3 py-1.5 text-xs bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          Sales Preset
                        </button>
                        <button
                          onClick={() => applyPreset("manager")}
                          className="px-3 py-1.5 text-xs bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors"
                        >
                          Manager Preset
                        </button>
                        <button
                          onClick={() => applyPreset("admin")}
                          className="px-3 py-1.5 text-xs bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 transition-colors"
                        >
                          Admin Preset
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t">
                <button
                  onClick={() => setShowEditUserModal(false)}
                  className={`px-4 py-2.5 border rounded-lg transition-colors ${
                    isDarkMode
                      ? "border-gray-600 hover:bg-gray-700"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateUserWithPermissions}
                  disabled={isUserLoading}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUserLoading ? "Updating..." : "Update User & Permissions"}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Alert Modal */}
        {showAlertModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black bg-opacity-50">
            <div
              className="p-6 rounded-xl border w-full max-w-md bg-white border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={`flex items-center mb-4 ${
                  alertType === "error"
                    ? "text-red-500"
                    : alertType === "success"
                    ? "text-green-500"
                    : "text-blue-500"
                }`}
              >
                <AlertCircle size={24} className="mr-3" />
                <h3 className="text-lg font-bold capitalize">{alertType}</h3>
              </div>
              <p className="mb-6 text-gray-700">{alertMessage}</p>
              <button
                onClick={() => setShowAlertModal(false)}
                className={`w-full py-2.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  alertType === "error"
                    ? "bg-red-500 hover:bg-red-600"
                    : alertType === "success"
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-blue-500 hover:bg-blue-600"
                } text-white`}
              >
                OK
              </button>
            </div>
          </div>
        )}
      </div>
    </ProviderWrapper>
  );
};

export default SettingsPage;

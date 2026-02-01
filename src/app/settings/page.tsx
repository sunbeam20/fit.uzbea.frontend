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
  Package,
  Tag,
  Building,
  UserPlus,
  Layers,
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
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useGetPermissionsQuery,
  useUpdateRolePermissionsMutation,
  useUpdateUserPermissionsMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetSuppliersQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
  useGetCustomersQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} from "@/state/api";
import type {
  User as UserType,
  Category,
  Supplier,
  Customer,
} from "@/state/api";
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
  const { data: roles, refetch: refetchRoles, isLoading: rolesLoading } = useGetRolesQuery();

  const [updateProfile] = useUpdateProfileMutation();
  const [createUser] = useCreateUserMutation();
  const [updateUser] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [deactivateUser] = useDeactivateUserMutation();
  const [activateUser] = useActivateUserMutation();
  const [updateRolePermissions] = useUpdateRolePermissionsMutation();
  const [updateUserPermissions] = useUpdateUserPermissionsMutation();
  const [createRole] = useCreateRoleMutation();
  const [updateRole] = useUpdateRoleMutation();
  const [deleteRole] = useDeleteRoleMutation();

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
        viewPurchasePrice: false,
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

  // Inventory Settings State
  const [activeInventorySection, setActiveInventorySection] =
    useState("categories");

  // Categories state
  const { data: categories = [], refetch: refetchCategories } =
    useGetCategoriesQuery();
  const [createCategory] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ id: 0, name: "" });
  const [categorySearch, setCategorySearch] = useState("");

  // Suppliers state
  const { data: suppliers = [], refetch: refetchSuppliers } =
    useGetSuppliersQuery();
  const [createSupplier] = useCreateSupplierMutation();
  const [updateSupplier] = useUpdateSupplierMutation();
  const [deleteSupplier] = useDeleteSupplierMutation();
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supplierForm, setSupplierForm] = useState({
    id: 0,
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [supplierSearch, setSupplierSearch] = useState("");

  // Customers state
  const { data: customers = [], refetch: refetchCustomers } =
    useGetCustomersQuery();
  const [createCustomer] = useCreateCustomerMutation();
  const [updateCustomer] = useUpdateCustomerMutation();
  const [deleteCustomer] = useDeleteCustomerMutation();
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    id: 0,
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [customerSearch, setCustomerSearch] = useState("");

  // Role State
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleForm, setRoleForm] = useState({
    id: 0,
    name: "",
    description: "",
  });
  const [roleSearch, setRoleSearch] = useState("");

  // Show alert function
  const showAlert = (type: "success" | "error" | "info", message: string) => {
    setAlertType(type);
    setAlertMessage(message);
    setShowAlertModal(true);
  };

  // Initialize data from API
  useEffect(() => {
    if (currentUser?.user) {
      console.log("Current User Object:", JSON.stringify(currentUser, null, 2));
      setProfileData({
        name: currentUser.user.name || "",
        email: currentUser.user.email || "",
        phone: currentUser.user.phone || "",
        address: currentUser.user.address || "",
        currentPassword: currentUser.user.currentPassword || "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  }, [currentUser]);

  // Filter users for user management
  const filteredUsers = (usersData?.users || []).filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      (user.userId && user.userId.toLowerCase().includes(search.toLowerCase()))
  );

  // Filter categories
  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  // Filter suppliers
  const filteredSuppliers = suppliers.filter(
    (sup) =>
      sup.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
      sup.phone.includes(supplierSearch) ||
      (sup.email &&
        sup.email.toLowerCase().includes(supplierSearch.toLowerCase()))
  );

  // Filter customers
  const filteredCustomers = customers.filter(
    (cust) =>
      cust.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      cust.phone.includes(customerSearch) ||
      (cust.email &&
        cust.email.toLowerCase().includes(customerSearch.toLowerCase()))
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
    setSelectedPages(["dashboard", "settings"]);
    setSelectedDataPermissions({
      viewPurchasePrice: false,
      viewCostPrice: false,
      editPurchasePrice: false,
      viewAllSales: true,
      viewAllPurchases: false,
      manageUsers: false,
      manageSettings: true,
    });
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
    if (id === currentUser?.user?.id) {
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
    if (user.id === currentUser?.user?.id) {
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

  // Handle search with debounce
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  // Apply preset function
  const applyPreset = (presetType: "sales" | "manager" | "admin") => {
    const preset = permissionPresets[presetType];
    setSelectedPages(preset.pages);
    setSelectedDataPermissions(preset.dataPermissions);
    showAlert(
      "success",
      `${
        presetType.charAt(0).toUpperCase() + presetType.slice(1)
      } preset applied!`
    );
  };

  // Handle update user with permissions
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
      if (currentUser?.user?.role_id === 1) {  // Changed from currentUser?.role_id
        // Only admin can update permissions
        await updateUserPermissions({
          userId: editUserData.id,
          overrides: {
            pageAccess: selectedPages,
            dataPermissions: selectedDataPermissions,
          },
        }).unwrap();
      }

      showAlert("success", "User and permissions updated successfully!");
      setShowEditUserModal(false);
      refetchUsers();
    } catch (error: any) {
      showAlert("error", error?.data?.message || "Failed to update user");
    } finally {
      setIsUserLoading(false);
    }
  };

  // Category CRUD Operations
  const handleOpenCategoryModal = (category?: Category) => {
    if (category) {
      setCategoryForm({ id: category.id, name: category.name });
    } else {
      setCategoryForm({ id: 0, name: "" });
    }
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) {
      showAlert("error", "Category name is required");
      return;
    }

    try {
      if (categoryForm.id > 0) {
        await updateCategory({
          id: categoryForm.id,
          category: { name: categoryForm.name },
        }).unwrap();
        showAlert("success", "Category updated successfully!");
      } else {
        await createCategory({ name: categoryForm.name }).unwrap();
        showAlert("success", "Category created successfully!");
      }
      setShowCategoryModal(false);
      refetchCategories();
    } catch (error: any) {
      showAlert("error", error?.data?.message || "Failed to save category");
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (confirm("Are you sure you want to delete this category?")) {
      try {
        await deleteCategory(id).unwrap();
        showAlert("success", "Category deleted successfully!");
        refetchCategories();
      } catch (error: any) {
        showAlert("error", error?.data?.message || "Failed to delete category");
      }
    }
  };

  // Supplier CRUD Operations
  const handleOpenSupplierModal = (supplier?: Supplier) => {
    if (supplier) {
      setSupplierForm({
        id: supplier.id,
        name: supplier.name,
        email: supplier.email || "",
        phone: supplier.phone,
        address: supplier.address || "",
      });
    } else {
      setSupplierForm({ id: 0, name: "", email: "", phone: "", address: "" });
    }
    setShowSupplierModal(true);
  };

  const handleSaveSupplier = async () => {
    if (!supplierForm.name.trim() || !supplierForm.phone.trim()) {
      showAlert("error", "Name and phone are required");
      return;
    }

    try {
      if (supplierForm.id > 0) {
        await updateSupplier({
          id: supplierForm.id,
          supplier: {
            name: supplierForm.name,
            email: supplierForm.email || undefined,
            phone: supplierForm.phone,
            address: supplierForm.address || undefined,
          },
        }).unwrap();
        showAlert("success", "Supplier updated successfully!");
      } else {
        await createSupplier({
          name: supplierForm.name,
          email: supplierForm.email || undefined,
          phone: supplierForm.phone,
          address: supplierForm.address || undefined,
        }).unwrap();
        showAlert("success", "Supplier created successfully!");
      }
      setShowSupplierModal(false);
      refetchSuppliers();
    } catch (error: any) {
      showAlert("error", error?.data?.message || "Failed to save supplier");
    }
  };

  const handleDeleteSupplier = async (id: number) => {
    if (confirm("Are you sure you want to delete this supplier?")) {
      try {
        await deleteSupplier(id).unwrap();
        showAlert("success", "Supplier deleted successfully!");
        refetchSuppliers();
      } catch (error: any) {
        showAlert("error", error?.data?.message || "Failed to delete supplier");
      }
    }
  };

  // Customer CRUD Operations
  const handleOpenCustomerModal = (customer?: Customer) => {
    if (customer) {
      setCustomerForm({
        id: customer.id,
        name: customer.name,
        email: customer.email || "",
        phone: customer.phone,
        address: customer.address || "",
      });
    } else {
      setCustomerForm({ id: 0, name: "", email: "", phone: "", address: "" });
    }
    setShowCustomerModal(true);
  };

  const handleSaveCustomer = async () => {
    if (!customerForm.name.trim() || !customerForm.phone.trim()) {
      showAlert("error", "Name and phone are required");
      return;
    }

    try {
      if (customerForm.id > 0) {
        await updateCustomer({
          id: customerForm.id,
          customer: {
            name: customerForm.name,
            email: customerForm.email || undefined,
            phone: customerForm.phone,
            address: customerForm.address || undefined,
          },
        }).unwrap();
        showAlert("success", "Customer updated successfully!");
      } else {
        await createCustomer({
          name: customerForm.name,
          email: customerForm.email || undefined,
          phone: customerForm.phone,
          address: customerForm.address || undefined,
        }).unwrap();
        showAlert("success", "Customer created successfully!");
      }
      setShowCustomerModal(false);
      refetchCustomers();
    } catch (error: any) {
      showAlert("error", error?.data?.message || "Failed to save customer");
    }
  };

  const handleDeleteCustomer = async (id: number) => {
    if (confirm("Are you sure you want to delete this customer?")) {
      try {
        await deleteCustomer(id).unwrap();
        showAlert("success", "Customer deleted successfully!");
        refetchCustomers();
      } catch (error: any) {
        showAlert("error", error?.data?.message || "Failed to delete customer");
      }
    }
  };

  // Role CRUD Operations
  const handleOpenRoleModal = (role?: {
    id: number;
    name: string;
    description?: string;
  }) => {
    if (role) {
      setRoleForm({
        id: role.id,
        name: role.name,
        description: role.description || "",
      });
    } else {
      setRoleForm({ id: 0, name: "", description: "" });
    }
    setShowRoleModal(true);
  };

  const handleSaveRole = async () => {
    if (!roleForm.name.trim()) {
      showAlert("error", "Role name is required");
      return;
    }

    try {
      if (roleForm.id > 0) {
        await updateRole({
          id: roleForm.id,
          role: {
            name: roleForm.name,
            description: roleForm.description || undefined,
          },
        }).unwrap();
        showAlert("success", "Role updated successfully!");
      } else {
        await createRole({
          name: roleForm.name,
          description: roleForm.description || undefined,
        }).unwrap();
        showAlert("success", "Role created successfully!");
      }
      setShowRoleModal(false);
      refetchRoles();
    } catch (error: any) {
      showAlert("error", error?.data?.message || "Failed to save role");
    }
  };

  const handleDeleteRole = async (id: number) => {
    if (id === 1) {
      // Assuming ID 1 is Admin role which shouldn't be deleted
      showAlert("error", "Cannot delete the Admin role");
      return;
    }

    if (confirm("Are you sure you want to delete this role?")) {
      try {
        await deleteRole(id).unwrap();
        showAlert("success", "Role deleted successfully!");
        refetchRoles();
      } catch (error: any) {
        showAlert("error", error?.data?.message || "Failed to delete role");
      }
    }
  };

  const handleClearCache = () => {
    if (confirm("Are you sure you want to clear all cache?")) {
      showAlert("success", "Cache cleared successfully!");
    }
  };

  const handleRunBackup = () => {
    showAlert("success", "Backup initiated successfully!");
  };

  const getContentMargin = () => {
    return isSidebarCollapsed ? "ml-0" : "ml-0";
  };

  const tabs = [
    { id: "profile", label: "My Profile", icon: User },
    { id: "system", label: "System", icon: Settings },
    { id: "users", label: "User Management", icon: Users },
    { id: "inventory", label: "Inventory Settings", icon: Database },
  ];

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
                                disabled={user.id === currentUser?.user?.id}
                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                                  user.status === "Active"
                                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                                } ${
                                  user.id === currentUser?.user?.id
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
                                  disabled={user.id === currentUser?.user?.id}
                                  className={`p-2 rounded transition-colors ${
                                    user.id === currentUser?.user?.id
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

        {/* Inventory Settings Tab */}
        {activeTab === "inventory" && (
          <div className="space-y-8">
            {/* Navigation */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setActiveInventorySection("categories")}
                className={`px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors ${
                  activeInventorySection === "categories"
                    ? "bg-blue-600 text-white"
                    : isDarkMode
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    : "bg-white text-gray-700 hover:bg-gray-50 border"
                }`}
              >
                <Tag className="w-4 h-4" />
                Categories
              </button>
              <button
                onClick={() => setActiveInventorySection("suppliers")}
                className={`px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors ${
                  activeInventorySection === "suppliers"
                    ? "bg-blue-600 text-white"
                    : isDarkMode
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    : "bg-white text-gray-700 hover:bg-gray-50 border"
                }`}
              >
                <Building className="w-4 h-4" />
                Suppliers
              </button>
              <button
                onClick={() => setActiveInventorySection("customers")}
                className={`px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors ${
                  activeInventorySection === "customers"
                    ? "bg-blue-600 text-white"
                    : isDarkMode
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    : "bg-white text-gray-700 hover:bg-gray-50 border"
                }`}
              >
                <UserPlus className="w-4 h-4" />
                Customers
              </button>
              <button
                onClick={() => setActiveInventorySection("roles")}
                className={`px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors ${
                  activeInventorySection === "roles"
                    ? "bg-blue-600 text-white"
                    : isDarkMode
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    : "bg-white text-gray-700 hover:bg-gray-50 border"
                }`}
              >
                <Shield className="w-4 h-4" />
                Roles
              </button>
            </div>

            {/* Categories Management */}
            {activeInventorySection === "categories" && (
              <div
                className={`rounded-xl shadow-lg border ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="p-6 border-b flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <Tag className="w-5 h-5" />
                      Categories Management
                    </h3>
                    <p
                      className={`text-sm mt-1 ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Manage product categories
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenCategoryModal()}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    New Category
                  </button>
                </div>

                <div className="p-6">
                  <div className="mb-6">
                    <div className="relative">
                      <Search
                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                          isDarkMode ? "text-gray-500" : "text-gray-400"
                        }`}
                      />
                      <input
                        type="text"
                        placeholder="Search categories..."
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead
                        className={`border-b ${
                          isDarkMode ? "border-gray-700" : "border-gray-200"
                        }`}
                      >
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                            ID
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                            Category Name
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
                        {filteredCategories.map((category) => (
                          <tr
                            key={category.id}
                            className={`hover:bg-opacity-50 ${
                              isDarkMode
                                ? "hover:bg-gray-700"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium">
                                {category.id}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium">
                                {category.name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    handleOpenCategoryModal(category)
                                  }
                                  className={`p-2 rounded transition-colors ${
                                    isDarkMode
                                      ? "text-blue-400 hover:text-blue-300 hover:bg-gray-700"
                                      : "text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                  }`}
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteCategory(category.id)
                                  }
                                  className={`p-2 rounded transition-colors ${
                                    isDarkMode
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

                    {filteredCategories.length === 0 && (
                      <div className="text-center py-12">
                        <Tag
                          className={`w-16 h-16 mx-auto mb-4 ${
                            isDarkMode ? "text-gray-600" : "text-gray-400"
                          }`}
                        />
                        <h3
                          className={`text-lg font-medium mb-2 ${
                            isDarkMode ? "text-gray-300" : "text-gray-900"
                          }`}
                        >
                          No categories found
                        </h3>
                        <p
                          className={`mb-6 ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {categorySearch
                            ? "Try adjusting your search"
                            : "Get started by creating your first category"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Suppliers Management */}
            {activeInventorySection === "suppliers" && (
              <div
                className={`rounded-xl shadow-lg border ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="p-6 border-b flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <Building className="w-5 h-5" />
                      Suppliers Management
                    </h3>
                    <p
                      className={`text-sm mt-1 ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Manage product suppliers
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenSupplierModal()}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    New Supplier
                  </button>
                </div>

                <div className="p-6">
                  <div className="mb-6">
                    <div className="relative">
                      <Search
                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                          isDarkMode ? "text-gray-500" : "text-gray-400"
                        }`}
                      />
                      <input
                        type="text"
                        placeholder="Search suppliers..."
                        value={supplierSearch}
                        onChange={(e) => setSupplierSearch(e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead
                        className={`border-b ${
                          isDarkMode ? "border-gray-700" : "border-gray-200"
                        }`}
                      >
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                            ID
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                            Phone
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                            Email
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
                        {filteredSuppliers.map((supplier) => (
                          <tr
                            key={supplier.id}
                            className={`hover:bg-opacity-50 ${
                              isDarkMode
                                ? "hover:bg-gray-700"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium">
                                {supplier.id}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium">
                                {supplier.name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm">{supplier.phone}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm">
                                {supplier.email || "-"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    handleOpenSupplierModal(supplier)
                                  }
                                  className={`p-2 rounded transition-colors ${
                                    isDarkMode
                                      ? "text-blue-400 hover:text-blue-300 hover:bg-gray-700"
                                      : "text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                  }`}
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteSupplier(supplier.id)
                                  }
                                  className={`p-2 rounded transition-colors ${
                                    isDarkMode
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

                    {filteredSuppliers.length === 0 && (
                      <div className="text-center py-12">
                        <Building
                          className={`w-16 h-16 mx-auto mb-4 ${
                            isDarkMode ? "text-gray-600" : "text-gray-400"
                          }`}
                        />
                        <h3
                          className={`text-lg font-medium mb-2 ${
                            isDarkMode ? "text-gray-300" : "text-gray-900"
                          }`}
                        >
                          No suppliers found
                        </h3>
                        <p
                          className={`mb-6 ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {supplierSearch
                            ? "Try adjusting your search"
                            : "Get started by creating your first supplier"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Customers Management */}
            {activeInventorySection === "customers" && (
              <div
                className={`rounded-xl shadow-lg border ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="p-6 border-b flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <UserPlus className="w-5 h-5" />
                      Customers Management
                    </h3>
                    <p
                      className={`text-sm mt-1 ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Manage customers
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenCustomerModal()}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    New Customer
                  </button>
                </div>

                <div className="p-6">
                  <div className="mb-6">
                    <div className="relative">
                      <Search
                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                          isDarkMode ? "text-gray-500" : "text-gray-400"
                        }`}
                      />
                      <input
                        type="text"
                        placeholder="Search customers..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead
                        className={`border-b ${
                          isDarkMode ? "border-gray-700" : "border-gray-200"
                        }`}
                      >
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                            ID
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                            Phone
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                            Email
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
                        {filteredCustomers.map((customer) => (
                          <tr
                            key={customer.id}
                            className={`hover:bg-opacity-50 ${
                              isDarkMode
                                ? "hover:bg-gray-700"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium">
                                {customer.id}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium">
                                {customer.name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm">{customer.phone}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm">
                                {customer.email || "-"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    handleOpenCustomerModal(customer)
                                  }
                                  className={`p-2 rounded transition-colors ${
                                    isDarkMode
                                      ? "text-blue-400 hover:text-blue-300 hover:bg-gray-700"
                                      : "text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                  }`}
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteCustomer(customer.id)
                                  }
                                  className={`p-2 rounded transition-colors ${
                                    isDarkMode
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

                    {filteredCustomers.length === 0 && (
                      <div className="text-center py-12">
                        <UserPlus
                          className={`w-16 h-16 mx-auto mb-4 ${
                            isDarkMode ? "text-gray-600" : "text-gray-400"
                          }`}
                        />
                        <h3
                          className={`text-lg font-medium mb-2 ${
                            isDarkMode ? "text-gray-300" : "text-gray-900"
                          }`}
                        >
                          No customers found
                        </h3>
                        <p
                          className={`mb-6 ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {customerSearch
                            ? "Try adjusting your search"
                            : "Get started by creating your first customer"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Roles Management */}
            {activeInventorySection === "roles" && (
              <div
                className={`rounded-xl shadow-lg border ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="p-6 border-b flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Roles Management
                    </h3>
                    <p
                      className={`text-sm mt-1 ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Manage user roles and permissions
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenRoleModal()}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    New Role
                  </button>
                </div>

                <div className="p-6">
                  <div className="mb-6">
                    <div className="relative">
                      <Search
                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                          isDarkMode ? "text-gray-500" : "text-gray-400"
                        }`}
                      />
                      <input
                        type="text"
                        placeholder="Search roles..."
                        value={roleSearch}
                        onChange={(e) => setRoleSearch(e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead
                        className={`border-b ${
                          isDarkMode ? "border-gray-700" : "border-gray-200"
                        }`}
                      >
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                            ID
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                            Role Name
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
                        {rolesLoading ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-8 text-center">
                              <div className="flex justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          roles
                            ?.filter(
                              (role) =>
                                role.name
                                  .toLowerCase()
                                  .includes(roleSearch.toLowerCase()) 
                            )
                            .map((role) => (
                              <tr
                                key={role.id}
                                className={`hover:bg-opacity-50 ${
                                  isDarkMode
                                    ? "hover:bg-gray-700"
                                    : "hover:bg-gray-50"
                                }`}
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium">
                                    {role.id}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium">
                                    {role.name}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleOpenRoleModal(role)}
                                      disabled={role.id === 1}
                                      className={`p-2 rounded transition-colors ${
                                        role.id === 1
                                          ? "text-gray-400 cursor-not-allowed"
                                          : isDarkMode
                                          ? "text-blue-400 hover:text-blue-300 hover:bg-gray-700"
                                          : "text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                      }`}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteRole(role.id)}
                                      disabled={role.id === 1} // Disable delete for Admin role
                                      className={`p-2 rounded transition-colors ${
                                        role.id === 1
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
                            ))
                        )}
                      </tbody>
                    </table>

                    {!rolesLoading && roles?.length === 0 && (
                      <div className="text-center py-12">
                        <Shield
                          className={`w-16 h-16 mx-auto mb-4 ${
                            isDarkMode ? "text-gray-600" : "text-gray-400"
                          }`}
                        />
                        <h3
                          className={`text-lg font-medium mb-2 ${
                            isDarkMode ? "text-gray-300" : "text-gray-900"
                          }`}
                        >
                          No roles found
                        </h3>
                        <p
                          className={`mb-6 ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {roleSearch
                            ? "Try adjusting your search"
                            : "Get started by creating your first role"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
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

        {/* Category Modal */}
        {showCategoryModal && (
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
                  {categoryForm.id > 0 ? "Edit Category" : "New Category"}
                </h3>
                <button
                  onClick={() => setShowCategoryModal(false)}
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
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, name: e.target.value })
                    }
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                    placeholder="Enter category name"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t">
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className={`px-4 py-2.5 border rounded-lg transition-colors ${
                    isDarkMode
                      ? "border-gray-600 hover:bg-gray-700"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCategory}
                  disabled={!categoryForm.name.trim()}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {categoryForm.id > 0 ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Supplier Modal */}
        {showSupplierModal && (
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
                  {supplierForm.id > 0 ? "Edit Supplier" : "New Supplier"}
                </h3>
                <button
                  onClick={() => setShowSupplierModal(false)}
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
                    Supplier Name *
                  </label>
                  <input
                    type="text"
                    value={supplierForm.name}
                    onChange={(e) =>
                      setSupplierForm({ ...supplierForm, name: e.target.value })
                    }
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                    placeholder="Enter supplier name"
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={supplierForm.phone}
                    onChange={(e) =>
                      setSupplierForm({
                        ...supplierForm,
                        phone: e.target.value,
                      })
                    }
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    value={supplierForm.email}
                    onChange={(e) =>
                      setSupplierForm({
                        ...supplierForm,
                        email: e.target.value,
                      })
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
                    Address
                  </label>
                  <textarea
                    value={supplierForm.address}
                    onChange={(e) =>
                      setSupplierForm({
                        ...supplierForm,
                        address: e.target.value,
                      })
                    }
                    rows={3}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                    placeholder="Enter address"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t">
                <button
                  onClick={() => setShowSupplierModal(false)}
                  className={`px-4 py-2.5 border rounded-lg transition-colors ${
                    isDarkMode
                      ? "border-gray-600 hover:bg-gray-700"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSupplier}
                  disabled={
                    !supplierForm.name.trim() || !supplierForm.phone.trim()
                  }
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {supplierForm.id > 0 ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Customer Modal */}
        {showCustomerModal && (
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
                  {customerForm.id > 0 ? "Edit Customer" : "New Customer"}
                </h3>
                <button
                  onClick={() => setShowCustomerModal(false)}
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
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={customerForm.name}
                    onChange={(e) =>
                      setCustomerForm({ ...customerForm, name: e.target.value })
                    }
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                    placeholder="Enter customer name"
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={customerForm.phone}
                    onChange={(e) =>
                      setCustomerForm({
                        ...customerForm,
                        phone: e.target.value,
                      })
                    }
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    value={customerForm.email}
                    onChange={(e) =>
                      setCustomerForm({
                        ...customerForm,
                        email: e.target.value,
                      })
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
                    Address
                  </label>
                  <textarea
                    value={customerForm.address}
                    onChange={(e) =>
                      setCustomerForm({
                        ...customerForm,
                        address: e.target.value,
                      })
                    }
                    rows={3}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                    placeholder="Enter address"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t">
                <button
                  onClick={() => setShowCustomerModal(false)}
                  className={`px-4 py-2.5 border rounded-lg transition-colors ${
                    isDarkMode
                      ? "border-gray-600 hover:bg-gray-700"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCustomer}
                  disabled={
                    !customerForm.name.trim() || !customerForm.phone.trim()
                  }
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {customerForm.id > 0 ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Role Modal */}
        {showRoleModal && (
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
                  {roleForm.id > 0 ? "Edit Role" : "New Role"}
                </h3>
                <button
                  onClick={() => setShowRoleModal(false)}
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
                    Role Name *
                  </label>
                  <input
                    type="text"
                    value={roleForm.name}
                    onChange={(e) =>
                      setRoleForm({ ...roleForm, name: e.target.value })
                    }
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                    placeholder="Enter role name (e.g., Manager, Sales)"
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Description
                  </label>
                  <textarea
                    value={roleForm.description}
                    onChange={(e) =>
                      setRoleForm({ ...roleForm, description: e.target.value })
                    }
                    rows={3}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                    placeholder="Enter role description (optional)"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t">
                <button
                  onClick={() => setShowRoleModal(false)}
                  className={`px-4 py-2.5 border rounded-lg transition-colors ${
                    isDarkMode
                      ? "border-gray-600 hover:bg-gray-700"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRole}
                  disabled={!roleForm.name.trim()}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {roleForm.id > 0 ? "Update" : "Create"}
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

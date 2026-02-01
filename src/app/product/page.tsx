"use client";
import { useState, useRef, useEffect } from "react";
import { useAppSelector } from "@/app/redux";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Filter,
  Download,
  Eye,
  Package,
  Warehouse,
  Tag,
  DollarSign,
  Hash,
  CheckCircle,
  XCircle,
  ChevronDown,
  AlertCircle,
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  Clock,
  User as UserIcon,
  Calendar,
  X,
  PlusIcon,
} from "lucide-react";
import {
  useGetProductsQuery,
  useDeleteProductMutation,
  useCreateProductMutation,
  useUpdateProductMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useGetSuppliersQuery,
  useCreateSupplierMutation,
  Product,
  Category,
  Supplier,
} from "@/state/api";
import { useRouter } from "next/navigation";
import ProviderWrapper from "../(components)/ProviderWrapper";

const ProductsPage = () => {
  const router = useRouter();

  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed
  );
  const isPOSPanelOpen = useAppSelector((state) => state.global.isPOSPanelOpen);
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);

  // RTK Query hooks - MOVE THESE FIRST
  const {
    data: products = [],
    isLoading,
    error,
    refetch,
  } = useGetProductsQuery();
  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: suppliers = [] } = useGetSuppliersQuery();
  const [deleteProduct] = useDeleteProductMutation();
  const [createProduct] = useCreateProductMutation();
  const [updateProduct] = useUpdateProductMutation();
  const [createCategory] = useCreateCategoryMutation();
  const [createSupplier] = useCreateSupplierMutation();

  // Local state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [productTypeFilter, setProductTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const [productToDeleteName, setProductToDeleteName] = useState("");

  const [useIndividualSerials, setUseIndividualSerials] = useState(false);
  const [individualSerials, setIndividualSerials] = useState<
    Array<{
      id?: number;
      serial: string;
      warranty?: "Yes" | "No";
      purchasePrice: number;
      wholesalePrice: number;
      retailPrice: number;
      productType: "New" | "PreOwned";
      supplier_id?: number;
    }>
  >([]);
  const [showBulkWarrantyDropdown, setShowBulkWarrantyDropdown] =
    useState(false);
  const [bulkWarranty, setBulkWarranty] = useState<"Yes" | "No" | "">("");
  const [bulkProductType, setBulkProductType] = useState<
    "New" | "PreOwned" | ""
  >("");
  const [bulkSupplierSearch, setBulkSupplierSearch] = useState("");
  const [filteredSuppliers, setFilteredSuppliers] = useState(suppliers);
  const [selectedBulkSupplierId, setSelectedBulkSupplierId] = useState<
    number | null
  >(null);
  const [bulkPurchasePrice, setBulkPurchasePrice] = useState("");
  const [bulkWholesalePrice, setBulkWholesalePrice] = useState("");
  const [bulkRetailPrice, setBulkRetailPrice] = useState("");

  useEffect(() => {
    if (bulkSupplierSearch.trim() === "") {
      // Check if filteredSuppliers is already the same as suppliers to avoid unnecessary updates
      if (filteredSuppliers.length !== suppliers?.length) {
        setFilteredSuppliers(suppliers || []);
      }
    } else {
      const filtered = (suppliers || []).filter((supplier) =>
        supplier.name.toLowerCase().includes(bulkSupplierSearch.toLowerCase())
      );
      
      // Only update if the filtered results are different
      const currentFilteredIds = filteredSuppliers.map(s => s.id).sort().join(',');
      const newFilteredIds = filtered.map(s => s.id).sort().join(',');
      
      if (currentFilteredIds !== newFilteredIds) {
        setFilteredSuppliers(filtered);
      }
    }
  }, [bulkSupplierSearch, suppliers, filteredSuppliers]);

  // Modal category state
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );

  // NEW: Category creation state
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Supplier state
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(
    null
  );
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  // User ID for created_by/updated_by
  const [userId, setUserId] = useState<number | undefined>(undefined);

  // Alert Modal State
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"success" | "error" | "info">(
    "info"
  );

  // Dropdown states
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showProductTypeDropdown, setShowProductTypeDropdown] = useState(false);
  const [showModalCategoryDropdown, setShowModalCategoryDropdown] =
    useState(false);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

  // Product search for modal
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [filteredProductsForModal, setFilteredProductsForModal] = useState<
    Product[]
  >([]); // RENAMED
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Refs
  const productTypeDropdownRef = useRef<HTMLDivElement>(null);
  const supplierDropdownRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const productTypeFilterDropdownRef = useRef<HTMLDivElement>(null);
  const modalCategoryDropdownRef = useRef<HTMLDivElement>(null);
  const bulkActionsRef = useRef<HTMLDivElement>(null); // FIXED: use useRef, not useState

  // Get user ID from localStorage or context
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUserId(user.id);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  // Effect for product search filtering in modal - FIXED ORDER
  useEffect(() => {
    if (productSearchTerm.trim() === "") {
      setFilteredProductsForModal([]);
    } else {
      const filtered = products.filter(
        (product) =>
          product.name
            .toLowerCase()
            .includes(productSearchTerm.toLowerCase()) &&
          product.id !== editingProduct?.id // Exclude current product
      );
      setFilteredProductsForModal(filtered);
    }
  }, [productSearchTerm, products, editingProduct]);

  // Close dropdowns when clicking outside - UPDATED
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setShowCategoryDropdown(false);
      }
      if (
        productTypeFilterDropdownRef.current &&
        !productTypeFilterDropdownRef.current.contains(event.target as Node)
      ) {
        setShowProductTypeDropdown(false);
      }
      if (
        modalCategoryDropdownRef.current &&
        !modalCategoryDropdownRef.current.contains(event.target as Node)
      ) {
        setShowModalCategoryDropdown(false);
        setShowNewCategoryInput(false);
      }
      if (
        supplierDropdownRef.current &&
        !supplierDropdownRef.current.contains(event.target as Node)
      ) {
        setShowSupplierDropdown(false);
      }
      if (
        bulkActionsRef.current &&
        !bulkActionsRef.current.contains(event.target as Node)
      ) {
        setShowBulkActions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleApplyBulkActions = () => {
    const newSerials = [...individualSerials];

    // Apply warranty if selected
    if (bulkWarranty) {
      newSerials.forEach((serial) => {
        serial.warranty = bulkWarranty;
      });
    }

    // Apply product type if selected
    if (bulkProductType) {
      newSerials.forEach((serial) => {
        serial.productType = bulkProductType;
      });
    }

    // Apply supplier if selected
    if (selectedBulkSupplierId) {
      newSerials.forEach((serial) => {
        serial.supplier_id = selectedBulkSupplierId;
      });
    }

    // Apply purchase price if entered
    if (bulkPurchasePrice !== "") {
      const price = parseFloat(bulkPurchasePrice);
      if (!isNaN(price)) {
        newSerials.forEach((serial) => {
          serial.purchasePrice = price;
        });
      }
    }

    // Apply wholesale price if entered
    if (bulkWholesalePrice !== "") {
      const price = parseFloat(bulkWholesalePrice);
      if (!isNaN(price)) {
        newSerials.forEach((serial) => {
          serial.wholesalePrice = price;
        });
      }
    }

    // Apply retail price if entered
    if (bulkRetailPrice !== "") {
      const price = parseFloat(bulkRetailPrice);
      if (!isNaN(price)) {
        newSerials.forEach((serial) => {
          serial.retailPrice = price;
        });
      }
    }

    setIndividualSerials(newSerials);

    // Reset bulk action fields
    setBulkWarranty("");
    setBulkProductType("");
    setBulkSupplierSearch("");
    setSelectedBulkSupplierId(null);
    setBulkPurchasePrice("");
    setBulkWholesalePrice("");
    setBulkRetailPrice("");
    setShowBulkActions(false);

    showAlert("Bulk actions applied successfully!", "success");
  };
  // Helper function to show alerts
  const showAlert = (
    message: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlertModal(true);
  };

  // Calculate content margin based on sidebar and POS panel states
  const getContentMargin = () => {
    let margin = "ml-0 ";

    if (!isSidebarCollapsed) {
      // margin += "md:ml-64 ";
    } else {
      // margin += "md:ml-16 ";
    }

    if (isPOSPanelOpen) {
      // margin += "md:mr-80";
    }

    return margin.trim();
  };

  // Get product type from serials (for filtering)
  const getProductType = (product: Product): string | null => {
    if (product.useIndividualSerials && product.productSerials?.length) {
      return product.productSerials[0].productType;
    }
    return null;
  };

  // Calculate price range for products with serials
  const getPriceRange = (product: Product) => {
    if (product.useIndividualSerials && product.productSerials?.length) {
      const retailPrices = product.productSerials.map((s) =>
        Number(s.retailPrice)
      );
      const min = Math.min(...retailPrices);
      const max = Math.max(...retailPrices);
      if (min === max) return `৳${min}`;
      return `৳${min} - ৳${max}`;
    }
    return "N/A";
  };

  // Filter products based on search and filters - RENAMED to avoid conflict
  const filteredProductsForTable = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.productCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.specification?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.productSerials?.some((ps) =>
        ps.serial.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      false;

    const matchesCategory =
      selectedCategory === "all" ||
      product.Categories?.name === selectedCategory;

    const productType = getProductType(product);
    const matchesProductType =
      productTypeFilter === "all" || productType === productTypeFilter;

    return matchesSearch && matchesCategory && matchesProductType;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProductsForTable.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredProductsForTable.length / itemsPerPage);

  const handleAddProduct = () => {
    setShowAddModal(true);
    setEditingProduct(null);
    setProductSearchTerm("");

    // Reset modal selections
    setSelectedCategoryName("");
    setSelectedCategoryId(null);
    setSelectedSupplierId(null);
    setShowAddSupplier(false);
    setNewCategoryName("");
    setShowNewCategoryInput(false);
    setUseIndividualSerials(false);
    setIndividualSerials([]);
    setFilteredProductsForModal([]);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductSearchTerm(product.name);

    // Set category data
    if (product.category_id) {
      const category = categories.find((cat) => cat.id === product.category_id);
      if (category) {
        setSelectedCategoryName(category.name);
        setSelectedCategoryId(category.id);
      } else {
        setSelectedCategoryName("");
        setSelectedCategoryId(null);
      }
    } else {
      setSelectedCategoryName("");
      setSelectedCategoryId(null);
    }

    // Set supplier from product data
    if (product.supplier_id) {
      setSelectedSupplierId(product.supplier_id);
    } else if (product.supplier?.id) {
      setSelectedSupplierId(product.supplier.id);
    } else {
      setSelectedSupplierId(null);
    }

    // Set individual serial tracking
    setUseIndividualSerials(product.useIndividualSerials || false);

    // If product has individual serials, populate them
    if (product.useIndividualSerials && product.productSerials) {
      const serials = product.productSerials.map((ps) => ({
        id: ps.id,
        serial: ps.serial || "",
        warranty: ps.warranty || "No",
        purchasePrice: Number(ps.purchasePrice),
        wholesalePrice: Number(ps.wholesalePrice),
        retailPrice: Number(ps.retailPrice),
        productType: ps.productType || "New",
        supplier_id: ps.supplier_id,
      }));
      setIndividualSerials(serials);
    } else {
      setIndividualSerials([]);
    }

    setShowAddModal(true);
  };

  const handleDeleteProduct = (id: number, name: string) => {
    setProductToDelete(id);
    setProductToDeleteName(name);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      await deleteProduct(productToDelete).unwrap();
      showAlert("Product marked as unavailable successfully!", "success");
      refetch(); // Refresh the product list
    } catch (error: any) {
      console.error("Failed to delete product:", error);
      showAlert(error?.data?.message || "Failed to delete product", "error");
    } finally {
      setShowDeleteConfirm(false);
      setProductToDelete(null);
      setProductToDeleteName("");
    }
  };

  const handleSaveProduct = async (formData: FormData) => {
    try {
      // Validate required fields
      if (!selectedCategoryId) {
        showAlert("Please select a category", "error");
        return;
      }

      const name = formData.get("name") as string;
      const specification = (formData.get("specification") as string) || null;
      const description = (formData.get("description") as string) || null;
      const quantity = parseInt(formData.get("quantity") as string) || 1;

      if (!name.trim()) {
        showAlert("Product name is required", "error");
        return;
      }

      // Prepare product data
      const productData: any = {
        name: name.trim(),
        specification,
        description,
        quantity,
        useIndividualSerials,
        category_id: selectedCategoryId,
        userId,
      };

      // Add supplier_id if selected
      if (selectedSupplierId) {
        productData.supplier_id = selectedSupplierId;
      }

      // Handle serial numbers based on tracking type
      if (useIndividualSerials) {
        // Validate serials if using individual serials
        if (individualSerials.length === 0) {
          showAlert(
            "At least one serial is required for serialized products",
            "error"
          );
          return;
        }

        // Validate each serial has required pricing fields
        for (const serial of individualSerials) {
          if (
            typeof serial.purchasePrice === "undefined" ||
            typeof serial.wholesalePrice === "undefined" ||
            typeof serial.retailPrice === "undefined"
          ) {
            showAlert(
              "Each serial must have purchasePrice, wholesalePrice, and retailPrice",
              "error"
            );
            return;
          }

          if (!serial.productType) {
            showAlert(
              "Each serial must have a productType (New or PreOwned)",
              "error"
            );
            return;
          }
        }

        // Send serials as array of objects
        productData.serials = individualSerials.map((s) => ({
          serial: s.serial || "",
          warranty: s.warranty || "No",
          purchasePrice: s.purchasePrice,
          wholesalePrice: s.wholesalePrice,
          retailPrice: s.retailPrice,
          productType: s.productType,
          supplier_id: s.supplier_id,
        }));
      }

      if (editingProduct) {
        await updateProduct({
          id: editingProduct.id,
          product: productData,
        }).unwrap();
      } else {
        await createProduct(productData).unwrap();
      }

      setShowAddModal(false);
      setEditingProduct(null);
      setSelectedCategoryName("");
      setSelectedCategoryId(null);
      setSelectedSupplierId(null);
      setShowAddSupplier(false);
      setNewCategoryName("");
      setShowNewCategoryInput(false);
      setUseIndividualSerials(false);
      setIndividualSerials([]);
      setProductSearchTerm("");
      setFilteredProductsForModal([]);

      refetch(); // Refresh the product list

      showAlert(
        `Product ${editingProduct ? "updated" : "added"} successfully!`,
        "success"
      );
    } catch (error: any) {
      console.error("Failed to save product:", error);
      const errorMessage =
        error?.data?.message ||
        error?.message ||
        `Failed to ${
          editingProduct ? "update" : "add"
        } product. Please try again.`;
      showAlert(errorMessage, "error");
    }
  };

  // NEW: Handle adding new category
  const handleAddNewCategory = async () => {
    if (!newCategoryName.trim()) {
      showAlert("Please enter a category name", "error");
      return;
    }

    try {
      const newCategory = await createCategory({
        name: newCategoryName.trim(),
      }).unwrap();
      showAlert(
        `Category "${newCategory.name}" added successfully!`,
        "success"
      );

      // Select the new category
      setSelectedCategoryName(newCategory.name);
      setSelectedCategoryId(newCategory.id);
      setNewCategoryName("");
      setShowNewCategoryInput(false);
      setShowModalCategoryDropdown(false);
    } catch (error: any) {
      console.error("Failed to create category:", error);
      showAlert(error?.data?.message || "Failed to create category", "error");
    }
  };

  // NEW: Handle adding new supplier
  const handleAddNewSupplier = async () => {
    if (!newSupplier.name.trim()) {
      showAlert("Supplier name is required", "error");
      return;
    }

    if (!newSupplier.phone.trim()) {
      showAlert("Supplier phone is required", "error");
      return;
    }

    try {
      const newSupplierData = await createSupplier({
        name: newSupplier.name.trim(),
        email: newSupplier.email.trim() || undefined,
        phone: newSupplier.phone.trim(),
        address: newSupplier.address.trim() || undefined,
      }).unwrap();

      // Reset new supplier form
      setNewSupplier({
        name: "",
        email: "",
        phone: "",
        address: "",
      });

      setShowAddSupplier(false);
      showAlert(
        `Supplier "${newSupplierData.name}" added successfully!`,
        "success"
      );

      // Refresh suppliers list
      // The suppliers list will be automatically updated by RTK Query
    } catch (error: any) {
      console.error("Failed to create supplier:", error);
      showAlert(error?.data?.message || "Failed to create supplier", "error");
    }
  };

  // Helper functions to get display text
  const getCategoryDisplayText = () => {
    if (selectedCategory === "all") return "All Categories";
    return (
      categories.find((cat) => cat.name === selectedCategory)?.name ||
      "All Categories"
    );
  };

  const getProductTypeDisplayText = () => {
    if (productTypeFilter === "all") return "All Types";
    if (productTypeFilter === "New") return "New Products";
    return "Pre-Owned Products";
  };

  // Helper to get selected supplier name
  const getSelectedSupplierName = () => {
    if (!selectedSupplierId) return "Select Supplier";
    const supplier = suppliers.find((s) => s.id === selectedSupplierId);
    return supplier ? supplier.name : "Select Supplier";
  };

  if (isLoading) {
    return (
      <div
        className={`${getContentMargin()} p-6 min-h-screen flex items-center justify-center`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`${getContentMargin()} p-6 min-h-screen flex items-center justify-center`}
      >
        <div className="text-center">
          <Package className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Error Loading Products
          </h3>
          <p className="text-red-600 mb-4">
            {"status" in error
              ? `Error: ${error.status}`
              : "Failed to load products"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Package className="w-6 h-6" />
                Products
              </h1>
              <p className="mt-1">Manage your product inventory</p>
            </div>
            {/* <button
              onClick={handleAddProduct}
              className="mt-4 md:mt-0 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button> */}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {/* Total Products Card */}
          <div
            className={`rounded-lg p-4 shadow-sm border transition-all duration-300 hover:shadow-md ${
              isDarkMode
                ? "bg-blue-900/30 border-blue-800 text-white"
                : "bg-blue-50 border-blue-200 text-blue-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Total Products</p>
                <p className="text-2xl font-bold mt-2">{products.length}</p>
              </div>
              <div
                className={`p-3 rounded-lg ${
                  isDarkMode ? "bg-blue-800/50" : "bg-blue-100"
                }`}
              >
                <Package
                  className={`w-6 h-6 ${
                    isDarkMode ? "text-blue-300" : "text-blue-600"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Low Stock Card */}
          <div
            className={`rounded-lg p-4 shadow-sm border transition-all duration-300 hover:shadow-md ${
              isDarkMode
                ? "bg-orange-900/30 border-orange-800 text-white"
                : "bg-orange-50 border-orange-200 text-orange-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Low Stock</p>
                <p className="text-2xl font-bold mt-2">
                  {products.filter((p) => p.quantity < 10).length}
                </p>
              </div>
              <div
                className={`p-3 rounded-lg ${
                  isDarkMode ? "bg-orange-800/50" : "bg-orange-100"
                }`}
              >
                <Warehouse
                  className={`w-6 h-6 ${
                    isDarkMode ? "text-orange-300" : "text-orange-600"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* New Products Card */}
          <div
            className={`rounded-lg p-4 shadow-sm border transition-all duration-300 hover:shadow-md ${
              isDarkMode
                ? "bg-green-900/30 border-green-800 text-white"
                : "bg-green-50 border-green-200 text-green-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">New Products</p>
                <p className="text-2xl font-bold mt-2">
                  {
                    products.filter(
                      (p) =>
                        p.useIndividualSerials &&
                        p.productSerials?.some((ps) => ps.productType === "New")
                    ).length
                  }
                </p>
              </div>
              <div
                className={`p-3 rounded-lg ${
                  isDarkMode ? "bg-green-800/50" : "bg-green-100"
                }`}
              >
                <Package
                  className={`w-6 h-6 ${
                    isDarkMode ? "text-green-300" : "text-green-600"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Pre-Owned Card */}
          <div
            className={`rounded-lg p-4 shadow-sm border transition-all duration-300 hover:shadow-md ${
              isDarkMode
                ? "bg-yellow-900/30 border-yellow-800 text-white"
                : "bg-yellow-50 border-yellow-200 text-yellow-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Pre-Owned</p>
                <p className="text-2xl font-bold mt-2">
                  {
                    products.filter(
                      (p) =>
                        p.useIndividualSerials &&
                        p.productSerials?.some(
                          (ps) => ps.productType === "PreOwned"
                        )
                    ).length
                  }
                </p>
              </div>
              <div
                className={`p-3 rounded-lg ${
                  isDarkMode ? "bg-yellow-800/50" : "bg-yellow-100"
                }`}
              >
                <Package
                  className={`w-6 h-6 ${
                    isDarkMode ? "text-yellow-300" : "text-yellow-600"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Categories Card */}
          <div
            className={`rounded-lg p-4 shadow-sm border transition-all duration-300 hover:shadow-md ${
              isDarkMode
                ? "bg-purple-900/30 border-purple-800 text-white"
                : "bg-purple-50 border-purple-200 text-purple-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Categories</p>
                <p className="text-2xl font-bold mt-2">
                  {
                    Array.from(new Set(products.map((p) => p.Categories?.name)))
                      .length
                  }
                </p>
              </div>
              <div
                className={`p-3 rounded-lg ${
                  isDarkMode ? "bg-purple-800/50" : "bg-purple-100"
                }`}
              >
                <Tag
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
          className={`rounded-lg shadow-sm mb-6 border ${
            isDarkMode
              ? "bg-gray-800/50 border-gray-700"
              : "bg-white/50 border-gray-200"
          }`}
        >
          <div className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search products by name, code, specification, or serial..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                      isDarkMode
                        ? "bg-gray-800/50 border-gray-700"
                        : "bg-white/50 border-gray-200"
                    }`}
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="relative" ref={categoryDropdownRef}>
                <button
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className={`flex items-center justify-between w-full md:w-60 px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                    isDarkMode
                      ? "bg-gray-800/50 border-gray-700"
                      : "bg-white/50 border-gray-200"
                  }`}
                >
                  <span>{getCategoryDisplayText()}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {showCategoryDropdown && (
                  <ul
                    className={`absolute z-10 w-full md:w-48 mt-1 border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto ${
                      isDarkMode
                        ? "bg-gray-800/90 border-gray-700"
                        : "bg-white/80 border-gray-200"
                    }`}
                  >
                    <li>
                      <button
                        onClick={() => {
                          setSelectedCategory("all");
                          setShowCategoryDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 cursor-pointer ${
                          selectedCategory === "all"
                            ? "bg-blue-50 text-blue-600"
                            : ""
                        } ${
                          isDarkMode
                            ? "hover:bg-gray-100 hover:text-black"
                            : "hover:bg-gray-100 hover:text-black"
                        }`}
                      >
                        All Categories
                      </button>
                    </li>
                    {categories.map((category) => (
                      <li key={category.id}>
                        <button
                          onClick={() => {
                            setSelectedCategory(category.name);
                            setShowCategoryDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2 hover:bg-gray-100 hover:text-black cursor-pointer ${
                            selectedCategory === category.name
                              ? "bg-blue-50 text-blue-600"
                              : ""
                          }`}
                        >
                          {category.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Product Type Filter */}
              <div className="relative" ref={productTypeFilterDropdownRef}>
                <button
                  onClick={() =>
                    setShowProductTypeDropdown(!showProductTypeDropdown)
                  }
                  className={`flex items-center justify-between w-full md:w-48 px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                    isDarkMode
                      ? "bg-gray-800/50 border-gray-700"
                      : "bg-white/50 border-gray-200"
                  }`}
                >
                  <span>{getProductTypeDisplayText()}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {showProductTypeDropdown && (
                  <ul
                    className={`absolute z-10 w-full md:w-48 mt-1 border border-gray-300 rounded-lg shadow-lg ${
                      isDarkMode
                        ? "bg-gray-800/90"
                        : "bg-white/80 border-gray-200"
                    }`}
                  >
                    <li>
                      <button
                        onClick={() => {
                          setProductTypeFilter("all");
                          setShowProductTypeDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 cursor-pointer ${
                          productTypeFilter === "all"
                            ? "bg-blue-50 text-blue-600"
                            : ""
                        } ${
                          isDarkMode
                            ? "hover:bg-gray-100 hover:text-black"
                            : "hover:bg-gray-100 hover:text-black"
                        }`}
                      >
                        All Types
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          setProductTypeFilter("New");
                          setShowProductTypeDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-white hover:text-black cursor-pointer ${
                          productTypeFilter === "New"
                            ? "bg-blue-50 text-blue-600"
                            : ""
                        }`}
                      >
                        New Products
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          setProductTypeFilter("PreOwned");
                          setShowProductTypeDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-white hover:text-black cursor-pointer ${
                          productTypeFilter === "PreOwned"
                            ? "bg-blue-50 text-blue-600"
                            : ""
                        }`}
                      >
                        Pre-Owned Products
                      </button>
                    </li>
                  </ul>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  className={`px-4 py-2 border rounded-lg flex items-center gap-2 cursor-none ${
                    isDarkMode
                      ? "bg-gray-800/50 border-gray-700"
                      : "bg-white/50 border-gray-200"
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  Filter
                </button>
                <button
                  className={`px-4 py-2 border rounded-lg flex items-center gap-2 cursor-none ${
                    isDarkMode
                      ? "bg-gray-800/50 border-gray-700"
                      : "bg-white/50 border-gray-200"
                  }`}
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div
          className={`rounded-lg shadow-sm border overflow-hidden ${
            isDarkMode
              ? "bg-gray-800/50 border-gray-700"
              : "bg-white/50 border-gray-200"
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead
                className={`border-b ${
                  isDarkMode ? "border-gray-600" : "border-gray-200"
                }`}
              >
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">
                    Serial Tracking
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">
                    Price Range
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  isDarkMode ? "divide-gray-700" : "divide-gray-200"
                }`}
              >
                {currentProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="dark:hover:bg-gray-50 hover:bg-gray-300"
                  >
                    {/* Product ID */}
                    <td className="px-6 py-4 whitespace-nowrap text-left">
                      <span className="inline-flex text-xs font-medium text-blue-500">
                        #{product.productCode || product.id}
                      </span>
                    </td>
                    {/* Product Name - Clickable */}
                    <td
                      className="px-6 py-4 whitespace-nowrap cursor-pointer"
                      onClick={() => router.push(`/product/${product.id}`)}
                    >
                      <div className="group">
                        <div className="text-sm font-medium group-hover:text-blue-600 transition-colors">
                          {product.name}
                        </div>
                        {product.specification && (
                          <div className="text-xs mt-1 text-gray-600">
                            {product.specification}
                          </div>
                        )}
                      </div>
                    </td>
                    {/* Product Category */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex px-2.5 py-2 rounded-lg text-xs font-medium bg-blue-100 text-blue-800">
                        {product.Categories?.name || "Uncategorized"}
                      </span>
                    </td>
                    {/* Serial Tracking */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex px-2.5 py-2 rounded-lg text-xs font-medium ${
                          product.useIndividualSerials
                            ? "bg-purple-100 text-purple-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {product.useIndividualSerials ? "Serialized" : "Bulk"}
                      </span>
                    </td>
                    {/* Product Quantity */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex flex-col items-center gap-2">
                        <span
                          className={`text-sm font-medium p-2 ${
                            product.quantity < 10 ? "text-red-500" : ""
                          }`}
                        >
                          {product.quantity}
                        </span>
                      </div>
                    </td>
                    {/* Product Price Range */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-medium">
                          {getPriceRange(product)}
                        </span>
                        {product.useIndividualSerials &&
                          product.productSerials && (
                            <span className="text-xs text-gray-500">
                              {product.productSerials.length} serials
                            </span>
                          )}
                      </div>
                    </td>
                    {/* Product Status */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {product.status === "Active" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3" />
                          Active
                        </span>
                      ) : product.status === "Unavailable" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircle className="w-3 h-3" />
                          Unavailable
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <XCircle className="w-3 h-3" />
                          Discontinued
                        </span>
                      )}
                    </td>
                    {/* Product Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex flex-col items-center space-y-2">
                        <div className="flex items-center space-x-2">
                          {/* View Button */}
                          <button
                            onClick={() =>
                              router.push(`/product/${product.id}`)
                            }
                            className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleEditProduct(product)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                            title="Edit Product"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() =>
                              handleDeleteProduct(product.id, product.name)
                            }
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                            title="Mark as Unavailable"
                            disabled={product.status === "Unavailable"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {product.status === "Unavailable" && (
                          <span className="text-xs text-red-500 italic">
                            Marked as unavailable
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {currentProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No products found
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ||
                selectedCategory !== "all" ||
                productTypeFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Get started by adding your first product"}
              </p>
              {!searchTerm &&
                selectedCategory === "all" &&
                productTypeFilter === "all" && (
                  <button
                    onClick={handleAddProduct}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    Add Product
                  </button>
                )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {indexOfFirstItem + 1} to{" "}
                  {Math.min(indexOfLastItem, filteredProductsForTable.length)}{" "}
                  of {filteredProductsForTable.length} results
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 border rounded-lg ${
                          currentPage === page
                            ? "bg-blue-500 text-white border-blue-500"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add/Edit Product Modal */}
        {showAddModal && (
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div
              className={`rounded-lg border max-w-4xl w-full max-h-[90vh] overflow-y-auto ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="p-6">
                <h2
                  className={`text-xl font-bold mb-4 ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSaveProduct(new FormData(e.currentTarget));
                  }}
                >
                  <div className="space-y-4">
                    {/* Product Name with Search/Select */}
                    <div>
                      <label
                        className={`block text-sm font-medium mb-1 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Product Name *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="name"
                          required
                          value={productSearchTerm}
                          onChange={(e) => setProductSearchTerm(e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                            isDarkMode
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          }`}
                          placeholder="Search or type product name..."
                        />
                        {productSearchTerm && (
                          <button
                            type="button"
                            onClick={() => setProductSearchTerm("")}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {!editingProduct &&
                        filteredProductsForModal.length > 0 &&
                        productSearchTerm && (
                          <div
                            className={`absolute z-10 w-full mt-1 border rounded-lg shadow-lg max-h-60 overflow-y-auto ${
                              isDarkMode
                                ? "bg-gray-800 border-gray-700"
                                : "bg-white border-gray-200"
                            }`}
                          >
                            {filteredProductsForModal.map((prod) => (
                              <button
                                key={prod.id}
                                type="button"
                                onClick={() => {
                                  setProductSearchTerm(prod.name);
                                  setFilteredProductsForModal([]);
                                }}
                                className={`w-full text-left px-3 py-2 ${
                                  isDarkMode
                                    ? "hover:bg-gray-700 text-white"
                                    : "hover:bg-gray-100 text-gray-900"
                                }`}
                              >
                                {prod.name}
                              </button>
                            ))}
                          </div>
                        )}
                    </div>

                    {/* Category and Quantity in same row */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Category with Add New option */}
                      <div className="relative" ref={modalCategoryDropdownRef}>
                        <label
                          className={`block text-sm font-medium mb-1 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Category *
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setShowModalCategoryDropdown(
                              !showModalCategoryDropdown
                            )
                          }
                          className={`flex items-center justify-between w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                            isDarkMode
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          }`}
                        >
                          <span>
                            {selectedCategoryName || "Select Category *"}
                          </span>
                          <ChevronDown className="w-4 h-4" />
                        </button>

                        {showModalCategoryDropdown && (
                          <div
                            className={`absolute z-10 w-full mt-1 border rounded-lg shadow-lg max-h-60 overflow-y-auto ${
                              isDarkMode
                                ? "bg-gray-800 border-gray-700"
                                : "bg-white border-gray-200"
                            }`}
                          >
                            {!showNewCategoryInput ? (
                              <>
                                {categories.map((category) => (
                                  <div key={category.id}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedCategoryName(category.name);
                                        setSelectedCategoryId(category.id);
                                        setShowModalCategoryDropdown(false);
                                      }}
                                      className={`w-full text-left px-3 py-2 ${
                                        isDarkMode
                                          ? "hover:bg-gray-700 text-white"
                                          : "hover:bg-gray-100 text-gray-900"
                                      }`}
                                    >
                                      {category.name}
                                    </button>
                                  </div>
                                ))}
                                <div className="border-t border-gray-200 dark:border-gray-700">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setShowNewCategoryInput(true)
                                    }
                                    className="w-full text-left px-3 py-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 flex items-center gap-2"
                                  >
                                    <PlusIcon className="w-4 h-4" />
                                    Add New Category
                                  </button>
                                </div>
                              </>
                            ) : (
                              <div className="p-3">
                                <div className="flex gap-2 mb-2">
                                  <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={(e) =>
                                      setNewCategoryName(e.target.value)
                                    }
                                    placeholder="Enter new category name *"
                                    className={`flex-1 px-3 py-1 border rounded text-sm ${
                                      isDarkMode
                                        ? "bg-gray-700 border-gray-600 text-white"
                                        : "bg-white border-gray-300"
                                    }`}
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    onClick={handleAddNewCategory}
                                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                                  >
                                    Add
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowNewCategoryInput(false);
                                    setNewCategoryName("");
                                  }}
                                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Quantity */}
                      <div>
                        <label
                          className={`block text-sm font-medium mb-1 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Quantity *
                        </label>
                        <input
                          type="number"
                          name="quantity"
                          required
                          min="1"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                            isDarkMode
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          }`}
                          defaultValue={editingProduct?.quantity || 1}
                          onChange={(e) => {
                            const qty = parseInt(e.target.value) || 1;
                            if (qty > 0 && useIndividualSerials) {
                              const newSerials = Array.from(
                                { length: qty },
                                (_, i) => ({
                                  id: individualSerials[i]?.id,
                                  serial: individualSerials[i]?.serial || "",
                                  warranty:
                                    individualSerials[i]?.warranty || "No",
                                  purchasePrice:
                                    individualSerials[i]?.purchasePrice || 0,
                                  wholesalePrice:
                                    individualSerials[i]?.wholesalePrice || 0,
                                  retailPrice:
                                    individualSerials[i]?.retailPrice || 0,
                                  productType:
                                    individualSerials[i]?.productType || "New",
                                  supplier_id:
                                    individualSerials[i]?.supplier_id,
                                })
                              );
                              setIndividualSerials(newSerials);
                            }
                          }}
                        />
                      </div>
                    </div>

                    {/* Individual Serial Toggle */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="useIndividualSerials"
                        checked={useIndividualSerials}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setUseIndividualSerials(checked);

                          // Initialize serials array if checked
                          if (checked) {
                            const quantity =
                              parseInt(
                                (
                                  document.querySelector(
                                    'input[name="quantity"]'
                                  ) as HTMLInputElement
                                )?.value
                              ) ||
                              editingProduct?.quantity ||
                              1;
                            const newSerials = Array.from(
                              { length: quantity },
                              (_, i) => ({
                                id: individualSerials[i]?.id,
                                serial: individualSerials[i]?.serial || "",
                                warranty:
                                  individualSerials[i]?.warranty || "No",
                                purchasePrice:
                                  individualSerials[i]?.purchasePrice || 0,
                                wholesalePrice:
                                  individualSerials[i]?.wholesalePrice || 0,
                                retailPrice:
                                  individualSerials[i]?.retailPrice || 0,
                                productType:
                                  individualSerials[i]?.productType || "New",
                                supplier_id: individualSerials[i]?.supplier_id,
                              })
                            );
                            setIndividualSerials(newSerials);
                          } else {
                            setIndividualSerials([]);
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <label
                        className={`text-sm ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Track individual serial numbers
                      </label>
                    </div>

                    {/* Individual Serial Numbers Section */}
                    {useIndividualSerials && (
                      <div
                        className={`mt-2 p-4 border rounded-lg ${
                          isDarkMode ? "border-gray-700" : "border-gray-200"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-4">
                          <h3
                            className={`font-medium ${
                              isDarkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            Individual Serial Numbers (
                            {individualSerials.length} items)
                          </h3>
                          <div className="flex gap-2">
                            {/* Bulk Actions - Same as SingleProductPage */}
                            <div className="relative" ref={bulkActionsRef}>
                              <button
                                type="button"
                                onClick={() =>
                                  setShowBulkActions(!showBulkActions)
                                }
                                className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm ${
                                  isDarkMode
                                    ? "border-gray-600 bg-gray-700 text-white"
                                    : "border-gray-300 bg-white text-gray-900"
                                }`}
                              >
                                Bulk Actions
                                <ChevronDown className="w-3 h-3" />
                              </button>
                              {showBulkActions && (
                                <div
                                  className={`absolute right-0 mt-1 border rounded-lg shadow-lg z-10 w-80 ${
                                    isDarkMode
                                      ? "bg-gray-800 border-gray-700"
                                      : "bg-white border-gray-200"
                                  }`}
                                >
                                  <div className="p-4">
                                    <h4 className="font-medium mb-3">
                                      Apply to all:
                                    </h4>

                                    {/* Warranty */}
                                    <div className="mb-3">
                                      <label className="block text-xs font-medium mb-1">
                                        Warranty
                                      </label>
                                      <div className="flex gap-2">
                                        <button
                                          type="button"
                                          onClick={() => setBulkWarranty("Yes")}
                                          className={`flex-1 px-2 py-1 rounded text-sm ${
                                            bulkWarranty === "Yes"
                                              ? "bg-green-500 text-white"
                                              : "bg-gray-100 hover:bg-gray-200"
                                          }`}
                                        >
                                          Yes
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setBulkWarranty("No")}
                                          className={`flex-1 px-2 py-1 rounded text-sm ${
                                            bulkWarranty === "No"
                                              ? "bg-red-500 text-white"
                                              : "bg-gray-100 hover:bg-gray-200"
                                          }`}
                                        >
                                          No
                                        </button>
                                      </div>
                                    </div>

                                    {/* Product Type */}
                                    <div className="mb-3">
                                      <label className="block text-xs font-medium mb-1">
                                        Product Type
                                      </label>
                                      <div className="flex gap-2">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setBulkProductType("New")
                                          }
                                          className={`flex-1 px-2 py-1 rounded text-sm ${
                                            bulkProductType === "New"
                                              ? "bg-blue-500 text-white"
                                              : "bg-gray-100 hover:bg-gray-200"
                                          }`}
                                        >
                                          New
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setBulkProductType("PreOwned")
                                          }
                                          className={`flex-1 px-2 py-1 rounded text-sm ${
                                            bulkProductType === "PreOwned"
                                              ? "bg-yellow-500 text-white"
                                              : "bg-gray-100 hover:bg-gray-200"
                                          }`}
                                        >
                                          Pre-Owned
                                        </button>
                                      </div>
                                    </div>

                                    {/* Supplier Search */}
                                    <div className="mb-3">
                                      <label className="block text-xs font-medium mb-1">
                                        Supplier
                                      </label>
                                      <div className="relative">
                                        <input
                                          type="text"
                                          placeholder="Search supplier..."
                                          value={bulkSupplierSearch}
                                          onChange={(e) =>
                                            setBulkSupplierSearch(
                                              e.target.value
                                            )
                                          }
                                          className={`w-full px-2 py-1 border rounded text-sm mb-2 ${
                                            isDarkMode
                                              ? "bg-gray-700 border-gray-600 text-white"
                                              : "bg-white border-gray-300"
                                          }`}
                                        />
                                        <div className="space-y-1 max-h-32 overflow-y-auto">
                                          {filteredSuppliers.map((supplier) => (
                                            <button
                                              key={supplier.id}
                                              type="button"
                                              onClick={() =>
                                                setSelectedBulkSupplierId(
                                                  supplier.id
                                                )
                                              }
                                              className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                                selectedBulkSupplierId ===
                                                supplier.id
                                                  ? "bg-blue-100 text-blue-800"
                                                  : isDarkMode
                                                  ? "text-white"
                                                  : "text-gray-900"
                                              }`}
                                            >
                                              {supplier.name}
                                            </button>
                                          ))}
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setShowAddSupplier(true);
                                              setShowBulkActions(false); // Close bulk actions dropdown
                                            }}
                                            className="w-full text-left px-2 py-1 text-sm text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 rounded flex items-center gap-1"
                                          >
                                            <PlusIcon className="w-3 h-3" />
                                            Add New Supplier
                                          </button>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Purchase Price */}
                                    <div className="mb-3">
                                      <label className="block text-xs font-medium mb-1">
                                        Purchase Price
                                      </label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Enter price"
                                        value={bulkPurchasePrice}
                                        onChange={(e) =>
                                          setBulkPurchasePrice(e.target.value)
                                        }
                                        className={`w-full px-2 py-1 border rounded text-sm ${
                                          isDarkMode
                                            ? "bg-gray-700 border-gray-600 text-white"
                                            : "bg-white border-gray-300"
                                        }`}
                                      />
                                    </div>

                                    {/* Wholesale Price */}
                                    <div className="mb-3">
                                      <label className="block text-xs font-medium mb-1">
                                        Wholesale Price
                                      </label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Enter price"
                                        value={bulkWholesalePrice}
                                        onChange={(e) =>
                                          setBulkWholesalePrice(e.target.value)
                                        }
                                        className={`w-full px-2 py-1 border rounded text-sm ${
                                          isDarkMode
                                            ? "bg-gray-700 border-gray-600 text-white"
                                            : "bg-white border-gray-300"
                                        }`}
                                      />
                                    </div>

                                    {/* Retail Price */}
                                    <div className="mb-3">
                                      <label className="block text-xs font-medium mb-1">
                                        Retail Price
                                      </label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Enter price"
                                        value={bulkRetailPrice}
                                        onChange={(e) =>
                                          setBulkRetailPrice(e.target.value)
                                        }
                                        className={`w-full px-2 py-1 border rounded text-sm ${
                                          isDarkMode
                                            ? "bg-gray-700 border-gray-600 text-white"
                                            : "bg-white border-gray-300"
                                        }`}
                                      />
                                    </div>

                                    <button
                                      type="button"
                                      onClick={handleApplyBulkActions}
                                      className="w-full mt-3 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                                    >
                                      Apply Bulk Actions
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-100 overflow-y-auto p-2">
                          {individualSerials.map((serial, index) => (
                            <div
                              key={serial.id || index}
                              className={`border rounded-lg p-3 ${
                                isDarkMode
                                  ? "border-gray-700 bg-gray-800"
                                  : "border-gray-200 bg-gray-50"
                              }`}
                            >
                              <div
                                className={`text-sm font-medium mb-2 ${
                                  isDarkMode ? "text-white" : "text-gray-900"
                                }`}
                              >
                                Item #{index + 1}
                              </div>
                              <div className="space-y-2">
                                {/* Serial Number */}
                                <div>
                                  <label
                                    className={`text-xs mb-1 block ${
                                      isDarkMode
                                        ? "text-gray-400"
                                        : "text-gray-500"
                                    }`}
                                  >
                                    Serial Number *
                                  </label>
                                  <input
                                    type="text"
                                    value={serial.serial}
                                    onChange={(e) => {
                                      const newSerials = [...individualSerials];
                                      newSerials[index].serial = e.target.value;
                                      setIndividualSerials(newSerials);
                                    }}
                                    className={`w-full px-2 py-1 border rounded text-sm ${
                                      isDarkMode
                                        ? "bg-gray-700 border-gray-600 text-white"
                                        : "bg-white border-gray-300 text-gray-900"
                                    }`}
                                    required={useIndividualSerials}
                                  />
                                </div>

                                {/* Warranty and Product Type */}
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label
                                      className={`text-xs mb-1 block ${
                                        isDarkMode
                                          ? "text-gray-400"
                                          : "text-gray-500"
                                      }`}
                                    >
                                      Warranty
                                    </label>
                                    <select
                                      value={serial.warranty}
                                      onChange={(e) => {
                                        const newSerials = [
                                          ...individualSerials,
                                        ];
                                        newSerials[index].warranty = e.target
                                          .value as "Yes" | "No";
                                        setIndividualSerials(newSerials);
                                      }}
                                      className={`w-full px-2 py-1 border rounded text-sm ${
                                        isDarkMode
                                          ? "bg-gray-700 border-gray-600 text-white"
                                          : "bg-white border-gray-300 text-gray-900"
                                      }`}
                                    >
                                      <option value="Yes">Yes</option>
                                      <option value="No">No</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label
                                      className={`text-xs mb-1 block ${
                                        isDarkMode
                                          ? "text-gray-400"
                                          : "text-gray-500"
                                      }`}
                                    >
                                      Product Type *
                                    </label>
                                    <select
                                      value={serial.productType}
                                      onChange={(e) => {
                                        const newSerials = [
                                          ...individualSerials,
                                        ];
                                        newSerials[index].productType = e.target
                                          .value as "New" | "PreOwned";
                                        setIndividualSerials(newSerials);
                                      }}
                                      className={`w-full px-2 py-1 border rounded text-sm ${
                                        isDarkMode
                                          ? "bg-gray-700 border-gray-600 text-white"
                                          : "bg-white border-gray-300 text-gray-900"
                                      }`}
                                      required={useIndividualSerials}
                                    >
                                      <option value="New">New</option>
                                      <option value="PreOwned">
                                        Pre-Owned
                                      </option>
                                    </select>
                                  </div>
                                </div>

                                {/* Supplier for this serial - FIXED: Use setShowAddSupplier */}
                                <div>
                                  <label
                                    className={`text-xs mb-1 block ${
                                      isDarkMode
                                        ? "text-gray-400"
                                        : "text-gray-500"
                                    }`}
                                  >
                                    Supplier (Optional)
                                  </label>
                                  <select
                                    value={serial.supplier_id || ""}
                                    onChange={(e) => {
                                      if (e.target.value === "add-new") {
                                        setShowAddSupplier(true);
                                      } else {
                                        const newSerials = [
                                          ...individualSerials,
                                        ];
                                        newSerials[index].supplier_id = e.target
                                          .value
                                          ? parseInt(e.target.value)
                                          : undefined;
                                        setIndividualSerials(newSerials);
                                      }
                                    }}
                                    className={`w-full px-2 py-1 border rounded text-sm ${
                                      isDarkMode
                                        ? "bg-gray-700 border-gray-600 text-white"
                                        : "bg-white border-gray-300 text-gray-900"
                                    }`}
                                  >
                                    <option value="">Select Supplier</option>
                                    {suppliers.map((supplier) => (
                                      <option
                                        key={supplier.id}
                                        value={supplier.id}
                                      >
                                        {supplier.name}
                                      </option>
                                    ))}
                                    <option
                                      value="add-new"
                                      className="text-blue-500 font-medium"
                                    >
                                      + Add New Supplier
                                    </option>
                                  </select>
                                </div>

                                {/* Pricing - Purchase, Wholesale, Retail */}
                                <div className="grid grid-cols-1 gap-2">
                                  <div>
                                    <label
                                      className={`text-xs mb-1 block ${
                                        isDarkMode
                                          ? "text-gray-400"
                                          : "text-gray-500"
                                      }`}
                                    >
                                      Purchase Price *
                                    </label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={serial.purchasePrice}
                                      onChange={(e) => {
                                        const newSerials = [
                                          ...individualSerials,
                                        ];
                                        newSerials[index].purchasePrice =
                                          parseFloat(e.target.value);
                                        setIndividualSerials(newSerials);
                                      }}
                                      className={`w-full px-2 py-1 border rounded text-sm ${
                                        isDarkMode
                                          ? "bg-gray-700 border-gray-600 text-white"
                                          : "bg-white border-gray-300 text-gray-900"
                                      }`}
                                      required={useIndividualSerials}
                                    />
                                  </div>
                                  <div>
                                    <label
                                      className={`text-xs mb-1 block ${
                                        isDarkMode
                                          ? "text-gray-400"
                                          : "text-gray-500"
                                      }`}
                                    >
                                      Wholesale Price *
                                    </label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={serial.wholesalePrice}
                                      onChange={(e) => {
                                        const newSerials = [
                                          ...individualSerials,
                                        ];
                                        newSerials[index].wholesalePrice =
                                          parseFloat(e.target.value);
                                        setIndividualSerials(newSerials);
                                      }}
                                      className={`w-full px-2 py-1 border rounded text-sm ${
                                        isDarkMode
                                          ? "bg-gray-700 border-gray-600 text-white"
                                          : "bg-white border-gray-300 text-gray-900"
                                      }`}
                                      required={useIndividualSerials}
                                    />
                                  </div>
                                  <div>
                                    <label
                                      className={`text-xs mb-1 block ${
                                        isDarkMode
                                          ? "text-gray-400"
                                          : "text-gray-500"
                                      }`}
                                    >
                                      Retail Price *
                                    </label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={serial.retailPrice}
                                      onChange={(e) => {
                                        const newSerials = [
                                          ...individualSerials,
                                        ];
                                        newSerials[index].retailPrice =
                                          parseFloat(e.target.value);
                                        setIndividualSerials(newSerials);
                                      }}
                                      className={`w-full px-2 py-1 border rounded text-sm ${
                                        isDarkMode
                                          ? "bg-gray-700 border-gray-600 text-white"
                                          : "bg-white border-gray-300 text-gray-900"
                                      }`}
                                      required={useIndividualSerials}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div
                          className={`mt-3 text-sm ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          <p>
                            ✓ Serial numbers are required for serialized
                            products
                          </p>
                          <p>
                            ✓ Each serial must have purchase, wholesale, and
                            retail prices
                          </p>
                          <p>
                            ✓ Product type must be specified for each serial
                          </p>
                          <p>
                            ✓ Supplier can be assigned to individual serials
                            (optional)
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Specification */}
                    <div>
                      <label
                        className={`block text-sm font-medium mb-1 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Specification
                      </label>
                      <input
                        type="text"
                        name="specification"
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                        defaultValue={editingProduct?.specification || ""}
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label
                        className={`block text-sm font-medium mb-1 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Description
                      </label>
                      <textarea
                        name="description"
                        rows={3}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                        defaultValue={editingProduct?.description || ""}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        setEditingProduct(null);
                        setSelectedCategoryName("");
                        setSelectedCategoryId(null);
                        setSelectedSupplierId(null);
                        setShowAddSupplier(false); // FIXED
                        setNewCategoryName("");
                        setShowNewCategoryInput(false);
                        setUseIndividualSerials(false);
                        setIndividualSerials([]);
                        setProductSearchTerm("");
                        setFilteredProductsForModal([]);
                      }}
                      className={`px-4 py-2 border rounded-lg hover:bg-gray-50 cursor-pointer ${
                        isDarkMode
                          ? "border-gray-600 text-white hover:bg-gray-700"
                          : "border-gray-300 text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer"
                    >
                      {editingProduct ? "Update" : "Add"} Product
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div
              className={`rounded-lg border max-w-md w-full ${
                isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white"
              }`}
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-orange-100 rounded-lg dark:bg-orange-900/20">
                    <Trash2 className="w-6 h-6 text-orange-500" />
                  </div>
                  <h3 className="text-lg font-bold dark:text-white">
                    Mark Product as Unavailable
                  </h3>
                </div>

                <p className="text-gray-600 mb-6 dark:text-gray-400">
                  Are you sure you want to mark{" "}
                  <strong>{productToDeleteName}</strong> as unavailable? This
                  product will be hidden from active listings but the data will
                  be preserved.
                </p>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setProductToDelete(null);
                      setProductToDeleteName("");
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteProduct}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                  >
                    Mark as Unavailable
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alert Modal */}
        {showAlertModal && (
          <div className="fixed inset-0 flex backdrop-blur-sm items-center justify-center z-[10000] p-4">
            <div
              className={`p-6 rounded-xl border w-full max-w-md transform transition-all duration-300 scale-100 ${
                isDarkMode
                  ? "bg-gray-900 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
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
              <p
                className={`mb-6 ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {alertMessage}
              </p>
              <button
                onClick={() => setShowAlertModal(false)}
                className={`w-full py-2 rounded-lg font-medium transition-colors cursor-pointer ${
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

export default ProductsPage;
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
  AlertCircle, // Added AlertCircle
} from "lucide-react";
import {
  useGetProductsQuery,
  useDeleteProductMutation,
  useCreateProductMutation,
  useUpdateProductMutation,
  useGetCategoriesQuery,
  Product,
} from "@/state/api";
import { useRouter } from "next/navigation";

const ProductsPage = () => {
  const router = useRouter();

  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed
  );
  const isPOSPanelOpen = useAppSelector((state) => state.global.isPOSPanelOpen);
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  
  // RTK Query hooks
  const { data: products = [], isLoading, error } = useGetProductsQuery();
  const { data: categories = [] } = useGetCategoriesQuery();
  const [deleteProduct] = useDeleteProductMutation();
  const [createProduct] = useCreateProductMutation();
  const [updateProduct] = useUpdateProductMutation();

  // Local state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [warrantyFilter, setWarrantyFilter] = useState("all");
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
    Array<{ id?: number; serial: string; warranty: string }>
  >([]);
  const [showBulkWarrantyDropdown, setShowBulkWarrantyDropdown] =
    useState(false);
  const [bulkSerial, setBulkSerial] = useState("");

  // Modal category state
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [selectedWarranty, setSelectedWarranty] = useState<"Yes" | "No">("No");

  // Alert Modal State
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"success" | "error" | "info">(
    "info"
  );

  // Dropdown states
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showWarrantyDropdown, setShowWarrantyDropdown] = useState(false);
  const [showModalCategoryDropdown, setShowModalCategoryDropdown] =
    useState(false);
  const [showModalWarrantyDropdown, setShowModalWarrantyDropdown] =
    useState(false);

  // Refs for dropdown closing
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const warrantyDropdownRef = useRef<HTMLDivElement>(null);
  const modalCategoryDropdownRef = useRef<HTMLDivElement>(null);
  const modalWarrantyDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setShowCategoryDropdown(false);
      }
      if (
        warrantyDropdownRef.current &&
        !warrantyDropdownRef.current.contains(event.target as Node)
      ) {
        setShowWarrantyDropdown(false);
      }
      if (
        modalCategoryDropdownRef.current &&
        !modalCategoryDropdownRef.current.contains(event.target as Node)
      ) {
        setShowModalCategoryDropdown(false);
      }
      if (
        modalWarrantyDropdownRef.current &&
        !modalWarrantyDropdownRef.current.contains(event.target as Node)
      ) {
        setShowModalWarrantyDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helper function to show alerts
  const showAlert = (message: string, type: "success" | "error" | "info" = "info") => {
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

  // Filter products based on search and filters
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) || "";
    const matchesCategory =
      selectedCategory === "all" ||
      product.Categories?.name === selectedCategory;
    const matchesWarranty =
      warrantyFilter === "all" || product.warranty === warrantyFilter;

    return matchesSearch && matchesCategory && matchesWarranty;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handleAddProduct = () => {
    setShowAddModal(true);
    setEditingProduct(null);
    // Reset modal selections
    setSelectedCategoryName("");
    setSelectedCategoryId(null);
    setSelectedWarranty("No");
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);

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

    // Set useIndividualSerials from product data
    setUseIndividualSerials(product.useIndividualSerials || false);

    // If product has individual serials, populate them
    if (product.useIndividualSerials && product.productSerials) {
      const serials = product.productSerials.map((ps) => ({
        id: ps.id,
        serial: ps.serial || "",
        warranty: ps.warranty,
      }));
      setIndividualSerials(serials);

      // Set warranty from first serial (they should all be the same)
      // Or use product.warranty if it exists
      setSelectedWarranty(
        product.warranty || product.productSerials[0]?.warranty || "No"
      );
    } else {
      // For non-serialized products
      setSelectedWarranty(product.warranty as "Yes" | "No");
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
      showAlert("Product deleted successfully!", "success");
    } catch (error) {
      console.error("Failed to delete product:", error);
      showAlert("Failed to delete product. Please try again.", "error");
    } finally {
      setShowDeleteConfirm(false);
      setProductToDelete(null);
      setProductToDeleteName("");
    }
  };

  const handleSaveProduct = async (formData: FormData) => {
    try {
      // Extract basic product data
      const productData: any = {
        name: formData.get("name") as string,
        specification: (formData.get("specification") as string) || null,
        description: (formData.get("description") as string) || null,
        quantity: parseInt(formData.get("quantity") as string) || 1,
        purchasePrice: parseFloat(formData.get("purchasePrice") as string),
        wholesalePrice: parseFloat(formData.get("wholesalePrice") as string),
        retailPrice: parseFloat(formData.get("retailPrice") as string),
        useIndividualSerials,
        category_id: selectedCategoryId || undefined,
      };

      console.log("Sending product data:", {
        ...productData,
        useIndividualSerials,
        individualSerialsCount: individualSerials.length,
      });

      // Handle serial numbers based on tracking type
      if (useIndividualSerials) {
        // Send individualSerials as array of objects with serial and warranty
        productData.individualSerials = individualSerials.map(s => ({
          serial: s.serial || "",
          warranty: s.warranty || "No"
        }));
        
        console.log("Sending serials with warranty:", productData.individualSerials);
      } else {
        // For non-serialized products
        productData.warranty = selectedWarranty || "No";
      }

      console.log("Final product data being sent:", productData);

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
      setSelectedWarranty("No");
      setUseIndividualSerials(false);
      setIndividualSerials([]);

      showAlert(`Product ${editingProduct ? "updated" : "added"} successfully!`, "success");
    } catch (error: any) {
      console.error("Failed to save product:", error);
      console.error("Error details:", error.data);
      const errorMessage =
        error?.data?.message ||
        error?.message ||
        `Failed to ${
          editingProduct ? "update" : "add"
        } product. Please try again.`;
      showAlert(errorMessage, "error");
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

  const getWarrantyDisplayText = () => {
    if (warrantyFilter === "all") return "All Warranty";
    if (warrantyFilter === "Yes") return "With Warranty";
    return "No Warranty";
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
          <button
            onClick={handleAddProduct}
            className="mt-4 md:mt-0 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg p-4 shadow-sm bg-blue-100 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-black">Total Products</p>
              <p className="text-2xl font-bold text-blue-500">
                {products.length}
              </p>
            </div>
            <div className="p-2 rounded-lg">
              <Package className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="rounded-lg p-4 shadow-sm bg-orange-100 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-black">Low Stock</p>
              <p className="text-2xl font-bold text-orange-500">
                {products.filter((p) => p.quantity < 10).length}
              </p>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg">
              <Warehouse className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </div>

        <div className="rounded-lg p-4 shadow-sm bg-green-100 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-black">With Warranty</p>
              <p className="text-2xl font-bold text-green-500">
                {products.filter((p) => p.warranty === "Yes").length}
              </p>
            </div>
            <div className="p-2 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>

        <div className="rounded-lg p-4 shadow-sm bg-purple-100 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-black">Categories</p>
              <p className="text-2xl font-bold text-purple-500">
                {
                  Array.from(new Set(products.map((p) => p.Categories?.name)))
                    .length
                }
              </p>
            </div>
            <div className="p-2 rounded-lg">
              <Tag className="w-6 h-6 text-purple-500" />
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
                  placeholder="Search products by name or serial..."
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

            {/* Category Filter - UL/LI Version */}
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

            {/* Warranty Filter - UL/LI Version */}
            <div className="relative" ref={warrantyDropdownRef}>
              <button
                onClick={() => setShowWarrantyDropdown(!showWarrantyDropdown)}
                className={`flex items-center justify-between w-full md:w-48 px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                  isDarkMode
                    ? "bg-gray-800/50 border-gray-700"
                    : "bg-white/50 border-gray-200"
                }`}
              >
                <span>{getWarrantyDisplayText()}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {showWarrantyDropdown && (
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
                        setWarrantyFilter("all");
                        setShowWarrantyDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 cursor-pointer ${
                        warrantyFilter === "all"
                          ? "bg-blue-50 text-blue-600"
                          : ""
                      } ${
                        isDarkMode
                          ? "hover:bg-gray-100 hover:text-black"
                          : "hover:bg-gray-100 hover:text-black"
                      }`}
                    >
                      All Warranty
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        setWarrantyFilter("Yes");
                        setShowWarrantyDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-white hover:text-black cursor-pointer ${
                        warrantyFilter === "Yes"
                          ? "bg-blue-50 text-blue-600"
                          : ""
                      }`}
                    >
                      With Warranty
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        setWarrantyFilter("No");
                        setShowWarrantyDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-white hover:text-black cursor-pointer ${
                        warrantyFilter === "No"
                          ? "bg-blue-50 text-blue-600"
                          : ""
                      }`}
                    >
                      No Warranty
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
                  Product ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Product Name
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">
                  Prices
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">
                  Warranty
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
                  <td className="px-6 py-4 whitespace-nowra text-left">
                    <span className="inline-flex text-xs font-medium">
                      {product.id || "nAn"}
                    </span>
                  </td>
                  {/* Product Name Cell - Clickable */}
                  <td
                    className="px-6 py-4 whitespace-nowrap cursor-pointer"
                    onClick={() => router.push(`/product/${product.id}`)}
                  >
                    <div className="group">
                      <div className="text-sm font-medium group-hover:text-blue-600 transition-colors">
                        {product.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Serial: {product.serial}
                      </div>
                      {product.specification && (
                        <div className="text-xs mt-1 text-gray-600">
                          {product.specification}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowra text-center">
                    <span className="inline-flex px-2.5 py-2 rounded-lg text-xs font-medium bg-blue-100 text-blue-800">
                      {product.Categories?.name || "Uncategorized"}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap flex-1 text-center">
                    <div className="gap-2">
                      <span
                        className={`text-sm font-medium p-2 ${
                          product.quantity < 10 ? "text-red-500" : ""
                        }`}
                      >
                        {product.quantity}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap flex-1 text-center">
                    <div className="gap-1">
                      <span className="font-medium">
                        {product.retailPrice}{" "}
                        <span className="text-green-500">&#2547;</span>
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {product.warranty === "Yes" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3" />
                        Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="w-3 h-3" />
                        No
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <div className="flex-1 items-center space-x-2">
                      {/* View Button - Navigates to single product page */}
                      <button
                        onClick={() => router.push(`/product/${product.id}`)}
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
                        onClick={() => handleDeleteProduct(product.id, product.name)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
              warrantyFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by adding your first product"}
            </p>
            {!searchTerm &&
              selectedCategory === "all" &&
              warrantyFilter === "all" && (
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
                {Math.min(indexOfLastItem, filteredProducts.length)} of{" "}
                {filteredProducts.length} results
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
                  {/* Basic Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        className={`block text-sm font-medium mb-1 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Product Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                        defaultValue={editingProduct?.name || ""}
                      />
                    </div>
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
                        <span>{selectedCategoryName || "Select Category"}</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>

                      {showModalCategoryDropdown && (
                        <ul
                          className={`absolute z-10 w-full mt-1 border rounded-lg shadow-lg max-h-60 overflow-y-auto ${
                            isDarkMode
                              ? "bg-gray-800 border-gray-700"
                              : "bg-white border-gray-200"
                          }`}
                        >
                          {categories.map((category) => (
                            <li key={category.id}>
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
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* Prices */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label
                        className={`block text-sm font-medium mb-1 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Purchase Price *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        name="purchasePrice"
                        required
                        min="0"
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                        defaultValue={editingProduct?.purchasePrice || ""}
                      />
                    </div>
                    <div>
                      <label
                        className={`block text-sm font-medium mb-1 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Wholesale Price *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        name="wholesalePrice"
                        required
                        min="0"
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                        defaultValue={editingProduct?.wholesalePrice || ""}
                      />
                    </div>
                    <div>
                      <label
                        className={`block text-sm font-medium mb-1 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Retail Price *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        name="retailPrice"
                        required
                        min="0"
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                        defaultValue={editingProduct?.retailPrice || ""}
                      />
                    </div>
                  </div>

                  {/* Quantity and Individual Serial Toggle */}
                  <div className="grid grid-cols-2 gap-4">
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
                              })
                            );
                            setIndividualSerials(newSerials);
                          }
                        }}
                      />
                    </div>
                    <div className="flex flex-col justify-end">
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
                                ) || 1;
                              const newSerials = Array.from(
                                { length: quantity },
                                (_, i) => ({
                                  id: individualSerials[i]?.id,
                                  serial: individualSerials[i]?.serial || "",
                                  warranty:
                                    individualSerials[i]?.warranty || "No",
                                })
                              );
                              setIndividualSerials(newSerials);
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <label
                          className={`text-sm ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Track each item individually with serial numbers
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Individual Serial Numbers Section */}
                  {useIndividualSerials && (
                    <div
                      className={`mt-4 p-4 border rounded-lg ${
                        isDarkMode ? "border-gray-700" : "border-gray-200"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3
                          className={`font-medium ${
                            isDarkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          Individual Serial Numbers ({individualSerials.length}{" "}
                          items)
                        </h3>
                        <div className="flex gap-2">
                          {/* Bulk Actions */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setShowBulkWarrantyDropdown(
                                  !showBulkWarrantyDropdown
                                )
                              }
                              className={`flex items-center gap-2 px-3 py-1 border rounded-lg text-sm ${
                                isDarkMode
                                  ? "border-gray-600 bg-gray-700 text-white"
                                  : "border-gray-300 bg-white text-gray-900"
                              }`}
                            >
                              Bulk Actions
                              <ChevronDown className="w-3 h-3" />
                            </button>
                            {showBulkWarrantyDropdown && (
                              <div
                                className={`absolute right-0 mt-1 border rounded-lg shadow-lg z-10 ${
                                  isDarkMode
                                    ? "bg-gray-800 border-gray-700"
                                    : "bg-white border-gray-200"
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newSerials = individualSerials.map(
                                      (s) => ({
                                        ...s,
                                        warranty: "Yes",
                                      })
                                    );
                                    setIndividualSerials(newSerials);
                                    setShowBulkWarrantyDropdown(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 ${
                                    isDarkMode
                                      ? "hover:bg-gray-700 text-white"
                                      : "hover:bg-gray-100 text-gray-900"
                                  }`}
                                >
                                  Set All Warranty to "Yes"
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newSerials = individualSerials.map(
                                      (s) => ({
                                        ...s,
                                        warranty: "No",
                                      })
                                    );
                                    setIndividualSerials(newSerials);
                                    setShowBulkWarrantyDropdown(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 ${
                                    isDarkMode
                                      ? "hover:bg-gray-700 text-white"
                                      : "hover:bg-gray-100 text-gray-900"
                                  }`}
                                >
                                  Set All Warranty to "No"
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newSerials = individualSerials.map(
                                      (s) => ({
                                        ...s,
                                        serial: "",
                                      })
                                    );
                                    setIndividualSerials(newSerials);
                                    setShowBulkWarrantyDropdown(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 ${
                                    isDarkMode
                                      ? "hover:bg-gray-700 text-white"
                                      : "hover:bg-gray-100 text-gray-900"
                                  }`}
                                >
                                  Clear All Serials
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-60 overflow-y-auto p-2">
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
                              <div>
                                <label
                                  className={`text-xs mb-1 block ${
                                    isDarkMode
                                      ? "text-gray-400"
                                      : "text-gray-500"
                                  }`}
                                >
                                  Serial Number
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
                                  placeholder="Optional"
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
                                  Warranty
                                </label>
                                <select
                                  value={serial.warranty}
                                  onChange={(e) => {
                                    const newSerials = [...individualSerials];
                                    newSerials[index].warranty = e.target.value;
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
                            </div>
                          </div>
                        ))}
                      </div>

                      <div
                        className={`mt-3 text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        <p>✓ Serial numbers can be left blank (optional)</p>
                        <p>
                          ✓ Warranty status can be set individually or in bulk
                        </p>
                        <p>
                          ✓{" "}
                          {
                            individualSerials.filter((s) => s.serial.trim())
                              .length
                          }{" "}
                          out of {individualSerials.length} items have serial
                          numbers
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Specification and Description */}
                  <div className="grid grid-cols-2 gap-4">
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
                  </div>

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
                      setSelectedCategoryName("");
                      setSelectedCategoryId(null);
                      setUseIndividualSerials(false);
                      setIndividualSerials([]);
                      setBulkSerial("");
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
                <div className="p-2 bg-red-100 rounded-lg dark:bg-red-900/20">
                  <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-lg font-bold dark:text-white">
                  Delete Product
                </h3>
              </div>

              <p className="text-gray-600 mb-6 dark:text-gray-400">
                Are you sure you want to delete <strong>{productToDeleteName}</strong>?
                This action cannot be undone and will permanently remove the
                product from your inventory.
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
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Delete Product
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
  );
};

export default ProductsPage;
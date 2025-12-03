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
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.serial.toLowerCase().includes(searchTerm.toLowerCase());
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
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowAddModal(true);
  };

  const handleDeleteProduct = async (id: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct(id).unwrap();
      } catch (error) {
        console.error("Failed to delete product:", error);
        alert("Failed to delete product. Please try again.");
      }
    }
  };

  const handleSaveProduct = async (formData: FormData) => {
    try {
      const productData = {
        name: formData.get("name") as string,
        specification: (formData.get("specification") as string) || null,
        description: (formData.get("description") as string) || null,
        quantity: parseInt(formData.get("quantity") as string),
        purchasePrice: parseFloat(formData.get("purchasePrice") as string),
        wholesalePrice: parseFloat(formData.get("wholesalePrice") as string),
        retailPrice: parseFloat(formData.get("retailPrice") as string),
        serial: formData.get("serial") as string,
        warranty: formData.get("warranty") as "Yes" | "No",
        category_id: parseInt(formData.get("category_id") as string),
      };

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
    } catch (error) {
      console.error("Failed to save product:", error);
      alert(
        `Failed to ${
          editingProduct ? "update" : "add"
        } product. Please try again.`
      );
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
        className={`${getContentMargin()} p-6 min-h-screen bg-gray-50 flex items-center justify-center`}
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
        className={`${getContentMargin()} p-6 min-h-screen bg-gray-50 flex items-center justify-center`}
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
      className={`${getContentMargin()} p-6 min-h-full border rounded-xl shadow-2xl transition-all duration-300 mt-20`}
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
        <div className="rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Total Products</p>
              <p className="text-2xl font-bold">{products.length}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Low Stock</p>
              <p className="text-2xl font-bold text-orange-500">
                {products.filter((p) => p.quantity < 10).length}
              </p>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg">
              <Warehouse className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </div>

        <div className="rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">With Warranty</p>
              <p className="text-2xl font-bold text-green-500">
                {products.filter((p) => p.warranty === "Yes").length}
              </p>
            </div>
            <div className="p-2 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>

        <div className="rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Categories</p>
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
      <div className="rounded-lg shadow-sm border mb-6">
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Category Filter - UL/LI Version */}
            <div className="relative" ref={categoryDropdownRef}>
              <button
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="flex items-center justify-between w-full md:w-48 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:border-blue-500"
              >
                <span>{getCategoryDisplayText()}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {showCategoryDropdown && (
                <ul className="absolute z-10 w-full md:w-48 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  <li>
                    <button
                      onClick={() => {
                        setSelectedCategory("all");
                        setShowCategoryDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
                        selectedCategory === "all"
                          ? "bg-blue-50 text-blue-600"
                          : ""
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
                        className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
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
                className="flex items-center justify-between w-full md:w-48 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:border-blue-500"
              >
                <span>{getWarrantyDisplayText()}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {showWarrantyDropdown && (
                <ul className="absolute z-10 w-full md:w-48 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                  <li>
                    <button
                      onClick={() => {
                        setWarrantyFilter("all");
                        setShowWarrantyDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
                        warrantyFilter === "all"
                          ? "bg-blue-50 text-blue-600"
                          : ""
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
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
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
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
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
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filter
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Prices
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Warranty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentProducts.map((product) => (
                <tr
                  key={product.id}
                  className="dark:hover:bg-gray-50 hover:bg-gray-300"
                >
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

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {product.Categories?.name || "Uncategorized"}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-gray-400" />
                      <span
                        className={`text-sm font-medium ${
                          product.quantity < 10
                            ? "text-red-500"
                            : "text-gray-700"
                        }`}
                      >
                        {product.quantity}
                      </span>
                      {product.quantity < 10 && (
                        <span className="text-xs text-red-500">Low Stock</span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">
                          {product.retailPrice}{" "}
                          <span className="text-green-500">&#2547;</span>
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
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

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
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
                        onClick={() => handleDeleteProduct(product.id)}
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
          <div className="rounded-lg border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveProduct(new FormData(e.currentTarget));
                }}
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        defaultValue={editingProduct?.name || ""}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Serial Number *
                      </label>
                      <input
                        type="text"
                        name="serial"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        defaultValue={editingProduct?.serial || ""}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Purchase Price *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        name="purchasePrice"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        defaultValue={editingProduct?.purchasePrice || ""}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Wholesale Price *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        name="wholesalePrice"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        defaultValue={editingProduct?.wholesalePrice || ""}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Retail Price *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        name="retailPrice"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        defaultValue={editingProduct?.retailPrice || ""}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        name="quantity"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        defaultValue={editingProduct?.quantity || ""}
                      />
                    </div>
                    <div className="relative" ref={modalCategoryDropdownRef}>
                      <label className="block text-sm font-medium mb-1">
                        Category *
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setShowModalCategoryDropdown(
                            !showModalCategoryDropdown
                          )
                        }
                        className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      >
                        <span>
                          {editingProduct?.category_id
                            ? categories.find(
                                (cat) => cat.id === editingProduct.category_id
                              )?.name || "Select Category"
                            : "Select Category"}
                        </span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <input
                        type="hidden"
                        name="category_id"
                        value={editingProduct?.category_id || ""}
                        required
                      />

                      {showModalCategoryDropdown && (
                        <ul
                          className={`absolute z-10 w-full mt-1 border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto ${
                            isDarkMode ? "bg-black" : "bg-white"
                          } `}
                        >
                          {categories.map((category) => (
                            <li key={category.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  // You'll need to handle this selection in your form submission
                                  setShowModalCategoryDropdown(false);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 hover:text-black dark:bg-gray-900"
                              >
                                {category.name}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Specification
                      </label>
                      <input
                        type="text"
                        name="specification"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        defaultValue={editingProduct?.specification || ""}
                      />
                    </div>
                    <div className="relative" ref={modalWarrantyDropdownRef}>
                      <label className="block text-sm font-medium mb-1">
                        Warranty
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setShowModalWarrantyDropdown(
                            !showModalWarrantyDropdown
                          )
                        }
                        className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      >
                        <span>{editingProduct?.warranty || "No"}</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <input
                        type="hidden"
                        name="warranty"
                        value={editingProduct?.warranty || "No"}
                      />

                      {showModalWarrantyDropdown && (
                        <ul
                          className={`absolute z-10 w-full mt-1 border border-gray-300 rounded-lg shadow-lg ${
                            isDarkMode ? "bg-black" : "bg-white"
                          } `}
                        >
                          <li>
                            <button
                              type="button"
                              onClick={() =>
                                setShowModalWarrantyDropdown(false)
                              }
                              className="w-full text-left px-3 py-2 hover:bg-gray-100 hover:text-black"
                            >
                              Yes
                            </button>
                          </li>
                          <li>
                            <button
                              type="button"
                              onClick={() =>
                                setShowModalWarrantyDropdown(false)
                              }
                              className="w-full text-left px-3 py-2 hover:bg-gray-100 hover:text-black"
                            >
                              No
                            </button>
                          </li>
                        </ul>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      defaultValue={editingProduct?.description || ""}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-black cursor-pointer"
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
    </div>
  );
};

export default ProductsPage;

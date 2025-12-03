"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppSelector } from "@/app/redux";
import {
  Package,
  ArrowLeft,
  Edit,
  Trash2,
  Warehouse,
  Tag,
  DollarSign,
  Hash,
  CheckCircle,
  XCircle,
  Calendar,
  FileText,
  AlertTriangle,
  TrendingUp,
  ArrowLeftRight,
  Undo2,
  ShoppingCart,
  Plus,
  Minus,
  Eye,
  ChevronDown,
} from "lucide-react";
import {
  useGetProductQuery,
  useDeleteProductMutation,
  Product,
  useGetProductSalesQuery,
  useGetProductExchangesQuery,
  useGetProductSalesReturnsQuery,
  useGetProductPurchasesQuery,
  useGetCategoriesQuery,
  useUpdateProductMutation,
  useCreateProductMutation,
} from "@/state/api";

// Define the Transaction interface
interface Transaction {
  id: number;
  date: string;
  quantity: number;
  price: number;
  total: number;
  customer?: string;
  supplier?: string;
  invoiceNumber?: string;
  status?: string;
}

const SingleProductPage = () => {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed
  );
  const isPOSPanelOpen = useAppSelector((state) => state.global.isPOSPanelOpen);
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);

  // RTK Query hooks
  const {
    data: product,
    isLoading,
    error,
    refetch,
  } = useGetProductQuery(parseInt(productId));
  const [deleteProduct] = useDeleteProductMutation();
  const [updateProduct] = useUpdateProductMutation();
  const [createProduct] = useCreateProductMutation();
  const { data: categories = [] } = useGetCategoriesQuery();

  // Transaction history queries
  const { data: sales = [] } = useGetProductSalesQuery(parseInt(productId));
  const { data: exchanges = [] } = useGetProductExchangesQuery(parseInt(productId));
  const { data: salesReturns = [] } = useGetProductSalesReturnsQuery(parseInt(productId));
  const { data: purchases = [] } = useGetProductPurchasesQuery(parseInt(productId));

  // Local state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Modal dropdown states
  const [showModalCategoryDropdown, setShowModalCategoryDropdown] = useState(false);
  const [showModalWarrantyDropdown, setShowModalWarrantyDropdown] = useState(false);
  
  // Refs for dropdown closing
  const modalCategoryDropdownRef = useRef<HTMLDivElement>(null);
  const modalWarrantyDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
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

  const handleEdit = () => {
    setEditingProduct(product || null);
    setShowEditModal(true);
  };

  const handleDelete = async () => {
    try {
      await deleteProduct(parseInt(productId)).unwrap();
      router.push("/product");
    } catch (error) {
      console.error("Failed to delete product:", error);
      alert("Failed to delete product. Please try again.");
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
        refetch(); // Refresh product data
      } else {
        await createProduct(productData).unwrap();
      }

      setShowEditModal(false);
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

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) {
      return { status: "Out of Stock", color: "text-red-500", bg: "bg-red-100" };
    } else if (quantity < 10) {
      return { status: "Low Stock", color: "text-orange-500", bg: "bg-orange-100" };
    } else {
      return { status: "In Stock", color: "text-green-500", bg: "bg-green-100" };
    }
  };

  // Calculate transaction statistics
  const totalSales = sales.reduce((sum: number, sale: Transaction) => sum + sale.quantity, 0);
  const totalPurchases = purchases.reduce((sum: number, purchase: Transaction) => sum + purchase.quantity, 0);
  const totalReturns = salesReturns.reduce((sum: number, ret: Transaction) => sum + ret.quantity, 0);
  const totalExchanges = exchanges.reduce((sum: number, exchange: Transaction) => sum + exchange.quantity, 0);

  if (isLoading) {
    return (
      <div
        className={`${getContentMargin()} p-6 min-h-screen bg-gray-50 flex items-center justify-center`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div
        className={`${getContentMargin()} p-6 min-h-screen bg-gray-50 flex items-center justify-center`}
      >
        <div className="text-center">
          <Package className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Product Not Found
          </h3>
          <p className="text-red-600 mb-4">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push("/product")}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Back to Products
            </button>
            <button
              onClick={() => refetch()}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stockStatus = getStockStatus(product.quantity);

  const renderTransactionTable = (transactions: Transaction[], type: string) => {
    const getIcon = (type: string) => {
      switch (type) {
        case "sales": return <TrendingUp className="w-4 h-4 text-green-500" />;
        case "purchases": return <ShoppingCart className="w-4 h-4 text-blue-500" />;
        case "returns": return <Undo2 className="w-4 h-4 text-orange-500" />;
        case "exchanges": return <ArrowLeftRight className="w-4 h-4 text-purple-500" />;
        default: return <Eye className="w-4 h-4 text-gray-500" />;
      }
    };

    const getQuantityIcon = (type: string) => {
      switch (type) {
        case "sales": return <Minus className="w-3 h-3 text-red-500" />;
        case "purchases": return <Plus className="w-3 h-3 text-green-500" />;
        case "returns": return <Plus className="w-3 h-3 text-green-500" />;
        case "exchanges": return <ArrowLeftRight className="w-3 h-3 text-blue-500" />;
        default: return <Hash className="w-3 h-3 text-gray-500" />;
      }
    };

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                {type === "sales" || type === "returns" ? "Customer" : "Supplier"}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Total
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Invoice
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  {new Date(transaction.date).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  {transaction.customer || transaction.supplier || "N/A"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <div className="flex items-center gap-1">
                    {getQuantityIcon(type)}
                    <span>{transaction.quantity}</span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  ৳{transaction.price}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                  ৳{transaction.total}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-600">
                  {transaction.invoiceNumber || "N/A"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    transaction.status === "completed" 
                      ? "bg-green-100 text-green-800"
                      : transaction.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {transaction.status || "Completed"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {transactions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No {type} records found for this product.
          </div>
        )}
      </div>
    );
  };

  // Edit Product Modal (identical to Products Page)
  const EditProductModal = () => (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="rounded-lg border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4 dark:text-white">
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
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    defaultValue={editingProduct?.name || ""}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                    Serial Number *
                  </label>
                  <input
                    type="text"
                    name="serial"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    defaultValue={editingProduct?.serial || ""}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                    Purchase Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="purchasePrice"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    defaultValue={editingProduct?.purchasePrice || ""}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                    Wholesale Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="wholesalePrice"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    defaultValue={editingProduct?.wholesalePrice || ""}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                    Retail Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="retailPrice"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    defaultValue={editingProduct?.retailPrice || ""}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    defaultValue={editingProduct?.quantity || ""}
                  />
                </div>
                <div className="relative" ref={modalCategoryDropdownRef}>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                    Category *
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setShowModalCategoryDropdown(!showModalCategoryDropdown)
                    }
                    className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                        isDarkMode ? "bg-gray-800 text-white" : "bg-white"
                      }`}
                    >
                      {categories.map((category) => (
                        <li key={category.id}>
                          <button
                            type="button"
                            onClick={() => {
                              // Update the hidden input value
                              const input = document.querySelector('input[name="category_id"]') as HTMLInputElement;
                              if (input) input.value = category.id.toString();
                              setShowModalCategoryDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-gray-100 ${
                              isDarkMode ? "hover:bg-gray-700 hover:text-white" : ""
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                    Specification
                  </label>
                  <input
                    type="text"
                    name="specification"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    defaultValue={editingProduct?.specification || ""}
                  />
                </div>
                <div className="relative" ref={modalWarrantyDropdownRef}>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                    Warranty
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setShowModalWarrantyDropdown(!showModalWarrantyDropdown)
                    }
                    className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                        isDarkMode ? "bg-gray-800 text-white" : "bg-white"
                      }`}
                    >
                      <li>
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.querySelector('input[name="warranty"]') as HTMLInputElement;
                            if (input) input.value = "Yes";
                            setShowModalWarrantyDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-gray-100 ${
                            isDarkMode ? "hover:bg-gray-700 hover:text-white" : ""
                          }`}
                        >
                          Yes
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.querySelector('input[name="warranty"]') as HTMLInputElement;
                            if (input) input.value = "No";
                            setShowModalWarrantyDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-gray-100 ${
                            isDarkMode ? "hover:bg-gray-700 hover:text-white" : ""
                          }`}
                        >
                          No
                        </button>
                      </li>
                    </ul>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  defaultValue={editingProduct?.description || ""}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setShowAddModal(false);
                  setEditingProduct(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white cursor-pointer"
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
  );

  return (
    <div
      className={`${getContentMargin()} p-6 min-h-full border rounded-xl shadow-2xl transition-all duration-300 mt-20`}
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => router.push("/product")}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="w-6 h-6" />
              {product.name}
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Serial: {product.serial}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${stockStatus.bg} ${stockStatus.color}`}
            >
              {product.quantity < 10 && <AlertTriangle className="w-4 h-4" />}
              {stockStatus.status}
            </span>
            {product.warranty === "Yes" && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <CheckCircle className="w-4 h-4" />
                Under Warranty
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit Product
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6 border-b dark:border-gray-700">
        <nav className="flex space-x-8">
          {[
            { id: "overview", name: "Overview", icon: Package },
            { id: "sales", name: "Sales", icon: TrendingUp },
            { id: "purchases", name: "Purchases", icon: ShoppingCart },
            { id: "returns", name: "Sales Returns", icon: Undo2 },
            { id: "exchanges", name: "Exchanges", icon: ArrowLeftRight },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <>
          {/* Product Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Main Product Information */}
            <div className="lg:col-span-2">
              <div className="rounded-lg shadow-sm border overflow-hidden">
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Product Information
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1 dark:text-gray-400">
                          Product Name
                        </label>
                        <p className="text-lg font-semibold dark:text-white">{product.name}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1 dark:text-gray-400">
                          Serial Number
                        </label>
                        <p className="text-lg font-mono dark:text-white">{product.serial}</p>
                      </div>
                    </div>

                    {product.specification && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1 dark:text-gray-400">
                          Specification
                        </label>
                        <p className="text-lg dark:text-white">{product.specification}</p>
                      </div>
                    )}

                    {product.description && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1 dark:text-gray-400">
                          Description
                        </label>
                        <p className="text-lg dark:text-white">{product.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Information */}
            <div className="space-y-6">
              {/* Transaction Statistics */}
              <div className="rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
                  <FileText className="w-5 h-5" />
                  Transaction Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      Total Sold
                    </span>
                    <span className="font-semibold dark:text-white">{totalSales} units</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-blue-500" />
                      Total Purchased
                    </span>
                    <span className="font-semibold dark:text-white">{totalPurchases} units</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <Undo2 className="w-4 h-4 text-orange-500" />
                      Total Returns
                    </span>
                    <span className="font-semibold dark:text-white">{totalReturns} units</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <ArrowLeftRight className="w-4 h-4 text-purple-500" />
                      Total Exchanges
                    </span>
                    <span className="font-semibold dark:text-white">{totalExchanges} units</span>
                  </div>
                </div>
              </div>

              {/* Stock Information */}
              <div className="rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
                  <Warehouse className="w-5 h-5" />
                  Stock Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Current Quantity</span>
                    <span className="text-2xl font-bold flex items-center gap-2 dark:text-white">
                      <Hash className="w-5 h-5 text-gray-400" />
                      {product.quantity}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Status</span>
                    <span className={`font-semibold ${stockStatus.color}`}>
                      {stockStatus.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Category & Warranty */}
              <div className="rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
                  <Tag className="w-5 h-5" />
                  Classification
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Category</span>
                    <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                      {product.Categories?.name || "Uncategorized"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Warranty</span>
                    {product.warranty === "Yes" ? (
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium">
                        <CheckCircle className="w-4 h-4" />
                        Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 px-3 py-1 rounded-full text-sm font-medium">
                        <XCircle className="w-4 h-4" />
                        No
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Information */}
          <div className="rounded-lg shadow-sm border mb-6">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Pricing Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`text-center p-4 border rounded-lg ${
                  isDarkMode ? 'border-gray-700' : ''
                }`}>
                  <label className="block text-sm font-medium mb-2">
                    Purchase Price
                  </label>
                  <p className="text-2xl font-bold">
                    ৳{product.purchasePrice}
                  </p>
                  <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">Cost Price</p>
                </div>
                
                <div className={`text-center p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20 ${
                  isDarkMode ? 'border-gray-700' : ''
                }`}>
                  <label className="block text-sm font-medium text-gray-500 mb-2 dark:text-gray-400">
                    Wholesale Price
                  </label>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    ৳{product.wholesalePrice}
                  </p>
                  <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">Bulk Selling Price</p>
                </div>
                
                <div className={`text-center p-4 border rounded-lg bg-green-50 dark:bg-green-900/20 ${
                  isDarkMode ? 'border-gray-700' : ''
                }`}>
                  <label className="block text-sm font-medium text-gray-500 mb-2 dark:text-gray-400">
                    Retail Price
                  </label>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                    ৳{product.retailPrice}
                  </p>
                  <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">Customer Price</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Sales Tab */}
      {activeTab === "sales" && (
        <div className={`rounded-lg shadow-sm border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : ''
        }`}>
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
              <TrendingUp className="w-5 h-5" />
              Sales History
            </h2>
            {renderTransactionTable(sales, "sales")}
          </div>
        </div>
      )}

      {/* Purchases Tab */}
      {activeTab === "purchases" && (
        <div className={`rounded-lg shadow-sm border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : ''
        }`}>
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
              <ShoppingCart className="w-5 h-5" />
              Purchase History
            </h2>
            {renderTransactionTable(purchases, "purchases")}
          </div>
        </div>
      )}

      {/* Sales Returns Tab */}
      {activeTab === "returns" && (
        <div className={`rounded-lg shadow-sm border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : ''
        }`}>
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
              <Undo2 className="w-5 h-5" />
              Sales Return History
            </h2>
            {renderTransactionTable(salesReturns, "returns")}
          </div>
        </div>
      )}

      {/* Exchanges Tab */}
      {activeTab === "exchanges" && (
        <div className={`rounded-lg shadow-sm border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : ''
        }`}>
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
              <ArrowLeftRight className="w-5 h-5" />
              Exchange History
            </h2>
            {renderTransactionTable(exchanges, "exchanges")}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg border max-w-md w-full ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg dark:bg-red-900/20">
                  <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-lg font-bold dark:text-white">Delete Product</h3>
              </div>
              
              <p className="text-gray-600 mb-6 dark:text-gray-400">
                Are you sure you want to delete <strong>{product.name}</strong>? 
                This action cannot be undone and will permanently remove the product 
                from your inventory.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Delete Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {(showEditModal || showAddModal) && editingProduct && <EditProductModal />}
    </div>
  );
};

export default SingleProductPage;
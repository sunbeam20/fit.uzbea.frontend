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
  Shield,
  ShieldCheck,
  ShieldX,
  AlertCircle,
  User,
  UserCheck,
  Clock,
  Building,
  Plus as PlusIcon,
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
  useGetSuppliersQuery,
  useCreateSupplierMutation,
  useCreateCategoryMutation,
} from "@/state/api";
import ProviderWrapper from "@/app/(components)/ProviderWrapper";

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

// Define Individual Serial interface
interface IndividualSerial {
  id?: number;
  serial: string;
  warranty: string;
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
  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: suppliers = [] } = useGetSuppliersQuery();
  const [createSupplier] = useCreateSupplierMutation();
  const [createCategory] = useCreateCategoryMutation();

  // Transaction history queries
  const { data: sales = [] } = useGetProductSalesQuery(parseInt(productId));
  const { data: exchanges = [] } = useGetProductExchangesQuery(
    parseInt(productId)
  );
  const { data: salesReturns = [] } = useGetProductSalesReturnsQuery(
    parseInt(productId)
  );
  const { data: purchases = [] } = useGetProductPurchasesQuery(
    parseInt(productId)
  );

  // Local state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDeleteName, setProductToDeleteName] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Modal state for edit (matching ProductsPage)
  const [showModalCategoryDropdown, setShowModalCategoryDropdown] =
    useState(false);
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [selectedProductType, setSelectedProductType] = useState<
    "New" | "PreOwned"
  >("New");
  const [selectedWarranty, setSelectedWarranty] = useState<"Yes" | "No">("No");
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(
    null
  );
  const [useIndividualSerials, setUseIndividualSerials] = useState(false);
  const [individualSerials, setIndividualSerials] = useState<
    IndividualSerial[]
  >([]);
  const [showBulkWarrantyDropdown, setShowBulkWarrantyDropdown] =
    useState(false);

  // NEW: Category creation state
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // NEW: Supplier state
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
  });

  // Alert Modal State
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"success" | "error" | "info">(
    "info"
  );

  // Dropdown states
  const [showProductTypeModalDropdown, setShowProductTypeModalDropdown] =
    useState(false);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

  // Refs for dropdown closing
  const modalCategoryDropdownRef = useRef<HTMLDivElement>(null);
  const productTypeDropdownRef = useRef<HTMLDivElement>(null);
  const supplierDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalCategoryDropdownRef.current &&
        !modalCategoryDropdownRef.current.contains(event.target as Node)
      ) {
        setShowModalCategoryDropdown(false);
        setShowNewCategoryInput(false);
      }
      if (
        productTypeDropdownRef.current &&
        !productTypeDropdownRef.current.contains(event.target as Node)
      ) {
        setShowProductTypeModalDropdown(false);
      }
      if (
        supplierDropdownRef.current &&
        !supplierDropdownRef.current.contains(event.target as Node)
      ) {
        setShowSupplierDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helper function to show alerts
  const showAlert = (
    message: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlertModal(true);
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
        contactPerson: "",
        email: "",
        phone: "",
        address: "",
      });

      setSelectedSupplierId(newSupplierData.id);
      setShowAddSupplier(false);
      showAlert(
        `Supplier "${newSupplierData.name}" added successfully!`,
        "success"
      );
    } catch (error: any) {
      console.error("Failed to create supplier:", error);
      showAlert(error?.data?.message || "Failed to create supplier", "error");
    }
  };

  // Helper to get selected supplier name
  const getSelectedSupplierName = () => {
    if (!selectedSupplierId) return "Select Supplier *";
    const supplier = suppliers.find((s) => s.id === selectedSupplierId);
    return supplier ? supplier.name : "Select Supplier *";
  };

  // Initialize edit modal data (matching ProductsPage)
  const initializeEditModal = (product: Product) => {
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

    // Set product type
    setSelectedProductType(product.productType || "New");

    // Set supplier
    setSelectedSupplierId(product.supplier_id || null);

    // Set individual serial tracking
    setUseIndividualSerials(product.useIndividualSerials || false);

    // Set individual serials if product has them
    if (product.useIndividualSerials && product.productSerials) {
      const serials: IndividualSerial[] = product.productSerials.map((ps) => ({
        id: ps.id,
        serial: ps.serial || "",
        warranty: ps.warranty || "No",
      }));
      setIndividualSerials(serials);
    } else {
      setIndividualSerials([]);
    }

    setShowEditModal(true);
  };

  const handleEdit = () => {
    if (product) {
      initializeEditModal(product);
    }
  };

  // UPDATED: Mark as unavailable instead of delete
  const handleMarkUnavailable = () => {
    if (product) {
      setProductToDeleteName(product.name);
      setShowDeleteConfirm(true);
    }
  };

  const confirmMarkUnavailable = async () => {
    try {
      // Update product status to "Unavailable" instead of deleting
      await updateProduct({
        id: parseInt(productId),
        product: {
          status: "Unavailable",
        },
      }).unwrap();

      showAlert("Product marked as unavailable successfully!", "success");
      refetch(); // Refresh product data

      setTimeout(() => {
        router.push("/product");
      }, 1500);
    } catch (error) {
      console.error("Failed to mark product as unavailable:", error);
      showAlert(
        "Failed to mark product as unavailable. Please try again.",
        "error"
      );
    } finally {
      setShowDeleteConfirm(false);
      setProductToDeleteName("");
    }
  };

  // UPDATED: Match ProductsPage handleSaveProduct
  const handleSaveProduct = async (formData: FormData) => {
    try {
      // Validate required fields
      if (!selectedSupplierId) {
        showAlert("Please select a supplier", "error");
        return;
      }

      if (!selectedCategoryId) {
        showAlert("Please select a category", "error");
        return;
      }

      // Extract basic product data
      const productData: any = {
        name: formData.get("name") as string,
        specification: (formData.get("specification") as string) || null,
        description: (formData.get("description") as string) || null,
        quantity: parseInt(formData.get("quantity") as string) || 1,
        purchasePrice: parseFloat(formData.get("purchasePrice") as string),
        wholesalePrice: parseFloat(formData.get("wholesalePrice") as string),
        retailPrice: parseFloat(formData.get("retailPrice") as string),
        productType: selectedProductType,
        useIndividualSerials,
        category_id: selectedCategoryId,
        supplier_id: selectedSupplierId,
        status: "Active", // Always set as Active when updating
      };

      // Handle serial numbers based on tracking type
      if (useIndividualSerials) {
        // Send individualSerials as array of objects with serial and warranty
        productData.individualSerials = individualSerials.map((s) => ({
          serial: s.serial || "",
          warranty: s.warranty || "No",
        }));
      } else {
        // For non-serialized products
        productData.warranty = selectedWarranty || "No";
      }

      if (editingProduct) {
        await updateProduct({
          id: editingProduct.id,
          product: productData,
        }).unwrap();
        refetch(); // Refresh product data
      }

      setShowEditModal(false);
      setEditingProduct(null);
      setSelectedCategoryName("");
      setSelectedCategoryId(null);
      setSelectedWarranty("No");
      setSelectedProductType("New");
      setUseIndividualSerials(false);
      setIndividualSerials([]);
      setSelectedSupplierId(null);
      setShowAddSupplier(false);
      setNewCategoryName("");
      setShowNewCategoryInput(false);

      showAlert("Product updated successfully!", "success");
    } catch (error: any) {
      console.error("Failed to update product:", error);
      const errorMessage =
        error?.data?.message ||
        error?.message ||
        "Failed to update product. Please try again.";
      showAlert(errorMessage, "error");
    }
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) {
      return {
        status: "Out of Stock",
        color: "text-red-500",
        bg: "bg-red-100",
      };
    } else if (quantity < 10) {
      return {
        status: "Low Stock",
        color: "text-orange-500",
        bg: "bg-orange-100",
      };
    } else {
      return {
        status: "In Stock",
        color: "text-green-500",
        bg: "bg-green-100",
      };
    }
  };

  // Calculate transaction statistics
  const totalSales = sales.reduce(
    (sum: number, sale: Transaction) => sum + sale.quantity,
    0
  );
  const totalPurchases = purchases.reduce(
    (sum: number, purchase: Transaction) => sum + purchase.quantity,
    0
  );
  const totalReturns = salesReturns.reduce(
    (sum: number, ret: Transaction) => sum + ret.quantity,
    0
  );
  const totalExchanges = exchanges.reduce(
    (sum: number, exchange: Transaction) => sum + exchange.quantity,
    0
  );

  // Helper function to calculate content margin
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

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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

  const renderTransactionTable = (
    transactions: Transaction[],
    type: string
  ) => {
    const getIcon = (type: string) => {
      switch (type) {
        case "sales":
          return <TrendingUp className="w-4 h-4 text-green-500" />;
        case "purchases":
          return <ShoppingCart className="w-4 h-4 text-blue-500" />;
        case "returns":
          return <Undo2 className="w-4 h-4 text-orange-500" />;
        case "exchanges":
          return <ArrowLeftRight className="w-4 h-4 text-purple-500" />;
        default:
          return <Eye className="w-4 h-4 text-gray-500" />;
      }
    };

    const getQuantityIcon = (type: string) => {
      switch (type) {
        case "sales":
          return <Minus className="w-3 h-3 text-red-500" />;
        case "purchases":
          return <Plus className="w-3 h-3 text-green-500" />;
        case "returns":
          return <Plus className="w-3 h-3 text-green-500" />;
        case "exchanges":
          return <ArrowLeftRight className="w-3 h-3 text-blue-500" />;
        default:
          return <Hash className="w-3 h-3 text-gray-500" />;
      }
    };

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead
            className={`border-b ${
              isDarkMode ? "border-gray-700" : "border-gray-200"
            }`}
          >
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                {type === "sales" || type === "returns"
                  ? "Customer"
                  : "Supplier"}
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
                  ৳{transaction.total.toFixed(2)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-600">
                  {transaction.invoiceNumber || "N/A"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      transaction.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : transaction.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
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

  // UPDATED: Edit Product Modal (exactly matching ProductsPage modal)
  const EditProductModal = () => (
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
            Edit Product
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
                {/* Product Name */}
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

                {/* Product Type Dropdown */}
                <div className="relative" ref={productTypeDropdownRef}>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Product Type *
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setShowProductTypeModalDropdown(
                        !showProductTypeModalDropdown
                      )
                    }
                    className={`flex items-center justify-between w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                  >
                    <span>
                      {selectedProductType === "New" ? "New" : "Pre-Owned"}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {showProductTypeModalDropdown && (
                    <ul
                      className={`absolute z-10 w-full mt-1 border rounded-lg shadow-lg ${
                        isDarkMode
                          ? "bg-gray-800 border-gray-700"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <li>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProductType("New");
                            setShowProductTypeModalDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 ${
                            isDarkMode
                              ? "hover:bg-gray-700 text-white"
                              : "hover:bg-gray-100 text-gray-900"
                          } ${
                            selectedProductType === "New"
                              ? "bg-blue-50 text-blue-600"
                              : ""
                          }`}
                        >
                          New
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProductType("PreOwned");
                            setShowProductTypeModalDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 ${
                            isDarkMode
                              ? "hover:bg-gray-700 text-white"
                              : "hover:bg-gray-100 text-gray-900"
                          } ${
                            selectedProductType === "PreOwned"
                              ? "bg-blue-50 text-blue-600"
                              : ""
                          }`}
                        >
                          Pre-Owned
                        </button>
                      </li>
                    </ul>
                  )}
                </div>
              </div>

              {/* Category + Supplier + Quantity */}
              <div className="grid grid-cols-3 gap-4">
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
                      setShowModalCategoryDropdown(!showModalCategoryDropdown)
                    }
                    className={`flex items-center justify-between w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                  >
                    <span>{selectedCategoryName || "Select Category *"}</span>
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
                              onClick={() => setShowNewCategoryInput(true)}
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
                            className="text-sm text-gray-500 hover:text-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Supplier with Add New option */}
                <div className="relative" ref={supplierDropdownRef}>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Supplier *
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setShowSupplierDropdown(!showSupplierDropdown)
                    }
                    className={`flex items-center justify-between w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                  >
                    <span>{getSelectedSupplierName()}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {showSupplierDropdown && (
                    <div
                      className={`absolute z-10 w-full mt-1 border rounded-lg shadow-lg max-h-60 overflow-y-auto ${
                        isDarkMode
                          ? "bg-gray-800 border-gray-700"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      {!showAddSupplier ? (
                        <>
                          {suppliers.map((supplier) => (
                            <div key={supplier.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedSupplierId(supplier.id);
                                  setShowSupplierDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2 ${
                                  isDarkMode
                                    ? "hover:bg-gray-700 text-white"
                                    : "hover:bg-gray-100 text-gray-900"
                                }`}
                              >
                                <div className="font-medium">
                                  {supplier.name}
                                </div>
                              </button>
                            </div>
                          ))}
                          <div className="border-t border-gray-200 dark:border-gray-700">
                            <button
                              type="button"
                              onClick={() => setShowAddSupplier(true)}
                              className="w-full text-left px-3 py-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                              <PlusIcon className="w-4 h-4" />
                              Add New Supplier
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="p-3">
                          <div className="mb-3">
                            <h4 className="font-medium mb-2">
                              Add New Supplier
                            </h4>
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={newSupplier.name}
                                onChange={(e) =>
                                  setNewSupplier({
                                    ...newSupplier,
                                    name: e.target.value,
                                  })
                                }
                                placeholder="Supplier Name *"
                                className={`w-full px-3 py-1 border rounded text-sm ${
                                  isDarkMode
                                    ? "bg-gray-700 border-gray-600 text-white"
                                    : "bg-white border-gray-300"
                                }`}
                                autoFocus
                              />
                              <input
                                type="text"
                                value={newSupplier.contactPerson}
                                onChange={(e) =>
                                  setNewSupplier({
                                    ...newSupplier,
                                    contactPerson: e.target.value,
                                  })
                                }
                                placeholder="Contact Person"
                                className={`w-full px-3 py-1 border rounded text-sm ${
                                  isDarkMode
                                    ? "bg-gray-700 border-gray-600 text-white"
                                    : "bg-white border-gray-300"
                                }`}
                              />
                              <input
                                type="email"
                                value={newSupplier.email}
                                onChange={(e) =>
                                  setNewSupplier({
                                    ...newSupplier,
                                    email: e.target.value,
                                  })
                                }
                                placeholder="Email"
                                className={`w-full px-3 py-1 border rounded text-sm ${
                                  isDarkMode
                                    ? "bg-gray-700 border-gray-600 text-white"
                                    : "bg-white border-gray-300"
                                }`}
                              />
                              <input
                                type="text"
                                value={newSupplier.phone}
                                onChange={(e) =>
                                  setNewSupplier({
                                    ...newSupplier,
                                    phone: e.target.value,
                                  })
                                }
                                placeholder="Phone *"
                                className={`w-full px-3 py-1 border rounded text-sm ${
                                  isDarkMode
                                    ? "bg-gray-700 border-gray-600 text-white"
                                    : "bg-white border-gray-300"
                                }`}
                              />
                              <input
                                type="text"
                                value={newSupplier.address}
                                onChange={(e) =>
                                  setNewSupplier({
                                    ...newSupplier,
                                    address: e.target.value,
                                  })
                                }
                                placeholder="Address"
                                className={`w-full px-3 py-1 border rounded text-sm ${
                                  isDarkMode
                                    ? "bg-gray-700 border-gray-600 text-white"
                                    : "bg-white border-gray-300"
                                }`}
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleAddNewSupplier}
                              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                            >
                              Add Supplier
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowAddSupplier(false);
                                setNewSupplier({
                                  name: "",
                                  contactPerson: "",
                                  email: "",
                                  phone: "",
                                  address: "",
                                });
                              }}
                              className="px-3 py-1 border rounded text-sm hover:bg-gray-100"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Quantity and Individual Serial Toggle */}
                <div className="relative">
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
                              warranty: individualSerials[i]?.warranty || "No",
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
                        Individual serial numbers & warranty
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Individual Serial Numbers Section */}
              {useIndividualSerials && (
                <div
                  className={`mt-2 p-4 border rounded-lg col-span-3 ${
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
                          <div>
                            <label
                              className={`text-xs mb-1 block ${
                                isDarkMode ? "text-gray-400" : "text-gray-500"
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
                                isDarkMode ? "text-gray-400" : "text-gray-500"
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
                    <p>✓ Warranty status can be set individually or in bulk</p>
                    <p>
                      ✓{" "}
                      {individualSerials.filter((s) => s.serial.trim()).length}{" "}
                      out of {individualSerials.length} items have serial
                      numbers
                    </p>
                  </div>
                </div>
              )}

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

              {/* Specification */}
              <div className="relative">
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
                  setShowEditModal(false);
                  setSelectedCategoryName("");
                  setSelectedCategoryId(null);
                  setUseIndividualSerials(false);
                  setIndividualSerials([]);
                  setSelectedSupplierId(null);
                  setShowAddSupplier(false);
                  setNewCategoryName("");
                  setShowNewCategoryInput(false);
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
                Update Product
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

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
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => router.push("/product")}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
            }`}
          >
            <ArrowLeft className="w-5 h-5 cursor-pointer" />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="w-6 h-6" />
              {product.name}
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              ID: {product.productCode}
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
            {product.useIndividualSerials && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <CheckCircle className="w-4 h-4" />
                {product.useIndividualSerials ? (
                  <>
                    {product.productSerials?.filter((s) => s.warranty === "Yes")
                      .length || 0}
                    /{product.quantity} under warranty
                  </>
                ) : (
                  "All under warranty"
                )}
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
            {/* UPDATED: Changed to Mark as Unavailable */}
            <button
              onClick={handleMarkUnavailable}
              disabled={product.status === "Unavailable"}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                product.status === "Unavailable"
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-orange-500 hover:bg-orange-600 text-white"
              }`}
            >
              <Trash2 className="w-4 h-4" />
              {product.status === "Unavailable"
                ? "Unavailable"
                : "Mark as Unavailable"}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        className={`mb-6 border-b ${
          isDarkMode ? "border-gray-700" : "border-gray-200"
        }`}
      >
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
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors cursor-pointer ${
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
            <div className="col-span-2">
              <div
                className={`rounded-lg shadow-sm border overflow-hidden h-full ${
                  isDarkMode
                    ? "bg-gray-800/50 border-gray-700"
                    : "bg-white/50 border-gray-200"
                }`}
              >
                <div className="p-4">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Product Information
                  </h2>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1 dark:text-gray-400">
                        Product Id
                      </label>
                      <p className="text-lg font-semibold dark:text-white">
                        {product.id}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1 dark:text-gray-400">
                        Product Name
                      </label>
                      <p className="text-lg font-semibold dark:text-white">
                        {product.name}
                      </p>
                    </div>

                    {product.specification && (
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-500 mb-1 dark:text-gray-400">
                          Specification
                        </label>
                        <p className="text-lg dark:text-white">
                          {product.specification}
                        </p>
                      </div>
                    )}

                    {product.description && (
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-500 mb-1 dark:text-gray-400">
                          Description
                        </label>
                        <p className="text-lg dark:text-white">
                          {product.description}
                        </p>
                      </div>
                    )}

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-500 mb-1 dark:text-gray-400">
                        Stock
                      </label>
                      <p className="text-lg font-mono dark:text-white">
                        {product.quantity} units
                      </p>
                    </div>

                    {/* Supplier Information */}
                    <div className="col-span-2 mt-4 pt-4 border-t dark:border-gray-700 border-gray-200">
                      <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                        <Building className="w-5 h-5" />
                        Supplier Information
                      </h3>
                      {product.supplier ? (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1 dark:text-gray-400">
                              Supplier Name
                            </label>
                            <p className="text-lg font-semibold dark:text-white">
                              {product.supplier.name || "N/A"}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1 dark:text-gray-400">
                              Contact
                            </label>
                            <p className="text-lg dark:text-white">
                              {product.supplier.phone ||
                                product.supplier.email ||
                                "N/A"}
                            </p>
                          </div>
                          {product.supplier.address && (
                            <div className="col-span-2">
                              <label className="block text-sm font-medium text-gray-500 mb-1 dark:text-gray-400">
                                Address
                              </label>
                              <p className="text-lg dark:text-white">
                                {product.supplier.address}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 italic">
                          No supplier information available
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Information */}
            <div className="space-y-6">
              {/* Pricing Information */}
              <div
                className={`rounded-lg shadow-sm border ${
                  isDarkMode
                    ? "bg-gray-800/50 border-gray-700"
                    : "bg-white/50 border-gray-200"
                }`}
              >
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Pricing Information
                  </h2>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg dark:border-gray-700 border-gray-200">
                      <label className="block text-sm font-medium text-gray-500 mb-2 dark:text-gray-400">
                        Purchase Price
                      </label>
                      <p className="text-2xl font-bold">
                        ৳{product.purchasePrice}
                      </p>
                      <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
                        Cost Price
                      </p>
                    </div>

                    <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20 dark:border-gray-700 border-gray-200">
                      <label className="block text-sm font-medium text-gray-500 mb-2 dark:text-gray-400">
                        Wholesale Price
                      </label>
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                        ৳{product.wholesalePrice}
                      </p>
                      <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
                        Bulk Selling Price
                      </p>
                    </div>

                    <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-900/20 dark:border-gray-700 border-gray-200">
                      <label className="block text-sm font-medium text-gray-500 mb-2 dark:text-gray-400">
                        Retail Price
                      </label>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                        ৳{product.retailPrice}
                      </p>
                      <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
                        Customer Price
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Information */}
              <div
                className={`rounded-lg shadow-sm border ${
                  isDarkMode
                    ? "bg-gray-800/50 border-gray-700"
                    : "bg-white/50 border-gray-200"
                }`}
              >
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
                    <Clock className="w-5 h-5" />
                    System Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-gray-400" />
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Created By
                        </label>
                      </div>
                      <p className="text-lg font-semibold dark:text-white">
                        {product.created_by || "System"}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {product.createdAt
                          ? formatDate(product.createdAt)
                          : "N/A"}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <UserCheck className="w-4 h-4 text-gray-400" />
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Last Updated By
                        </label>
                      </div>
                      <p className="text-lg font-semibold dark:text-white">
                        {product.updated_by || "Not updated"}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {product.updatedAt
                          ? formatDate(product.updatedAt)
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Serial Numbers Section */}
            <div className="col-span-2">
              <div
                className={`rounded-lg shadow-sm border ${
                  isDarkMode
                    ? "bg-gray-800/50 border-gray-700"
                    : "bg-white/50 border-gray-200"
                }`}
              >
                <div className="p-4">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    {product.useIndividualSerials ? (
                      <>
                        <Shield className="w-5 h-5" />
                        Serial Numbers & Warranty Status
                      </>
                    ) : (
                      <>
                        <Hash className="w-5 h-5" />
                        Serial Number Information
                      </>
                    )}
                  </h2>

                  {product.useIndividualSerials ? (
                    <div className="space-y-4">
                      {product.productSerials &&
                      product.productSerials.length > 0 ? (
                        <>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {product.productSerials.map((serial, index) => (
                              <div
                                key={serial.id}
                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-sm font-mono ${
                                  serial.status === "Available"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                    : serial.status === "Sold"
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                    : serial.status === "Returned"
                                    ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                }`}
                              >
                                {serial.warranty === "Yes" && (
                                  <ShieldCheck className="size-4" />
                                )}
                                {serial.warranty === "No" && (
                                  <ShieldX className="size-4" />
                                )}
                                {serial.serial || `Item ${index + 1}`}
                              </div>
                            ))}
                          </div>

                          {/* Summary */}
                          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <h4 className="font-medium mb-3 dark:text-white">
                              Summary
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="text-2xl font-bold text-gray-800 dark:text-white">
                                  {
                                    product.productSerials.filter(
                                      (s) => s.status === "Available"
                                    ).length
                                  }
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  Available
                                </div>
                              </div>
                              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="text-2xl font-bold text-gray-800 dark:text-white">
                                  {
                                    product.productSerials.filter(
                                      (s) => s.status === "Sold"
                                    ).length
                                  }
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  Sold
                                </div>
                              </div>
                              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="text-2xl font-bold text-gray-800 dark:text-white">
                                  {
                                    product.productSerials.filter(
                                      (s) => s.warranty === "Yes"
                                    ).length
                                  }
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  With Warranty
                                </div>
                              </div>
                              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="text-2xl font-bold text-gray-800 dark:text-white">
                                  {
                                    product.productSerials.filter(
                                      (s) => s.warranty === "No"
                                    ).length
                                  }
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  No Warranty
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 italic">
                          No serial numbers registered
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-500 mb-1 dark:text-gray-400">
                          Bulk Serial Number
                        </label>
                        <p className="text-lg font-mono dark:text-white">
                          {"No bulk serial"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1 dark:text-gray-400">
                          Warranty Status
                        </label>
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          <ShieldX className="w-4 h-4" />
                          All {product.quantity} items without warranty
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Category & Transaction Statistics */}
            <div className="space-y-6">
              {/* Category & Stock */}
              <div
                className={`rounded-lg shadow-sm border ${
                  isDarkMode
                    ? "bg-gray-800/50 border-gray-700"
                    : "bg-white/50 border-gray-200"
                }`}
              >
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
                    <Tag className="w-5 h-5" />
                    Classification & Stock
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1 dark:text-gray-400">
                        Category
                      </label>
                      <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                        {product.Categories?.name || "Uncategorized"}
                      </span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1 dark:text-gray-400">
                        Stock Status
                      </label>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold dark:text-white">
                          {product.quantity} units
                        </span>
                        <span className={`font-semibold ${stockStatus.color}`}>
                          {stockStatus.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction Statistics */}
              <div
                className={`rounded-lg shadow-sm border ${
                  isDarkMode
                    ? "bg-gray-800/50 border-gray-700"
                    : "bg-white/50 border-gray-200"
                }`}
              >
                <div className="p-6">
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
                      <span className="font-semibold dark:text-white">
                        {totalSales} units
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-blue-500" />
                        Total Purchased
                      </span>
                      <span className="font-semibold dark:text-white">
                        {totalPurchases} units
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <Undo2 className="w-4 h-4 text-orange-500" />
                        Total Returns
                      </span>
                      <span className="font-semibold dark:text-white">
                        {totalReturns} units
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <ArrowLeftRight className="w-4 h-4 text-purple-500" />
                        Total Exchanges
                      </span>
                      <span className="font-semibold dark:text-white">
                        {totalExchanges} units
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Sales Tab */}
      {activeTab === "sales" && (
        <div
          className={`rounded-lg shadow-sm border ${
            isDarkMode
              ? "bg-gray-800/50 border-gray-700"
              : "bg-white/50 border-gray-200"
          }`}
        >
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
        <div
          className={`rounded-lg shadow-sm border ${
            isDarkMode
              ? "bg-gray-800/50 border-gray-700"
              : "bg-white/50 border-gray-200"
          }`}
        >
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
        <div
          className={`rounded-lg shadow-sm border ${
            isDarkMode
              ? "bg-gray-800/50 border-gray-700"
              : "bg-white/50 border-gray-200"
          }`}
        >
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
        <div
          className={`rounded-lg shadow-sm border ${
            isDarkMode
              ? "bg-gray-800/50 border-gray-700"
              : "bg-white/50 border-gray-200"
          }`}
        >
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
              <ArrowLeftRight className="w-5 h-5" />
              Exchange History
            </h2>
            {renderTransactionTable(exchanges, "exchanges")}
          </div>
        </div>
      )}

      {/* UPDATED: Delete Confirmation Modal (Mark as Unavailable) */}
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
                product will be hidden from active listings but the data will be
                preserved.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setProductToDeleteName("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmMarkUnavailable}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  Mark as Unavailable
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && <EditProductModal />}

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

export default SingleProductPage;

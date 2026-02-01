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
  Key,
  Barcode,
  Layers,
  RefreshCw,
  Search,
  X,
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
  useGetProductsQuery,
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
  serial?: string;
  isOldProduct?: boolean;
  oldProductName?: string;
  newProductName?: string;
}

// Define Individual Serial interface for editing
interface IndividualSerial {
  id?: number;
  serial: string;
  warranty: "Yes" | "No";
  purchasePrice: number;
  wholesalePrice: number;
  retailPrice: number;
  productType: "New" | "PreOwned";
  supplier_id?: number;
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
  const { data: allProducts = [] } = useGetProductsQuery();
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

  // Modal state for edit
  const [showModalCategoryDropdown, setShowModalCategoryDropdown] =
    useState(false);
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [useIndividualSerials, setUseIndividualSerials] = useState(false);
  const [individualSerials, setIndividualSerials] = useState<
    IndividualSerial[]
  >([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // NEW: Category creation state
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Supplier state for adding new supplier from dropdown
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
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

  // Bulk Actions State
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

  // Product search state
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // Refs for dropdown closing
  const modalCategoryDropdownRef = useRef<HTMLDivElement>(null);
  const bulkActionsRef = useRef<HTMLDivElement>(null);

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
        bulkActionsRef.current &&
        !bulkActionsRef.current.contains(event.target as Node)
      ) {
        setShowBulkActions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  // Update filtered suppliers when bulk supplier search changes
  useEffect(() => {
    if (bulkSupplierSearch.trim() === "") {
      setFilteredSuppliers(suppliers);
    } else {
      const filtered = suppliers.filter((supplier) =>
        supplier.name.toLowerCase().includes(bulkSupplierSearch.toLowerCase())
      );
      setFilteredSuppliers(filtered);
    }
  }, [bulkSupplierSearch, suppliers]);

  // Update filtered products when product search changes
  useEffect(() => {
    if (productSearchTerm.trim() === "") {
      setFilteredProducts([]);
    } else {
      const filtered = allProducts.filter(
        (product) =>
          product.name
            .toLowerCase()
            .includes(productSearchTerm.toLowerCase()) &&
          product.id !== editingProduct?.id // Exclude current product
      );
      setFilteredProducts(filtered);
    }
  }, [productSearchTerm, allProducts, editingProduct]);

  // Helper function to show alerts
  const showAlert = (
    message: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlertModal(true);
  };

  // NEW: Handle adding new supplier (fixed version)
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

      setShowAddSupplierModal(false);
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

  // NEW: Handle bulk actions apply
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

  // Calculate price range for products with serials
  const getPriceRange = () => {
    if (!product) return { min: 0, max: 0, formatted: "N/A" };

    if (product.useIndividualSerials && product.productSerials?.length) {
      const retailPrices = product.productSerials.map((s) =>
        Number(s.retailPrice)
      );
      const min = Math.min(...retailPrices);
      const max = Math.max(...retailPrices);
      if (min === max) return { min, max, formatted: `৳${min}` };
      return { min, max, formatted: `৳${min} - ৳${max}` };
    }
    return { min: 0, max: 0, formatted: "N/A" };
  };

  // Calculate average price
  const getAveragePrice = () => {
    if (!product) return "N/A";

    if (product.useIndividualSerials && product.productSerials?.length) {
      const prices = product.productSerials.map((s) => Number(s.retailPrice));
      const average =
        prices.reduce((sum, price) => sum + price, 0) / prices.length;
      return `৳${average.toFixed(2)}`;
    }
    return "N/A";
  };

  // Get product type display
  const getProductTypeDisplay = () => {
    if (!product) return "N/A";

    if (product.useIndividualSerials && product.productSerials?.length) {
      const types = [
        ...new Set(product.productSerials.map((s) => s.productType)),
      ];
      if (types.length === 1) return types[0];
      return types.join(", ");
    }
    return "N/A";
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

  // Initialize edit modal data
  const initializeEditModal = (product: Product) => {
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

    // Set individual serial tracking
    setUseIndividualSerials(product.useIndividualSerials || false);

    // Set individual serials if product has them
    if (product.useIndividualSerials && product.productSerials) {
      const serials: IndividualSerial[] = product.productSerials.map((ps) => ({
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
      // Update product to mark as unavailable by setting quantity to 0
      await updateProduct({
        id: parseInt(productId),
        product: {
          quantity: 0,
        },
      }).unwrap();

      showAlert("Product marked as unavailable successfully!", "success");
      refetch(); // Refresh product data

      setTimeout(() => {
        router.push("/product");
      }, 1500);
    } catch (error: any) {
      console.error("Failed to mark product as unavailable:", error);
      showAlert(
        error?.data?.message || "Failed to mark product as unavailable",
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
      if (!editingProduct) return;

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
          if (!serial.serial || !serial.serial.trim()) {
            showAlert("Each serial must have a serial number", "error");
            return;
          }

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

      await updateProduct({
        id: editingProduct.id,
        product: productData,
      }).unwrap();

      refetch(); // Refresh product data
      setShowEditModal(false);
      setEditingProduct(null);
      setSelectedCategoryName("");
      setSelectedCategoryId(null);
      setShowAddSupplierModal(false);
      setNewCategoryName("");
      setShowNewCategoryInput(false);
      setUseIndividualSerials(false);
      setIndividualSerials([]);
      setProductSearchTerm("");

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
        bg: "bg-red-100 dark:bg-red-900/20",
      };
    } else if (quantity < 10) {
      return {
        status: "Low Stock",
        color: "text-orange-500",
        bg: "bg-orange-100 dark:bg-orange-900/20",
      };
    } else {
      return {
        status: "In Stock",
        color: "text-green-500",
        bg: "bg-green-100 dark:bg-green-900/20",
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

  // Calculate total revenue from sales
  const totalSalesRevenue = sales.reduce(
    (sum: number, sale: Transaction) => sum + sale.total,
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

  // Get serial status count
  const getSerialStatusCount = (status: string) => {
    if (!product || !product.productSerials) return 0;
    return product.productSerials.filter((s) => s.status === status).length;
  };

  // Get warranty count
  const getWarrantyCount = (warranty: string) => {
    if (!product || !product.productSerials) return 0;
    return product.productSerials.filter((s) => s.warranty === warranty).length;
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
  const priceRange = getPriceRange();
  const averagePrice = getAveragePrice();
  const productTypeDisplay = getProductTypeDisplay();

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
                {type === "exchanges" ? "Exchange Type" : "Status"}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {transactions.map((transaction) => (
              <tr
                key={transaction.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800"
              >
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
                <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400">
                  {transaction.invoiceNumber || "N/A"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {type === "exchanges" ? (
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.isOldProduct
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      }`}
                    >
                      {transaction.isOldProduct ? "Old Product" : "New Product"}
                    </span>
                  ) : (
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.status === "completed"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : transaction.status === "pending"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {transaction.status || "Completed"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {transactions.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No {type} records found for this product.
          </div>
        )}
      </div>
    );
  };

  // Edit Product Modal
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
                {filteredProducts.length > 0 && productSearchTerm && (
                  <div
                    className={`absolute z-10 w-full mt-1 border rounded-lg shadow-lg max-h-60 overflow-y-auto ${
                      isDarkMode
                        ? "bg-gray-800 border-gray-700"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    {filteredProducts.map((prod) => (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => {
                          setProductSearchTerm(prod.name);
                          setFilteredProducts([]);
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
                            warranty: individualSerials[i]?.warranty || "No",
                            purchasePrice:
                              individualSerials[i]?.purchasePrice || 0,
                            wholesalePrice:
                              individualSerials[i]?.wholesalePrice || 0,
                            retailPrice: individualSerials[i]?.retailPrice || 0,
                            productType:
                              individualSerials[i]?.productType || "New",
                            supplier_id: individualSerials[i]?.supplier_id,
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
                          warranty: individualSerials[i]?.warranty || "No",
                          purchasePrice:
                            individualSerials[i]?.purchasePrice || 0,
                          wholesalePrice:
                            individualSerials[i]?.wholesalePrice || 0,
                          retailPrice: individualSerials[i]?.retailPrice || 0,
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
                      Individual Serial Numbers ({individualSerials.length}{" "}
                      items)
                    </h3>
                    <div className="flex gap-2">
                      {/* Bulk Actions - Updated */}
                      <div className="relative" ref={bulkActionsRef}>
                        <button
                          type="button"
                          onClick={() => setShowBulkActions(!showBulkActions)}
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
                                    onClick={() => setBulkProductType("New")}
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
                                      setBulkSupplierSearch(e.target.value)
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
                                          setSelectedBulkSupplierId(supplier.id)
                                        }
                                        className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                          selectedBulkSupplierId === supplier.id
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
                                        setShowAddSupplierModal(true);
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
                                isDarkMode ? "text-gray-400" : "text-gray-500"
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
                                  isDarkMode ? "text-gray-400" : "text-gray-500"
                                }`}
                              >
                                Warranty
                              </label>
                              <select
                                value={serial.warranty}
                                onChange={(e) => {
                                  const newSerials = [...individualSerials];
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
                                  isDarkMode ? "text-gray-400" : "text-gray-500"
                                }`}
                              >
                                Product Type *
                              </label>
                              <select
                                value={serial.productType}
                                onChange={(e) => {
                                  const newSerials = [...individualSerials];
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
                                <option value="PreOwned">Pre-Owned</option>
                              </select>
                            </div>
                          </div>

                          {/* Supplier for this serial */}
                          <div>
                            <label
                              className={`text-xs mb-1 block ${
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              Supplier (Optional)
                            </label>
                            <select
                              value={serial.supplier_id || ""}
                              onChange={(e) => {
                                if (e.target.value === "add-new") {
                                  setShowAddSupplierModal(true);
                                } else {
                                  const newSerials = [...individualSerials];
                                  newSerials[index].supplier_id = e.target.value
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
                                <option key={supplier.id} value={supplier.id}>
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
                                  isDarkMode ? "text-gray-400" : "text-gray-500"
                                }`}
                              >
                                Purchase Price *
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={serial.purchasePrice}
                                onChange={(e) => {
                                  const newSerials = [...individualSerials];
                                  newSerials[index].purchasePrice = parseFloat(
                                    e.target.value
                                  );
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
                                  isDarkMode ? "text-gray-400" : "text-gray-500"
                                }`}
                              >
                                Wholesale Price *
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={serial.wholesalePrice}
                                onChange={(e) => {
                                  const newSerials = [...individualSerials];
                                  newSerials[index].wholesalePrice = parseFloat(
                                    e.target.value
                                  );
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
                                  isDarkMode ? "text-gray-400" : "text-gray-500"
                                }`}
                              >
                                Retail Price *
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={serial.retailPrice}
                                onChange={(e) => {
                                  const newSerials = [...individualSerials];
                                  newSerials[index].retailPrice = parseFloat(
                                    e.target.value
                                  );
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
                    <p>✓ Serial numbers are required for serialized products</p>
                    <p>
                      ✓ Each serial must have purchase, wholesale, and retail
                      prices
                    </p>
                    <p>✓ Product type must be specified for each serial</p>
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
                  setShowEditModal(false);
                  setEditingProduct(null);
                  setSelectedCategoryName("");
                  setSelectedCategoryId(null);
                  setShowAddSupplierModal(false);
                  setNewCategoryName("");
                  setShowNewCategoryInput(false);
                  setUseIndividualSerials(false);
                  setIndividualSerials([]);
                  setProductSearchTerm("");
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
                      {getWarrantyCount("Yes")}/{product.quantity} under
                      warranty
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Product Information */}
              <div className="col-span-2">
                <div
                  className={`rounded-lg shadow-sm border overflow-hidden ${
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
                    {/* Product Information */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1 dark:text-gray-400">
                          Product Code
                        </label>
                        <p className="text-lg font-semibold dark:text-white">
                          {product.productCode || product.id}
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

                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1 dark:text-gray-400">
                          Tracking Type
                        </label>
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${
                            product.useIndividualSerials
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {product.useIndividualSerials ? "Serialized" : "Bulk"}
                        </span>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1 dark:text-gray-400">
                          Product Type
                        </label>
                        <p className="text-lg dark:text-white">
                          {productTypeDisplay}
                        </p>
                      </div>

                      {/* Supplier Information */}
                      <div className="col-span-2 mt-4 pt-4 border-t dark:border-gray-700 border-gray-200">
                        <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                          {product.useIndividualSerials ? (
                            <>
                              <Barcode className="w-5 h-5" />
                              Serial Numbers & Details
                            </>
                          ) : (
                            <>
                              <Layers className="w-5 h-5" />
                              Bulk Product Information
                            </>
                          )}
                        </h3>

                        {product.useIndividualSerials ? (
                          <div className="space-y-4">
                            {product.productSerials &&
                            product.productSerials.length > 0 ? (
                              <>
                                <div className="overflow-x-auto">
                                  <table className="w-full">
                                    <thead
                                      className={`border-b ${
                                        isDarkMode
                                          ? "border-gray-700"
                                          : "border-gray-200"
                                      }`}
                                    >
                                      <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                          Serial
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                          Status
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                          Warranty
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                          Type
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                          Supplier
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                          Purchase
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                          Wholesale
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                          Retail
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                      {product.productSerials.map((serial) => (
                                        <tr
                                          key={serial.id}
                                          className="hover:bg-gray-50 dark:hover:bg-gray-800"
                                        >
                                          <td className="px-4 py-3 whitespace-nowrap text-sm font-mono">
                                            {serial.serial || "-"}
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap">
                                            <span
                                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                serial.status === "Available"
                                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                                  : serial.status === "Sold"
                                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                                  : serial.status === "Returned"
                                                  ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                                                  : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                              }`}
                                            >
                                              {serial.status}
                                            </span>
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap">
                                            <span
                                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                serial.warranty === "Yes"
                                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                              }`}
                                            >
                                              {serial.warranty === "Yes" ? (
                                                <ShieldCheck className="w-3 h-3 mr-1" />
                                              ) : (
                                                <ShieldX className="w-3 h-3 mr-1" />
                                              )}
                                              {serial.warranty}
                                            </span>
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap">
                                            <span
                                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                serial.productType === "New"
                                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                                              }`}
                                            >
                                              {serial.productType}
                                            </span>
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                                            {serial.supplier?.name || "N/A"}
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                                            ৳
                                            {Number(
                                              serial.purchasePrice
                                            ).toFixed(2)}
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                                            ৳
                                            {Number(
                                              serial.wholesalePrice
                                            ).toFixed(2)}
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold">
                                            ৳
                                            {Number(serial.retailPrice).toFixed(
                                              2
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>

                                {/* Summary */}
                                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                  <h4 className="font-medium mb-3 dark:text-white">
                                    Summary
                                  </h4>
                                  <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                      <div className="text-2xl font-bold text-gray-800 dark:text-white">
                                        {getSerialStatusCount("Available")}
                                      </div>
                                      <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Available
                                      </div>
                                    </div>
                                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                      <div className="text-2xl font-bold text-gray-800 dark:text-white">
                                        {getSerialStatusCount("Sold")}
                                      </div>
                                      <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Sold
                                      </div>
                                    </div>
                                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                      <div className="text-2xl font-bold text-gray-800 dark:text-white">
                                        {getWarrantyCount("Yes")}
                                      </div>
                                      <div className="text-sm text-gray-600 dark:text-gray-400">
                                        With Warranty
                                      </div>
                                    </div>
                                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                      <div className="text-2xl font-bold text-gray-800 dark:text-white">
                                        {getWarrantyCount("No")}
                                      </div>
                                      <div className="text-sm text-gray-600 dark:text-gray-400">
                                        No Warranty
                                      </div>
                                    </div>
                                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                      <div className="text-2xl font-bold text-gray-800 dark:text-white">
                                        {product.productSerials?.filter(
                                          (s) => s.supplier?.name
                                        ).length || 0}
                                      </div>
                                      <div className="text-sm text-gray-600 dark:text-gray-400">
                                        With Supplier
                                      </div>
                                    </div>
                                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                      <div className="text-2xl font-bold text-gray-800 dark:text-white">
                                        {product.productSerials?.length || 0}
                                      </div>
                                      <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Total Serials
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
                                Bulk Product
                              </label>
                              <p className="text-lg dark:text-white">
                                This product is tracked in bulk quantities
                                without individual serial numbers.
                              </p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-500 mb-1 dark:text-gray-400">
                                Stock Type
                              </label>
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                <Layers className="w-4 h-4" />
                                Bulk Quantity: {product.quantity} units
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar Information */}
              <div className="space-y-6 h-fit">
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
                          <span
                            className={`font-semibold ${stockStatus.color}`}
                          >
                            {stockStatus.status}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1 dark:text-gray-400">
                          Created
                        </label>
                        <p className="text-sm dark:text-white">
                          {product.createdAt
                            ? formatDate(product.createdAt)
                            : "N/A"}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1 dark:text-gray-400">
                          Last Updated
                        </label>
                        <p className="text-sm dark:text-white">
                          {product.updatedAt
                            ? formatDate(product.updatedAt)
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Pricing Information */}
                <div
                  className={`rounded-lg shadow-sm border ${
                    isDarkMode
                      ? "bg-gray-800/50 border-gray-700"
                      : "bg-white/50 border-gray-200"
                  }`}
                >
                  <div className="p-6">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Pricing Information
                    </h2>
                    <div className="space-y-6">
                      <div className="p-4 border rounded-lg dark:border-gray-700 border-gray-200">
                        <label className="block text-sm font-medium text-gray-500 mb-2 dark:text-gray-400">
                          Price Range
                        </label>
                        <p className="text-2xl font-bold">
                          {priceRange.formatted}
                        </p>
                        <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
                          Retail Price Range
                        </p>
                      </div>

                      <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20 dark:border-gray-700 border-gray-200">
                        <label className="block text-sm font-medium text-gray-500 mb-2 dark:text-gray-400">
                          Average Price
                        </label>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                          {averagePrice}
                        </p>
                        <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
                          Average Retail Price
                        </p>
                      </div>

                      <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-900/20 dark:border-gray-700 border-gray-200">
                        <label className="block text-sm font-medium text-gray-500 mb-2 dark:text-gray-400">
                          Total Value
                        </label>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                          ৳{product.quantity * priceRange.max}
                        </p>
                        <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
                          Current Stock Value
                        </p>
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

        {/* Add New Supplier Modal */}
        {showAddSupplierModal && (
          <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[10001] p-4">
            <div
              className={`rounded-lg border max-w-md w-full ${
                isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white"
              }`}
            >
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4 dark:text-white">
                  Add New Supplier
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                      Supplier Name *
                    </label>
                    <input
                      type="text"
                      value={newSupplier.name}
                      onChange={(e) =>
                        setNewSupplier({ ...newSupplier, name: e.target.value })
                      }
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                      placeholder="Enter supplier name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newSupplier.email}
                      onChange={(e) =>
                        setNewSupplier({
                          ...newSupplier,
                          email: e.target.value,
                        })
                      }
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                      placeholder="Enter email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                      Phone *
                    </label>
                    <input
                      type="text"
                      value={newSupplier.phone}
                      onChange={(e) =>
                        setNewSupplier({
                          ...newSupplier,
                          phone: e.target.value,
                        })
                      }
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                      Address
                    </label>
                    <input
                      type="text"
                      value={newSupplier.address}
                      onChange={(e) =>
                        setNewSupplier({
                          ...newSupplier,
                          address: e.target.value,
                        })
                      }
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                      placeholder="Enter address"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowAddSupplierModal(false);
                      setNewSupplier({
                        name: "",
                        email: "",
                        phone: "",
                        address: "",
                      });
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
                    onClick={handleAddNewSupplier}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer"
                  >
                    Add Supplier
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alert Modal - Same as before */}
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

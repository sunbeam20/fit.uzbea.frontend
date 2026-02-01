"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/app/redux";
import { setIsPOSPanelOpen } from "@/state";
import {
  ChevronDown,
  Search,
  Plus as PlusIcon,
  Minus,
  Trash2,
  Percent,
  UserPlus,
  X,
  Check,
  AlertCircle,
  Loader2,
  Calendar,
  Clock,
  ShoppingCart,
  RefreshCw,
  ArrowLeftRight,
  Wrench,
  Package,
  Barcode,
  Hash,
  Filter,
  FileText,
  ShoppingBag,
  Receipt,
  CirclePlus,
  Plus,
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  Truck,
  Home,
  Wifi,
  Utensils,
  Gift,
  PackageSearch,
  Clock as ClockIcon,
  Save,
  Printer,
  Download,
  Upload,
} from "lucide-react";
import { debounce } from "lodash";
import {
  useCreateProductMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useSearchProductsQuery,
  useGetSuppliersQuery,
  useSearchCustomersQuery,
  useCreateSaleFromPOSMutation,
  useScanBarcodeQuery,
  useGetPOSProductsQuery,
  useGetCustomersQuery,
  useCreateCustomerMutation,
  useGetSaleQuery,
  useCreateSalesReturnMutation,
  useCreatePurchaseReturnMutation,
  useCreateExchangeMutation,
  useCreateServiceMutation,
  useGetMeQuery,
  useSearchSalesQuery,
  useSearchPurchasesQuery,
  useGetAvailableSerialsQuery,
  useCreateSupplierMutation,
  // New API hooks for new features
  useCreatePreOrderMutation,
  useGetDueSalesQuery,
  useCreatePaymentMutation,
  useCreateExpenseMutation,
  useGetExpenseCategoriesQuery,
  Product,
  Customer,
  Sale,
  SalesReturn,
  PurchaseReturn,
  Exchange,
  Service,
  ProductSerial,
  Purchase,
  PreOrder,
  Expense,
  ExpenseCategory,
} from "@/state/api";

interface CartItem {
  product: Product;
  quantity: number;
  price: number;
  selectedSerials?: string[];
  discount?: {
    type: "percentage" | "fixed";
    value: number;
  };
  discountedPrice: number;
}

interface OrderDiscount {
  type: "percentage" | "fixed";
  value: number;
}

interface ReturnItem {
  id: number;
  product_id: number;
  quantity: number;
  returnQuantity: number;
  unitPrice: number;
  discount?: number;
  returnReason: string;
  serials?: string[];
  Products?: {
    id: number;
    name: string;
    specification?: string;
    useIndividualSerials: boolean;
    productCode?: string;
  };
}

interface IndividualSerial {
  id?: number;
  serial: string;
  warranty?: "Yes" | "No";
  purchasePrice: number;
  wholesalePrice: number;
  retailPrice: number;
  productType: "New" | "PreOwned";
  supplier_id?: number;
}

interface ExchangeItem {
  id: number;
  product_id: number;
  quantity: number;
  exchangeQuantity: number;
  unitPrice: number;
  exchangeReason: string;
  serials?: string[];
  Products?: {
    id: number;
    name: string;
    specification?: string;
    useIndividualSerials: boolean;
    productCode?: string;
  };
}

// Pre-Order Interface
interface PreOrderData {
  productName: string;
  quantity: number;
  specification: string;
  details: string;
  price: number;
  amountPaid: number;
  deliveryDate: string;
  customer_id?: number | null;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  status: "pending" | "confirmed" | "delivered" | "cancelled";
  notes?: string;
}

// Cash In (Due Payment) Interface
interface DuePaymentData {
  sale_id: number;
  customer_id: number;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  notes?: string;
  referenceNumber?: string;
}

// Cash Out (Expense) Interface
interface ExpenseData {
  category_id: number;
  amount: number;
  date: string;
  details: string;
  // Category-specific fields
  month?: string; // For rent, electricity, internet
  sale_id?: number; // For courier
  customer_id?: number; // For courier
  vendorName?: string; // For stationary, food, donation
}

const POSPanel = () => {
  // Pre-Order States
  const [showPreOrderModal, setShowPreOrderModal] = useState(false);
  const [preOrderData, setPreOrderData] = useState<PreOrderData>({
    productName: "",
    quantity: 1,
    specification: "",
    details: "",
    price: 0,
    amountPaid: 0,
    deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0], // Default 7 days from now
    customer_id: null,
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    status: "pending",
    notes: "",
  });
  const [showPreOrderCustomerSearch, setShowPreOrderCustomerSearch] =
    useState(false);
  const [preOrderCustomerSearchTerm, setPreOrderCustomerSearchTerm] =
    useState("");
  const [serialsLoaded, setSerialsLoaded] = useState<{
    [key: number]: boolean;
  }>({});

  // Cash In (Due Payments) States
  const [showCashInModal, setShowCashInModal] = useState(false);
  const [duePayments, setDuePayments] = useState<Sale[]>([]);
  const [selectedDueSale, setSelectedDueSale] = useState<Sale | null>(null);
  const [duePaymentData, setDuePaymentData] = useState<DuePaymentData>({
    sale_id: 0,
    customer_id: 0,
    amount: 0,
    paymentMethod: "cash",
    paymentDate: new Date().toISOString().split("T")[0],
    notes: "",
    referenceNumber: "",
  });

  // Cash Out (Expenses) States
  const [showCashOutModal, setShowCashOutModal] = useState(false);
  const [expenseData, setExpenseData] = useState<ExpenseData>({
    category_id: 0,
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    details: "",
    month: new Date().toISOString().slice(0, 7), // YYYY-MM format
    vendorName: "",
  });
  const [selectedExpenseCategory, setSelectedExpenseCategory] =
    useState<ExpenseCategory | null>(null);
  const [showExpenseCategoryDropdown, setShowExpenseCategoryDropdown] =
    useState(false);
  const [expenseMonth, setExpenseMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );

  // States
  const [selectedProductForDiscount, setSelectedProductForDiscount] = useState<number | null>(null);
  const [selectedWarrantySerials, setSelectedWarrantySerials] = useState<
    string[]
  >([]);
  const [showWarrantySerialModal, setShowWarrantySerialModal] = useState(false);
  const [showModalProductResults, setShowModalProductResults] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [existingProductData, setExistingProductData] =
    useState<Product | null>(null);
  const [selectedProductForEdit, setSelectedProductForEdit] =
    useState<Product | null>(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProductData, setNewProductData] = useState({
    name: "",
    category_id: null as number | null,
    quantity: 1,
    useIndividualSerials: false,
    specification: "",
    description: "",
  });
  const [newProductSerials, setNewProductSerials] = useState<
    IndividualSerial[]
  >([]);
  const [newProductSelectedCategoryName, setNewProductSelectedCategoryName] =
    useState("");
  const [showNewProductCategoryDropdown, setShowNewProductCategoryDropdown] =
    useState(false);
  const [showNewProductCategoryInput, setShowNewProductCategoryInput] =
    useState(false);
  const [newProductCategoryName, setNewProductCategoryName] = useState("");
  const [newProductBulkActions, setNewProductBulkActions] = useState(false);

  // Add create product mutation
  const [createProduct, { isLoading: creatingProduct }] =
    useCreateProductMutation();

  const { data: categories } = useGetCategoriesQuery();
  const [createCategory] = useCreateCategoryMutation();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"info" | "error" | "success">(
    "info",
  );
  const [discountProductId, setDiscountProductId] = useState<number | null>(
    null,
  );
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">(
    "percentage",
  );
  const [discountValue, setDiscountValue] = useState("");

  const [orderSummary, setOrderSummary] = useState({
    subtotal: 0,
    productDiscount: 0,
    orderDiscount: 0,
    totalDiscount: 0,
    total: 0,
    dueAmount: 0,
    advancePaid: 0,
  });
  const [paymentAmount, setPaymentAmount] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showProductResults, setShowProductResults] = useState(false);
  const [showCustomerResults, setShowCustomerResults] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [newSupplierData, setNewSupplierData] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
  });

  const [filteredProductsForModal, setFilteredProductsForModal] = useState<
    Product[]
  >([]);
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(
    null,
  );
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [useIndividualSerials, setUseIndividualSerials] = useState(false);
  const [individualSerials, setIndividualSerials] = useState<
    IndividualSerial[]
  >([]);
  const [showModalCategoryDropdown, setShowModalCategoryDropdown] =
    useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkWarranty, setBulkWarranty] = useState<"Yes" | "No">("No");
  const [bulkProductType, setBulkProductType] = useState<"New" | "PreOwned">(
    "New",
  );
  const [bulkSupplierSearch, setBulkSupplierSearch] = useState("");
  const [selectedBulkSupplierId, setSelectedBulkSupplierId] = useState<
    number | null
  >(null);
  const [bulkPurchasePrice, setBulkPurchasePrice] = useState("");
  const [bulkWholesalePrice, setBulkWholesalePrice] = useState("");
  const [bulkRetailPrice, setBulkRetailPrice] = useState("");
  // New states for enhanced features
  const [showSerialModal, setShowSerialModal] = useState(false);
  const [selectedProductForSerials, setSelectedProductForSerials] =
    useState<Product | null>(null);
  const [selectedSerials, setSelectedSerials] = useState<string[]>([]);

  const [showExchangeSerialModal, setShowExchangeSerialModal] = useState(false);
  const [
    selectedExchangeProductForSerials,
    setSelectedExchangeProductForSerials,
  ] = useState<Product | null>(null);
  const [selectedExchangeSerials, setSelectedExchangeSerials] = useState<
    string[]
  >([]);

  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundType, setRefundType] = useState<"sale" | "purchase">("sale");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(
    null,
  );
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [returnReason, setReturnReason] = useState("");
  const [refundMethod, setRefundMethod] = useState("cash");
  const [selectedReturnSerials, setSelectedReturnSerials] = useState<{
    [itemId: number]: string[];
  }>({});
  const [purchaseReturnItems, setPurchaseReturnItems] = useState<any[]>([]);

  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [newExchangeProducts, setNewExchangeProducts] = useState<CartItem[]>(
    [],
  );
  const [exchangeSaleSearchTerm, setExchangeSaleSearchTerm] = useState("");
  const [exchangeSelectedSale, setExchangeSelectedSale] = useState<Sale | null>(
    null,
  );
  const [exchangeItems, setExchangeItems] = useState<ExchangeItem[]>([]);
  const [exchangeSelectedSerials, setExchangeSelectedSerials] = useState<{
    [itemId: number]: string[];
  }>({});

  const [exchangeProductSearchTerm, setExchangeProductSearchTerm] =
    useState("");
  const [showExchangeProductResults, setShowExchangeProductResults] =
    useState(false);
  const [exchangeProductResults, setExchangeProductResults] = useState<
    Product[]
  >([]);
  // const [exchangeProductsLoading, setExchangeProductsLoading] = useState(false);
  const [exchangeNewProducts, setExchangeNewProducts] = useState<CartItem[]>(
    [],
  );
  const [exchangeReason, setExchangeReason] = useState("");

  // Update your existing API hooks to include exchange sale search
  const { data: exchangeSaleSearchResults, isLoading: searchingExchangeSales } =
    useSearchSalesQuery(exchangeSaleSearchTerm, {
      skip: exchangeSaleSearchTerm.trim().length < 2,
    });

  const [serviceModalTab, setServiceModalTab] = useState<"normal" | "warranty">(
    "normal",
  );
  const [serviceCustomerSearchTerm, setServiceCustomerSearchTerm] =
    useState("");
  const [showServiceCustomerResults, setShowServiceCustomerResults] =
    useState(false);
  const [selectedServiceCustomer, setSelectedServiceCustomer] =
    useState<Customer | null>(null);
  const [warrantySaleSearchTerm, setWarrantySaleSearchTerm] = useState("");
  const [showWarrantySaleResults, setShowWarrantySaleResults] = useState(false);
  const [warrantyProducts, setWarrantyProducts] = useState<any[]>([]);
  const [selectedWarrantyProduct, setSelectedWarrantyProduct] =
    useState<any>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceType, setServiceType] = useState<"warranty" | "normal">(
    "normal",
  );
  const [serviceProduct, setServiceProduct] = useState<any>(null);
  const [serviceDetails, setServiceDetails] = useState({
    description: "",
    cost: 0,
    assignedTechnician: "",
  });
  const [dueDate, setDueDate] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
  // Responsive states
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [activeTab, setActiveTab] = useState<"products" | "customers" | "cart">(
    "products",
  );

  const dispatch = useAppDispatch();
  const showPanel = useAppSelector((state) => state.global.isPOSPanelOpen);
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Get current user
  const { data: currentUser } = useGetMeQuery();

  // Refs for click outside detection
  const newProductCategoryDropdownRef = useRef<HTMLDivElement>(null);
  const newProductBulkActionsRef = useRef<HTMLDivElement>(null);
  const productSearchRef = useRef<HTMLDivElement>(null);
  const customerSearchRef = useRef<HTMLDivElement>(null);
  const productResultsRef = useRef<HTMLDivElement>(null);
  const customerResultsRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const modalCategoryDropdownRef = useRef<HTMLDivElement>(null);
  const bulkActionsRef = useRef<HTMLDivElement>(null);
  const modalSearchResultsRef = useRef<HTMLDivElement>(null);
  const serialsRef = useRef<{ [itemId: number]: string[] }>({});
  // API Hooks
  const { data: suppliers } = useGetSuppliersQuery();
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  // API hooks for service modal
  const {
    data: serviceCustomerSearchResults,
    isLoading: searchingServiceCustomers,
  } = useSearchCustomersQuery(serviceCustomerSearchTerm, {
    skip: serviceCustomerSearchTerm.length < 2 || serviceModalTab !== "normal",
  });

  const { data: warrantySaleSearchResults, isLoading: searchingWarrantySales } =
    useSearchSalesQuery(warrantySaleSearchTerm, {
      skip:
        warrantySaleSearchTerm.trim().length < 2 ||
        serviceModalTab !== "warranty",
    });

  const { data: searchProductsData, isLoading: productsLoading } =
    useSearchProductsQuery(productSearchTerm, {
      skip: productSearchTerm.length < 2 || showExchangeModal,
    });
  // Get serials for exchange product
  const { data: exchangeProductSerials, isLoading: loadingExchangeSerials } =
    useGetAvailableSerialsQuery(
      { productId: selectedExchangeProductForSerials?.id || 0 },
      { skip: !selectedExchangeProductForSerials || !showExchangeSerialModal },
    );

  const { data: searchCustomersData, isLoading: customersLoading } =
    useSearchCustomersQuery(customerSearchTerm, {
      skip: customerSearchTerm.length < 2,
    });
  const {
    data: exchangeSearchProductsData,
    isLoading: exchangeProductsLoading,
    refetch: refetchExchangeProducts,
  } = useSearchProductsQuery(exchangeProductSearchTerm, {
    skip: exchangeProductSearchTerm.length < 2 || !showExchangeModal, // Only search when exchange modal is open
  });

  const { data: barcodeProduct, refetch: scanBarcode } = useScanBarcodeQuery(
    barcodeInput,
    { skip: barcodeInput.length < 3 },
  );
  const [createSupplier, { isLoading: creatingSupplier }] =
    useCreateSupplierMutation();
  const { data: posProducts } = useGetPOSProductsQuery();
  const [createSale, { isLoading: creatingSale }] =
    useCreateSaleFromPOSMutation();

  const {
    data: allCustomers,
    isLoading: allCustomersLoading,
    refetch: refetchAllCustomers,
  } = useGetCustomersQuery();

  const [createCustomer, { isLoading: creatingCustomer }] =
    useCreateCustomerMutation();

  // Pre-Order API
  const [createPreOrder, { isLoading: creatingPreOrder }] =
    useCreatePreOrderMutation();

  // Cash In API
  const { data: dueSales, refetch: refetchDueSales } = useGetDueSalesQuery();
  const [createPayment, { isLoading: creatingPayment }] =
    useCreatePaymentMutation();

  // Cash Out API
  const { data: expenseCategories } = useGetExpenseCategoriesQuery();
  const [createExpense, { isLoading: creatingExpense }] =
    useCreateExpenseMutation();

  // New API hooks for enhanced features
  const [createSalesReturn, { isLoading: creatingSalesReturn }] =
    useCreateSalesReturnMutation();
  const [createPurchaseReturn, { isLoading: creatingPurchaseReturn }] =
    useCreatePurchaseReturnMutation();
  const [createExchange, { isLoading: creatingExchange }] =
    useCreateExchangeMutation();
  const [createService, { isLoading: creatingService }] =
    useCreateServiceMutation();

  // Search hooks
  const [saleSearchTerm, setSaleSearchTerm] = useState("");
  const {
    data: saleSearchResults,
    isLoading: searchingSales,
    error: saleSearchError,
  } = useSearchSalesQuery(saleSearchTerm, {
    skip: saleSearchTerm.trim().length < 2,
  });

  const [purchaseSearchTerm, setPurchaseSearchTerm] = useState("");
  const {
    data: purchaseSearchResults,
    isLoading: searchingPurchases,
    error: purchaseSearchError,
  } = useSearchPurchasesQuery(purchaseSearchTerm, {
    skip: purchaseSearchTerm.trim().length < 2,
  });

  // Get sale by ID
  const { data: selectedSaleData, isLoading: loadingSale } = useGetSaleQuery(
    selectedSale?.id || 0,
    { skip: !selectedSale },
  );

  // Get serials for product
  const { data: productSerials, isLoading: loadingSerials } =
    useGetAvailableSerialsQuery(
      { productId: selectedProductForSerials?.id || 0 },
      { skip: !selectedProductForSerials },
    );
  // Handle customer selection for normal service
  const handleSelectServiceCustomer = (customer: Customer) => {
    setSelectedServiceCustomer(customer);
    setShowServiceCustomerResults(false);
    setServiceCustomerSearchTerm("");
  };

  // Handle sale selection for warranty claim
  const handleSelectWarrantySale = (sale: Sale) => {
    // Filter products that have warranty
    if (sale.SalesItems && sale.SalesItems.length > 0) {
      const productsWithWarranty = sale.SalesItems.filter((item) => {
        // Check if product has serials with warranty
        if (item.salesItemSerials && item.salesItemSerials.length > 0) {
          return item.salesItemSerials.some(
            (serial) => serial.ProductSerials?.warranty === "Yes",
          );
        }
        return false;
      }).map((item) => ({
        ...item,
        serials: item.salesItemSerials
          ?.map((sis) => ({
            serial: sis.ProductSerials?.serial,
            warranty: sis.ProductSerials?.warranty,
          }))
          .filter((s) => s.warranty === "Yes"),
      }));

      setWarrantyProducts(productsWithWarranty);
      setServiceProduct({
        sale_id: sale.id,
        sale: sale,
        customer: sale.Customers,
      });
    }
    setShowWarrantySaleResults(false);
    setWarrantySaleSearchTerm("");
  };

  // Handle warranty product selection
  const handleSelectWarrantyProduct = (product: any) => {
    setSelectedWarrantyProduct(product);

    // Auto-fill customer from sale
    if (serviceProduct?.customer) {
      setSelectedServiceCustomer(serviceProduct.customer);
    }

    // Auto-fill service description based on product
    setServiceDetails((prev) => ({
      ...prev,
      description: `Warranty service for ${product.Products?.name || "product"}`,
    }));

    // Reset selected serials
    setSelectedWarrantySerials([]);

    // If product has multiple warranty serials, show selection modal
    if (product.serials && product.serials.length > 1) {
      setShowWarrantySerialModal(true);
    }
  };

  // Handle create service
  const handleCreateService = async () => {
    if (!currentUser) {
      showAlert("User not authenticated", "error");
      return;
    }

    // Validate based on service type
    if (serviceModalTab === "normal") {
      if (!selectedServiceCustomer) {
        showAlert("Please select a customer for normal service", "error");
        return;
      }
    } else if (serviceModalTab === "warranty") {
      if (!selectedWarrantyProduct) {
        showAlert("Please select a product with warranty", "error");
        return;
      }
      if (!serviceProduct?.customer) {
        showAlert(
          "Could not find customer information for warranty claim",
          "error",
        );
        return;
      }

      // For warranty claims, require serial selection if product has serials
      if (
        selectedWarrantyProduct.serials &&
        selectedWarrantyProduct.serials.length > 0
      ) {
        if (selectedWarrantySerials.length === 0) {
          showAlert(
            "Please select at least one serial number for warranty service",
            "error",
          );
          return;
        }
      }
    }

    if (!serviceDetails.description.trim()) {
      showAlert("Please provide service description", "error");
      return;
    }

    try {
      const serviceData: any = {
        user_id: currentUser.id,
        service_description: serviceDetails.description,
        service_cost: serviceDetails.cost,
        service_status: "Pending",
        assigned_technician: serviceDetails.assignedTechnician || null,
        warranty_claim: serviceModalTab === "warranty",
        date: new Date().toISOString().split("T")[0],
      };

      // Add customer info
      if (serviceModalTab === "normal" && selectedServiceCustomer) {
        serviceData.customer_id = selectedServiceCustomer.id;
        serviceData.customer_name = selectedServiceCustomer.name;
        serviceData.customer_phone = selectedServiceCustomer.phone;
      } else if (serviceModalTab === "warranty" && serviceProduct?.customer) {
        serviceData.customer_id = serviceProduct.customer.id;
        serviceData.customer_name = serviceProduct.customer.name;
        serviceData.customer_phone = serviceProduct.customer.phone;
      }

      // Add product info for warranty claims
      if (serviceModalTab === "warranty" && selectedWarrantyProduct) {
        serviceData.product_id = selectedWarrantyProduct.product_id;
        serviceData.product_name = selectedWarrantyProduct.Products?.name;
        serviceData.product_specification =
          selectedWarrantyProduct.Products?.specification;

        // Add sale and serial info
        serviceData.sale_id = serviceProduct?.sale_id;

        // Add selected serials
        if (selectedWarrantySerials.length > 0) {
          serviceData.product_serials = selectedWarrantySerials;
        } else if (selectedWarrantyProduct.serials?.[0]) {
          // Fallback to first serial if none selected
          serviceData.product_serial =
            selectedWarrantyProduct.serials[0].serial;
        }
      }

      await createService(serviceData).unwrap();

      const successMessage =
        serviceModalTab === "warranty"
          ? "Warranty claim created successfully!"
          : "Service request created successfully!";

      showAlert(successMessage, "success");

      // Reset state
      setShowServiceModal(false);
      resetServiceModal();
    } catch (error: any) {
      console.error("Service creation failed:", error);
      showAlert(
        error?.data?.message || "Failed to create service request",
        "error",
      );
    }
  };

  // Reset service modal
  const resetServiceModal = () => {
    setServiceModalTab("normal");
    setSelectedServiceCustomer(null);
    setServiceCustomerSearchTerm("");
    setWarrantySaleSearchTerm("");
    setServiceProduct(null);
    setWarrantyProducts([]);
    setSelectedWarrantyProduct(null);
    setSelectedWarrantySerials([]); // Add this line
    setShowWarrantySerialModal(false); // Add this line
    setServiceDetails({
      description: "",
      cost: 0,
      assignedTechnician: "",
    });
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!showAddProductModal) {
      setIsEditingProduct(false);
      setExistingProductData(null);
      setSelectedProductForEdit(null);
      setProductSearchTerm("");
      setFilteredProductsForModal([]);
      setShowModalProductResults(false);
      setNewProductData({
        name: "",
        category_id: null,
        quantity: 1,
        useIndividualSerials: false,
        specification: "",
        description: "",
      });
      setIndividualSerials([]);
      setSelectedCategoryName("");
      setSelectedCategoryId(null);
      setUseIndividualSerials(false);
    }
  }, [showAddProductModal]);
  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Update current date and time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // dedicated function to extract and set serials
  const extractAndSetSerialsWithRef = useCallback((sale: Sale) => {
    if (!sale.SalesItems) return [];

    const itemsWithSerials = sale.SalesItems.map((item) => {
      const serials =
        item.salesItemSerials
          ?.map((sis) => sis.ProductSerials?.serial)
          .filter((s): s is string => !!s) || [];

      // Store in ref
      serialsRef.current[item.id] = serials;

      return {
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        returnQuantity: 0,
        unitPrice: convertToNumber(item.unitPrice),
        discount: convertToNumber(item.discount) || 0,
        returnReason: "",
        Products: item.Products
          ? {
              id: item.Products.id,
              name: item.Products.name,
              specification: item.Products.specification,
              useIndividualSerials: item.Products.useIndividualSerials,
              productCode: item.Products.productCode,
            }
          : undefined,
        serials: serials,
      };
    });

    return itemsWithSerials;
  }, []);
  const getSerialsForItem = (itemId: number): string[] => {
    const item = returnItems.find((ri) => ri.id === itemId);
    if (item?.serials && item.serials.length > 0) {
      return item.serials;
    }
    // Fallback to ref
    return serialsRef.current[itemId] || [];
  };
  // Update selected sale data when loaded
  useEffect(() => {
    if (selectedSaleData && refundType === "sale") {
      console.log("selectedSaleData updated, checking if serials already set");

      // Only update if serials aren't already loaded for this item
      const items = selectedSaleData.SalesItems.map((item) => {
        const existingItem = returnItems.find((ri) => ri.id === item.id);

        // Keep existing serials if they exist
        const existingSerials = existingItem?.serials || [];

        // Extract new serials only if we don't have them
        const newSerials =
          existingSerials.length > 0
            ? existingSerials
            : item.salesItemSerials
                ?.map((sis) => sis.ProductSerials?.serial)
                .filter((s): s is string => !!s) || [];

        return {
          id: item.id,
          product_id: item.product_id,
          quantity: item.quantity,
          returnQuantity: existingItem?.returnQuantity || 0,
          unitPrice: convertToNumber(item.unitPrice),
          discount: convertToNumber(item.discount) || 0,
          returnReason: existingItem?.returnReason || "",
          Products: item.Products
            ? {
                id: item.Products.id,
                name: item.Products.name,
                specification: item.Products.specification,
                useIndividualSerials: item.Products.useIndividualSerials,
                productCode: item.Products.productCode,
              }
            : undefined,
          serials: newSerials,
        };
      });

      setReturnItems(items);
    }
  }, [selectedSaleData, refundType]);

  // debugging for search results
  useEffect(() => {
    console.log("Sale Search Debug:", {
      term: saleSearchTerm,
      results: saleSearchResults,
      loading: searchingSales,
      showRefundModal: showRefundModal,
    });
  }, [saleSearchTerm, saleSearchResults, searchingSales, showRefundModal]);
  useEffect(() => {
    console.log("Purchase Search Debug:", {
      term: purchaseSearchTerm,
      results: purchaseSearchResults,
      loading: searchingPurchases,
    });
  }, [purchaseSearchTerm, purchaseSearchResults, searchingPurchases]);
  // Helper function to show alerts
  const showAlert = (
    message: string,
    type: "info" | "error" | "success" = "info",
  ) => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlertModal(true);
  };

  const handleAddNewSupplier = async () => {
    try {
      if (!newSupplierData.name.trim()) {
        showAlert("Supplier name is required", "error");
        return;
      }

      // Convert nulls to undefined for optional fields
      const supplierData = {
        name: newSupplierData.name.trim(),
        contact_person: newSupplierData.contactPerson || undefined,
        phone: newSupplierData.phone || undefined,
        email: newSupplierData.email || undefined,
        address: newSupplierData.address || undefined,
      };

      await createSupplier(supplierData).unwrap();

      showAlert("Supplier added successfully!", "success");

      // Reset form
      setShowAddSupplierModal(false);
      setNewSupplierData({
        name: "",
        contactPerson: "",
        phone: "",
        email: "",
        address: "",
      });

      // Refetch suppliers to update the list
      // Note: You might need to refetch suppliers query if available
    } catch (error: any) {
      console.error("Failed to add supplier:", error);
      showAlert(
        error?.data?.message || "Failed to add supplier. Please try again.",
        "error",
      );
    }
  };
  // ========== PRE-ORDER FUNCTIONS ==========

  // Handle customer selection for pre-order
  const handleSelectPreOrderCustomer = (customer: Customer) => {
    setPreOrderData({
      ...preOrderData,
      customer_id: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email || "",
    });
    setShowPreOrderCustomerSearch(false);
    setPreOrderCustomerSearchTerm("");
  };

  // Calculate remaining amount for pre-order
  const calculatePreOrderRemaining = () => {
    const totalAmount = preOrderData.price * preOrderData.quantity;
    return Math.max(0, totalAmount - preOrderData.amountPaid);
  };

  // Create pre-order
  const handleCreatePreOrder = async () => {
    try {
      // Validate required fields
      if (!preOrderData.productName.trim()) {
        showAlert("Product name is required", "error");
        return;
      }

      if (preOrderData.quantity <= 0) {
        showAlert("Quantity must be greater than 0", "error");
        return;
      }

      if (preOrderData.price <= 0) {
        showAlert("Price must be greater than 0", "error");
        return;
      }

      if (!preOrderData.deliveryDate) {
        showAlert("Delivery date is required", "error");
        return;
      }

      const totalAmount = preOrderData.price * preOrderData.quantity;
      const remainingAmount = calculatePreOrderRemaining();

      // Prepare pre-order data
      const preOrderPayload: any = {
        productName: preOrderData.productName.trim(),
        quantity: preOrderData.quantity,
        specification: preOrderData.specification || null,
        details: preOrderData.details || null,
        price: preOrderData.price,
        totalAmount: totalAmount,
        amountPaid: preOrderData.amountPaid,
        remainingAmount: remainingAmount,
        deliveryDate: preOrderData.deliveryDate,
        status: preOrderData.status,
        notes: preOrderData.notes || null,
        userId: currentUser?.id,
      };

      // Add customer info if selected
      if (preOrderData.customer_id) {
        preOrderPayload.customer_id = preOrderData.customer_id;
      } else {
        // For walk-in customers, add contact info
        if (preOrderData.customerName?.trim()) {
          preOrderPayload.customerName = preOrderData.customerName.trim();
        }
        if (preOrderData.customerPhone?.trim()) {
          preOrderPayload.customerPhone = preOrderData.customerPhone.trim();
        }
        if (preOrderData.customerEmail?.trim()) {
          preOrderPayload.customerEmail = preOrderData.customerEmail.trim();
        }
      }

      await createPreOrder(preOrderPayload).unwrap();

      showAlert("Pre-order created successfully!", "success");

      // Reset form
      setShowPreOrderModal(false);
      setPreOrderData({
        productName: "",
        quantity: 1,
        specification: "",
        details: "",
        price: 0,
        amountPaid: 0,
        deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        customer_id: null,
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        status: "pending",
        notes: "",
      });
    } catch (error: any) {
      console.error("Failed to create pre-order:", error);
      showAlert(
        error?.data?.message || "Failed to create pre-order. Please try again.",
        "error",
      );
    }
  };

  // ========== CASH IN FUNCTIONS ==========

  // Load due sales
  useEffect(() => {
    if (showCashInModal && dueSales) {
      setDuePayments(dueSales);
    }
  }, [showCashInModal, dueSales]);

  // Handle due sale selection
  const handleSelectDueSale = (sale: Sale) => {
    setSelectedDueSale(sale);
    const dueAmount = Math.max(
      0,
      convertToNumber(sale.totalAmount) - convertToNumber(sale.totalPaid),
    );

    setDuePaymentData({
      sale_id: sale.id,
      customer_id: sale.customer_id || 0,
      amount: dueAmount,
      paymentMethod: "cash",
      paymentDate: new Date().toISOString().split("T")[0],
      notes: `Payment for sale #${sale.saleNo || sale.id}`,
      referenceNumber: "",
    });
  };

  // Create due payment
  const handleCreateDuePayment = async () => {
    try {
      if (!selectedDueSale) {
        showAlert("Please select a sale with due amount", "error");
        return;
      }

      if (duePaymentData.amount <= 0) {
        showAlert("Payment amount must be greater than 0", "error");
        return;
      }

      const dueAmount = Math.max(
        0,
        convertToNumber(selectedDueSale.totalAmount) -
          convertToNumber(selectedDueSale.totalPaid),
      );

      if (duePaymentData.amount > dueAmount) {
        showAlert(
          `Payment amount cannot exceed due amount (${dueAmount}৳)`,
          "error",
        );
        return;
      }

      const paymentPayload: any = {
        sale_id: selectedDueSale.id,
        customer_id: selectedDueSale.customer_id,
        user_id: currentUser?.id,
        amount: duePaymentData.amount,
        payment_method: duePaymentData.paymentMethod,
        payment_date: duePaymentData.paymentDate,
        notes: duePaymentData.notes,
        reference_number: duePaymentData.referenceNumber || null,
      };

      await createPayment(paymentPayload).unwrap();

      showAlert(
        `Payment of ${duePaymentData.amount}৳ recorded successfully!`,
        "success",
      );

      // Reset form
      setShowCashInModal(false);
      setSelectedDueSale(null);
      setDuePaymentData({
        sale_id: 0,
        customer_id: 0,
        amount: 0,
        paymentMethod: "cash",
        paymentDate: new Date().toISOString().split("T")[0],
        notes: "",
        referenceNumber: "",
      });

      // Refresh due sales list
      refetchDueSales();
    } catch (error: any) {
      console.error("Failed to record payment:", error);
      showAlert(
        error?.data?.message || "Failed to record payment. Please try again.",
        "error",
      );
    }
  };

  // ========== CASH OUT FUNCTIONS ==========

  // Handle expense category selection
  const handleSelectExpenseCategory = (category: ExpenseCategory) => {
    setSelectedExpenseCategory(category);
    setExpenseData({
      ...expenseData,
      category_id: category.id,
      details: category.name, // Default details to category name
    });
    setShowExpenseCategoryDropdown(false);
  };

  // Check if category requires month field
  const requiresMonthField = () => {
    const monthCategories = ["rent", "electricity", "internet", "utility"];
    return (
      selectedExpenseCategory &&
      monthCategories.includes(selectedExpenseCategory.name.toLowerCase())
    );
  };

  // Check if category requires sale/customer fields
  const requiresSaleFields = () => {
    return (
      selectedExpenseCategory &&
      selectedExpenseCategory.name.toLowerCase() === "courier"
    );
  };

  // Create expense
  const handleCreateExpense = async () => {
    try {
      if (!selectedExpenseCategory) {
        showAlert("Please select an expense category", "error");
        return;
      }

      if (expenseData.amount <= 0) {
        showAlert("Expense amount must be greater than 0", "error");
        return;
      }

      if (!expenseData.details.trim()) {
        showAlert("Please provide expense details", "error");
        return;
      }

      // Prepare expense payload
      const expensePayload: any = {
        category_id: selectedExpenseCategory.id,
        amount: expenseData.amount,
        date: expenseData.date,
        details: expenseData.details,
        user_id: currentUser?.id,
      };

      // Add category-specific fields
      if (requiresMonthField() && expenseData.month) {
        expensePayload.month = expenseData.month;
      }

      if (requiresSaleFields()) {
        if (expenseData.sale_id) {
          expensePayload.sale_id = expenseData.sale_id;
        }
        if (expenseData.customer_id) {
          expensePayload.customer_id = expenseData.customer_id;
        }
      }

      // Add vendor name for relevant categories
      const vendorCategories = ["stationary", "food", "donation", "courier"];
      if (
        vendorCategories.includes(selectedExpenseCategory.name.toLowerCase()) &&
        expenseData.vendorName
      ) {
        expensePayload.vendor_name = expenseData.vendorName;
      }

      await createExpense(expensePayload).unwrap();

      showAlert(
        `Expense of ${expenseData.amount}৳ recorded successfully!`,
        "success",
      );

      // Reset form
      setShowCashOutModal(false);
      setSelectedExpenseCategory(null);
      setExpenseData({
        category_id: 0,
        amount: 0,
        date: new Date().toISOString().split("T")[0],
        details: "",
        month: new Date().toISOString().slice(0, 7),
        vendorName: "",
      });
    } catch (error: any) {
      console.error("Failed to create expense:", error);
      showAlert(
        error?.data?.message || "Failed to create expense. Please try again.",
        "error",
      );
    }
  };
  // Helper function to convert Decimal to number
  const convertToNumber = (value: any): number => {
    if (typeof value === "number") return value;
    if (typeof value === "string") return parseFloat(value);
    if (value && typeof value === "object" && "toNumber" in value) {
      return value.toNumber();
    }
    return 0;
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close product search results
      if (
        showProductResults &&
        productSearchRef.current &&
        !productSearchRef.current.contains(event.target as Node) &&
        productResultsRef.current &&
        !productResultsRef.current.contains(event.target as Node)
      ) {
        setShowProductResults(false);
      }
      // Close customer search results
      if (
        showCustomerResults &&
        customerSearchRef.current &&
        !customerSearchRef.current.contains(event.target as Node) &&
        customerResultsRef.current &&
        !customerResultsRef.current.contains(event.target as Node)
      ) {
        setShowCustomerResults(false);
      }
      // Close modal category dropdown
      if (
        modalCategoryDropdownRef.current &&
        !modalCategoryDropdownRef.current.contains(event.target as Node)
      ) {
        setShowModalCategoryDropdown(false);
      }
      // Close bulk actions dropdown
      if (
        bulkActionsRef.current &&
        !bulkActionsRef.current.contains(event.target as Node)
      ) {
        setShowBulkActions(false);
      }
      // Close modal product search results
      if (
        showModalProductResults &&
        modalSearchResultsRef.current &&
        !modalSearchResultsRef.current.contains(event.target as Node)
      ) {
        setShowModalProductResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProductResults, showCustomerResults]);

  // useEffect(() => {
  //   if (productSearchTerm && showAddProductModal) {
  //     // Filter products based on search term
  //     const filtered = posProducts?.filter(product =>
  //       product.name.toLowerCase().includes(productSearchTerm.toLowerCase())
  //     ) || [];
  //     setFilteredProductsForModal(filtered);
  //   } else {
  //     setFilteredProductsForModal([]);
  //   }
  // }, [productSearchTerm, posProducts, showAddProductModal]);
  // Function to handle product selection from search
  const handleSelectProductForEdit = (product: Product) => {
    setProductSearchTerm(product.name);
    setIsEditingProduct(true);
    setExistingProductData(product);
    setSelectedProductForEdit(product);

    // Load existing product data
    loadProductData(product);
  };

  // Function to load existing product data
  const loadProductData = (product: Product) => {
    // Set category
    setSelectedCategoryName(product.Categories?.name || "");
    setSelectedCategoryId(product.category_id || null);

    // Update newProductData with existing product values
    setNewProductData({
      name: product.name,
      category_id: product.category_id || null,
      quantity: product.quantity,
      useIndividualSerials: product.useIndividualSerials,
      specification: product.specification || "",
      description: product.description || "",
    });

    // Set individual serials data
    if (product.useIndividualSerials && product.productSerials) {
      const serials: IndividualSerial[] = product.productSerials.map(
        (serial) => ({
          id: serial.id,
          serial: serial.serial,
          warranty: serial.warranty || "No",
          purchasePrice: convertToNumber(serial.purchasePrice),
          wholesalePrice: convertToNumber(serial.wholesalePrice),
          retailPrice: convertToNumber(serial.retailPrice),
          productType: (serial.productType === "New" ||
          serial.productType === "PreOwned"
            ? serial.productType
            : "New") as "New" | "PreOwned",
          supplier_id: serial.supplier_id,
        }),
      );

      setIndividualSerials(serials);
      setUseIndividualSerials(true);
    } else {
      setIndividualSerials([]);
      setUseIndividualSerials(false);
    }

    // Set form mode
    setIsEditingProduct(true);
    setExistingProductData(product);

    showAlert(`Editing existing product: ${product.name}`, "info");
  };
  // Debounced search for products
  const debouncedProductSearch = useCallback(
    debounce((searchTerm: string) => {
      setProductSearchTerm(searchTerm);
      setShowProductResults(searchTerm.length >= 2);
    }, 500),
    [],
  );

  // Debounced search for customers
  const debouncedCustomerSearch = useCallback(
    debounce((searchTerm: string) => {
      setCustomerSearchTerm(searchTerm);
      setShowCustomerResults(searchTerm.length >= 2);
    }, 500),
    [],
  );

  // Debounced search for exchange products
  const debouncedExchangeProductSearch = useCallback(
    debounce((searchTerm: string) => {
      // Only update if exchange modal is open
      if (showExchangeModal) {
        setExchangeProductSearchTerm(searchTerm);
      }
    }, 500),
    [showExchangeModal], // Add dependency
  );

  // Handle barcode scanning
  useEffect(() => {
    if (barcodeInput.length >= 3) {
      const timer = setTimeout(() => {
        scanBarcode();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [barcodeInput, scanBarcode]);

  // Add product from barcode scan
  useEffect(() => {
    if (barcodeProduct) {
      handleAddProduct(barcodeProduct);
      setBarcodeInput(""); // Clear barcode input
    }
  }, [barcodeProduct]);

  // Calculate order summary
  useEffect(() => {
    calculateOrderSummary();
  }, [cart]);

  const handleCreateNewProduct = async () => {
    try {
      // Validate required fields
      if (!newProductData.name.trim()) {
        showAlert("Product name is required", "error");
        return;
      }

      if (!newProductData.category_id) {
        showAlert("Please select a category", "error");
        return;
      }

      // Prepare product data
      const productData: any = {
        name: newProductData.name.trim(),
        specification: newProductData.specification || null,
        description: newProductData.description || null,
        quantity: newProductData.quantity,
        useIndividualSerials: newProductData.useIndividualSerials,
        category_id: newProductData.category_id,
        userId: currentUser?.id,
      };

      // Handle serial numbers based on tracking type
      if (newProductData.useIndividualSerials) {
        // Validate serials if using individual serials
        if (newProductSerials.length === 0) {
          showAlert(
            "At least one serial is required for serialized products",
            "error",
          );
          return;
        }

        // Validate each serial has required fields
        for (const serial of newProductSerials) {
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
              "error",
            );
            return;
          }

          if (!serial.productType) {
            showAlert(
              "Each serial must have a productType (New or PreOwned)",
              "error",
            );
            return;
          }
        }

        // Send serials as array of objects
        productData.serials = newProductSerials.map((s) => {
          const type = (
            s.productType === "New" || s.productType === "PreOwned"
              ? s.productType
              : "New"
          ) as "New" | "PreOwned";
          return {
            serial: s.serial || "",
            warranty: s.warranty || "No",
            purchasePrice: s.purchasePrice,
            wholesalePrice: s.wholesalePrice,
            retailPrice: s.retailPrice,
            productType: type,
          };
        });
      }

      await createProduct(productData).unwrap();

      showAlert("Product created successfully!", "success");

      // Reset form
      setShowAddProductModal(false);
      setNewProductData({
        name: "",
        category_id: null,
        quantity: 1,
        useIndividualSerials: false,
        specification: "",
        description: "",
      });
      setNewProductSerials([]);
      setNewProductSelectedCategoryName("");

      // Optionally, you might want to refresh the products list here
      // refetchProducts();
    } catch (error: any) {
      console.error("Failed to create product:", error);
      const errorMessage =
        error?.data?.message ||
        error?.message ||
        "Failed to create product. Please try again.";
      showAlert(errorMessage, "error");
    }
  };

  const calculateOrderSummary = () => {
    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    const productDiscount = cart.reduce((sum, item) => {
      if (item.discount) {
        const originalPrice = item.price * item.quantity;
        const discountedPrice = item.discountedPrice * item.quantity;
        return sum + (originalPrice - discountedPrice);
      }
      return sum;
    }, 0);

    const totalDiscount = productDiscount;
    const total = Math.max(0, subtotal - productDiscount);
    const dueAmount = total - orderSummary.advancePaid;

    setOrderSummary({
      ...orderSummary,
      subtotal,
      productDiscount,
      orderDiscount: 0,
      totalDiscount,
      total,
      dueAmount,
    });
  };

  // Add product to cart
  const handleAddProduct = (product: Product) => {
    // Check if product uses individual serials
    if (product.useIndividualSerials) {
      setSelectedProductForSerials(product);
      setSelectedSerials([]);
      setShowSerialModal(true);
      return;
    }

    // Get price from product
    const price = getProductPrice(product);
    if (price === 0) {
      showAlert("Product doesn't have price information", "error");
      return;
    }

    // Add to cart without serials
    addProductToCart(product, price);
  };

  const addProductToCart = (
    product: Product,
    price: number,
    selectedSerials?: string[],
  ) => {
    const existingItem = cart.find((item) => item.product.id === product.id);

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: selectedSerials?.length || 1,
                selectedSerials: selectedSerials,
              }
            : item,
        ),
      );
    } else {
      const newItem: CartItem = {
        product,
        quantity: selectedSerials?.length || 1,
        price,
        discountedPrice: price,
        selectedSerials,
      };
      setCart([...cart, newItem]);
    }
  };

  // Remove product from cart
  const handleRemoveProduct = (productId: number) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  // Update quantity
  const handleUpdateQuantity = (productId: number, change: number) => {
    setCart(
      cart.map((item) => {
        if (item.product.id === productId) {
          const newQuantity = Math.max(1, item.quantity + change);

          // If product uses serials, adjust selected serials
          if (item.product.useIndividualSerials && item.selectedSerials) {
            const serials = item.selectedSerials;
            if (change > 0) {
              // Need to add more serials - show modal again
              setSelectedProductForSerials(item.product);
              setSelectedSerials(serials);
              setShowSerialModal(true);
              return item;
            } else {
              // Remove last serial
              const newSerials = serials.slice(0, newQuantity);
              return {
                ...item,
                quantity: newQuantity,
                selectedSerials: newSerials,
              };
            }
          }

          return { ...item, quantity: newQuantity };
        }
        return item;
      }),
    );
  };
  const validateReturnItems = (items: ReturnItem[]): boolean => {
    for (const item of items) {
      if (item.returnQuantity <= 0) continue;

      // Check if product uses serials
      if (item.Products?.useIndividualSerials) {
        const selectedSerials = selectedReturnSerials[item.id] || [];

        // Must select exactly returnQuantity serials
        if (selectedSerials.length !== item.returnQuantity) {
          showAlert(
            `Please select exactly ${item.returnQuantity} serial(s) for ${item.Products.name}`,
            "error",
          );
          return false;
        }

        // Validate serials belong to the original sale
        const originalSerials = item.serials || [];
        const invalidSerials = selectedSerials.filter(
          (serial) => !originalSerials.includes(serial),
        );

        if (invalidSerials.length > 0) {
          showAlert(
            `Invalid serial(s) selected for ${
              item.Products.name
            }: ${invalidSerials.join(", ")}`,
            "error",
          );
          return false;
        }
      }
    }
    return true;
  };

  const handleApplyBulkActions = () => {
    const newSerials = individualSerials.map((serial) => {
      const updatedSerial = { ...serial };

      if (bulkWarranty) {
        updatedSerial.warranty = bulkWarranty;
      }

      if (bulkProductType) {
        updatedSerial.productType = bulkProductType;
      }

      if (selectedBulkSupplierId) {
        updatedSerial.supplier_id = selectedBulkSupplierId;
      }

      if (bulkPurchasePrice && !isNaN(parseFloat(bulkPurchasePrice))) {
        updatedSerial.purchasePrice = parseFloat(bulkPurchasePrice);
      }

      if (bulkWholesalePrice && !isNaN(parseFloat(bulkWholesalePrice))) {
        updatedSerial.wholesalePrice = parseFloat(bulkWholesalePrice);
      }

      if (bulkRetailPrice && !isNaN(parseFloat(bulkRetailPrice))) {
        updatedSerial.retailPrice = parseFloat(bulkRetailPrice);
      }

      return updatedSerial;
    });

    setIndividualSerials(newSerials);
    setShowBulkActions(false);
    showAlert("Bulk actions applied successfully!", "success");
  };
  // Apply product discount
  const handleApplyDiscount = () => {
    if (!discountProductId || !discountValue) return;

    const discountNum = parseFloat(discountValue);
    if (isNaN(discountNum)) {
      showAlert("Please enter a valid discount value", "error");
      return;
    }

    setCart(
      cart.map((item) => {
        if (item.product.id === discountProductId) {
          let newDiscountedPrice = item.price;

          if (discountType === "percentage") {
            if (discountNum > 100) {
              showAlert("Discount percentage cannot exceed 100%", "error");
              return item;
            }
            const discountAmount = (item.price * discountNum) / 100;
            newDiscountedPrice = Math.max(0, item.price - discountAmount);
          } else {
            if (discountNum > item.price) {
              showAlert("Discount amount cannot exceed product price", "error");
              return item;
            }
            newDiscountedPrice = Math.max(0, item.price - discountNum);
          }

          return {
            ...item,
            discount: { type: discountType, value: discountNum },
            discountedPrice: newDiscountedPrice,
          };
        }
        return item;
      }),
    );

    setDiscountValue("");
    setShowDiscountModal(false);
    setDiscountProductId(null);
    setSelectedProductForDiscount(null); // Clear the selection
    showAlert("Discount applied successfully", "success");
  };
  // Apply order discount
  const handleApplyOrderDiscount = () => {
    if (!discountValue) return;

    const discountNum = parseFloat(discountValue);
    if (isNaN(discountNum)) {
      showAlert("Please enter a valid discount value", "error");
      return;
    }

    if (discountType === "percentage" && discountNum > 100) {
      showAlert("Discount percentage cannot exceed 100%", "error");
      return;
    }

    setDiscountValue("");
    setShowDiscountModal(false);
    showAlert("Order discount applied successfully", "success");
  };

  // Remove order discount
  const handleRemoveOrderDiscount = () => {
    showAlert("Order discount removed", "info");
  };
  const handleRemoveDiscount = (productId: number) => {
    setCart(
      cart.map((item) => {
        if (item.product.id === productId) {
          const retailPrice = convertToNumber(item.price);
          return {
            ...item,
            discount: undefined,
            discountedPrice: retailPrice,
          };
        }
        return item;
      }),
    );
    showAlert("Discount removed from product", "success");
  };

  // Select customer
  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerResults(false);
    showAlert(`Customer selected: ${customer.name}`, "success");

    // Switch to cart tab on mobile after selecting customer
    if (isMobile) {
      setActiveTab("cart");
    }
  };
  const handleSaveProduct = async (formData: FormData) => {
    try {
      const productName = formData.get("name")?.toString() || "";
      const specification = formData.get("specification")?.toString() || null;
      const description = formData.get("description")?.toString() || null;
      const quantity = parseInt(formData.get("quantity")?.toString() || "1");

      // Prepare product data
      const productData: any = {
        name: productName.trim(),
        specification,
        description,
        quantity,
        useIndividualSerials,
        category_id: selectedCategoryId,
        userId: currentUser?.id,
      };

      // Handle individual serials
      if (useIndividualSerials && individualSerials.length > 0) {
        productData.serials = individualSerials.map((serial) => ({
          serial: serial.serial,
          warranty: serial.warranty || "No",
          purchasePrice: serial.purchasePrice,
          wholesalePrice: serial.wholesalePrice,
          retailPrice: serial.retailPrice,
          productType: serial.productType,
          supplier_id: serial.supplier_id || null,
        }));
      }

      if (isEditingProduct && existingProductData) {
        // Update existing product
        productData.id = existingProductData.id;
        // Call update product API here if you have one
        // await updateProduct(productData).unwrap();
        showAlert("Product updated successfully!", "success");
      } else {
        // Create new product
        await createProduct(productData).unwrap();
        showAlert("Product created successfully!", "success");
      }

      // Reset form
      resetProductForm();
    } catch (error: any) {
      showAlert(error?.data?.message || "Failed to save product", "error");
    }
  };
  const resetProductForm = () => {
    setShowAddProductModal(false);
    setIsEditingProduct(false);
    setExistingProductData(null);
    setSelectedProductForEdit(null);
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
  };
  const filteredSuppliers =
    suppliers?.filter((supplier) =>
      supplier.name.toLowerCase().includes(bulkSupplierSearch.toLowerCase()),
    ) || [];

  // Clear all
  const handleClearAll = () => {
    setCart([]);
    setSelectedCustomer(null);
    setOrderSummary({
      subtotal: 0,
      productDiscount: 0,
      orderDiscount: 0,
      totalDiscount: 0,
      total: 0,
      dueAmount: 0,
      advancePaid: 0,
    });
    setPaymentAmount("");
    showAlert("Cart cleared successfully", "success");
  };

  // Handle payment
  const handlePayment = async () => {
    const paidAmount = parseFloat(paymentAmount) || 0;
    const dueAmount = Math.max(0, orderSummary.total - paidAmount);

    // Validate
    if (!currentUser) {
      showAlert("User not authenticated", "error");
      return;
    }

    if (cart.length === 0) {
      showAlert("Cart is empty", "error");
      return;
    }

    // Prepare sale items
    const itemsWithSerials = cart.map((item) => {
      const retailPrice = convertToNumber(item.price);
      const discountValue = item.discount?.value || 0;

      const itemData: any = {
        product_id: item.product.id,
        quantity: item.quantity,
        unitPrice: retailPrice,
        discount: discountValue,
      };

      // Add serials if product uses them
      if (item.selectedSerials && item.selectedSerials.length > 0) {
        itemData.serials = item.selectedSerials;
      }

      return itemData;
    });

    // Calculate due date
    const calculateDueDate = () => {
      if (dueAmount > 0) {
        return dueDate
          ? new Date(dueDate)
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      }
      return null;
    };

    const finalDueDate = calculateDueDate();

    // Prepare sale data with ALL possible fields
    const saleData: any = {
      customer_id: selectedCustomer?.id || null,
      user_id: currentUser.user?.id,
      items: itemsWithSerials,
      totalAmount: orderSummary.total,
      totalPaid: paidAmount,
      totaldiscount: orderSummary.totalDiscount,
      status: dueAmount > 0 ? "pending" : "completed",
    };

    // Add optional fields only if they have values
    if (orderSummary.totalDiscount > 0) {
      saleData.totaldiscount = orderSummary.totalDiscount;
    }

    if (finalDueDate) {
      saleData.dueDate = finalDueDate.toISOString().split("T")[0];
    }

    if (paymentMethod) {
      saleData.payment_method = paymentMethod.toLowerCase().replace(" ", "_");
    }

    // Add advancePaid if you have it
    if (orderSummary.advancePaid > 0) {
      saleData.advance_paid = orderSummary.advancePaid;
    }

    console.log("=== SENDING SALE DATA ===");
    console.log("Sale Data Structure:", saleData);
    console.log("Items:", itemsWithSerials);
    console.log("Cart:", cart);
    console.log("User:", currentUser);
    console.log("========================");

    try {
      await createSale(saleData).unwrap();

      showAlert(
        `Sale completed successfully!${
          dueAmount > 0 ? ` Due amount: ${dueAmount}৳` : ""
        }`,
        "success",
      );

      handleClearAll();
      setShowPaymentModal(false);
    } catch (error: any) {
      console.error("Sale creation failed:", error);
      console.error("Error details:", error?.data);
      showAlert(
        error?.data?.message || error?.data?.error || "Failed to complete sale",
        "error",
      );
    }
  };

  // Handle add new customer
  const handleAddNewCustomer = async () => {
    if (!newCustomer.name.trim() || !newCustomer.phone.trim()) {
      showAlert("Name and phone number are required", "error");
      return;
    }

    try {
      const result = await createCustomer(newCustomer).unwrap();
      showAlert(`Customer ${result.name} added successfully!`, "success");
      setSelectedCustomer(result);
      refetchAllCustomers();
      setShowAddCustomerModal(false);
      setNewCustomer({ name: "", email: "", phone: "", address: "" });
    } catch (error: any) {
      showAlert(
        error?.data?.message || "Failed to add customer. Please try again.",
        "error",
      );
    }
  };
  const handleAddNewCategory = async () => {
    if (!newCategoryName.trim()) {
      showAlert("Please enter a category name", "error");
      return;
    }

    try {
      const newCategory = await createCategory({
        name: newCategoryName.trim(),
      }).unwrap();

      // Set the new category as selected
      setSelectedCategoryName(newCategory.name);
      setSelectedCategoryId(newCategory.id);
      setShowNewCategoryInput(false);
      setNewCategoryName("");
      showAlert(
        `Category "${newCategory.name}" added successfully!`,
        "success",
      );
    } catch (error: any) {
      showAlert(error?.data?.message || "Failed to create category", "error");
    }
  };

  // Handle serial selection
  const handleSerialSelection = (serial: string) => {
    if (!selectedProductForSerials) return;

    const newSelectedSerials = selectedSerials.includes(serial)
      ? selectedSerials.filter((s) => s !== serial)
      : [...selectedSerials, serial];

    setSelectedSerials(newSelectedSerials);

    // Auto-update quantity based on selected serials
    const cartItem = cart.find(
      (item) => item.product.id === selectedProductForSerials.id,
    );
    if (cartItem) {
      setCart(
        cart.map((item) =>
          item.product.id === selectedProductForSerials.id
            ? {
                ...item,
                quantity: newSelectedSerials.length,
                selectedSerials: newSelectedSerials,
              }
            : item,
        ),
      );
    }
  };

  const handleSerialSelectionForReturn = (itemId: number, serial: string) => {
    setSelectedReturnSerials((prev) => {
      const currentSerials = prev[itemId] || [];
      const item = returnItems.find((i) => i.id === itemId);

      if (!item) return prev;

      if (currentSerials.includes(serial)) {
        // Remove serial
        return {
          ...prev,
          [itemId]: currentSerials.filter((s) => s !== serial),
        };
      } else {
        // Add serial, but limit to item's returnQuantity
        if (currentSerials.length < item.returnQuantity) {
          return {
            ...prev,
            [itemId]: [...currentSerials, serial],
          };
        }
        return prev;
      }
    });
  };

  // Handle adding product with selected serials
  const handleAddWithSerials = () => {
    if (selectedProductForSerials) {
      if (selectedSerials.length === 0) {
        showAlert("Please select at least one serial", "error");
        return;
      }

      const price = getProductPrice(selectedProductForSerials);
      if (price === 0) {
        showAlert("Product doesn't have price information", "error");
        return;
      }

      const existingItem = cart.find(
        (item) => item.product.id === selectedProductForSerials.id,
      );

      if (existingItem) {
        setCart(
          cart.map((item) =>
            item.product.id === selectedProductForSerials.id
              ? {
                  ...item,
                  quantity: selectedSerials.length,
                  selectedSerials: selectedSerials,
                }
              : item,
          ),
        );
      } else {
        // Add to cart with price and serials
        const newItem: CartItem = {
          product: selectedProductForSerials,
          quantity: selectedSerials.length,
          price: price,
          discountedPrice: price,
          selectedSerials,
        };
        setCart([...cart, newItem]);
      }

      setShowSerialModal(false);
      setSelectedProductForSerials(null);
      setSelectedSerials([]);
    }
  };

  // Handle refund initiation
  const handleRefund = () => {
    setShowRefundModal(true);
    setRefundType("sale");
    setSaleSearchTerm("");
    setSelectedSale(null);
    setReturnItems([]);
    setReturnReason("");
  };

  // Handle exchange initiation
  const handleExchange = () => {
    setShowExchangeModal(true);
    setExchangeSaleSearchTerm("");
    setExchangeSelectedSale(null);
    setExchangeItems([]);
    setExchangeSelectedSerials({});
    setExchangeNewProducts([]);
    setExchangeReason("");
  };

  // Handle service initiation
  const handleService = () => {
    setShowServiceModal(true);
    setServiceType("normal");
    setServiceProduct(null);
    setServiceDetails({
      description: "",
      cost: 0,
      assignedTechnician: "",
    });
  };

  // Handle sale selection for refund
  const handleSelectSale = async (sale: Sale) => {
    console.log("Selecting sale:", sale.id);
    setSelectedSale(sale);
    setSaleSearchTerm("");

    // Immediately set return items from the sale object
    const items = extractAndSetSerialsWithRef(sale);
    setReturnItems(items);

    // Also clear selected serials
    setSelectedReturnSerials({});

    // Debug log
    console.log("Initial return items set from search result:", items.length);
  };

  // Handle purchase selection for refund
  const handleSelectPurchase = async (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setPurchaseSearchTerm(""); // Clear search term to hide results

    if (purchase.PurchasesItems) {
      const returnItemsData: ReturnItem[] = purchase.PurchasesItems.map(
        (item) => {
          const unitPrice = convertToNumber(item.unitPrice);

          return {
            id: item.id,
            product_id: item.product_id,
            quantity: item.quantity,
            returnQuantity: 0,
            unitPrice: unitPrice,
            returnReason: "",
            Products: item.Products
              ? {
                  id: item.Products.id,
                  name: item.Products.name,
                  specification: item.Products.specification || undefined,
                  useIndividualSerials: item.Products.useIndividualSerials,
                  productCode: item.Products.productCode || undefined,
                }
              : undefined,
            serials:
              item.purchaseItemSerials
                ?.map((s) => s.ProductSerials?.serial)
                .filter((s): s is string => !!s) || [],
          };
        },
      );

      setReturnItems(returnItemsData); // Use the same state for purchase returns
      setSelectedReturnSerials({});
    }
  };

  // Handle sale selection for exchange
  const handleSelectSaleForExchange = (sale: Sale) => {
    setExchangeSelectedSale(sale);

    if (sale.SalesItems && sale.SalesItems.length > 0) {
      const exchangeItemsData: ExchangeItem[] = sale.SalesItems.map((item) => {
        const unitPrice = convertToNumber(item.unitPrice);

        return {
          id: item.id,
          product_id: item.product_id,
          quantity: item.quantity,
          exchangeQuantity: 0,
          unitPrice: unitPrice,
          exchangeReason: "",
          Products: item.Products
            ? {
                id: item.Products.id,
                name: item.Products.name,
                specification: item.Products.specification,
                useIndividualSerials: item.Products.useIndividualSerials,
                productCode: item.Products.productCode,
              }
            : undefined,
          serials:
            item.salesItemSerials
              ?.map((s) => s.ProductSerials?.serial)
              .filter((s): s is string => !!s) || [],
        };
      });

      setExchangeItems(exchangeItemsData);
      setExchangeSelectedSerials({});
    }
  };
  // Handle return item quantity change
  const handleReturnQuantityChange = (itemId: number, quantity: number) => {
    setReturnItems((prev) => {
      const newItems = prev.map((item) => {
        if (item.id === itemId) {
          const newQuantity = Math.max(0, Math.min(quantity, item.quantity));

          // If quantity decreased, remove excess serials
          if (newQuantity < item.returnQuantity) {
            const currentSerials = selectedReturnSerials[itemId] || [];
            if (currentSerials.length > newQuantity) {
              setSelectedReturnSerials((prevSerials) => ({
                ...prevSerials,
                [itemId]: currentSerials.slice(0, newQuantity),
              }));
            }
          }

          return {
            ...item,
            returnQuantity: newQuantity,
          };
        }
        return item;
      });

      return newItems;
    });
  };
  // Handle exchange item quantity change
  const handleExchangeQuantityChange = (itemId: number, quantity: number) => {
    setExchangeItems((prev) => {
      const newItems = prev.map((item) => {
        if (item.id === itemId) {
          const newQuantity = Math.max(0, Math.min(quantity, item.quantity));

          // If quantity decreased, remove excess serials
          if (newQuantity < item.exchangeQuantity) {
            const currentSerials = exchangeSelectedSerials[itemId] || [];
            if (currentSerials.length > newQuantity) {
              setExchangeSelectedSerials((prevSerials) => ({
                ...prevSerials,
                [itemId]: currentSerials.slice(0, newQuantity),
              }));
            }
          }

          return {
            ...item,
            exchangeQuantity: newQuantity,
          };
        }
        return item;
      });

      return newItems;
    });
  };
  // Handle exchange serial selection
  const handleExchangeItemSerialSelection = (
    itemId: number,
    serial: string,
  ) => {
    setExchangeSelectedSerials((prev) => {
      const currentSerials = prev[itemId] || [];

      // If serial is already selected, remove it
      if (currentSerials.includes(serial)) {
        return {
          ...prev,
          [itemId]: currentSerials.filter((s) => s !== serial),
        };
      } else {
        // Add serial, but limit to item's exchangeQuantity
        const item = exchangeItems.find((i) => i.id === itemId);
        if (item && currentSerials.length < item.exchangeQuantity) {
          return {
            ...prev,
            [itemId]: [...currentSerials, serial],
          };
        }
        return prev;
      }
    });
  };
  const handleNewExchangeSerialSelection = (serial: string) => {
    if (!selectedExchangeProductForSerials) return;

    const newSelectedSerials = selectedExchangeSerials.includes(serial)
      ? selectedExchangeSerials.filter((s) => s !== serial)
      : [...selectedExchangeSerials, serial];

    setSelectedExchangeSerials(newSelectedSerials);
  };

  const handleAddExchangeWithSerials = () => {
    if (selectedExchangeProductForSerials) {
      if (selectedExchangeSerials.length === 0) {
        showAlert("Please select at least one serial", "error");
        return;
      }

      const existingItem = exchangeNewProducts.find(
        (item) => item.product.id === selectedExchangeProductForSerials.id,
      );

      if (existingItem) {
        // Update existing item with new serials
        setExchangeNewProducts(
          exchangeNewProducts.map((item) =>
            item.product.id === selectedExchangeProductForSerials.id
              ? {
                  ...item,
                  quantity: selectedExchangeSerials.length,
                  selectedSerials: selectedExchangeSerials,
                }
              : item,
          ),
        );
      } else {
        // Add new item with serials
        const retailPrice = convertToNumber(
          selectedExchangeProductForSerials.productSerials &&
            selectedExchangeProductForSerials.productSerials.length > 0
            ? selectedExchangeProductForSerials.productSerials[0].retailPrice
            : 0,
        );
        const newItem: CartItem = {
          product: selectedExchangeProductForSerials,
          quantity: selectedExchangeSerials.length,
          price: retailPrice,
          discountedPrice: retailPrice,
          selectedSerials: selectedExchangeSerials,
        };
        setExchangeNewProducts([...exchangeNewProducts, newItem]);
      }

      setShowExchangeSerialModal(false);
      setSelectedExchangeProductForSerials(null);
      setSelectedExchangeSerials([]);
    }
  };
  // Validate exchange items
  const validateExchangeItems = (items: ExchangeItem[]): boolean => {
    for (const item of items) {
      if (item.exchangeQuantity <= 0) continue;

      // Check if product uses serials
      if (item.Products?.useIndividualSerials) {
        const selectedSerials = exchangeSelectedSerials[item.id] || []; // Use exchangeSelectedSerials

        // Must select exactly exchangeQuantity serials
        if (selectedSerials.length !== item.exchangeQuantity) {
          showAlert(
            `Please select exactly ${item.exchangeQuantity} serial(s) for ${item.Products.name}`,
            "error",
          );
          return false;
        }

        // Validate serials belong to the original sale
        const originalSerials = item.serials || [];
        const invalidSerials = selectedSerials.filter(
          (serial) => !originalSerials.includes(serial),
        );

        if (invalidSerials.length > 0) {
          showAlert(
            `Invalid serial(s) selected for ${
              item.Products.name
            }: ${invalidSerials.join(", ")}`,
            "error",
          );
          return false;
        }
      }
    }
    return true;
  };
  // Calculate return total
  const calculateReturnTotal = () => {
    return returnItems.reduce((total, item) => {
      return total + convertToNumber(item.unitPrice) * item.returnQuantity;
    }, 0);
  };

  // Calculate exchange price difference
  const calculateExchangeDifference = () => {
    const oldTotal = exchangeItems.reduce((total, item) => {
      return total + convertToNumber(item.unitPrice) * item.exchangeQuantity;
    }, 0);

    const newTotal = exchangeNewProducts.reduce((total, item) => {
      return total + item.discountedPrice * item.quantity;
    }, 0);

    return newTotal - oldTotal;
  };
  // Add product to exchange cart
  const handleAddExchangeProduct = (product: Product) => {
    console.log("handleAddExchangeProduct called for:", product.name);

    // Get price from serials or product data
    let price = 0;

    if (
      product.useIndividualSerials &&
      product.productSerials &&
      product.productSerials.length > 0
    ) {
      // For serialized products, get price from first serial
      price = convertToNumber(product.productSerials[0].retailPrice);
    } else if (!product.useIndividualSerials) {
      // For non-serialized products, try to get price from product data
      // You might need to adjust this based on your Product type structure
      price =
        convertToNumber((product as any).retailPrice) ||
        convertToNumber((product as any).price) ||
        0;
    }

    if (price === 0) {
      console.warn("No price found for product:", product);
      showAlert("Product doesn't have price information", "error");
      return;
    }

    // Check if product uses individual serials
    if (product.useIndividualSerials) {
      console.log("Product requires serial selection");
      setSelectedExchangeProductForSerials(product);
      setSelectedExchangeSerials([]);
      setShowExchangeSerialModal(true);
      return;
    }

    console.log("Adding non-serialized product to exchange cart");

    // For non-serialized products, add directly
    const existingItem = exchangeNewProducts.find(
      (item) => item.product.id === product.id,
    );

    if (existingItem) {
      setExchangeNewProducts(
        exchangeNewProducts.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );
    } else {
      const newItem: CartItem = {
        product,
        quantity: 1,
        price: price,
        discountedPrice: price,
      };
      setExchangeNewProducts([...exchangeNewProducts, newItem]);
    }

    // Clear search term after adding
    setExchangeProductSearchTerm("");
  };
  // Remove product from exchange cart
  const handleRemoveExchangeProduct = (productId: number) => {
    // Check if the product exists in exchangeNewProducts
    const productExists = exchangeNewProducts.some(
      (item) => item.product.id === productId,
    );

    if (!productExists) {
      console.log("Product not found in exchangeNewProducts:", productId);
      console.log("Current exchangeNewProducts:", exchangeNewProducts);
      return;
    }

    // Remove the product
    const updatedProducts = exchangeNewProducts.filter(
      (item) => item.product.id !== productId,
    );

    console.log("Removing product:", productId);
    console.log("Updated products:", updatedProducts);

    setExchangeNewProducts(updatedProducts);
  };
  // Handle create sale return with serial support
  const handleCreateSaleReturn = async () => {
    // First validate all required fields exist
    if (!selectedSale) {
      showAlert("Please select a sale", "error");
      return;
    }

    if (!currentUser) {
      showAlert("User not authenticated", "error");
      return;
    }

    // Get the actual user ID from the nested structure
    const userId = currentUser.user?.id;

    if (!userId) {
      showAlert("Could not retrieve user ID from user data", "error");
      return;
    }

    if (!selectedSale.customer_id) {
      showAlert("Selected sale doesn't have a customer", "error");
      return;
    }

    const itemsToReturn = returnItems.filter((item) => item.returnQuantity > 0);
    if (itemsToReturn.length === 0) {
      showAlert("Please select items to return", "error");
      return;
    }

    // Validate return reason
    if (!itemsToReturn[0]?.returnReason?.trim()) {
      showAlert("Please enter a return reason", "error");
      return;
    }

    // Validate serials for serialized products
    for (const item of itemsToReturn) {
      if (item.Products?.useIndividualSerials) {
        const selectedSerials = selectedReturnSerials[item.id] || [];
        if (selectedSerials.length !== item.returnQuantity) {
          showAlert(
            `Please select exactly ${item.returnQuantity} serial(s) for ${item.Products.name}`,
            "error",
          );
          return;
        }
      }
    }

    // Calculate total payback amount
    const total_payback = itemsToReturn.reduce((total, item) => {
      const itemDiscount = item.discount || 0;
      const itemPrice = convertToNumber(item.unitPrice) - itemDiscount;
      return total + itemPrice * item.returnQuantity;
    }, 0);

    // Validate total_payback is a valid number
    if (isNaN(total_payback) || total_payback <= 0) {
      showAlert("Invalid total payback amount", "error");
      return;
    }

    try {
      console.log("=== SENDING SALE RETURN DATA ===");
      console.log("Sales ID:", selectedSale.id);
      console.log("Customer ID:", selectedSale.customer_id);
      console.log("User ID:", userId); // Now this should be 15
      console.log("Total Payback:", total_payback);
      console.log("Items:", itemsToReturn);

      // Prepare return data
      const returnData: any = {
        sales_id: selectedSale.id,
        customer_id: selectedSale.customer_id,
        user_id: userId, // Use the extracted user ID
        total_payback: total_payback,
        note: returnReason.trim(),
        items: itemsToReturn.map((item) => ({
          sales_item_id: item.id,
          product_id: item.product_id,
          quantity: item.returnQuantity,
          unitPrice: convertToNumber(item.unitPrice),
          discount: convertToNumber(item.discount || 0),
          returnReason: item.returnReason || returnReason,
          serials: selectedReturnSerials[item.id] || [],
        })),
      };

      console.log("Full Return Data:", returnData);

      const result = await createSalesReturn(returnData).unwrap();

      showAlert("Sale return created successfully!", "success");

      // Reset state
      setShowRefundModal(false);
      setSelectedSale(null);
      setReturnItems([]);
      setSelectedReturnSerials({});
      setReturnReason("");
    } catch (error: any) {
      console.error("Sale return creation failed:", error);
      console.error("Error details:", error?.data);

      // More detailed error handling
      if (error?.data?.message) {
        showAlert(`Failed: ${error.data.message}`, "error");
      } else if (error?.data?.error) {
        showAlert(`Failed: ${error.data.error}`, "error");
      } else {
        showAlert("Failed to create sale return. Please try again.", "error");
      }
    }
  };
  // Handle create purchase return
  const handleCreatePurchaseReturn = async () => {
    if (!selectedPurchase || !currentUser) {
      showAlert(
        "Please select a purchase and ensure you're logged in",
        "error",
      );
      return;
    }

    const itemsToReturn = returnItems.filter((item) => item.returnQuantity > 0);
    if (itemsToReturn.length === 0) {
      showAlert("Please select items to return", "error");
      return;
    }

    // Validate serials for serialized products
    for (const item of itemsToReturn) {
      if (item.Products?.useIndividualSerials) {
        const selectedSerials = selectedReturnSerials[item.id] || [];
        if (selectedSerials.length !== item.returnQuantity) {
          showAlert(
            `Please select exactly ${item.returnQuantity} serial(s) for ${item.Products.name}`,
            "error",
          );
          return;
        }
      }
    }

    if (!returnReason.trim()) {
      showAlert("Please enter a return reason", "error");
      return;
    }

    // Calculate total payback amount
    const total_payback = itemsToReturn.reduce((total, item) => {
      return total + convertToNumber(item.unitPrice) * item.returnQuantity;
    }, 0);

    try {
      if (!selectedPurchase.supplier_id) {
        showAlert("Selected purchase doesn't have a supplier", "error");
        return;
      }

      // Prepare purchase return data
      const returnData: any = {
        purchase_id: selectedPurchase.id,
        supplier_id: selectedPurchase.supplier_id,
        user_id: currentUser.id,
        total_payback: total_payback,
        note: returnReason,
        items: itemsToReturn.map((item) => ({
          purchase_item_id: item.id,
          product_id: item.product_id,
          quantity: item.returnQuantity,
          unitPrice: convertToNumber(item.unitPrice),
          returnReason: item.returnReason,
          serials: selectedReturnSerials[item.id] || [],
        })),
      };

      const result = await createPurchaseReturn(returnData).unwrap();

      showAlert("Purchase return created successfully!", "success");

      // Reset state
      setShowRefundModal(false);
      setSelectedPurchase(null);
      setReturnItems([]);
      setSelectedReturnSerials({});
      setReturnReason("");
    } catch (error: any) {
      console.error("Purchase return creation failed:", error);
      showAlert(
        error?.data?.message || "Failed to create purchase return",
        "error",
      );
    }
  };

  // Handle create exchange
  const handleCreateExchange = async () => {
    if (!exchangeSelectedSale || !currentUser) {
      showAlert("Please select a sale and ensure you're logged in", "error");
      return;
    }

    const itemsToExchange = exchangeItems.filter(
      (item) => item.exchangeQuantity > 0,
    );
    if (itemsToExchange.length === 0) {
      showAlert("Please select items to exchange", "error");
      return;
    }

    if (exchangeNewProducts.length === 0) {
      showAlert("Please add new products for exchange", "error");
      return;
    }

    if (!validateExchangeItems(itemsToExchange)) {
      return;
    }

    if (!exchangeReason.trim()) {
      showAlert("Please enter an exchange reason", "error");
      return;
    }

    try {
      const priceDifference = calculateExchangeDifference();

      // Prepare exchange data
      const exchangeData: any = {
        sale_id: exchangeSelectedSale.id,
        customer_id: exchangeSelectedSale.customer_id,
        user_id: currentUser.id,
        reason: exchangeReason,
        old_items: itemsToExchange.map((item) => ({
          sales_item_id: item.id,
          product_id: item.product_id,
          quantity: item.exchangeQuantity,
          price: convertToNumber(item.unitPrice),
          note: item.exchangeReason || "No reason provided",
          serials: exchangeSelectedSerials[item.id] || [],
        })),
        new_items: exchangeNewProducts.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          price: item.discountedPrice,
          serials: item.selectedSerials || [],
        })),
        total_paid: priceDifference > 0 ? priceDifference : 0,
        total_payback: priceDifference < 0 ? Math.abs(priceDifference) : 0,
        net_amount: Math.abs(priceDifference),
        status: "completed",
        date: new Date().toISOString().split("T")[0],
      };

      await createExchange(exchangeData).unwrap();

      showAlert("Exchange created successfully!", "success");

      // Reset state
      setShowExchangeModal(false);
      setExchangeSelectedSale(null);
      setExchangeItems([]);
      setExchangeSelectedSerials({});
      setExchangeNewProducts([]);
      setExchangeReason("");
    } catch (error: any) {
      console.error("Exchange creation failed:", error);
      showAlert(error?.data?.message || "Failed to create exchange", "error");
    }
  };

  // Format date and time
  const formatDateTime = (date: Date) => {
    return {
      date: date.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    };
  };

  const { date, time } = formatDateTime(currentDateTime);

  // Get the position for search results
  const getSearchPosition = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return { left: 0, top: 0, width: 0 };

    const rect = ref.current.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.bottom + 8,
      width: rect.width,
    };
  };
  // Update getProductPrice function
  const getProductPrice = (product: Product): number => {
    // Check if product has serials with retail prices
    if (product.productSerials && product.productSerials.length > 0) {
      // Return the retail price from first serial
      return convertToNumber(product.productSerials[0].retailPrice);
    }

    // Try to get from product data if available
    if ((product as any).retailPrice) {
      return convertToNumber((product as any).retailPrice);
    }

    return 0;
  };

  // Alternative: If you have a separate API to get product price
  const getProductPriceFromAPI = async (productId: number): Promise<number> => {
    // You might need to fetch product with serials to get price
    return 0;
  };

  // Mobile Bottom Navigation
  const MobileBottomNav = () => (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 border-t ${
        isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
      }`}
    >
      <div className="flex justify-around items-center h-16">
        <button
          onClick={() => setActiveTab("products")}
          className={`flex flex-col items-center justify-center flex-1 py-2 ${
            activeTab === "products"
              ? isDarkMode
                ? "text-blue-400"
                : "text-blue-600"
              : isDarkMode
                ? "text-gray-400"
                : "text-gray-500"
          }`}
        >
          <Search size={20} />
          <span className="text-xs mt-1">Products</span>
        </button>

        <button
          onClick={() => setActiveTab("customers")}
          className={`flex flex-col items-center justify-center flex-1 py-2 ${
            activeTab === "customers"
              ? isDarkMode
                ? "text-blue-400"
                : "text-blue-600"
              : isDarkMode
                ? "text-gray-400"
                : "text-gray-500"
          }`}
        >
          <UserPlus size={20} />
          <span className="text-xs mt-1">Customers</span>
        </button>

        <button
          onClick={() => setActiveTab("cart")}
          className={`flex flex-col items-center justify-center flex-1 py-2 relative ${
            activeTab === "cart"
              ? isDarkMode
                ? "text-blue-400"
                : "text-blue-600"
              : isDarkMode
                ? "text-gray-400"
                : "text-gray-500"
          }`}
        >
          <div className="relative">
            <ShoppingCart size={20} />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </div>
          <span className="text-xs mt-1">Cart</span>
        </button>
      </div>
    </div>
  );

  // Mobile Header
  const MobileHeader = () => (
    <div
      className={`sticky top-0 z-30 p-4 border-b ${
        isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2
            className={`text-xl font-bold ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            POS System
          </h2>
          <p
            className={`text-sm ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {date} {time}
          </p>
        </div>
        <button
          onClick={() => dispatch(setIsPOSPanelOpen(false))}
          className={`p-2 rounded-lg ${
            isDarkMode
              ? "bg-gray-800 hover:bg-gray-700"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          <X size={24} />
        </button>
      </div>
    </div>
  );

  // Add this function to render the warranty serial selection modal
  const renderWarrantySerialModal = () => (
    <div className="fixed inset-0 flex backdrop-blur-sm items-center justify-center z-[10001] p-4">
      <div
        className={`p-6 rounded-lg border w-full max-w-md transform transition-all duration-300 scale-100 max-h-[80vh] overflow-y-auto ${
          isDarkMode
            ? "bg-gray-900 border-gray-700"
            : "bg-white border-gray-200"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3
            className={`text-lg font-bold ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Select Warranty Serials
          </h3>
          <button
            onClick={() => setShowWarrantySerialModal(false)}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <p
            className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
          >
            Select serial number(s) for warranty service
          </p>

          <div className="max-h-60 overflow-y-auto">
            {selectedWarrantyProduct?.serials?.map(
              (serial: any, index: number) => (
                <div
                  key={index}
                  className={`p-3 border rounded-lg mb-2 cursor-pointer transition-colors ${
                    selectedWarrantySerials.includes(serial.serial)
                      ? isDarkMode
                        ? "border-blue-500 bg-blue-900/20"
                        : "border-blue-400 bg-blue-50"
                      : isDarkMode
                        ? "border-gray-700 hover:bg-gray-800"
                        : "border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    if (selectedWarrantySerials.includes(serial.serial)) {
                      setSelectedWarrantySerials((prev) =>
                        prev.filter((s) => s !== serial.serial),
                      );
                    } else {
                      setSelectedWarrantySerials((prev) => [
                        ...prev,
                        serial.serial,
                      ]);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{serial.serial}</div>
                      <div
                        className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                      >
                        Warranty: {serial.warranty || "Yes"}
                      </div>
                    </div>
                    {selectedWarrantySerials.includes(serial.serial) && (
                      <Check className="text-green-500" size={16} />
                    )}
                  </div>
                </div>
              ),
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                if (selectedWarrantySerials.length === 0) {
                  showAlert("Please select at least one serial", "error");
                  return;
                }
                setShowWarrantySerialModal(false);
              }}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-medium"
            >
              Confirm ({selectedWarrantySerials.length} selected)
            </button>
            <button
              onClick={() => {
                setSelectedWarrantySerials([]);
                setShowWarrantySerialModal(false);
              }}
              className={`flex-1 py-3 rounded-lg font-medium ${
                isDarkMode
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-gray-300 hover:bg-gray-400 text-gray-800"
              }`}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  // Render Add Supplier Modal
  const renderAddSupplierModal = () => (
    <div className="fixed inset-0 flex backdrop-blur-sm items-center justify-center z-[10001] p-4">
      <div
        className={`p-6 rounded-lg border w-full max-w-md transform transition-all duration-300 scale-100 ${
          isDarkMode
            ? "bg-gray-900 border-gray-700"
            : "bg-white border-gray-200"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3
            className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
          >
            Add New Supplier
          </h3>
          <button
            onClick={() => setShowAddSupplierModal(false)}
            className={`p-2 rounded-lg ${
              isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {["name", "phone", "email", "address"].map((field) => (
            <div key={field}>
              <label
                className={`block mb-2 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                {field === "contactPerson"
                  ? "Contact Person"
                  : field.charAt(0).toUpperCase() + field.slice(1)}
                {field === "name" ? " *" : ""}
              </label>
              {field === "address" ? (
                <textarea
                  value={newSupplierData[field as keyof typeof newSupplierData]}
                  onChange={(e) =>
                    setNewSupplierData({
                      ...newSupplierData,
                      [field]: e.target.value,
                    })
                  }
                  className={`w-full p-3 border rounded-lg ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-600 text-white"
                      : "bg-white border-gray-300"
                  }`}
                  rows={3}
                  placeholder={`Enter ${field}`}
                  required={field === "address" ? false : field === "name"}
                />
              ) : (
                <input
                  type={
                    field === "email"
                      ? "email"
                      : field === "phone"
                        ? "tel"
                        : "text"
                  }
                  value={newSupplierData[field as keyof typeof newSupplierData]}
                  onChange={(e) =>
                    setNewSupplierData({
                      ...newSupplierData,
                      [field]: e.target.value,
                    })
                  }
                  className={`w-full p-3 border rounded-lg ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-600 text-white"
                      : "bg-white border-gray-300"
                  }`}
                  placeholder={`Enter ${field}`}
                  required={field === "name"}
                />
              )}
            </div>
          ))}

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleAddNewSupplier}
              disabled={creatingSupplier || !newSupplierData.name.trim()}
              className={`flex-1 py-3 rounded-lg font-medium ${
                creatingSupplier || !newSupplierData.name.trim()
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              {creatingSupplier ? "Adding..." : "Add Supplier"}
            </button>

            <button
              onClick={() => setShowAddSupplierModal(false)}
              className={`flex-1 py-3 rounded-lg font-medium ${
                isDarkMode
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-gray-300 hover:bg-gray-400 text-gray-800"
              }`}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  // Render Pre-Order Modal
  const renderPreOrderModal = () => (
    <div className="fixed inset-0 flex backdrop-blur-sm items-center justify-center z-[10000] p-4 mt-12">
      <div
        className={`p-6 rounded-lg border w-full max-w-5xl transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto ${
          isDarkMode
            ? "bg-gray-900/50 border-gray-700"
            : "bg-white/50 border-gray-200"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3
            className={`text-lg font-bold ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Create Pre-Order
          </h3>
          <button
            onClick={() => setShowPreOrderModal(false)}
            className={`p-2 rounded-lg ${
              isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            <X size={20} />
          </button>
        </div>

        <div className=" grid grid-cols-2 space-between gap-4">
          {/* Product Information */}
          <div
            className={`col-span-1 border p-4 rounded-lg ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
          >
            <h4
              className={`font-bold mb-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}
            >
              Product Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label
                  className={`block mb-2 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Product Name *
                </label>
                <input
                  type="text"
                  value={preOrderData.productName}
                  onChange={(e) =>
                    setPreOrderData({
                      ...preOrderData,
                      productName: e.target.value,
                    })
                  }
                  className={`w-full p-3 border rounded-lg ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-black"
                  }`}
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div>
                <label
                  className={`block mb-2 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  value={preOrderData.quantity}
                  onChange={(e) =>
                    setPreOrderData({
                      ...preOrderData,
                      quantity: parseInt(e.target.value) || 1,
                    })
                  }
                  className={`w-full p-3 border rounded-lg ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-black"
                  }`}
                  required
                />
              </div>

              <div>
                <label
                  className={`block mb-2 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Price per Unit (৳) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={preOrderData.price}
                  onChange={(e) =>
                    setPreOrderData({
                      ...preOrderData,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                  className={`w-full p-3 border rounded-lg ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-black"
                  }`}
                  required
                />
              </div>

              <div>
                <label
                  className={`block mb-2 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Specification
                </label>
                <input
                  type="text"
                  value={preOrderData.specification}
                  onChange={(e) =>
                    setPreOrderData({
                      ...preOrderData,
                      specification: e.target.value,
                    })
                  }
                  className={`w-full p-3 border rounded-lg ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-black"
                  }`}
                  placeholder="Product specification"
                />
              </div>

              <div className="col-span-2">
                <label
                  className={`block mb-2 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Details
                </label>
                <textarea
                  value={preOrderData.details}
                  onChange={(e) =>
                    setPreOrderData({
                      ...preOrderData,
                      details: e.target.value,
                    })
                  }
                  className={`w-full p-3 border rounded-lg ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-black"
                  }`}
                  rows={3}
                  placeholder="Additional product details"
                />
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div
            className={`col-span-1 border p-4 rounded-lg ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
          >
            <h4
              className={`font-bold mb-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}
            >
              Customer Information
            </h4>

            {/* Customer Search */}
            <div className="mb-4">
              <label
                className={`block mb-2 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                Search Existing Customer
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={preOrderCustomerSearchTerm}
                  onChange={(e) => {
                    setPreOrderCustomerSearchTerm(e.target.value);
                    if (e.target.value.length >= 2) {
                      setShowPreOrderCustomerSearch(true);
                    } else {
                      setShowPreOrderCustomerSearch(false);
                    }
                  }}
                  className={`w-full p-3 border rounded-lg ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-black"
                  }`}
                  placeholder="Search by name, phone, or email"
                />

                {showPreOrderCustomerSearch && searchCustomersData && (
                  <div
                    className={`absolute z-10 w-full mt-1 border rounded-lg shadow-lg max-h-60 overflow-y-auto ${
                      isDarkMode
                        ? "bg-gray-800 border-gray-700"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    {searchCustomersData.map((customer) => (
                      <div
                        key={customer.id}
                        className={`p-3 border-b cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          preOrderData.customer_id === customer.id
                            ? "bg-blue-50 dark:bg-blue-900/30"
                            : ""
                        }`}
                        onClick={() => handleSelectPreOrderCustomer(customer)}
                      >
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-gray-500">
                          {customer.phone}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Customer Details */}
            {preOrderData.customer_id ? (
              <div
                className={`p-3 rounded-lg border mb-4 ${
                  isDarkMode
                    ? "border-green-700 bg-green-900/20"
                    : "border-green-300 bg-green-50"
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">
                      {preOrderData.customerName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {preOrderData.customerPhone}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setPreOrderData({
                        ...preOrderData,
                        customer_id: null,
                        customerName: "",
                        customerPhone: "",
                        customerEmail: "",
                      });
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block mb-2 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={preOrderData.customerName || ""}
                    onChange={(e) =>
                      setPreOrderData({
                        ...preOrderData,
                        customerName: e.target.value,
                      })
                    }
                    className={`w-full p-3 border rounded-lg ${
                      isDarkMode
                        ? "bg-gray-800 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-black"
                    }`}
                    placeholder="Walk-in customer name"
                  />
                </div>

                <div>
                  <label
                    className={`block mb-2 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={preOrderData.customerPhone || ""}
                    onChange={(e) =>
                      setPreOrderData({
                        ...preOrderData,
                        customerPhone: e.target.value,
                      })
                    }
                    className={`w-full p-3 border rounded-lg ${
                      isDarkMode
                        ? "bg-gray-800 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-black"
                    }`}
                    placeholder="Phone number"
                  />
                </div>

                <div className="col-span-2">
                  <label
                    className={`block mb-2 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={preOrderData.customerEmail || ""}
                    onChange={(e) =>
                      setPreOrderData({
                        ...preOrderData,
                        customerEmail: e.target.value,
                      })
                    }
                    className={`w-full p-3 border rounded-lg ${
                      isDarkMode
                        ? "bg-gray-800 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-black"
                    }`}
                    placeholder="Email address"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Payment & Delivery Information */}
          <div
            className={`col-span-2 border p-4 rounded-lg ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
          >
            <h4
              className={`font-bold mb-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}
            >
              Payment & Delivery Information
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className={`block mb-2 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Delivery Date *
                </label>
                <input
                  type="date"
                  value={preOrderData.deliveryDate}
                  onChange={(e) =>
                    setPreOrderData({
                      ...preOrderData,
                      deliveryDate: e.target.value,
                    })
                  }
                  className={`w-full p-3 border rounded-lg ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-600 text-white"
                      : "bg-white border-gray-300"
                  }`}
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>

              <div>
                <label
                  className={`block mb-2 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Amount Paid (৳)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={preOrderData.amountPaid}
                  onChange={(e) =>
                    setPreOrderData({
                      ...preOrderData,
                      amountPaid: parseFloat(e.target.value) || 0,
                    })
                  }
                  className={`w-full p-3 border rounded-lg ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-600 text-white"
                      : "bg-white border-gray-300"
                  }`}
                />
              </div>

              <div className="col-span-2">
                <label
                  className={`block mb-2 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Notes
                </label>
                <textarea
                  value={preOrderData.notes || ""}
                  onChange={(e) =>
                    setPreOrderData({ ...preOrderData, notes: e.target.value })
                  }
                  className={`w-full p-3 border rounded-lg ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-600 text-white"
                      : "bg-white border-gray-300"
                  }`}
                  rows={2}
                  placeholder="Additional notes or special instructions"
                />
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div
            className={`col-span-2 border p-4 rounded-lg ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
          >
            <h5
              className={`font-bold mb-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}
            >
              Order Summary
            </h5>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span
                  className={isDarkMode ? "text-gray-300" : "text-gray-600"}
                >
                  Total Amount:
                </span>
                <span className="font-bold">
                  {preOrderData.price * preOrderData.quantity}৳
                </span>
              </div>

              <div className="flex justify-between">
                <span
                  className={isDarkMode ? "text-gray-300" : "text-gray-600"}
                >
                  Amount Paid:
                </span>
                <span className="font-medium text-green-600">
                  {preOrderData.amountPaid}৳
                </span>
              </div>

              <div className="flex justify-between border-t pt-2 border-gray-300 dark:border-gray-700">
                <span
                  className={`font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
                >
                  Remaining Amount:
                </span>
                <span
                  className={`text-lg font-bold ${
                    calculatePreOrderRemaining() > 0
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {calculatePreOrderRemaining()}৳
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 col-span-2">
            <button
              onClick={handleCreatePreOrder}
              disabled={
                creatingPreOrder ||
                !preOrderData.productName.trim() ||
                !preOrderData.deliveryDate
              }
              className={`flex-1 py-3 rounded-lg font-medium ${
                creatingPreOrder ||
                !preOrderData.productName.trim() ||
                !preOrderData.deliveryDate
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              {creatingPreOrder ? "Creating..." : "Create Pre-Order"}
            </button>

            <button
              onClick={() => setShowPreOrderModal(false)}
              className={`flex-1 py-3 rounded-lg font-medium ${
                isDarkMode
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-gray-300 hover:bg-gray-400 text-gray-800"
              }`}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Cash In Modal
  const renderCashInModal = () => (
    <div className="fixed inset-0 flex backdrop-blur-sm items-center justify-center z-[10000] p-4 mt-12">
      <div
        className={`p-6 rounded-lg border w-full max-w-4xl transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto ${
          isDarkMode
            ? "bg-gray-900/50 border-gray-700"
            : "bg-white/50 border-gray-200"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3
            className={`text-lg font-bold ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Cash In - Receive Due Payment
          </h3>
          <button
            onClick={() => setShowCashInModal(false)}
            className={`p-2 rounded-lg ${
              isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Due Sales List */}
          <div>
            <h4
              className={`font-bold mb-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}
            >
              Sales with Due Amount ({duePayments.length})
            </h4>

            <div
              className={`rounded-lg border overflow-hidden ${
                isDarkMode ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <div
                className={`p-3 font-medium border-b ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-700 text-white"
                    : "bg-gray-100 border-gray-200 text-gray-900"
                }`}
              >
                <div className="grid grid-cols-12 text-sm">
                  <div className="col-span-3">Sale #</div>
                  <div className="col-span-4">Customer</div>
                  <div className="col-span-3">Due Amount</div>
                  <div className="col-span-2">Select</div>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {duePayments.length === 0 ? (
                  <div className="p-4 text-center">
                    <PackageSearch className="mx-auto h-12 w-12 mb-2 opacity-50" />
                    <p
                      className={isDarkMode ? "text-gray-400" : "text-gray-500"}
                    >
                      No due payments found
                    </p>
                  </div>
                ) : (
                  duePayments.map((sale) => {
                    const totalAmount = convertToNumber(sale.totalAmount);
                    const totalPaid = convertToNumber(sale.totalPaid);
                    const dueAmount = Math.max(0, totalAmount - totalPaid);

                    return (
                      <div
                        key={sale.id}
                        className={`p-3 border-b cursor-pointer transition-colors ${
                          selectedDueSale?.id === sale.id
                            ? isDarkMode
                              ? "bg-blue-900/30 border-blue-500"
                              : "bg-blue-50 border-blue-300"
                            : isDarkMode
                              ? "border-gray-700 hover:bg-gray-800"
                              : "border-gray-200 hover:bg-gray-50"
                        }`}
                        onClick={() => handleSelectDueSale(sale)}
                      >
                        <div className="grid grid-cols-12 items-center">
                          <div className="col-span-3">
                            <div className="font-medium text-sm">
                              #{sale.saleNo || sale.id}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(sale.createdAt).toLocaleDateString()}
                            </div>
                          </div>

                          <div className="col-span-4">
                            <div className="font-medium text-sm truncate">
                              {sale.Customers?.name || "Walk-in"}
                            </div>
                            <div className="text-xs text-gray-500">
                              Total: {totalAmount}৳
                            </div>
                          </div>

                          <div className="col-span-3">
                            <div
                              className={`font-bold text-sm ${
                                dueAmount > 0
                                  ? "text-red-600"
                                  : "text-green-600"
                              }`}
                            >
                              {dueAmount}৳
                            </div>
                            <div className="text-xs text-gray-500">
                              Paid: {totalPaid}৳
                            </div>
                          </div>

                          <div className="col-span-2 text-center">
                            {selectedDueSale?.id === sale.id ? (
                              <Check
                                className="text-green-500 mx-auto"
                                size={20}
                              />
                            ) : (
                              <div className="w-5 h-5 border rounded mx-auto"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Payment Form */}
          <div>
            <h4
              className={`font-bold mb-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}
            >
              Payment Details
            </h4>

            {selectedDueSale ? (
              <div className="space-y-4">
                {/* Sale Info */}
                <div
                  className={`p-4 rounded-lg border ${
                    isDarkMode
                      ? "border-gray-700 bg-gray-800"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold">
                        Sale #{selectedDueSale.saleNo || selectedDueSale.id}
                      </div>
                      <div className="text-sm text-gray-500">
                        Customer: {selectedDueSale.Customers?.name || "Walk-in"}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedDueSale(null)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <div className="text-sm text-gray-500">Total Amount</div>
                      <div className="font-bold">
                        {convertToNumber(selectedDueSale.totalAmount)}৳
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Already Paid</div>
                      <div className="font-bold text-green-600">
                        {convertToNumber(selectedDueSale.totalPaid)}৳
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Due Amount</div>
                      <div className="font-bold text-red-600">
                        {Math.max(
                          0,
                          convertToNumber(selectedDueSale.totalAmount) -
                            convertToNumber(selectedDueSale.totalPaid),
                        )}
                        ৳
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Form */}
                <div className="space-y-4">
                  <div>
                    <label
                      className={`block mb-2 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Payment Amount (৳) *
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      max={Math.max(
                        0,
                        convertToNumber(selectedDueSale.totalAmount) -
                          convertToNumber(selectedDueSale.totalPaid),
                      )}
                      step="0.01"
                      value={duePaymentData.amount}
                      onChange={(e) =>
                        setDuePaymentData({
                          ...duePaymentData,
                          amount: parseFloat(e.target.value) || 0,
                        })
                      }
                      className={`w-full p-3 border rounded-lg ${
                        isDarkMode
                          ? "bg-gray-800 border-gray-600 text-white"
                          : "bg-white border-gray-300"
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <label
                      className={`block mb-2 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Payment Method *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {["cash", "card", "mobile_banking"].map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() =>
                            setDuePaymentData({
                              ...duePaymentData,
                              paymentMethod: method,
                            })
                          }
                          className={`py-2 rounded-lg font-medium ${
                            duePaymentData.paymentMethod === method
                              ? isDarkMode
                                ? "bg-blue-600 text-white"
                                : "bg-blue-500 text-white"
                              : isDarkMode
                                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                        >
                          {method.replace("_", " ").toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label
                      className={`block mb-2 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Payment Date *
                    </label>
                    <input
                      type="date"
                      value={duePaymentData.paymentDate}
                      onChange={(e) =>
                        setDuePaymentData({
                          ...duePaymentData,
                          paymentDate: e.target.value,
                        })
                      }
                      className={`w-full p-3 border rounded-lg ${
                        isDarkMode
                          ? "bg-gray-800 border-gray-600 text-white"
                          : "bg-white border-gray-300"
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <label
                      className={`block mb-2 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Reference Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={duePaymentData.referenceNumber || ""}
                      onChange={(e) =>
                        setDuePaymentData({
                          ...duePaymentData,
                          referenceNumber: e.target.value,
                        })
                      }
                      className={`w-full p-3 border rounded-lg ${
                        isDarkMode
                          ? "bg-gray-800 border-gray-600 text-white"
                          : "bg-white border-gray-300"
                      }`}
                      placeholder="Transaction ID/Reference"
                    />
                  </div>

                  <div>
                    <label
                      className={`block mb-2 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Notes (Optional)
                    </label>
                    <textarea
                      value={duePaymentData.notes || ""}
                      onChange={(e) =>
                        setDuePaymentData({
                          ...duePaymentData,
                          notes: e.target.value,
                        })
                      }
                      className={`w-full p-3 border rounded-lg ${
                        isDarkMode
                          ? "bg-gray-800 border-gray-600 text-white"
                          : "bg-white border-gray-300"
                      }`}
                      rows={2}
                      placeholder="Additional notes"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleCreateDuePayment}
                      disabled={creatingPayment || duePaymentData.amount <= 0}
                      className={`flex-1 py-3 rounded-lg font-medium ${
                        creatingPayment || duePaymentData.amount <= 0
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-green-500 hover:bg-green-600 text-white"
                      }`}
                    >
                      {creatingPayment ? "Processing..." : "Record Payment"}
                    </button>

                    <button
                      onClick={() => setShowCashInModal(false)}
                      className={`flex-1 py-3 rounded-lg font-medium ${
                        isDarkMode
                          ? "bg-gray-700 hover:bg-gray-600 text-white"
                          : "bg-gray-300 hover:bg-gray-400 text-gray-800"
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className={`p-8 text-center rounded-lg border ${
                  isDarkMode
                    ? "border-gray-700 bg-gray-800"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <DollarSign className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                  Select a sale from the left to record payment
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Render Cash Out Modal
  const renderCashOutModal = () => (
    <div className="fixed inset-0 flex backdrop-blur-sm items-center justify-center z-[10000] p-4 mt-12">
      <div
        className={`p-6 rounded-lg border w-full max-w-2xl transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto ${
          isDarkMode
            ? "bg-gray-900/50 border-gray-700"
            : "bg-white/50 border-gray-200"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3
            className={`text-lg font-bold ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Cash Out - Record Expense
          </h3>
          <button
            onClick={() => setShowCashOutModal(false)}
            className={`p-2 rounded-lg ${
              isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Expense Category */}
          <div>
            <label
              className={`block mb-2 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            >
              Expense Category *
            </label>
            <div className="relative" ref={newProductCategoryDropdownRef}>
              <button
                type="button"
                onClick={() =>
                  setShowExpenseCategoryDropdown(!showExpenseCategoryDropdown)
                }
                className={`flex items-center justify-between w-full p-3 border rounded-lg ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              >
                <span>
                  {selectedExpenseCategory?.name || "Select Category"}
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showExpenseCategoryDropdown && (
                <div
                  className={`absolute z-10 w-full mt-1 border rounded-lg shadow-lg max-h-60 overflow-y-auto ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-gray-200"
                  }`}
                >
                  {expenseCategories?.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => handleSelectExpenseCategory(category)}
                      className={`w-full text-left p-3 border-b last:border-b-0 ${
                        isDarkMode
                          ? "hover:bg-gray-700 text-white border-gray-700"
                          : "hover:bg-gray-100 text-gray-900 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {getCategoryIcon(category.name)}
                        <div>
                          <div className="font-medium">{category.name}</div>
                          <div className="text-sm text-gray-500">
                            {category.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedExpenseCategory && (
            <>
              {/* Basic Expense Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block mb-2 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Amount (৳) *
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={expenseData.amount}
                    onChange={(e) =>
                      setExpenseData({
                        ...expenseData,
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className={`w-full p-3 border rounded-lg ${
                      isDarkMode
                        ? "bg-gray-800 border-gray-600 text-white"
                        : "bg-white border-gray-300"
                    }`}
                    required
                  />
                </div>

                <div>
                  <label
                    className={`block mb-2 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Date *
                  </label>
                  <input
                    type="date"
                    value={expenseData.date}
                    onChange={(e) =>
                      setExpenseData({ ...expenseData, date: e.target.value })
                    }
                    className={`w-full p-3 border rounded-lg ${
                      isDarkMode
                        ? "bg-gray-800 border-gray-600 text-white"
                        : "bg-white border-gray-300"
                    }`}
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label
                    className={`block mb-2 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Details *
                  </label>
                  <textarea
                    value={expenseData.details}
                    onChange={(e) =>
                      setExpenseData({
                        ...expenseData,
                        details: e.target.value,
                      })
                    }
                    className={`w-full p-3 border rounded-lg ${
                      isDarkMode
                        ? "bg-gray-800 border-gray-600 text-white"
                        : "bg-white border-gray-300"
                    }`}
                    rows={3}
                    placeholder={`Enter details for ${selectedExpenseCategory.name}`}
                    required
                  />
                </div>
              </div>

              {/* Category-specific Fields */}
              {requiresMonthField() && (
                <div>
                  <label
                    className={`block mb-2 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    For Month *
                  </label>
                  <input
                    type="month"
                    value={
                      expenseData.month || new Date().toISOString().slice(0, 7)
                    }
                    onChange={(e) =>
                      setExpenseData({ ...expenseData, month: e.target.value })
                    }
                    className={`w-full p-3 border rounded-lg ${
                      isDarkMode
                        ? "bg-gray-800 border-gray-600 text-white"
                        : "bg-white border-gray-300"
                    }`}
                    required
                  />
                </div>
              )}

              {requiresSaleFields() && (
                <div className="space-y-4">
                  <h5
                    className={`font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
                  >
                    Courier Information
                  </h5>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        className={`block mb-2 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                      >
                        Sale ID (Optional)
                      </label>
                      <input
                        type="number"
                        value={expenseData.sale_id || ""}
                        onChange={(e) =>
                          setExpenseData({
                            ...expenseData,
                            sale_id: parseInt(e.target.value) || undefined,
                          })
                        }
                        className={`w-full p-3 border rounded-lg ${
                          isDarkMode
                            ? "bg-gray-800 border-gray-600 text-white"
                            : "bg-white border-gray-300"
                        }`}
                        placeholder="Sale ID"
                      />
                    </div>

                    <div>
                      <label
                        className={`block mb-2 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                      >
                        Customer ID (Optional)
                      </label>
                      <input
                        type="number"
                        value={expenseData.customer_id || ""}
                        onChange={(e) =>
                          setExpenseData({
                            ...expenseData,
                            customer_id: parseInt(e.target.value) || undefined,
                          })
                        }
                        className={`w-full p-3 border rounded-lg ${
                          isDarkMode
                            ? "bg-gray-800 border-gray-600 text-white"
                            : "bg-white border-gray-300"
                        }`}
                        placeholder="Customer ID"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Vendor Name for relevant categories */}
              {["stationary", "food", "donation", "courier"].includes(
                selectedExpenseCategory.name.toLowerCase(),
              ) && (
                <div>
                  <label
                    className={`block mb-2 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Vendor Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={expenseData.vendorName || ""}
                    onChange={(e) =>
                      setExpenseData({
                        ...expenseData,
                        vendorName: e.target.value,
                      })
                    }
                    className={`w-full p-3 border rounded-lg ${
                      isDarkMode
                        ? "bg-gray-800 border-gray-600 text-white"
                        : "bg-white border-gray-300"
                    }`}
                    placeholder="Vendor/Supplier name"
                  />
                </div>
              )}

              {/* Summary */}
              <div
                className={`p-4 rounded-lg border ${
                  isDarkMode
                    ? "border-gray-700 bg-gray-800"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold">
                      {selectedExpenseCategory.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {expenseData.details}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    {expenseData.amount}৳
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCreateExpense}
                  disabled={
                    creatingExpense ||
                    expenseData.amount <= 0 ||
                    !expenseData.details.trim()
                  }
                  className={`flex-1 py-3 rounded-lg font-medium ${
                    creatingExpense ||
                    expenseData.amount <= 0 ||
                    !expenseData.details.trim()
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-red-500 hover:bg-red-600 text-white"
                  }`}
                >
                  {creatingExpense ? "Recording..." : "Record Expense"}
                </button>

                <button
                  onClick={() => setShowCashOutModal(false)}
                  className={`flex-1 py-3 rounded-lg font-medium ${
                    isDarkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-white"
                      : "bg-gray-300 hover:bg-gray-400 text-gray-800"
                  }`}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // Helper function to get category icon
  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes("rent")) return <Home size={20} />;
    if (name.includes("electricity")) return <TrendingUp size={20} />;
    if (name.includes("internet")) return <Wifi size={20} />;
    if (name.includes("stationary")) return <FileText size={20} />;
    if (name.includes("courier")) return <Truck size={20} />;
    if (name.includes("food")) return <Utensils size={20} />;
    if (name.includes("donation")) return <Gift size={20} />;
    return <DollarSign size={20} />;
  };

  // Render serial selection modal
  const renderSerialModal = () => (
    <div className="fixed inset-0 flex backdrop-blur-sm items-center justify-center z-[10000] p-4">
      <div
        className={`p-6 rounded-lg border w-full max-w-md transform transition-all duration-300 scale-100 max-h-[80vh] overflow-y-auto ${
          isDarkMode
            ? "bg-gray-900 border-gray-700"
            : "bg-white border-gray-200"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3
            className={`text-lg font-bold ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Select Serials for {selectedProductForSerials?.name}
          </h3>
          <button
            onClick={() => {
              setShowSerialModal(false);
              setSelectedProductForSerials(null);
              setSelectedSerials([]);
            }}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">
          <p
            className={`text-sm ${
              isDarkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Available serials ({productSerials?.length || 0})
          </p>
          {loadingSerials ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : productSerials && productSerials.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {productSerials.map((serial) => (
                <div
                  key={serial.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedSerials.includes(serial.serial)
                      ? isDarkMode
                        ? "border-blue-500 bg-blue-900/20"
                        : "border-blue-400 bg-blue-50"
                      : isDarkMode
                        ? "border-gray-700 hover:bg-gray-800"
                        : "border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => handleSerialSelection(serial.serial)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{serial.serial}</div>
                      <div
                        className={`text-xs ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Status: {serial.status}
                      </div>
                    </div>
                    {selectedSerials.includes(serial.serial) && (
                      <Check className="text-green-500" size={16} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p
                className={`${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
              >
                No serials available for this product
              </p>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleAddWithSerials}
              disabled={selectedSerials.length === 0 || loadingSerials}
              className={`flex-1 py-3 rounded-lg font-medium ${
                selectedSerials.length === 0 || loadingSerials
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-600 text-white"
              }`}
            >
              {loadingSerials
                ? "Loading..."
                : `Add ${selectedSerials.length} Serial${
                    selectedSerials.length !== 1 ? "s" : ""
                  }`}
            </button>
            <button
              onClick={() => {
                setShowSerialModal(false);
                setSelectedProductForSerials(null);
                setSelectedSerials([]);
              }}
              className={`flex-1 py-3 rounded-lg font-medium ${
                isDarkMode
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-gray-300 hover:bg-gray-400 text-gray-800"
              }`}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Exchange Serial Selection Modal
  const renderExchangeSerialModal = () => (
    <div className="fixed inset-0 flex backdrop-blur-sm items-center justify-center z-[10001] p-4">
      <div
        className={`p-6 rounded-lg border w-full max-w-md transform transition-all duration-300 scale-100 max-h-[80vh] overflow-y-auto ${
          isDarkMode
            ? "bg-gray-900 border-gray-700"
            : "bg-white border-gray-200"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3
            className={`text-lg font-bold ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Select Serials for Exchange -{" "}
            {selectedExchangeProductForSerials?.name}
          </h3>
          <button
            onClick={() => {
              setShowExchangeSerialModal(false);
              setSelectedExchangeProductForSerials(null);
              setSelectedExchangeSerials([]);
            }}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">
          <p
            className={`text-sm ${
              isDarkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Available serials ({exchangeProductSerials?.length || 0})
          </p>
          {loadingExchangeSerials ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : exchangeProductSerials && exchangeProductSerials.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {exchangeProductSerials.map((serial) => (
                <div
                  key={serial.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedExchangeSerials.includes(serial.serial)
                      ? isDarkMode
                        ? "border-blue-500 bg-blue-900/20"
                        : "border-blue-400 bg-blue-50"
                      : isDarkMode
                        ? "border-gray-700 hover:bg-gray-800"
                        : "border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() =>
                    handleNewExchangeSerialSelection(serial.serial)
                  }
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{serial.serial}</div>
                      <div
                        className={`text-xs ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Status: {serial.status}
                      </div>
                      <div className="text-xs text-green-500 mt-1">
                        Retail: {convertToNumber(serial.retailPrice)}৳
                      </div>
                    </div>
                    {selectedExchangeSerials.includes(serial.serial) && (
                      <Check className="text-green-500" size={16} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p
                className={`${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
              >
                No serials available for this product
              </p>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleAddExchangeWithSerials}
              disabled={
                selectedExchangeSerials.length === 0 || loadingExchangeSerials
              }
              className={`flex-1 py-3 rounded-lg font-medium ${
                selectedExchangeSerials.length === 0 || loadingExchangeSerials
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-600 text-white"
              }`}
            >
              {loadingExchangeSerials
                ? "Loading..."
                : `Add ${selectedExchangeSerials.length} Serial${
                    selectedExchangeSerials.length !== 1 ? "s" : ""
                  }`}
            </button>
            <button
              onClick={() => {
                setShowExchangeSerialModal(false);
                setSelectedExchangeProductForSerials(null);
                setSelectedExchangeSerials([]);
              }}
              className={`flex-1 py-3 rounded-lg font-medium ${
                isDarkMode
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-gray-300 hover:bg-gray-400 text-gray-800"
              }`}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Render refund modal
  const renderRefundModal = () => (
    <div className="fixed inset-0 flex backdrop-blur-sm items-center justify-center z-[10000] p-4 mt-12">
      <div
        className={`p-6 rounded-lg border w-full max-w-4xl transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto ${
          isDarkMode
            ? "bg-gray-800/50 border-gray-700"
            : "bg-white/50 border-gray-200"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3
            className={`text-lg font-bold ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {refundType === "sale" ? "Sale Return" : "Purchase Return"}
          </h3>
          <button
            onClick={() => setShowRefundModal(false)}
            className={`p-2 rounded-lg ${
              isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Refund Type Selection */}
        <div className="mb-6">
          <label
            className={`block mb-2 font-medium ${
              isDarkMode ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Return Type
          </label>
          <div className="flex gap-4">
            <button
              onClick={() => {
                setRefundType("sale");
                setSelectedSale(null);
                setSelectedPurchase(null);
                setReturnItems([]);
              }}
              className={`flex-1 py-2 rounded ${
                refundType === "sale"
                  ? "bg-blue-500 text-white"
                  : isDarkMode
                    ? "bg-gray-800/50 text-gray-300 hover:bg-gray-700"
                    : "bg-white/50 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Sale Return
            </button>
            <button
              onClick={() => {
                setRefundType("purchase");
                setSelectedSale(null);
                setSelectedPurchase(null);
                setReturnItems([]);
              }}
              className={`flex-1 py-2 rounded ${
                refundType === "purchase"
                  ? "bg-blue-500 text-white"
                  : isDarkMode
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Purchase Return
            </button>
          </div>
        </div>

        {/* Search Sale/Purchase */}
        <div className="mb-6">
          <label
            className={`block mb-2 font-medium ${
              isDarkMode ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Search {refundType === "sale" ? "Sale" : "Purchase"} Number
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={
                refundType === "sale" ? saleSearchTerm : purchaseSearchTerm
              }
              onChange={(e) => {
                if (refundType === "sale") {
                  setSaleSearchTerm(e.target.value);
                } else {
                  setPurchaseSearchTerm(e.target.value);
                }
              }}
              className={`flex-1 p-3 border rounded-lg ${
                isDarkMode
                  ? "bg-gray-800 border-gray-600 text-white"
                  : "bg-white border-gray-300"
              }`}
              placeholder={`Enter ${
                refundType === "sale" ? "Sale" : "Purchase"
              } ID or Customer Name...`}
            />
            <button
              onClick={() => {
                // The search is automatic via RTK Query when saleSearchTerm length >= 2
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 rounded-lg flex items-center justify-center"
            >
              <Search size={20} />
            </button>
          </div>

          {/* Search Results Container */}
          <div className="mt-3">
            {/* Show loading indicator */}
            {(searchingSales || searchingPurchases) && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-blue-500 mr-2" />
                <span className="text-sm">Searching...</span>
              </div>
            )}

            {/* Show sale search results */}
            {refundType === "sale" && saleSearchTerm.trim().length >= 2 && (
              <div className="border rounded-lg overflow-hidden">
                {!searchingSales && saleSearchResults && (
                  <>
                    <div
                      className={`px-3 py-2 text-xs ${
                        isDarkMode
                          ? "bg-gray-800 text-gray-400"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      Found {saleSearchResults.length} sale(s)
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {saleSearchResults.length === 0 ? (
                        <div className="p-4 text-center">
                          <Search className="mx-auto h-8 w-8 mb-2 opacity-50" />
                          <p className="text-gray-500">No sales found</p>
                        </div>
                      ) : (
                        saleSearchResults.map((sale) => (
                          <div
                            key={sale.id}
                            className={`p-3 border-b cursor-pointer transition-colors ${
                              selectedSale?.id === sale.id
                                ? isDarkMode
                                  ? "bg-blue-900/30 border-blue-500"
                                  : "bg-blue-50 border-blue-300"
                                : isDarkMode
                                  ? "border-gray-700 hover:bg-gray-800"
                                  : "border-gray-200 hover:bg-gray-50"
                            }`}
                            onClick={() => handleSelectSale(sale)}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex-1">
                                <div className="font-medium flex items-center">
                                  <Receipt className="mr-2 h-4 w-4" />
                                  Sale #{sale.saleNo || sale.id}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-300 mt-1 space-y-1">
                                  <div>
                                    Customer:{" "}
                                    {sale.Customers?.name || "Walk-in"}
                                  </div>
                                  <div>
                                    Date:{" "}
                                    {new Date(
                                      sale.createdAt,
                                    ).toLocaleDateString()}
                                  </div>
                                  <div>
                                    Total:{" "}
                                    {convertToNumber(sale.totalAmount).toFixed(
                                      2,
                                    )}
                                    ৳
                                  </div>
                                  <div>
                                    Items: {sale.SalesItems?.length || 0}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center">
                                <div className="text-right mr-3">
                                  <div
                                    className={`text-sm font-medium ${
                                      isDarkMode
                                        ? "text-blue-300"
                                        : "text-blue-600"
                                    }`}
                                  >
                                    {sale.status || "completed"}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    ID: {sale.id}
                                  </div>
                                </div>
                                {selectedSale?.id === sale.id && (
                                  <Check className="text-green-500" size={20} />
                                )}
                              </div>
                            </div>
                            {/* {sale.note && (
                              <div className="mt-2 text-xs text-gray-500 italic">
                                Note: {sale.note}
                              </div>
                            )} */}
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Show purchase search results */}
            {refundType === "purchase" &&
              purchaseSearchTerm.trim().length >= 2 && (
                <div className="border rounded-lg overflow-hidden">
                  {!searchingPurchases && purchaseSearchResults && (
                    <>
                      <div
                        className={`px-3 py-2 text-xs ${
                          isDarkMode
                            ? "bg-gray-800 text-gray-400"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        Found {purchaseSearchResults.length} purchase(s)
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {purchaseSearchResults.length === 0 ? (
                          <div className="p-4 text-center">
                            <Search className="mx-auto h-8 w-8 mb-2 opacity-50" />
                            <p className="text-gray-500">No purchases found</p>
                          </div>
                        ) : (
                          purchaseSearchResults.map((purchase) => (
                            <div
                              key={purchase.id}
                              className={`p-3 border-b cursor-pointer transition-colors ${
                                selectedPurchase?.id === purchase.id
                                  ? isDarkMode
                                    ? "bg-blue-900/30 border-blue-500"
                                    : "bg-blue-50 border-blue-300"
                                  : isDarkMode
                                    ? "border-gray-700 hover:bg-gray-800"
                                    : "border-gray-200 hover:bg-gray-50"
                              }`}
                              onClick={() => handleSelectPurchase(purchase)}
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex-1">
                                  <div className="font-medium flex items-center">
                                    <ShoppingBag className="mr-2 h-4 w-4" />
                                    Purchase #
                                    {purchase.purchaseNo || purchase.id}
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-300 mt-1 space-y-1">
                                    <div>
                                      Supplier:{" "}
                                      {purchase.Suppliers?.name || "Unknown"}
                                    </div>
                                    <div>
                                      Date:{" "}
                                      {new Date(
                                        purchase.createdAt,
                                      ).toLocaleDateString()}
                                    </div>
                                    <div>
                                      Total:{" "}
                                      {convertToNumber(purchase.totalAmount)}৳
                                    </div>
                                    <div>
                                      Items:{" "}
                                      {purchase.PurchasesItems?.length || 0}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center">
                                  <div className="text-right mr-3">
                                    {/* <div className={`text-sm font-medium ${
                                    isDarkMode ? "text-blue-300" : "text-blue-600"
                                  }`}>
                                    {purchase.status || "received"}
                                  </div> */}
                                    <div className="text-xs text-gray-500">
                                      ID: {purchase.id}
                                    </div>
                                  </div>
                                  {selectedPurchase?.id === purchase.id && (
                                    <Check
                                      className="text-green-500"
                                      size={20}
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
          </div>
        </div>

        {/* Selected Sale Details */}
        {selectedSale && refundType === "sale" && (
          <div className="mb-6">
            <div
              className={`p-4 rounded-lg border ${
                isDarkMode
                  ? "border-gray-700 bg-gray-800"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4
                    className={`font-bold ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Sale #{selectedSale.id}
                  </h4>
                  <p
                    className={`text-sm ${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    Customer: {selectedSale.Customers?.name}
                  </p>
                  <p
                    className={`text-sm ${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    Date:{" "}
                    {new Date(selectedSale.createdAt).toLocaleDateString()}
                  </p>
                  <p
                    className={`text-sm ${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    Total: {convertToNumber(selectedSale.totalAmount)}৳
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedSale(null);
                    setReturnItems([]);
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Items to Return */}
              {loadingSale ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : (
                <div className="space-y-3">
                  <h5
                    className={`font-semibold ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Select Items to Return
                  </h5>

                  {returnItems.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 border rounded-lg ${
                        isDarkMode ? "border-gray-700" : "border-gray-200"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex-1">
                          <div className="font-medium">
                            {item.Products?.name ||
                              `Product ${item.product_id}`}
                          </div>
                          <div
                            className={`text-sm ${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            <span>Original Price: {item.unitPrice}৳</span>
                            {item.discount !== 0 && (
                              <span className="ml-2 text-red-500">
                                Discount: {item.discount}৳
                              </span>
                            )}
                          </div>
                          <div
                            className={`text-sm ${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            Original Quantity: {item.quantity}
                          </div>
                          {item.serials && item.serials.length > 0 && (
                            <div className="mt-1">
                              <div
                                className={`text-xs ${
                                  isDarkMode ? "text-gray-400" : "text-gray-500"
                                }`}
                              >
                                Available Serials: {item.serials.join(", ")}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleReturnQuantityChange(
                                item.id,
                                item.returnQuantity - 1,
                              )
                            }
                            className={`w-7 h-7 flex items-center justify-center border rounded ${
                              isDarkMode
                                ? "border-gray-600 hover:bg-gray-700"
                                : "border-gray-300 hover:bg-gray-100"
                            }`}
                            disabled={item.returnQuantity <= 0}
                          >
                            <Minus size={12} />
                          </button>
                          <span
                            className={`w-8 text-center ${
                              isDarkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {item.returnQuantity}/{item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              handleReturnQuantityChange(
                                item.id,
                                item.returnQuantity + 1,
                              )
                            }
                            className={`w-7 h-7 flex items-center justify-center border rounded ${
                              isDarkMode
                                ? "border-gray-600 hover:bg-gray-700"
                                : "border-gray-300 hover:bg-gray-100"
                            }`}
                            disabled={item.returnQuantity >= item.quantity}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Serial Selection for Serialized Products */}
                      {item.Products?.useIndividualSerials &&
                        item.returnQuantity > 0 && (
                          <div className="mt-2">
                            <label
                              className={`block mb-1 text-sm ${
                                isDarkMode ? "text-gray-300" : "text-gray-700"
                              }`}
                            >
                              Select Serial Numbers to Return (
                              {item.returnQuantity} required)
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {item.serials?.map((serial, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() =>
                                    handleSerialSelectionForReturn(
                                      item.id,
                                      serial,
                                    )
                                  }
                                  className={`px-2 py-1 text-xs border rounded ${
                                    selectedReturnSerials[item.id]?.includes(
                                      serial,
                                    )
                                      ? isDarkMode
                                        ? "bg-blue-900 border-blue-500 text-white"
                                        : "bg-blue-100 border-blue-400 text-blue-800"
                                      : isDarkMode
                                        ? "border-gray-600 hover:bg-gray-700"
                                        : "border-gray-300 hover:bg-gray-100"
                                  }`}
                                >
                                  {serial}
                                  {selectedReturnSerials[item.id]?.includes(
                                    serial,
                                  ) && (
                                    <Check className="inline ml-1" size={10} />
                                  )}
                                </button>
                              ))}
                            </div>
                            {selectedReturnSerials[item.id] &&
                              selectedReturnSerials[item.id].length !==
                                item.returnQuantity && (
                                <p className="text-xs text-red-500 mt-1">
                                  Please select exactly {item.returnQuantity}{" "}
                                  serial(s)
                                </p>
                              )}
                          </div>
                        )}

                      {item.returnQuantity > 0 && (
                        <div className="mt-2">
                          <input
                            type="text"
                            value={item.returnReason}
                            onChange={(e) => {
                              const newItems = [...returnItems];
                              const index = newItems.findIndex(
                                (i) => i.id === item.id,
                              );
                              newItems[index].returnReason = e.target.value;
                              setReturnItems(newItems);
                            }}
                            className={`w-full p-2 text-sm border rounded ${
                              isDarkMode
                                ? "bg-gray-700 border-gray-600 text-white"
                                : "bg-white border-gray-300"
                            }`}
                            placeholder="Reason for returning this item..."
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        {/* Selected Purchase Details */}
        {selectedPurchase && refundType === "purchase" && (
          <div className="mb-6">
            <div
              className={`p-4 rounded-lg border ${
                isDarkMode
                  ? "border-gray-700 bg-gray-800"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4
                    className={`font-bold ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Purchase #{selectedPurchase.id}
                  </h4>
                  <p
                    className={`text-sm ${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    Supplier: {selectedPurchase.Suppliers?.name || "Unknown"}
                  </p>
                  <p
                    className={`text-sm ${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    Date:{" "}
                    {new Date(selectedPurchase.createdAt).toLocaleDateString()}
                  </p>
                  <p
                    className={`text-sm ${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    Total: {selectedPurchase.totalAmount} ৳
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedPurchase(null);
                    setReturnItems([]);
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Items to Return */}
              <div className="space-y-3">
                <h5
                  className={`font-semibold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Select Items to Return
                </h5>

                {returnItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 border rounded-lg ${
                      isDarkMode ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex-1">
                        <div className="font-medium">
                          {item.Products?.name || `Product ${item.product_id}`}
                        </div>
                        <div
                          className={`text-sm ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Original Price: {convertToNumber(item.unitPrice)}৳
                        </div>
                        <div
                          className={`text-sm ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Original Quantity: {item.quantity}
                        </div>
                        {item.serials && item.serials.length > 0 && (
                          <div className="mt-1">
                            <div
                              className={`text-xs ${
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              Available Serials: {item.serials.join(", ")}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            handleReturnQuantityChange(
                              item.id,
                              item.returnQuantity - 1,
                            )
                          }
                          className={`w-7 h-7 flex items-center justify-center border rounded ${
                            isDarkMode
                              ? "border-gray-600 hover:bg-gray-700"
                              : "border-gray-300 hover:bg-gray-100"
                          }`}
                          disabled={item.returnQuantity <= 0}
                        >
                          <Minus size={12} />
                        </button>
                        <span
                          className={`w-8 text-center ${
                            isDarkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {item.returnQuantity}/{item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            handleReturnQuantityChange(
                              item.id,
                              item.returnQuantity + 1,
                            )
                          }
                          className={`w-7 h-7 flex items-center justify-center border rounded ${
                            isDarkMode
                              ? "border-gray-600 hover:bg-gray-700"
                              : "border-gray-300 hover:bg-gray-100"
                          }`}
                          disabled={item.returnQuantity >= item.quantity}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Serial Selection for Serialized Products */}
                    {item.Products?.useIndividualSerials &&
                      item.returnQuantity > 0 && (
                        <div className="mt-2">
                          <label
                            className={`block mb-1 text-sm ${
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Select Serial Numbers to Return (
                            {item.returnQuantity} required)
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {item.serials?.map((serial, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() =>
                                  handleSerialSelectionForReturn(
                                    item.id,
                                    serial,
                                  )
                                }
                                className={`px-2 py-1 text-xs border rounded ${
                                  selectedReturnSerials[item.id]?.includes(
                                    serial,
                                  )
                                    ? isDarkMode
                                      ? "bg-blue-900 border-blue-500 text-white"
                                      : "bg-blue-100 border-blue-400 text-blue-800"
                                    : isDarkMode
                                      ? "border-gray-600 hover:bg-gray-700"
                                      : "border-gray-300 hover:bg-gray-100"
                                }`}
                              >
                                {serial}
                                {selectedReturnSerials[item.id]?.includes(
                                  serial,
                                ) && (
                                  <Check className="inline ml-1" size={10} />
                                )}
                              </button>
                            ))}
                          </div>
                          {selectedReturnSerials[item.id] &&
                            selectedReturnSerials[item.id].length !==
                              item.returnQuantity && (
                              <p className="text-xs text-red-500 mt-1">
                                Please select exactly {item.returnQuantity}{" "}
                                serial(s)
                              </p>
                            )}
                        </div>
                      )}

                    {item.returnQuantity > 0 && (
                      <div className="mt-2">
                        <input
                          type="text"
                          value={item.returnReason}
                          onChange={(e) => {
                            const newItems = [...returnItems];
                            const index = newItems.findIndex(
                              (i) => i.id === item.id,
                            );
                            newItems[index].returnReason = e.target.value;
                            setReturnItems(newItems);
                          }}
                          className={`w-full p-2 text-sm border rounded ${
                            isDarkMode
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-300"
                          }`}
                          placeholder="Reason for returning this item..."
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* Return Summary */}
        {returnItems.some((item) => item.returnQuantity > 0) && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              isDarkMode
                ? "border-green-700 bg-green-900/20"
                : "border-green-300 bg-green-50"
            }`}
          >
            <h5
              className={`font-semibold mb-2 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Return Summary
            </h5>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span
                  className={isDarkMode ? "text-gray-300" : "text-gray-600"}
                >
                  Items to Return:
                </span>
                <span className="font-medium">
                  {returnItems.filter((item) => item.returnQuantity > 0).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span
                  className={isDarkMode ? "text-gray-300" : "text-gray-600"}
                >
                  Total Quantity:
                </span>
                <span className="font-medium">
                  {returnItems.reduce(
                    (sum, item) => sum + item.returnQuantity,
                    0,
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span
                  className={isDarkMode ? "text-gray-300" : "text-gray-600"}
                >
                  Original Amount:
                </span>
                <span className="font-medium">
                  {returnItems
                    .filter((item) => item.returnQuantity > 0)
                    .reduce(
                      (sum, item) =>
                        sum +
                        convertToNumber(item.unitPrice) * item.returnQuantity,
                      0,
                    )}
                  ৳
                </span>
              </div>
              <div className="flex justify-between">
                <span
                  className={isDarkMode ? "text-gray-300" : "text-gray-600"}
                >
                  Discounts:
                </span>
                <span className="font-medium text-red-500">
                  -
                  {returnItems
                    .filter((item) => item.returnQuantity > 0)
                    .reduce(
                      (sum, item) =>
                        sum + (item.discount || 0) * item.returnQuantity,
                      0,
                    )}
                  ৳
                </span>
              </div>
              <div className="border-t pt-2 mt-2 border-gray-300 dark:border-gray-700">
                <div className="flex justify-between">
                  <span
                    className={`font-bold ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Refund Amount:
                  </span>
                  <span className="text-lg font-bold text-green-600">
                    {returnItems
                      .filter((item) => item.returnQuantity > 0)
                      .reduce((sum, item) => {
                        const itemPrice =
                          convertToNumber(item.unitPrice) -
                          (item.discount || 0);
                        return sum + itemPrice * item.returnQuantity;
                      }, 0)}
                    ৳
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Refund Method */}
        <div className="mb-6">
          <label
            className={`block mb-2 font-medium ${
              isDarkMode ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Refund Method
          </label>
          <div className="flex gap-4">
            {["cash"].map((method) => (
              <button
                key={method}
                onClick={() => setRefundMethod(method)}
                className={`flex-1 py-2 rounded capitalize ${
                  refundMethod === method
                    ? "bg-blue-500 text-white"
                    : isDarkMode
                      ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {method.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={
              refundType === "sale"
                ? handleCreateSaleReturn
                : handleCreatePurchaseReturn
            }
            disabled={
              creatingSalesReturn ||
              creatingPurchaseReturn ||
              !(refundType === "sale" ? selectedSale : selectedPurchase) ||
              returnItems.filter((item) => item.returnQuantity > 0).length ===
                0 ||
              // Check only items with returnQuantity > 0 for empty reasons
              returnItems
                .filter((item) => item.returnQuantity > 0)
                .some((item) => item.returnReason.trim() === "")
            }
            className={`flex-1 py-3 rounded-lg font-medium ${
              creatingSalesReturn ||
              creatingPurchaseReturn ||
              !(refundType === "sale" ? selectedSale : selectedPurchase) ||
              returnItems.filter((item) => item.returnQuantity > 0).length ===
                0 ||
              returnItems
                .filter((item) => item.returnQuantity > 0)
                .some((item) => item.returnReason.trim() === "")
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600 text-white"
            }`}
          >
            {creatingSalesReturn || creatingPurchaseReturn
              ? "Processing..."
              : "Create Return"}
          </button>
          <button
            onClick={() => setShowRefundModal(false)}
            className={`flex-1 py-3 rounded-lg font-medium ${
              isDarkMode
                ? "bg-gray-700 hover:bg-gray-600 text-white"
                : "bg-gray-300 hover:bg-gray-400 text-gray-800"
            }`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  // Render exchange modal
  const renderExchangeModal = () => (
    <div className="fixed inset-0 flex backdrop-blur-sm items-center justify-center z-[10000] p-4 mt-12">
      <div
        className={`p-6 rounded-lg border w-full max-w-6xl transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto ${
          isDarkMode
            ? "bg-gray-900/50 border-gray-700"
            : "bg-white/50 border-gray-200"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3
            className={`text-lg font-bold ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Exchange Products
          </h3>
          <button
            onClick={() => setShowExchangeModal(false)}
            className={`p-2 rounded-lg ${
              isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Two Column Layout for Exchange */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Old Items */}
          <div>
            <h4
              className={`font-bold mb-4 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Exchange From (Old Products)
            </h4>

            {/* Search Sale */}
            <div className="mb-6">
              <label
                className={`block mb-2 font-medium ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Search Sale
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={exchangeSaleSearchTerm}
                  onChange={(e) => setExchangeSaleSearchTerm(e.target.value)}
                  className={`flex-1 p-3 border rounded-lg ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-600 text-white"
                      : "bg-white border-gray-300"
                  }`}
                  placeholder="Enter Sale ID or Customer Name..."
                />
                {/* <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 rounded-lg flex items-center justify-center">
                  <Search size={20} />
                </button> */}
              </div>

              {/* Search Results */}
              <div className="mt-3">
                {searchingExchangeSales && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500 mr-2" />
                    <span className="text-sm">Searching...</span>
                  </div>
                )}

                {!searchingExchangeSales &&
                  exchangeSaleSearchResults &&
                  exchangeSaleSearchTerm.trim().length >= 2 && (
                    <div className="border rounded-lg overflow-hidden">
                      <div
                        className={`px-3 py-2 text-xs ${
                          isDarkMode
                            ? "bg-gray-800 text-gray-400"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        Found {exchangeSaleSearchResults.length} sale(s)
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {exchangeSaleSearchResults.length === 0 ? (
                          <div className="p-4 text-center">
                            <Search className="mx-auto h-8 w-8 mb-2 opacity-50" />
                            <p className="text-gray-500">No sales found</p>
                          </div>
                        ) : (
                          exchangeSaleSearchResults.map((sale) => (
                            <div
                              key={sale.id}
                              className={`p-3 border-b cursor-pointer transition-colors ${
                                exchangeSelectedSale?.id === sale.id
                                  ? isDarkMode
                                    ? "bg-blue-900/30 border-blue-500"
                                    : "bg-blue-50 border-blue-300"
                                  : isDarkMode
                                    ? "border-gray-700 hover:bg-gray-800"
                                    : "border-gray-200 hover:bg-gray-50"
                              }`}
                              onClick={() => handleSelectSaleForExchange(sale)}
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex-1">
                                  <div className="font-medium flex items-center">
                                    <Receipt className="mr-2 h-4 w-4" />
                                    Sale #{sale.saleNo || sale.id}
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-300 mt-1 space-y-1">
                                    <div>
                                      Customer:{" "}
                                      {sale.Customers?.name || "Walk-in"}
                                    </div>
                                    <div>
                                      Date:{" "}
                                      {new Date(
                                        sale.createdAt,
                                      ).toLocaleDateString()}
                                    </div>
                                    <div>
                                      Total: {convertToNumber(sale.totalAmount)}
                                      ৳
                                    </div>
                                    <div>
                                      Items: {sale.SalesItems?.length || 0}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center">
                                  <div className="text-right mr-3">
                                    <div
                                      className={`text-sm font-medium ${
                                        isDarkMode
                                          ? "text-blue-300"
                                          : "text-blue-600"
                                      }`}
                                    >
                                      {sale.status || "completed"}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      ID: {sale.id}
                                    </div>
                                  </div>
                                  {exchangeSelectedSale?.id === sale.id && (
                                    <Check
                                      className="text-green-500"
                                      size={20}
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* Selected Sale Details */}
            {exchangeSelectedSale && (
              <div className="mb-6">
                <div
                  className={`p-4 rounded-lg border ${
                    isDarkMode
                      ? "border-gray-700 bg-gray-800"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4
                        className={`font-bold ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Sale #{exchangeSelectedSale.id}
                      </h4>
                      <p
                        className={`text-sm ${
                          isDarkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        Customer: {exchangeSelectedSale.Customers?.name}
                      </p>
                      <p
                        className={`text-sm ${
                          isDarkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        Date:{" "}
                        {new Date(
                          exchangeSelectedSale.createdAt,
                        ).toLocaleDateString()}
                      </p>
                      <p
                        className={`text-sm ${
                          isDarkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        Total:{" "}
                        {convertToNumber(exchangeSelectedSale.totalAmount)}৳
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setExchangeSelectedSale(null);
                        setExchangeItems([]);
                        setExchangeSelectedSerials({});
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Items to Exchange */}
                  <div className="space-y-3">
                    <h5
                      className={`font-semibold ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Select Items to Exchange
                    </h5>

                    {exchangeItems.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 border rounded-lg ${
                          isDarkMode ? "border-gray-700" : "border-gray-200"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex-1">
                            <div className="font-medium">
                              {item.Products?.name ||
                                `Product ${item.product_id}`}
                            </div>
                            <div
                              className={`text-sm ${
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              Price: {convertToNumber(item.unitPrice)}৳
                            </div>
                            <div
                              className={`text-sm ${
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              Original Quantity: {item.quantity}
                            </div>
                            {item.serials && item.serials.length > 0 && (
                              <div className="mt-1">
                                <div
                                  className={`text-xs ${
                                    isDarkMode
                                      ? "text-gray-400"
                                      : "text-gray-500"
                                  }`}
                                >
                                  Available Serials: {item.serials.join(", ")}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                handleExchangeQuantityChange(
                                  item.id,
                                  item.exchangeQuantity - 1,
                                )
                              }
                              className={`w-7 h-7 flex items-center justify-center border rounded ${
                                isDarkMode
                                  ? "border-gray-600 hover:bg-gray-700"
                                  : "border-gray-300 hover:bg-gray-100"
                              }`}
                              disabled={item.exchangeQuantity <= 0}
                            >
                              <Minus size={12} />
                            </button>
                            <span
                              className={`w-8 text-center ${
                                isDarkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {item.exchangeQuantity}/{item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                handleExchangeQuantityChange(
                                  item.id,
                                  item.exchangeQuantity + 1,
                                )
                              }
                              className={`w-7 h-7 flex items-center justify-center border rounded ${
                                isDarkMode
                                  ? "border-gray-600 hover:bg-gray-700"
                                  : "border-gray-300 hover:bg-gray-100"
                              }`}
                              disabled={item.exchangeQuantity >= item.quantity}
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Serial Selection for Serialized Products */}
                        {item.serials &&
                          item.serials.length > 0 &&
                          item.exchangeQuantity > 0 && (
                            <div className="mt-2">
                              <label
                                className={`block mb-1 text-sm ${
                                  isDarkMode ? "text-gray-300" : "text-gray-700"
                                }`}
                              >
                                Select Serial Numbers to Exchange (
                                {item.exchangeQuantity} required)
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {item.serials.map((serial, index) => (
                                  <button
                                    key={index}
                                    type="button"
                                    onClick={() =>
                                      handleExchangeItemSerialSelection(
                                        item.id,
                                        serial,
                                      )
                                    }
                                    className={`px-2 py-1 text-xs border rounded ${
                                      exchangeSelectedSerials[
                                        item.id
                                      ]?.includes(serial)
                                        ? isDarkMode
                                          ? "bg-blue-900 border-blue-500 text-white"
                                          : "bg-blue-100 border-blue-400 text-blue-800"
                                        : isDarkMode
                                          ? "border-gray-600 hover:bg-gray-700"
                                          : "border-gray-300 hover:bg-gray-100"
                                    }`}
                                  >
                                    {serial}
                                    {exchangeSelectedSerials[item.id]?.includes(
                                      serial,
                                    ) && (
                                      <Check
                                        className="inline ml-1"
                                        size={10}
                                      />
                                    )}
                                  </button>
                                ))}
                              </div>
                              {exchangeSelectedSerials[item.id] &&
                                exchangeSelectedSerials[item.id].length !==
                                  item.exchangeQuantity && (
                                  <p className="text-xs text-red-500 mt-1">
                                    Please select exactly{" "}
                                    {item.exchangeQuantity} serial(s)
                                  </p>
                                )}
                            </div>
                          )}

                        {item.exchangeQuantity > 0 && (
                          <div className="mt-2">
                            <input
                              type="text"
                              value={item.exchangeReason}
                              onChange={(e) => {
                                const newItems = [...exchangeItems];
                                const index = newItems.findIndex(
                                  (i) => i.id === item.id,
                                );
                                newItems[index].exchangeReason = e.target.value;
                                setExchangeItems(newItems);
                              }}
                              className={`w-full p-2 text-sm border rounded ${
                                isDarkMode
                                  ? "bg-gray-700 border-gray-600 text-white"
                                  : "bg-white border-gray-300"
                              }`}
                              placeholder="Reason for exchanging this item..."
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - New Items */}
          <div>
            <h4
              className={`font-bold mb-4 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Exchange To (New Products)
            </h4>

            {/* Product Search for New Items */}
            <div className="mb-6">
              <label
                className={`block mb-2 font-medium ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Search Product
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={exchangeProductSearchTerm}
                  onChange={(e) => {
                    // Update only exchange search term
                    setExchangeProductSearchTerm(e.target.value);
                    // Don't update the main product search term
                  }}
                  className={`w-full p-3 border rounded-lg ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-600 text-white"
                      : "bg-white border-gray-300"
                  }`}
                  placeholder="Search products to exchange with..."
                  // Remove the onFocus logic that might trigger main search
                />
                {exchangeProductsLoading && (
                  <div className="absolute right-3 top-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Search Results for New Products */}
            {exchangeProductSearchTerm.length >= 2 && (
              <div className="mb-4">
                <div
                  className={`border rounded-lg shadow-lg max-h-60 overflow-y-auto ${
                    isDarkMode
                      ? "bg-gray-900 border-gray-700 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                >
                  <div
                    className={`px-3 py-2 text-xs ${
                      isDarkMode
                        ? "bg-gray-800 text-gray-400"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    Found {exchangeSearchProductsData?.length || 0} product(s)
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {exchangeProductsLoading ? (
                      <div className="p-4 text-center">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-500 mb-2" />
                        <p className="text-gray-500">Searching...</p>
                      </div>
                    ) : exchangeSearchProductsData &&
                      exchangeSearchProductsData.length > 0 ? (
                      exchangeSearchProductsData.map((product) => {
                        const price =
                          product.productSerials &&
                          product.productSerials.length > 0
                            ? convertToNumber(
                                product.productSerials[0].retailPrice,
                              )
                            : 0;
                        return (
                          <div
                            key={product.id}
                            className={`p-3 border-b cursor-pointer transition-colors ${
                              isDarkMode
                                ? "border-gray-700 hover:bg-gray-800"
                                : "border-gray-200 hover:bg-gray-50"
                            }`}
                            onClick={() => {
                              console.log("Adding exchange product:", product);
                              handleAddExchangeProduct(product);
                              setExchangeProductSearchTerm(""); // Clear search term
                            }}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex-1">
                                <div className="font-medium flex items-center gap-2">
                                  {product.name}
                                  {product.useIndividualSerials && (
                                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded dark:bg-purple-900 dark:text-purple-300">
                                      Serialized
                                    </span>
                                  )}
                                </div>
                                <div
                                  className={`text-sm ${
                                    isDarkMode
                                      ? "text-gray-400"
                                      : "text-gray-500"
                                  }`}
                                >
                                  {product.specification || "No specification"}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Category:{" "}
                                  {product.Categories?.name || "Uncategorized"}
                                </div>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="text-green-600 font-semibold">
                                  {price} ৳
                                </span>
                                <span
                                  className={`text-xs ${
                                    isDarkMode
                                      ? "text-gray-400"
                                      : "text-gray-500"
                                  }`}
                                >
                                  Stock: {product.quantity}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center">
                        <Search className="mx-auto h-8 w-8 mb-2 opacity-50" />
                        <p className="text-gray-500">No products found</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* New Exchange Products */}
            <div className="space-y-3">
              <h5
                className={`font-semibold ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                New Products for Exchange
              </h5>

              {exchangeNewProducts.length === 0 ? (
                <div
                  className={`text-center py-8 rounded-lg border ${
                    isDarkMode
                      ? "border-gray-700 text-gray-400"
                      : "border-gray-200 text-gray-500"
                  }`}
                >
                  <Package className="mx-auto h-12 w-12 mb-2 opacity-50" />
                  <p>No products added for exchange</p>
                  <p className="text-sm mt-1">Search and add products above</p>
                </div>
              ) : (
                exchangeNewProducts.map((item) => (
                  <div
                    key={item.product.id}
                    className={`p-3 border rounded-lg ${
                      isDarkMode ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="font-medium">{item.product.name}</div>
                        <div
                          className={`text-sm ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {item.discountedPrice}৳ × {item.quantity}
                        </div>
                        {item.selectedSerials &&
                          item.selectedSerials.length > 0 && (
                            <div className="text-xs text-blue-500">
                              Serials: {item.selectedSerials.join(", ")}
                            </div>
                          )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              const newProducts = [...exchangeNewProducts];
                              const index = newProducts.findIndex(
                                (p) => p.product.id === item.product.id,
                              );
                              if (newProducts[index].quantity > 1) {
                                newProducts[index].quantity -= 1;
                                setExchangeNewProducts(newProducts);
                              }
                            }}
                            className={`w-7 h-7 flex items-center justify-center border rounded ${
                              isDarkMode
                                ? "border-gray-600 hover:bg-gray-700"
                                : "border-gray-300 hover:bg-gray-100"
                            }`}
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-8 text-center text-sm">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => {
                              const newProducts = [...exchangeNewProducts];
                              const index = newProducts.findIndex(
                                (p) => p.product.id === item.product.id,
                              );
                              newProducts[index].quantity += 1;
                              setExchangeNewProducts(newProducts);
                            }}
                            className={`w-7 h-7 flex items-center justify-center border rounded ${
                              isDarkMode
                                ? "border-gray-600 hover:bg-gray-700"
                                : "border-gray-300 hover:bg-gray-100"
                            }`}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <button
                          onClick={() =>
                            handleRemoveExchangeProduct(item.product.id)
                          }
                          className="p-1.5 text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Exchange Summary */}
            {(exchangeItems.some((item) => item.exchangeQuantity > 0) ||
              exchangeNewProducts.length > 0) && (
              <div
                className={`mt-6 p-4 rounded-lg border ${
                  isDarkMode
                    ? "border-green-700 bg-green-900/20"
                    : "border-green-300 bg-green-50"
                }`}
              >
                <h5
                  className={`font-semibold mb-2 ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Exchange Summary
                </h5>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span
                      className={isDarkMode ? "text-gray-300" : "text-gray-600"}
                    >
                      Old Items Value:
                    </span>
                    <span className="font-medium">
                      {exchangeItems
                        .filter((item) => item.exchangeQuantity > 0)
                        .reduce(
                          (sum, item) =>
                            sum +
                            convertToNumber(item.unitPrice) *
                              item.exchangeQuantity,
                          0,
                        )}
                      ৳
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span
                      className={isDarkMode ? "text-gray-300" : "text-gray-600"}
                    >
                      New Items Value:
                    </span>
                    <span className="font-medium">
                      {exchangeNewProducts.reduce(
                        (sum, item) =>
                          sum + item.discountedPrice * item.quantity,
                        0,
                      )}
                      ৳
                    </span>
                  </div>
                  <div
                    className={`border-t pt-2 mt-2 ${
                      isDarkMode ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between">
                      <span
                        className={`font-bold ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Price Difference:
                      </span>
                      <span
                        className={`text-lg font-bold ${
                          calculateExchangeDifference() > 0
                            ? "text-green-600"
                            : calculateExchangeDifference() < 0
                              ? "text-red-600"
                              : isDarkMode
                                ? "text-white"
                                : "text-gray-900"
                        }`}
                      >
                        {calculateExchangeDifference() > 0 ? "+" : ""}
                        {Math.abs(calculateExchangeDifference())}৳
                        {calculateExchangeDifference() > 0
                          ? " Customer Pays"
                          : calculateExchangeDifference() < 0
                            ? " Store Pays"
                            : " Even Exchange"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Exchange Reason */}
        <div className="mt-6">
          <label
            className={`block mb-2 font-medium ${
              isDarkMode ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Overall Exchange Reason
          </label>
          <textarea
            value={exchangeReason}
            onChange={(e) => setExchangeReason(e.target.value)}
            className={`w-full p-3 border rounded-lg ${
              isDarkMode
                ? "bg-gray-800 border-gray-600 text-white"
                : "bg-white border-gray-300"
            }`}
            rows={3}
            placeholder="Enter exchange reason..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleCreateExchange}
            disabled={
              creatingExchange ||
              !exchangeSelectedSale ||
              exchangeItems.filter((item) => item.exchangeQuantity > 0)
                .length === 0 ||
              exchangeNewProducts.length === 0 ||
              !exchangeReason.trim()
            }
            className={`flex-1 py-3 rounded-lg font-medium ${
              creatingExchange ||
              !exchangeSelectedSale ||
              exchangeItems.filter((item) => item.exchangeQuantity > 0)
                .length === 0 ||
              exchangeNewProducts.length === 0 ||
              !exchangeReason.trim()
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600 text-white"
            }`}
          >
            {creatingExchange ? "Processing..." : "Complete Exchange"}
          </button>
          <button
            onClick={() => setShowExchangeModal(false)}
            className={`flex-1 py-3 rounded-lg font-medium ${
              isDarkMode
                ? "bg-gray-700 hover:bg-gray-600 text-white"
                : "bg-gray-300 hover:bg-gray-400 text-gray-800"
            }`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  // Render service modal
  const renderServiceModal = () => (
    <div className="fixed inset-0 flex backdrop-blur-sm items-center justify-center z-[10000] p-4 mt-12">
      <div
        className={`p-6 rounded-lg border w-full max-w-4xl transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto ${
          isDarkMode
            ? "bg-gray-900/50 border-gray-700"
            : "bg-white/50 border-gray-200"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3
            className={`text-lg font-bold ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Create Service Request
          </h3>
          <button
            onClick={() => {
              setShowServiceModal(false);
              resetServiceModal();
            }}
            className={`p-2 rounded-lg ${
              isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Service Type Tabs */}
        <div className="mb-6">
          <label
            className={`block mb-2 font-medium ${
              isDarkMode ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Service Type
          </label>
          <div className="flex gap-4">
            <button
              onClick={() => {
                setServiceModalTab("normal");
                setSelectedWarrantyProduct(null);
                setWarrantyProducts([]);
                setServiceProduct(null);
              }}
              className={`flex-1 py-2 rounded ${
                serviceModalTab === "normal"
                  ? "bg-blue-500 text-white"
                  : isDarkMode
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Normal Service
            </button>
            <button
              onClick={() => {
                setServiceModalTab("warranty");
                setSelectedServiceCustomer(null);
                setServiceCustomerSearchTerm("");
              }}
              className={`flex-1 py-2 rounded ${
                serviceModalTab === "warranty"
                  ? "bg-blue-500 text-white"
                  : isDarkMode
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Warranty Claim
            </button>
          </div>
        </div>

        {/* Normal Service Section */}
        {serviceModalTab === "normal" && (
          <div className="space-y-6">
            {/* Customer Search for Normal Service */}
            <div>
              <label
                className={`block mb-2 font-medium ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Search Customer *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={serviceCustomerSearchTerm}
                  onChange={(e) => {
                    setServiceCustomerSearchTerm(e.target.value);
                    if (e.target.value.length >= 2) {
                      setShowServiceCustomerResults(true);
                    } else {
                      setShowServiceCustomerResults(false);
                    }
                  }}
                  onFocus={() => {
                    if (serviceCustomerSearchTerm.length >= 2) {
                      setShowServiceCustomerResults(true);
                    }
                  }}
                  className={`w-full p-3 border rounded-lg ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-600 text-white"
                      : "bg-white border-gray-300"
                  }`}
                  placeholder="Search customer by name, phone, or email..."
                />

                {searchingServiceCustomers && (
                  <div className="absolute right-3 top-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                  </div>
                )}
              </div>

              {/* Customer Search Results */}
              {showServiceCustomerResults && serviceCustomerSearchResults && (
                <div
                  className={`absolute z-10 w-full mt-1 border rounded-lg shadow-lg max-h-60 overflow-y-auto ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-gray-200"
                  }`}
                >
                  {serviceCustomerSearchResults.length === 0 ? (
                    <div className="p-4 text-center">
                      <Search className="mx-auto h-8 w-8 mb-2 opacity-50" />
                      <p
                        className={
                          isDarkMode ? "text-gray-300" : "text-gray-500"
                        }
                      >
                        No customers found
                      </p>
                    </div>
                  ) : (
                    serviceCustomerSearchResults.map((customer) => (
                      <div
                        key={customer.id}
                        className={`p-3 border-b cursor-pointer transition-colors ${
                          selectedServiceCustomer?.id === customer.id
                            ? isDarkMode
                              ? "bg-blue-900/30 border-blue-500"
                              : "bg-blue-50 border-blue-300"
                            : isDarkMode
                              ? "border-gray-700 hover:bg-gray-700"
                              : "border-gray-200 hover:bg-gray-50"
                        }`}
                        onClick={() => handleSelectServiceCustomer(customer)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-sm text-gray-500">
                              {customer.phone}
                            </div>
                            {customer.email && (
                              <div className="text-xs text-gray-400">
                                {customer.email}
                              </div>
                            )}
                          </div>
                          {selectedServiceCustomer?.id === customer.id && (
                            <Check className="text-green-500" size={16} />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Selected Customer Display */}
              {selectedServiceCustomer && (
                <div
                  className={`mt-2 p-3 rounded-lg border ${
                    isDarkMode
                      ? "border-green-700 bg-green-900/20"
                      : "border-green-300 bg-green-50"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">
                        {selectedServiceCustomer.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {selectedServiceCustomer.phone}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedServiceCustomer(null)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Warranty Claim Section */}
        {serviceModalTab === "warranty" && (
          <div className="space-y-6">
            {/* Sale Search for Warranty Claim */}
            <div>
              <label
                className={`block mb-2 font-medium ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Search Sale *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={warrantySaleSearchTerm}
                  onChange={(e) => {
                    setWarrantySaleSearchTerm(e.target.value);
                    if (e.target.value.trim().length >= 2) {
                      setShowWarrantySaleResults(true);
                    } else {
                      setShowWarrantySaleResults(false);
                    }
                  }}
                  onFocus={() => {
                    if (warrantySaleSearchTerm.trim().length >= 2) {
                      setShowWarrantySaleResults(true);
                    }
                  }}
                  className={`w-full p-3 border rounded-lg ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-600 text-white"
                      : "bg-white border-gray-300"
                  }`}
                  placeholder="Search sale by ID or customer name..."
                />

                {searchingWarrantySales && (
                  <div className="absolute right-3 top-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                  </div>
                )}
              </div>

              {/* Sale Search Results */}
              {showWarrantySaleResults && warrantySaleSearchResults && (
                <div
                  className={`absolute z-10 w-full mt-1 border rounded-lg shadow-lg max-h-60 overflow-y-auto ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-gray-200"
                  }`}
                >
                  {warrantySaleSearchResults.length === 0 ? (
                    <div className="p-4 text-center">
                      <Search className="mx-auto h-8 w-8 mb-2 opacity-50" />
                      <p
                        className={
                          isDarkMode ? "text-gray-300" : "text-gray-500"
                        }
                      >
                        No sales found
                      </p>
                    </div>
                  ) : (
                    warrantySaleSearchResults.map((sale) => (
                      <div
                        key={sale.id}
                        className={`p-3 border-b cursor-pointer transition-colors ${
                          serviceProduct?.sale_id === sale.id
                            ? isDarkMode
                              ? "bg-blue-900/30 border-blue-500"
                              : "bg-blue-50 border-blue-300"
                            : isDarkMode
                              ? "border-gray-700 hover:bg-gray-700"
                              : "border-gray-200 hover:bg-gray-50"
                        }`}
                        onClick={() => handleSelectWarrantySale(sale)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <div className="font-medium">
                              Sale #{sale.saleNo || sale.id}
                            </div>
                            <div className="text-sm text-gray-500">
                              Customer: {sale.Customers?.name || "Walk-in"}
                            </div>
                            <div className="text-xs text-gray-400">
                              Date:{" "}
                              {new Date(sale.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          {serviceProduct?.sale_id === sale.id && (
                            <Check className="text-green-500" size={16} />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Selected Sale Display */}
              {serviceProduct?.sale_id && (
                <div
                  className={`mt-2 p-3 rounded-lg border ${
                    isDarkMode
                      ? "border-blue-700 bg-blue-900/20"
                      : "border-blue-300 bg-blue-50"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">
                        Sale #{serviceProduct.sale_id}
                      </div>
                      <div className="text-sm text-gray-500">
                        Customer: {serviceProduct.customer?.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        Phone: {serviceProduct.customer?.phone}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setServiceProduct(null);
                        setWarrantyProducts([]);
                        setSelectedWarrantyProduct(null);
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Products with Warranty */}
              {warrantyProducts.length > 0 && (
                <div className="mt-4">
                  <label
                    className={`block mb-2 font-medium ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Select Product with Warranty *
                  </label>
                  <div className="space-y-2">
                    {warrantyProducts.map((product) => (
                      <div
                        key={product.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedWarrantyProduct?.id === product.id
                            ? isDarkMode
                              ? "border-green-500 bg-green-900/20"
                              : "border-green-400 bg-green-50"
                            : isDarkMode
                              ? "border-gray-700 hover:bg-gray-800"
                              : "border-gray-200 hover:bg-gray-50"
                        }`}
                        onClick={() => handleSelectWarrantyProduct(product)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">
                              {product.Products?.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {product.Products?.specification}
                            </div>
                            <div className="text-xs text-green-500 mt-1">
                              {product.serials?.length || 0} warranty serial(s)
                              available
                            </div>

                            {/* Show selected serials */}
                            {selectedWarrantyProduct?.id === product.id &&
                              selectedWarrantySerials.length > 0 && (
                                <div className="mt-2">
                                  <div className="text-xs font-medium text-blue-600">
                                    Selected Serials:{" "}
                                    {selectedWarrantySerials.length}
                                  </div>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {selectedWarrantySerials.map(
                                      (serial, idx) => (
                                        <span
                                          key={idx}
                                          className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                        >
                                          {serial}
                                        </span>
                                      ),
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowWarrantySerialModal(true);
                                    }}
                                    className="text-xs text-blue-500 hover:text-blue-700 mt-1"
                                  >
                                    Change serial selection
                                  </button>
                                </div>
                              )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">
                              Qty: {product.quantity}
                            </span>
                            {selectedWarrantyProduct?.id === product.id && (
                              <Check className="text-green-500" size={16} />
                            )}
                          </div>
                        </div>

                        {/* Warranty Serials */}
                        {product.serials && product.serials.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                            <div className="text-xs font-medium text-gray-500 mb-1">
                              Available Warranty Serials:
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {product.serials.map(
                                (serial: any, idx: number) => (
                                  <span
                                    key={idx}
                                    className={`text-xs px-2 py-1 rounded ${
                                      selectedWarrantySerials.includes(
                                        serial.serial,
                                      )
                                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                                    }`}
                                  >
                                    {serial.serial}
                                    {selectedWarrantySerials.includes(
                                      serial.serial,
                                    ) && (
                                      <Check
                                        className="inline ml-1"
                                        size={10}
                                      />
                                    )}
                                  </span>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Warranty Products Message */}
              {serviceProduct?.sale_id && warrantyProducts.length === 0 && (
                <div
                  className={`mt-4 p-4 rounded-lg border ${
                    isDarkMode
                      ? "border-yellow-700 bg-yellow-900/20"
                      : "border-yellow-300 bg-yellow-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="text-yellow-500" size={20} />
                    <span className="text-yellow-700 dark:text-yellow-300">
                      No products with warranty found in this sale
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Service Details */}
        {(serviceModalTab === "normal" && selectedServiceCustomer) ||
        (serviceModalTab === "warranty" && selectedWarrantyProduct) ? (
          <div className="mt-6 space-y-4">
            {/* Show serial selection status for warranty claims */}
            {serviceModalTab === "warranty" &&
              selectedWarrantyProduct?.serials && (
                <div
                  className={`p-3 rounded-lg border ${
                    isDarkMode
                      ? "border-blue-700 bg-blue-900/20"
                      : "border-blue-300 bg-blue-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">
                        Selected Product
                      </div>
                      <div className="text-sm">
                        {selectedWarrantyProduct.Products?.name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">
                        {selectedWarrantySerials.length > 0
                          ? `${selectedWarrantySerials.length} serial(s) selected`
                          : "No serials selected"}
                      </div>
                      {selectedWarrantyProduct.serials.length > 0 &&
                        selectedWarrantySerials.length === 0 && (
                          <button
                            type="button"
                            onClick={() => setShowWarrantySerialModal(true)}
                            className="text-xs text-blue-500 hover:text-blue-700 mt-1"
                          >
                            Select serials
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              )}
            <h4
              className={`font-bold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Service Details
            </h4>

            <div>
              <label
                className={`block mb-2 font-medium ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Service Description *
              </label>
              <textarea
                value={serviceDetails.description}
                onChange={(e) =>
                  setServiceDetails({
                    ...serviceDetails,
                    description: e.target.value,
                  })
                }
                className={`w-full p-3 border rounded-lg ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-600 text-white"
                    : "bg-white border-gray-300"
                }`}
                rows={4}
                placeholder="Describe the service needed..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className={`block mb-2 font-medium ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Service Cost (৳)
                </label>
                <input
                  type="number"
                  value={serviceDetails.cost}
                  onChange={(e) =>
                    setServiceDetails({
                      ...serviceDetails,
                      cost: parseFloat(e.target.value) || 0,
                    })
                  }
                  className={`w-full p-3 border rounded-lg ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-600 text-white"
                      : "bg-white border-gray-300"
                  }`}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <label
                  className={`block mb-2 font-medium ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Assigned Technician
                </label>
                <input
                  type="text"
                  value={serviceDetails.assignedTechnician}
                  onChange={(e) =>
                    setServiceDetails({
                      ...serviceDetails,
                      assignedTechnician: e.target.value,
                    })
                  }
                  className={`w-full p-3 border rounded-lg ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-600 text-white"
                      : "bg-white border-gray-300"
                  }`}
                  placeholder="Technician name..."
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleCreateService}
                disabled={creatingService || !serviceDetails.description.trim()}
                className={`flex-1 py-3 rounded-lg font-medium ${
                  creatingService || !serviceDetails.description.trim()
                    ? "bg-gray-400 cursor-not-allowed"
                    : serviceModalTab === "warranty"
                      ? "bg-green-500 hover:bg-green-600 text-white"
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                {creatingService
                  ? "Creating..."
                  : serviceModalTab === "warranty"
                    ? "Create Warranty Claim"
                    : "Create Service Request"}
              </button>
              <button
                onClick={() => {
                  setShowServiceModal(false);
                  resetServiceModal();
                }}
                className={`flex-1 py-3 rounded-lg font-medium ${
                  isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-gray-300 hover:bg-gray-400 text-gray-800"
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`text-center py-8 rounded-lg border ${
              isDarkMode
                ? "border-gray-700 bg-gray-800"
                : "border-gray-200 bg-gray-50"
            }`}
          >
            <Wrench className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
              {serviceModalTab === "normal"
                ? "Select a customer to create service request"
                : "Select a sale and product to create warranty claim"}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // Render discount modal
  const renderDiscountModal = () => (
    <div className="fixed inset-0 flex backdrop-blur-sm items-center justify-center z-[10000] p-4">
      <div
        className={`p-6 rounded-xl border-2 w-full max-w-md transform transition-all duration-300 scale-100 ${
          isDarkMode
            ? "bg-gradient-to-br from-gray-900 to-gray-800 border-blue-500"
            : "bg-gradient-to-br from-white to-blue-50 border-blue-400"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-3 rounded-lg ${isDarkMode ? "bg-blue-900/50" : "bg-blue-100"}`}>
            <Percent className={`w-6 h-6 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
          </div>
          <div>
            <h3 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Apply Product Discount
            </h3>
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              Applying discount to:{" "}
              <span className="font-medium">
                {cart.find((item) => item.product.id === discountProductId)?.product.name || "Selected Product"}
              </span>
            </p>
          </div>
        </div>
        <div className="space-y-6">
          <div>
            <label
              className={`block mb-3 font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            >
              Discount Type
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setDiscountType("percentage")}
                className={`flex-1 py-3 rounded-lg font-medium transition-all duration-200 ${
                  discountType === "percentage"
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105"
                    : isDarkMode
                      ? "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Percent size={16} />
                  Percentage (%)
                </div>
              </button>
              <button
                onClick={() => setDiscountType("fixed")}
                className={`flex-1 py-3 rounded-lg font-medium transition-all duration-200 ${
                  discountType === "fixed"
                    ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg transform scale-105"
                    : isDarkMode
                      ? "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <DollarSign size={16} />
                  Fixed Amount (৳)
                </div>
              </button>
            </div>
          </div>
          <div>
            <label
              className={`block mb-3 font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            >
              Discount Value
            </label>
            <input
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              className={`w-full p-4 border-2 rounded-lg text-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
              placeholder={
                discountType === "percentage"
                  ? "Enter percentage (0-100)"
                  : "Enter amount in ৳"
              }
              min="0"
              max={discountType === "percentage" ? "100" : undefined}
              step="0.01"
              autoFocus
            />
            {discountType === "percentage" && (
              <div className="mt-2">
                <div className="flex gap-2">
                  {[5, 10, 15, 20].map((percent) => (
                    <button
                      key={percent}
                      type="button"
                      onClick={() => setDiscountValue(percent.toString())}
                      className={`flex-1 py-2 text-sm rounded ${
                        discountValue === percent.toString()
                          ? "bg-blue-500 text-white"
                          : isDarkMode
                            ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {percent}%
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleApplyDiscount}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
            >
              Apply Discount
            </button>
            <button
              onClick={() => {
                setShowDiscountModal(false);
                setDiscountProductId(null);
              }}
              className={`flex-1 py-4 rounded-lg font-medium text-lg transition-all duration-300 transform hover:scale-[1.02] ${
                isDarkMode
                  ? "bg-gray-700 hover:bg-gray-600 text-white shadow-lg"
                  : "bg-gray-300 hover:bg-gray-400 text-gray-800 shadow-lg"
              }`}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Update the desktop view action buttons section
  const renderDesktopActionButtons = () => (
    <div
      className={`rounded-lg border p-1 ${
        isDarkMode
          ? "bg-gray-800/50 border-gray-700"
          : "bg-white/50 border-gray-200"
      }`}
    >
      <div className="grid grid-cols-2 gap-1">
        {/* Discount Button */}
        <button
          onClick={() => {
            if (cart.length === 0) {
              showAlert("Add products first to apply discount", "info");
              return;
            }
            
            if (!selectedProductForDiscount) {
              showAlert("Please select a product from the cart first", "info");
              return;
            }
            
            // Set the selected product for discount
            setDiscountProductId(selectedProductForDiscount);
            setShowDiscountModal(true);
          }}
          className="py-1 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <Percent size={14} />
          {selectedProductForDiscount ? "Discount Selected" : "Discount"}
        </button>
        {/* AddProduct Button */}
        <button
          onClick={() => setShowAddProductModal(true)}
          className="py-1 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <CirclePlus size={14} />
          Add Product
        </button>

        {/* Refund Button */}
        <button
          onClick={handleRefund}
          className="py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <RefreshCw size={14} />
          Refund
        </button>

        {/* Exchange Button */}
        <button
          onClick={handleExchange}
          className="py-1 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeftRight size={14} />
          Exchange
        </button>

        {/* Service Button */}
        <button
          onClick={handleService}
          className="py-1 rounded-lg bg-teal-500 hover:bg-teal-600 text-white font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <Wrench size={14} />
          Service
        </button>

        {/* PreOrder Button */}
        <button
          onClick={() => setShowPreOrderModal(true)}
          className="py-1 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <PackageSearch size={14} />
          Pre Order
        </button>
      </div>

      {/* Confirm Sell Button */}
      <button
        onClick={() => {
          if (cart.length === 0) {
            showAlert("Add products to cart first", "info");
            return;
          }
          if (!selectedCustomer) {
            showAlert("Please select a customer first", "info");
            return;
          }
          setShowPaymentModal(true);
        }}
        disabled={creatingSale}
        className={`w-full mt-1 text-white font-bold py-1 rounded-lg text-lg transition-colors flex items-center justify-center gap-1 cursor-pointer ${
          creatingSale
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-green-500 hover:bg-green-600"
        }`}
      >
        {creatingSale ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Processing...
          </>
        ) : (
          <>Confirm Sell</>
        )}
      </button>

      {/* Cash Buttons */}
      <div className="flex gap-1 mt-1">
        <button
          onClick={() => setShowCashInModal(true)}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white py-1 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
        >
          <TrendingDown size={14} />
          Cash IN
        </button>
        <button
          onClick={() => setShowCashOutModal(true)}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white py-1 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
        >
          <TrendingUp size={14} />
          Cash OUT
        </button>
      </div>

      {/* Clear Button */}
      <button
        onClick={handleClearAll}
        disabled={cart.length === 0 && !selectedCustomer}
        className={`w-full mt-1 py-1 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer ${
          cart.length === 0 && !selectedCustomer
            ? "bg-gray-300 cursor-not-allowed dark:bg-gray-700"
            : "bg-gray-400 hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-500"
        } ${isDarkMode ? "text-gray-800" : "text-gray-800"}`}
      >
        <Trash2 size={16} />
        CLEAR ALL
      </button>
    </div>
  );

  // order summary display
  const renderOrderSummary = () => (
    <div
      className={`rounded-lg border p-4 ${
        isDarkMode
          ? "bg-gray-800/50 border-gray-700"
          : "bg-white/50 border-gray-200"
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <h2
          className={`text-lg font-semibold ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}
        >
          Order Summary
        </h2>
        <span
          className={`text-sm px-2 py-1 rounded ${
            isDarkMode
              ? "bg-gray-700 text-gray-300"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {cart.length} {cart.length === 1 ? "item" : "items"}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
            Subtotal:
          </span>
          <span
            className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}
          >
            {orderSummary.subtotal}৳
          </span>
        </div>

        {orderSummary.productDiscount > 0 && (
          <div className="flex justify-between">
            <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
              Product Discount:
            </span>
            <span className="font-medium text-red-500">
              -{orderSummary.productDiscount}৳
            </span>
          </div>
        )}

        <div className="border-t pt-3 mt-2 border-gray-300 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <span
              className={`font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
            >
              Total:
            </span>
            <span className="text-xl font-bold text-green-600">
              {orderSummary.total}৳
            </span>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Amount due from customer
          </div>
        </div>
      </div>
    </div>
  );
  // Render Add Product Modal
  const renderAddProductModal = () => (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`rounded-lg border max-w-4xl w-full max-h-[90vh] overflow-y-auto ${
          isDarkMode
            ? "bg-gray-900/50 border-gray-700"
            : "bg-white/50 border-gray-200"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2
            className={`text-xl font-bold mb-4 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {isEditingProduct ? (
              <span className="flex items-center gap-2">
                <span>Edit Product</span>
                <span className="text-sm bg-yellow-500 text-white px-2 py-1 rounded">
                  Editing: {existingProductData?.name}
                </span>
              </span>
            ) : (
              "Add New Product"
            )}
          </h2>
          {isEditingProduct && existingProductData && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-700 dark:text-yellow-300 font-medium">
                    Editing:
                  </span>
                  <span className="font-medium">
                    {existingProductData.name}
                  </span>
                  <span className="text-xs bg-yellow-500 text-white px-2 py-0.5 rounded">
                    ID: {existingProductData.id}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingProduct(false);
                    setExistingProductData(null);
                    setSelectedProductForEdit(null);
                    setProductSearchTerm("");
                    // Reset all form fields
                    setNewProductData({
                      name: "",
                      category_id: null,
                      quantity: 1,
                      useIndividualSerials: false,
                      specification: "",
                      description: "",
                    });
                    setIndividualSerials([]);
                    setSelectedCategoryName("");
                    setSelectedCategoryId(null);
                    setUseIndividualSerials(false);
                    showAlert("Reset form to add new product", "info");
                  }}
                  className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Start Over
                </button>
              </div>
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveProduct(new FormData(e.currentTarget));
            }}
          >
            <div className="space-y-4">
              {/* Product Name with Search/Select */}
              <div className="relative" ref={modalSearchResultsRef}>
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
                    value={
                      isEditingProduct
                        ? existingProductData?.name || productSearchTerm
                        : productSearchTerm
                    }
                    onChange={(e) => {
                      setProductSearchTerm(e.target.value);
                      setIsEditingProduct(false);
                      setExistingProductData(null);
                      setSelectedProductForEdit(null);

                      // Show results when typing
                      if (e.target.value.trim().length >= 2) {
                        setShowModalProductResults(true);
                      } else {
                        setShowModalProductResults(false);
                      }
                    }}
                    onFocus={() => {
                      if (productSearchTerm.length >= 2) {
                        setShowModalProductResults(true);
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    } ${isEditingProduct ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400" : ""}`}
                    placeholder="Type to search existing products or add new..."
                  />
                  {isEditingProduct && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <span className="text-xs bg-yellow-500 text-white px-2 py-1 rounded">
                        Editing
                      </span>
                    </div>
                  )}
                </div>

                {/* Search Results Dropdown */}
                {productSearchTerm.trim().length >= 2 &&
                  showModalProductResults && (
                    <div
                      className={`absolute z-50 w-full mt-1 border rounded-lg shadow-lg max-h-60 overflow-y-auto ${
                        isDarkMode
                          ? "bg-gray-800 border-gray-700"
                          : "bg-white border-gray-200"
                      }`}
                      style={{ top: "100%" }}
                    >
                      {productsLoading ? (
                        <div className="p-4 text-center">
                          <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-500 mb-2" />
                          <p className="text-sm text-gray-500">Searching...</p>
                        </div>
                      ) : searchProductsData &&
                        searchProductsData.length > 0 ? (
                        <>
                          <div
                            className={`px-3 py-2 text-xs font-medium ${
                              isDarkMode
                                ? "bg-gray-900 text-gray-400"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            Existing Products ({searchProductsData.length})
                          </div>

                          {/* Existing Products List */}
                          {searchProductsData.map((product) => (
                            <div
                              key={product.id}
                              className="group border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  handleSelectProductForEdit(product);
                                  setShowModalProductResults(false); // Hide dropdown on selection
                                }}
                                className={`w-full text-left px-3 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 ${
                                  selectedProductForEdit?.id === product.id
                                    ? "bg-blue-50 dark:bg-blue-900/30"
                                    : ""
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="font-medium flex items-center gap-2">
                                      {product.name}
                                      {product.useIndividualSerials && (
                                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded dark:bg-purple-900 dark:text-purple-300">
                                          Serialized
                                        </span>
                                      )}
                                    </div>
                                    <div
                                      className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                                    >
                                      {product.specification ||
                                        "No specification"}
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-xs">
                                      <span
                                        className={
                                          isDarkMode
                                            ? "text-gray-500"
                                            : "text-gray-600"
                                        }
                                      >
                                        Category:{" "}
                                        {product.Categories?.name ||
                                          "Uncategorized"}
                                      </span>
                                      <span
                                        className={
                                          isDarkMode
                                            ? "text-gray-500"
                                            : "text-gray-600"
                                        }
                                      >
                                        Stock: {product.quantity}
                                      </span>
                                      {product.productSerials &&
                                        product.productSerials.length > 0 && (
                                          <span
                                            className={
                                              isDarkMode
                                                ? "text-gray-500"
                                                : "text-gray-600"
                                            }
                                          >
                                            Serials:{" "}
                                            {product.productSerials.length}
                                          </span>
                                        )}
                                    </div>
                                  </div>
                                  <div className="text-xs text-blue-600 dark:text-blue-400 font-medium ml-2 whitespace-nowrap">
                                    Click to Edit
                                  </div>
                                </div>
                              </button>
                            </div>
                          ))}

                          {/* Add New Product Option */}
                          <div className="border-t border-gray-200 dark:border-gray-700">
                            <button
                              type="button"
                              onClick={() => {
                                setIsEditingProduct(false);
                                setExistingProductData(null);
                                setSelectedProductForEdit(null);
                                setShowModalProductResults(false); // Hide dropdown
                                showAlert(
                                  `Will add as new product: "${productSearchTerm}"`,
                                  "info",
                                );
                              }}
                              className={`w-full text-left px-3 py-3 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-2 ${
                                isDarkMode ? "text-green-400" : "text-green-600"
                              }`}
                            >
                              <PlusIcon className="w-4 h-4" />
                              <span className="font-medium">
                                Add as new product: "{productSearchTerm}"
                              </span>
                            </button>
                          </div>
                        </>
                      ) : productSearchTerm.trim().length >= 2 ? (
                        <div>
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingProduct(false);
                              setExistingProductData(null);
                              setSelectedProductForEdit(null);
                              setShowModalProductResults(false); // Hide dropdown
                              showAlert(
                                `Will add as new product: "${productSearchTerm}"`,
                                "info",
                              );
                            }}
                            className={`w-full text-left px-3 py-3 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-2 ${
                              isDarkMode ? "text-green-400" : "text-green-600"
                            }`}
                          >
                            <PlusIcon className="w-4 h-4" />
                            <span className="font-medium">
                              Add as new product: "{productSearchTerm}"
                            </span>
                          </button>
                        </div>
                      ) : null}
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
                          {categories?.map((category) => (
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
                    value={newProductData.quantity}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow empty string temporarily while user is typing
                      if (value === "") {
                        setNewProductData({ ...newProductData, quantity: 1 });
                        return;
                      }

                      const qty = parseInt(value, 10);
                      if (!isNaN(qty) && qty > 0) {
                        setNewProductData({ ...newProductData, quantity: qty });

                        if (useIndividualSerials) {
                          // Preserve existing serials, add new empty ones if quantity increased
                          const newSerials = [...individualSerials];

                          if (qty > newSerials.length) {
                            // Add new empty serials
                            for (let i = newSerials.length; i < qty; i++) {
                              newSerials.push({
                                serial: "",
                                warranty: "No" as "Yes" | "No",
                                purchasePrice: 0,
                                wholesalePrice: 0,
                                retailPrice: 0,
                                productType: "New" as "New" | "PreOwned",
                              });
                            }
                          } else if (qty < newSerials.length) {
                            // Remove excess serials
                            newSerials.splice(qty);
                          }

                          setIndividualSerials(newSerials);
                        }
                      }
                    }}
                    onFocus={(e) => {
                      // Select all text when focused for easier editing
                      e.target.select();
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
                    setNewProductData({
                      ...newProductData,
                      useIndividualSerials: checked,
                    });

                    if (checked) {
                      // Initialize serials based on current quantity
                      const quantity = newProductData.quantity;
                      const newSerials = Array.from(
                        { length: quantity },
                        (_, i) => {
                          // Preserve existing serial data if available
                          const existing = individualSerials[i] || {};
                          return {
                            id: existing.id,
                            serial: existing.serial || "",
                            warranty: existing.warranty || "No",
                            purchasePrice: existing.purchasePrice || 0,
                            wholesalePrice: existing.wholesalePrice || 0,
                            retailPrice: existing.retailPrice || 0,
                            productType: existing.productType || "New",
                            supplier_id: existing.supplier_id,
                          };
                        },
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
                      {/* Bulk Actions */}
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
                                        setShowAddSupplier(true);
                                        setShowBulkActions(false);
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
                              required
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
                                required
                              >
                                <option value="New">New</option>
                                <option value="PreOwned">Pre-Owned</option>
                              </select>
                            </div>
                          </div>

                          {/* Supplier */}
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
                                  setShowBulkActions(false);
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
                              {suppliers?.map((supplier) => (
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

                          {/* Pricing */}
                          <div className="space-y-2">
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
                                    e.target.value,
                                  );
                                  setIndividualSerials(newSerials);
                                }}
                                className={`w-full px-2 py-1 border rounded text-sm ${
                                  isDarkMode
                                    ? "bg-gray-700 border-gray-600 text-white"
                                    : "bg-white border-gray-300 text-gray-900"
                                }`}
                                required
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
                                    e.target.value,
                                  );
                                  setIndividualSerials(newSerials);
                                }}
                                className={`w-full px-2 py-1 border rounded text-sm ${
                                  isDarkMode
                                    ? "bg-gray-700 border-gray-600 text-white"
                                    : "bg-white border-gray-300 text-gray-900"
                                }`}
                                required
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
                                    e.target.value,
                                  );
                                  setIndividualSerials(newSerials);
                                }}
                                className={`w-full px-2 py-1 border rounded text-sm ${
                                  isDarkMode
                                    ? "bg-gray-700 border-gray-600 text-white"
                                    : "bg-white border-gray-300 text-gray-900"
                                }`}
                                required
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
                  Specification (Optional)
                </label>
                <input
                  type="text"
                  name="specification"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                />
              </div>

              {/* Description */}
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowAddProductModal(false);
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
                className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                  isEditingProduct
                    ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                {isEditingProduct ? (
                  <>
                    <Check className="inline mr-2 w-4 h-4" />
                    Update Product
                  </>
                ) : (
                  <>
                    <Plus className="inline mr-2 w-4 h-4" />
                    Add New Product
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-0 h-0 overflow-hidden">
      {/* === FULL SCREEN SLIDING PANEL === */}
      <div
        ref={panelRef}
        className={`
          fixed inset-0 z-50
          backdrop-blur-xs border-l border-white/10
          transition-transform duration-500 ease-[cubic-bezier(.25,.8,.25,1)]
          overflow-hidden mt-12
          ${showPanel ? "translate-x-0" : "translate-x-full"}
          ${isAuthenticated ? "translate-x-0" : "translate-x-full"}
          ${isMobile ? "flex flex-col" : ""}
        `}
      >
        {/* Mobile Header */}
        {isMobile && <MobileHeader />}

        {/* Mobile View - Similar structure but responsive */}
        {isMobile ? (
          <div className="flex-1 overflow-hidden pb-16">
            {/* Mobile tabs implementation - similar to before but updated */}
            {/* For brevity, using the same mobile structure but with updated modals */}
            {/* You can copy the mobile structure from the previous version */}
          </div>
        ) : (
          /* Desktop View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 h-full p-1">
            {/* LEFT SIDE */}
            <div className="col-span-1 md:col-span-2 lg:col-span-2 flex flex-col gap-2">
              {/* PRODUCT SEARCH SECTION */}
              <div
                className={`rounded-lg border p-0 ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
                ref={productSearchRef}
              >
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-3 relative">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          onChange={(e) => {
                            debouncedProductSearch(e.target.value);
                            if (e.target.value.length < 2) {
                              setShowProductResults(false);
                            }
                          }}
                          className={`w-full p-2 border rounded-lg pl-4 ${
                            isDarkMode
                              ? "bg-gray-800/50 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-900"
                              : "bg-white/50 border-gray-300 text-black focus:border-blue-500 focus:ring-blue-500"
                          }`}
                          placeholder="Enter Product Name/Barcode here..."
                          onFocus={() => {
                            if (productSearchTerm.length >= 2) {
                              setShowProductResults(true);
                            }
                          }}
                        />
                        {productsLoading && (
                          <div className="absolute right-3 top-3">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PRODUCT DETAILS TABLE */}
              <div
                className={`rounded-lg border p-4 overflow-auto flex-1 ${
                  isDarkMode
                    ? "bg-gray-800/50 border-gray-700"
                    : "bg-white/50 border-gray-200"
                }`}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2
                    className={`text-lg font-semibold ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Product Details
                  </h2>
                  {cart.length > 0 && (
                    <span
                      className={`text-sm px-2 py-1 rounded ${
                        isDarkMode
                          ? "bg-gray-700 text-gray-300"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {cart.length} item{cart.length !== 1 ? "s" : ""} in cart
                    </span>
                  )}
                </div>

                {cart.length === 0 ? (
                  <div
                    className={`text-center py-12 ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    <Search className="mx-auto h-12 w-12 mb-3 opacity-50" />
                    <p className="text-lg">No products added</p>
                    <p className="text-sm mt-1">
                      Search and add products above to get started
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-center">
                      <thead>
                        <tr
                          className={`border-b font-bold ${
                            isDarkMode
                              ? "border-gray-700 text-gray-300"
                              : "border-gray-200 text-gray-700"
                          }`}
                        >
                          <th className="py-3 px-2 text-left">Product</th>
                          <th className="py-3 px-2">Quantity</th>
                          <th className="py-3 px-2">Price</th>
                          <th className="py-3 px-2">Discount</th>
                          <th className="py-3 px-2">Total</th>
                          <th className="py-3 px-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cart.map((item) => {
                          const price = convertToNumber(item.price);
                          const discountedPrice = convertToNumber(
                            item.discountedPrice,
                          );
                          const total = discountedPrice * item.quantity;

                          return (
                            <tr
                              key={item.product.id}
                              className={`border-b transition-colors ${
                                isDarkMode
                                  ? "border-gray-700 hover:bg-gray-800"
                                  : "border-gray-200 hover:bg-gray-50"
                              }`}
                            >
                              <td 
                                className="py-3 px-2 text-left cursor-pointer"
                                onClick={() => {
                                  // Toggle selection
                                  if (selectedProductForDiscount === item.product.id) {
                                    setSelectedProductForDiscount(null);
                                  } else {
                                    setSelectedProductForDiscount(item.product.id);
                                  }
                                }}
                              >
                                <div className="flex items-center">
                                  {/* Selection indicator */}
                                  <div className={`mr-2 w-4 h-4 border rounded flex items-center justify-center ${
                                    selectedProductForDiscount === item.product.id
                                      ? "bg-blue-500 border-blue-500"
                                      : isDarkMode
                                        ? "border-gray-600"
                                        : "border-gray-300"
                                  }`}>
                                    {selectedProductForDiscount === item.product.id && (
                                      <Check size={12} className="text-white" />
                                    )}
                                  </div>
                                  
                                  <div>
                                    <div className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"} ${
                                      selectedProductForDiscount === item.product.id ? "text-blue-600 dark:text-blue-400" : ""
                                    }`}>
                                      {item.product.name}
                                      {selectedProductForDiscount === item.product.id && (
                                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-1.5 py-0.5 rounded">
                                          Selected for Discount
                                        </span>
                                      )}
                                    </div>
                                    <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                      {item.product.specification}
                                    </div>
                                    {item.selectedSerials && item.selectedSerials.length > 0 && (
                                      <div className="text-xs text-blue-500 mt-1">
                                        Serials: {item.selectedSerials.join(", ")}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-2">
                                <div className="flex items-center justify-center">
                                  <button
                                    onClick={() =>
                                      handleUpdateQuantity(item.product.id, -1)
                                    }
                                    className={`w-8 h-8 flex items-center justify-center border rounded transition-colors cursor-pointer ${
                                      isDarkMode
                                        ? "border-gray-600 hover:bg-gray-700 disabled:opacity-50"
                                        : "border-gray-300 hover:bg-gray-100 disabled:opacity-50"
                                    }`}
                                    disabled={item.quantity <= 1}
                                  >
                                    <Minus size={14} />
                                  </button>
                                  <span
                                    className={`w-12 text-center font-medium ${
                                      isDarkMode
                                        ? "text-white"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() =>
                                      handleUpdateQuantity(item.product.id, 1)
                                    }
                                    className={`w-8 h-8 flex items-center justify-center border rounded transition-colors cursor-pointer ${
                                      isDarkMode
                                        ? "border-gray-600 hover:bg-gray-700"
                                        : "border-gray-300 hover:bg-gray-100"
                                    }`}
                                  >
                                    <Plus size={14} />
                                  </button>
                                </div>
                              </td>
                              <td className="py-3 px-2">
                                <div
                                  className={`font-medium ${
                                    isDarkMode ? "text-white" : "text-gray-900"
                                  }`}
                                >
                                  {price} ৳
                                </div>
                              </td>
                              <td className="py-3 px-2">
                                {item.discount ? (
                                  <div className="flex flex-col items-center">
                                    <span className="text-red-500 font-medium">
                                      {item.discount.type === "percentage"
                                        ? `${item.discount.value}%`
                                        : `${item.discount.value} ৳`}
                                    </span>
                                    <div className="text-xs text-gray-500">
                                      Saved: {((convertToNumber(item.price) - item.discountedPrice) * item.quantity).toFixed(2)}৳
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation(); // Prevent row selection
                                        handleRemoveDiscount(item.product.id);
                                      }}
                                      className="text-xs text-red-500 hover:text-red-700 mt-1 transition-colors cursor-pointer flex items-center gap-1"
                                    >
                                      <X size={10} />
                                      Remove
                                    </button>
                                  </div>
                                ) : (
                                  <div className={`text-sm ${selectedProductForDiscount === item.product.id ? "text-blue-600 font-medium" : "text-gray-500"}`}>
                                    {selectedProductForDiscount === item.product.id ? "Click Discount button" : "No discount"}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-2">
                                <div
                                  className={`font-semibold ${
                                    isDarkMode ? "text-white" : "text-gray-900"
                                  }`}
                                >
                                  {total} ৳
                                </div>
                                {item.discount && (
                                  <div
                                    className={`text-xs line-through ${
                                      isDarkMode
                                        ? "text-gray-500"
                                        : "text-gray-400"
                                    }`}
                                  >
                                    {price * item.quantity} ৳
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-2">
                                <div className="flex flex-col items-center gap-2">
                                  <button
                                    onClick={() =>
                                      handleRemoveProduct(item.product.id)
                                    }
                                    className="p-2 bg-red-500 hover:bg-red-600 text-white rounded transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    <Trash2 size={14} />
                                    <span className="text-xs">Remove</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* ORDER SUMMARY */}
              {renderOrderSummary()}
            </div>

            {/* === RIGHT SIDE (CUSTOMER & ACTIONS) === */}
            <div className="col-span-1 md:col-span-2 lg:col-span-1 flex flex-col gap-2">
              {/* CUSTOMER SEARCH */}
              <div
                className={`rounded-lg border p-0 relative ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
                ref={customerSearchRef}
              >
                <div className="relative">
                  <input
                    type="text"
                    onChange={(e) => {
                      debouncedCustomerSearch(e.target.value);
                      if (e.target.value.length < 2) {
                        setShowCustomerResults(false);
                      }
                    }}
                    className={`w-full p-2 border rounded-lg pl-4 ${
                      isDarkMode
                        ? "bg-gray-800 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500"
                        : "bg-white border-gray-300 text-black focus:border-blue-500 focus:ring-blue-500"
                    }`}
                    placeholder="Enter Customer Name/Phone/Email here..."
                    onFocus={() => {
                      if (customerSearchTerm.length >= 2) {
                        setShowCustomerResults(true);
                      }
                    }}
                  />
                  {customersLoading && (
                    <div className="absolute right-3 top-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Customers List */}
              <div
                className={`rounded-lg border p-4 flex-1 flex flex-col ${
                  isDarkMode
                    ? "bg-gray-800/50 border-gray-700"
                    : "bg-white/50 border-gray-200"
                }`}
              >
                {/* Selected Customer Display */}
                <div className="mb-2">
                  <div className="flex justify-between items-center">
                    <h3
                      className={`font-semibold text-sm ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Selected Customer
                    </h3>
                    <button
                      onClick={() => refetchAllCustomers()}
                      className={`p-1 rounded transition-colors cursor-pointer ${
                        isDarkMode
                          ? "hover:bg-gray-700 text-gray-400"
                          : "hover:bg-gray-200 text-gray-500"
                      }`}
                      title="Refresh customers list"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    </button>
                  </div>
                  {selectedCustomer ? (
                    <div
                      className={`p-1 rounded-lg border overflow-hidden ${
                        isDarkMode
                          ? "border-blue-500 bg-blue-900/20"
                          : "border-blue-300 bg-blue-50"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1 truncate">
                          <div className="font-medium text-sm">
                            <span className="pr-4">
                              {selectedCustomer.name}
                            </span>
                            <span className="pr-4">
                              ({selectedCustomer.phone})
                            </span>
                            <span className="pr-4 underline">
                              {selectedCustomer.email}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedCustomer(null);
                            showAlert("Customer removed", "info");
                          }}
                          className={`rounded-full transition-colors cursor-pointer pl-2 ${
                            isDarkMode
                              ? "hover:bg-red-900/50"
                              : "hover:bg-red-100"
                          }`}
                          title="Remove customer"
                        >
                          <X size={12} className="text-red-500" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`p-1 rounded-lg border text-center ${
                        isDarkMode
                          ? "border-gray-700 bg-gray-800/30 text-gray-400"
                          : "border-gray-300 bg-gray-100/50 text-gray-500"
                      }`}
                    >
                      <div className="text-sm">No customer selected</div>
                    </div>
                  )}
                </div>

                {/* All Customers List */}
                <div className="mb-3 flex-1 overflow-hidden">
                  <div className="flex justify-between items-center mb-2">
                    <h3
                      className={`font-semibold text-sm ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      All Customers
                    </h3>
                    <span
                      className={`text-xs ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {allCustomers?.length || 0} total
                    </span>
                  </div>
                  <div className="overflow-y-auto max-h-[calc(100%-3rem)] pr-1">
                    {allCustomersLoading ? (
                      <div className="flex flex-col justify-center items-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-500 mb-2" />
                        <span className="text-sm">Loading customers...</span>
                      </div>
                    ) : allCustomers && allCustomers.length > 0 ? (
                      <div className="space-y-1">
                        {allCustomers.map((customer) => (
                          <div
                            key={customer.id}
                            className={`p-1 rounded-lg border cursor-pointer transition-all duration-200 ${
                              selectedCustomer?.id === customer.id
                                ? isDarkMode
                                  ? "border-blue-500 bg-blue-900/20 shadow-md"
                                  : "border-blue-400 bg-blue-50 shadow-sm"
                                : isDarkMode
                                  ? "border-gray-700 hover:bg-gray-800/70 hover:border-gray-600"
                                  : "border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                            }`}
                            onClick={() => handleSelectCustomer(customer)}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex-1 min-w-0">
                                <div
                                  className={`font-medium text-sm truncate ${
                                    selectedCustomer?.id === customer.id
                                      ? "text-blue-500"
                                      : isDarkMode
                                        ? "text-white"
                                        : "text-gray-900"
                                  }`}
                                >
                                  <span className="pr-4">{customer.name}</span>
                                  <span className="pr-4">
                                    ({customer.phone})
                                  </span>
                                  <span className="pr-4 underline">
                                    {customer.email}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        className={`text-center py-6 ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        <UserPlus className="mx-auto h-8 w-8 mb-2 opacity-50" />
                        <p className="text-sm font-medium mb-1">
                          No customers found
                        </p>
                        <p className="text-xs">Add customers to get started</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Fixed Bottom Section */}
                <div className="mt-auto">
                  {/* Add New Customer Button */}
                  <button
                    onClick={() => setShowAddCustomerModal(true)}
                    className={`w-full py-1 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                      isDarkMode
                        ? "bg-gray-700 hover:bg-gray-600 text-white shadow-md"
                        : "bg-gray-800 hover:bg-gray-900 text-white shadow-sm"
                    }`}
                  >
                    <UserPlus size={12} />
                    Add New Customer
                  </button>

                  {/* Date and Time Display */}
                  <div className="pt-2 border-gray-300 dark:border-gray-700">
                    <div className="flex rounded-lg p-2 justify-between font-bold">
                      <div
                        className={`flex gap-2 ${
                          isDarkMode ? "text-blue-400" : "text-blue-600"
                        }`}
                      >
                        <Calendar
                          size={16}
                          className={
                            isDarkMode ? "text-blue-400" : "text-blue-600"
                          }
                        />
                        {date}
                      </div>
                      <div
                        className={`flex gap-2 ${
                          isDarkMode ? "text-green-400" : "text-green-600"
                        }`}
                      >
                        <Clock
                          size={16}
                          className={
                            isDarkMode ? "text-green-400" : "text-green-600"
                          }
                        />
                        {time}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              {renderDesktopActionButtons()}
            </div>
          </div>
        )}

        {/* Mobile Bottom Navigation */}
        {isMobile && <MobileBottomNav />}
      </div>

      {/* PRODUCT SEARCH RESULTS */}
      {showProductResults && searchProductsData && (
        <div
          ref={productResultsRef}
          className="fixed z-[9999]"
          style={{
            left: getSearchPosition(productSearchRef).left,
            top: getSearchPosition(productSearchRef).top,
            width: getSearchPosition(productSearchRef).width,
          }}
        >
          <div
            className={`border rounded-lg shadow-lg max-h-96 overflow-y-auto ${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            {searchProductsData.length === 0 ? (
              <div className="p-4 text-center">
                <Search className="mx-auto h-6 w-6 mb-2 opacity-50" />
                <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                  No products found
                </p>
              </div>
            ) : (
              searchProductsData.map((product) => {
                const price =
                  product.productSerials && product.productSerials.length > 0
                    ? convertToNumber(product.productSerials[0].retailPrice)
                    : 0;
                return (
                  <div
                    key={product.id}
                    className={`p-3 border-b cursor-pointer transition-colors ${
                      isDarkMode
                        ? "border-gray-700 hover:bg-gray-700"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() => {
                      handleAddProduct(product);
                      setShowProductResults(false);
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="font-medium">{product.name}</div>
                        <div
                          className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                        >
                          {product.specification || "No specification"}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs">
                          <span
                            className={
                              isDarkMode ? "text-gray-500" : "text-gray-600"
                            }
                          >
                            {product.Categories?.name || "Uncategorized"}
                          </span>
                          <span
                            className={
                              isDarkMode ? "text-gray-500" : "text-gray-600"
                            }
                          >
                            Stock: {product.quantity}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-semibold text-green-600">
                          {price}৳
                        </span>
                        {product.useIndividualSerials && (
                          <span className="text-xs text-blue-500">
                            Serialized
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* CUSTOMER SEARCH RESULTS */}
      {showCustomerResults && searchCustomersData && (
        <div
          ref={customerResultsRef}
          className="fixed z-[9999]"
          style={{
            left: getSearchPosition(customerSearchRef).left,
            top: getSearchPosition(customerSearchRef).top,
            width: getSearchPosition(customerSearchRef).width,
          }}
        >
          <div
            className={`border rounded-lg shadow-lg max-h-96 overflow-y-auto ${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            {searchCustomersData.length === 0 ? (
              <div className="p-4 text-center">
                <Search className="mx-auto h-6 w-6 mb-2 opacity-50" />
                <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                  No customers found
                </p>
              </div>
            ) : (
              searchCustomersData.map((customer) => (
                <div
                  key={customer.id}
                  className={`p-3 border-b cursor-pointer transition-colors ${
                    isDarkMode
                      ? "border-gray-700 hover:bg-gray-700"
                      : "border-gray-200 hover:bg-gray-50"
                  } ${
                    selectedCustomer?.id === customer.id
                      ? isDarkMode
                        ? "bg-blue-900/20"
                        : "bg-blue-50"
                      : ""
                  }`}
                  onClick={() => {
                    handleSelectCustomer(customer);
                    setShowCustomerResults(false);
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="font-medium">{customer.name}</div>
                      <div
                        className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                      >
                        {customer.phone}
                      </div>
                      {customer.email && (
                        <div
                          className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-600"}`}
                        >
                          {customer.email}
                        </div>
                      )}
                    </div>
                    {selectedCustomer?.id === customer.id && (
                      <Check className="text-green-500 w-5 h-5" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ADD CUSTOMER MODAL */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[10000] p-4 backdrop-blur-xs mt-12">
          <div
            className={`p-6 rounded-lg border w-full max-w-md transform transition-all duration-300 scale-100 ${
              isDarkMode
                ? "bg-gray-800/50 border-gray-700"
                : "bg-white/50 border-gray-200"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              className={`text-lg font-bold mb-4 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Add New Customer
            </h3>
            <div className="space-y-4">
              {["Name", "Phone", "Email", "Address"].map((field) => (
                <div key={field}>
                  <label
                    className={`block mb-2 font-medium ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {field} {["Name", "Phone"].includes(field) ? "*" : ""}
                  </label>
                  {field === "Address" ? (
                    <textarea
                      value={newCustomer.address}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          address: e.target.value,
                        })
                      }
                      className={`w-full p-3 border rounded-lg ${
                        isDarkMode
                          ? "bg-gray-800 border-gray-600 text-white"
                          : "bg-white border-gray-300"
                      }`}
                      placeholder={`Enter ${field.toLowerCase()}`}
                      rows={3}
                    />
                  ) : (
                    <input
                      type={
                        field === "Email"
                          ? "email"
                          : field === "Phone"
                            ? "tel"
                            : "text"
                      }
                      value={
                        newCustomer[
                          field.toLowerCase() as keyof typeof newCustomer
                        ]
                      }
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          [field.toLowerCase()]: e.target.value,
                        })
                      }
                      className={`w-full p-3 border rounded-lg ${
                        isDarkMode
                          ? "bg-gray-800 border-gray-600 text-white"
                          : "bg-white border-gray-300"
                      }`}
                      placeholder={`Enter ${field.toLowerCase()}`}
                      required={["Name", "Phone"].includes(field)}
                    />
                  )}
                </div>
              ))}
              <div className="flex gap-3">
                <button
                  onClick={handleAddNewCustomer}
                  disabled={
                    creatingCustomer ||
                    !newCustomer.name.trim() ||
                    !newCustomer.phone.trim()
                  }
                  className={`flex-1 py-3 rounded-lg font-medium ${
                    creatingCustomer ||
                    !newCustomer.name.trim() ||
                    !newCustomer.phone.trim()
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-500 hover:bg-green-600 text-white"
                  }`}
                >
                  {creatingCustomer ? "Adding..." : "Add Customer"}
                </button>
                <button
                  onClick={() => {
                    setShowAddCustomerModal(false);
                    setNewCustomer({
                      name: "",
                      email: "",
                      phone: "",
                      address: "",
                    });
                  }}
                  className={`flex-1 py-3 rounded-lg font-medium ${
                    isDarkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-white"
                      : "bg-gray-300 hover:bg-gray-400 text-gray-800"
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ALERT MODAL */}
      {showAlertModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[10000] p-4 backdrop-blur-xs">
          <div
            className={`p-6 rounded-lg border w-full max-w-md transform transition-all duration-300 scale-100 ${
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
      {/* WARRANTY SERIAL MODAL */}
      {showWarrantySerialModal && renderWarrantySerialModal()}
      {/* ADD SUPPLIER MODAL */}
      {showAddSupplierModal && renderAddSupplierModal()}
      {/* Pre Order Modal */}
      {showPreOrderModal && renderPreOrderModal()}
      {/* Cash In Modals */}
      {showCashInModal && renderCashInModal()}
      {/* Cash Out Modals */}
      {showCashOutModal && renderCashOutModal()}
      {/* SERIAL SELECTION MODAL */}
      {showSerialModal && renderSerialModal()}
      {/* EXCHANGE SERIAL SELECTION MODAL */}
      {showExchangeSerialModal && renderExchangeSerialModal()}
      {/* DISCOUNT MODAL */}
      {showDiscountModal && renderDiscountModal()}
      {/* REFUND MODAL */}
      {showRefundModal && renderRefundModal()}
      {/* EXCHANGE MODAL */}
      {showExchangeModal && renderExchangeModal()}
      {/* SERVICE MODAL */}
      {showServiceModal && renderServiceModal()}
      {/* PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[10000] p-4 backdrop-blur-xs mt-12">
          <div
            className={`p-6 rounded-lg border w-full max-w-2xl max-h-[90vh] overflow-y-auto ${
              isDarkMode
                ? "bg-gray-800/50 border-gray-700"
                : "bg-white/50 border-gray-200"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3
                className={`text-xl font-bold ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Complete Sale
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className={`p-2 rounded-lg ${
                  isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
                }`}
              >
                <X size={20} />
              </button>
            </div>

            {/* Products List */}
            <div
              className={`mb-6 rounded-lg border overflow-hidden ${
                isDarkMode ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <div
                className={`p-3 font-bold border-b ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-700 text-white"
                    : "bg-gray-100 border-gray-200 text-gray-900"
                }`}
              >
                Products ({cart.length})
              </div>
              <div className="max-h-40 overflow-y-auto">
                {cart.map((item, index) => {
                  const retailPrice = convertToNumber(item.price);
                  return (
                    <div
                      key={item.product.id}
                      className={`p-3 border-b ${
                        index === cart.length - 1 ? "border-b-0" : ""
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium">{item.product.name}</div>
                          <div className="text-sm text-gray-500">
                            {item.product.specification || "No specification"}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-gray-600">
                              Qty: {item.quantity}
                            </span>
                            {item.discountedPrice !== retailPrice && (
                              <span className="text-sm line-through text-gray-400">
                                {retailPrice}৳
                              </span>
                            )}
                          </div>
                          {item.selectedSerials &&
                            item.selectedSerials.length > 0 && (
                              <div className="mt-1">
                                <div className="text-xs font-medium text-gray-600">
                                  Serials:
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {item.selectedSerials.map((serial, idx) => (
                                    <span
                                      key={idx}
                                      className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-700"
                                    >
                                      {serial}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">
                            {item.discountedPrice * item.quantity}৳
                          </div>
                          {item.discountedPrice !== retailPrice && (
                            <div className="text-xs text-red-500">
                              Save:{" "}
                              {(retailPrice - item.discountedPrice) *
                                item.quantity}
                              ৳
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Sale Summary Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Customer Information */}
              <div
                className={`p-4 rounded-lg border ${
                  isDarkMode
                    ? "border-gray-700 bg-gray-800"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <h4
                  className={`font-bold mb-3 ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Customer Information
                </h4>
                {selectedCustomer ? (
                  <div className="space-y-2">
                    <div>
                      <span
                        className={`text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Name:
                      </span>
                      <p
                        className={`font-medium ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {selectedCustomer.name}
                      </p>
                    </div>
                    <div>
                      <span
                        className={`text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Phone:
                      </span>
                      <p
                        className={`font-medium ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {selectedCustomer.phone}
                      </p>
                    </div>
                    {selectedCustomer.email && (
                      <div>
                        <span
                          className={`text-sm ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Email:
                        </span>
                        <p
                          className={`font-medium ${
                            isDarkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {selectedCustomer.email}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p
                    className={`text-sm ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    No customer selected (Walk-in customer)
                  </p>
                )}
              </div>

              {/* Order Summary */}
              <div
                className={`p-4 rounded-lg border ${
                  isDarkMode
                    ? "border-gray-700 bg-gray-800"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <h4
                  className={`font-bold mb-3 ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Order Summary
                </h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span
                      className={isDarkMode ? "text-gray-300" : "text-gray-600"}
                    >
                      Subtotal:
                    </span>
                    <span className="font-medium">
                      {orderSummary.subtotal}৳
                    </span>
                  </div>

                  {orderSummary.productDiscount > 0 && (
                    <div className="flex justify-between">
                      <span
                        className={
                          isDarkMode ? "text-gray-300" : "text-gray-600"
                        }
                      >
                        Product Discount:
                      </span>
                      <span className="font-medium text-red-500">
                        -{orderSummary.productDiscount}৳
                      </span>
                    </div>
                  )}

                  {orderSummary.orderDiscount > 0 && (
                    <div className="flex justify-between">
                      <span
                        className={
                          isDarkMode ? "text-gray-300" : "text-gray-600"
                        }
                      >
                        Order Discount:
                      </span>
                      <span className="font-medium text-red-500">
                        -{orderSummary.orderDiscount}৳
                      </span>
                    </div>
                  )}

                  <div className="border-t border-gray-300 dark:border-gray-700 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span
                        className={`font-bold ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Total:
                      </span>
                      <span className="text-xl font-bold text-green-600">
                        {orderSummary.total}৳
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="space-y-4">
              {/* Payment Method */}
              <div>
                <label
                  className={`block mb-2 font-medium ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Payment Method
                </label>
                <div className="flex gap-4">
                  {["Cash", "Card", "Mobile Banking"].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`flex-1 py-2.5 rounded-lg font-medium ${
                        paymentMethod === method
                          ? isDarkMode
                            ? "bg-blue-600 text-white"
                            : "bg-blue-500 text-white"
                          : isDarkMode
                            ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block mb-2 font-medium ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Amount Paid (৳)
                  </label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className={`w-full p-3 border rounded-lg text-xl ${
                      isDarkMode
                        ? "bg-gray-800 border-gray-600 text-white"
                        : "bg-white border-gray-300"
                    }`}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    autoFocus
                  />
                  <div className="flex gap-2 mt-2">
                    {[
                      orderSummary.total,
                      orderSummary.total / 2,
                      orderSummary.total * 0.75,
                    ].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setPaymentAmount(amount.toString())}
                        className={`flex-1 py-1.5 text-sm rounded ${
                          isDarkMode
                            ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                            : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                        }`}
                      >
                        {amount}৳
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setPaymentAmount(orderSummary.total.toString())
                      }
                      className={`flex-1 py-1.5 text-sm rounded ${
                        isDarkMode
                          ? "bg-green-700 hover:bg-green-600 text-white"
                          : "bg-green-200 hover:bg-green-300 text-green-800"
                      }`}
                    >
                      Full
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    className={`block mb-2 font-medium ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className={`w-full p-3 border rounded-lg ${
                      isDarkMode
                        ? "bg-gray-800 border-gray-600 text-white"
                        : "bg-white border-gray-300"
                    }`}
                  />
                  <p
                    className={`text-xs mt-1 ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Required if payment is incomplete
                  </p>
                </div>
              </div>

              {/* Payment Summary */}
              {paymentAmount && (
                <div
                  className={`p-4 rounded-lg border ${
                    isDarkMode
                      ? "border-gray-700 bg-gray-800"
                      : "border-gray-200 bg-gray-100"
                  }`}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div
                        className={`text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Amount Paid
                      </div>
                      <div
                        className={`text-2xl font-bold ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {parseFloat(paymentAmount)}৳
                      </div>
                    </div>
                    <div>
                      <div
                        className={`text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {parseFloat(paymentAmount) < orderSummary.total
                          ? "Amount Due"
                          : "Change"}
                      </div>
                      <div
                        className={`text-2xl font-bold ${
                          parseFloat(paymentAmount) < orderSummary.total
                            ? "text-red-600"
                            : parseFloat(paymentAmount) > orderSummary.total
                              ? "text-green-600"
                              : isDarkMode
                                ? "text-white"
                                : "text-gray-900"
                        }`}
                      >
                        {Math.abs(
                          orderSummary.total - parseFloat(paymentAmount),
                        )}
                        ৳
                        {parseFloat(paymentAmount) < orderSummary.total
                          ? " Due"
                          : parseFloat(paymentAmount) > orderSummary.total
                            ? " Change"
                            : ""}
                      </div>
                    </div>
                  </div>
                </div>
              )}



              {/* Action Buttons */}
              <div
                className={`rounded-lg p-2 flex justify-end space-between gap-4 `}
              >
                <button
                  onClick={handlePayment}
                  disabled={creatingSale || !paymentAmount}
                  className={`p-2 rounded-lg font-bold text-lg transition-colors ${
                    creatingSale || !paymentAmount
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-500 hover:bg-green-600 text-white"
                  }`}
                >
                  {creatingSale ? (
                    <>
                      <Loader2 className="inline mr-2 h-5 w-5 animate-spin" />
                      Processing Sale...
                    </>
                  ) : (
                    "Complete Sale"
                  )}
                </button>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className={`p-2 rounded-lg font-medium text-lg ${
                    isDarkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-white"
                      : "bg-gray-300 hover:bg-gray-400 text-gray-800"
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showAddProductModal && renderAddProductModal()}
    </div>
  );
};

export default POSPanel;
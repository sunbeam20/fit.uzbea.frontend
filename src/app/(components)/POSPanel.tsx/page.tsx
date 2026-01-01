"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/app/redux";
import { setIsPOSPanelOpen } from "@/state";
import {
  Search,
  Plus,
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
} from "lucide-react";
import { debounce } from "lodash";
import {
  useSearchProductsQuery,
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
  Product,
  Customer,
  Sale,
  SalesReturn,
  PurchaseReturn,
  Exchange,
  Service,
  ProductSerial,
  Purchase,
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
    retailPrice: number;
    wholesalePrice: number;
    purchasePrice: number;
    useIndividualSerials?: boolean;
    productCode?: string;
  };
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
    retailPrice: number;
    wholesalePrice: number;
    purchasePrice: number;
    useIndividualSerials?: boolean;
    productCode?: string;
  };
}

const POSPanel = () => {
  // States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"info" | "error" | "success">(
    "info"
  );
  const [discountProductId, setDiscountProductId] = useState<number | null>(
    null
  );
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">(
    "percentage"
  );
  const [discountValue, setDiscountValue] = useState("");
  const [orderDiscount, setOrderDiscount] = useState<OrderDiscount | null>(
    null
  );
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

  // New states for enhanced features
  const [showSerialModal, setShowSerialModal] = useState(false);
  const [selectedProductForSerials, setSelectedProductForSerials] =
    useState<Product | null>(null);
  const [selectedSerials, setSelectedSerials] = useState<string[]>([]);

  const [showExchangeSerialModal, setShowExchangeSerialModal] = useState(false);
  const [selectedExchangeProductForSerials, setSelectedExchangeProductForSerials] = useState<Product | null>(null);
  const [selectedExchangeSerials, setSelectedExchangeSerials] = useState<string[]>([]);

  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundType, setRefundType] = useState<"sale" | "purchase">("sale");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(
    null
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
    []
  );
  const [exchangeSaleSearchTerm, setExchangeSaleSearchTerm] = useState("");
  const [exchangeSelectedSale, setExchangeSelectedSale] = useState<Sale | null>(
    null
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
    []
  );
  const [exchangeReason, setExchangeReason] = useState("");

  // Update your existing API hooks to include exchange sale search
  const { data: exchangeSaleSearchResults, isLoading: searchingExchangeSales } =
    useSearchSalesQuery(exchangeSaleSearchTerm, {
      skip: exchangeSaleSearchTerm.trim().length < 2,
    });

  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceType, setServiceType] = useState<"warranty" | "normal">(
    "normal"
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
    "products"
  );

  const dispatch = useAppDispatch();
  const showPanel = useAppSelector((state) => state.global.isPOSPanelOpen);
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Get current user
  const { data: currentUser } = useGetMeQuery();

  // Refs for click outside detection
  const productSearchRef = useRef<HTMLDivElement>(null);
  const customerSearchRef = useRef<HTMLDivElement>(null);
  const productResultsRef = useRef<HTMLDivElement>(null);
  const customerResultsRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // API Hooks
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");

  const { data: searchProductsData, isLoading: productsLoading } =
    useSearchProductsQuery(productSearchTerm, {
      skip: productSearchTerm.length < 2 || showExchangeModal,
    });

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
    { skip: barcodeInput.length < 3 }
  );

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
    { skip: !selectedSale }
  );

  // Get serials for product
  const { data: productSerials, isLoading: loadingSerials } =
    useGetAvailableSerialsQuery(
      { productId: selectedProductForSerials?.id || 0 },
      { skip: !selectedProductForSerials }
    );

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

  // Update selected sale data when loaded
  useEffect(() => {
    if (selectedSaleData && refundType === "sale") {
      setReturnItems(
        selectedSaleData.SalesItems.map((item) => ({
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
                retailPrice: convertToNumber(item.Products.retailPrice),
                wholesalePrice: convertToNumber(item.Products.wholesalePrice),
                purchasePrice: convertToNumber(item.Products.purchasePrice),
                useIndividualSerials: item.Products.useIndividualSerials,
                productCode: item.Products.productCode,
              }
            : undefined,
        }))
      );
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
    type: "info" | "error" | "success" = "info"
  ) => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlertModal(true);
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
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProductResults, showCustomerResults]);

  // Debounced search for products
  const debouncedProductSearch = useCallback(
    debounce((searchTerm: string) => {
      setProductSearchTerm(searchTerm);
      setShowProductResults(searchTerm.length >= 2);
    }, 500),
    []
  );

  // Debounced search for customers
  const debouncedCustomerSearch = useCallback(
    debounce((searchTerm: string) => {
      setCustomerSearchTerm(searchTerm);
      setShowCustomerResults(searchTerm.length >= 2);
    }, 500),
    []
  );

  // Debounced search for exchange products
  const debouncedExchangeProductSearch = useCallback(
    debounce((searchTerm: string) => {
      // Only update if exchange modal is open
      if (showExchangeModal) {
        setExchangeProductSearchTerm(searchTerm);
      }
    }, 500),
    [showExchangeModal] // Add dependency
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
  }, [cart, orderDiscount]);

  const calculateOrderSummary = () => {
    const subtotal = cart.reduce(
      (sum, item) =>
        sum + convertToNumber(item.product.retailPrice) * item.quantity,
      0
    );

    const productDiscount = cart.reduce((sum, item) => {
      if (item.discount) {
        const originalPrice =
          convertToNumber(item.product.retailPrice) * item.quantity;
        const discountedPrice = item.discountedPrice * item.quantity;
        return sum + (originalPrice - discountedPrice);
      }
      return sum;
    }, 0);

    let orderDiscountAmount = 0;
    if (orderDiscount) {
      if (orderDiscount.type === "percentage") {
        orderDiscountAmount = (subtotal * orderDiscount.value) / 100;
      } else {
        orderDiscountAmount = Math.min(orderDiscount.value, subtotal);
      }
    }

    const totalDiscount = productDiscount + orderDiscountAmount;
    const total = Math.max(0, subtotal - orderDiscountAmount - productDiscount);
    const dueAmount = total - orderSummary.advancePaid;

    setOrderSummary({
      ...orderSummary,
      subtotal,
      productDiscount,
      orderDiscount: orderDiscountAmount,
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
      setShowSerialModal(true);
      return;
    }

    addProductToCart(product);
  };

  const addProductToCart = (product: Product, selectedSerials?: string[]) => {
    const existingItem = cart.find((item) => item.product.id === product.id);
    const retailPrice = convertToNumber(product.retailPrice);

    if (existingItem) {
      // For serialized products, quantity should equal number of selected serials
      const newQuantity = selectedSerials
        ? selectedSerials.length
        : existingItem.quantity + 1;

      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: newQuantity,
                selectedSerials: selectedSerials
                  ? [...(item.selectedSerials || []), ...selectedSerials]
                  : item.selectedSerials,
              }
            : item
        )
      );
    } else {
      // For new serialized product, quantity equals number of selected serials
      const quantity = selectedSerials ? selectedSerials.length : 1;

      const newItem: CartItem = {
        product,
        quantity: quantity,
        price: retailPrice,
        discountedPrice: retailPrice,
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
      })
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
            "error"
          );
          return false;
        }

        // Validate serials belong to the original sale
        const originalSerials = item.serials || [];
        const invalidSerials = selectedSerials.filter(
          (serial) => !originalSerials.includes(serial)
        );

        if (invalidSerials.length > 0) {
          showAlert(
            `Invalid serial(s) selected for ${
              item.Products.name
            }: ${invalidSerials.join(", ")}`,
            "error"
          );
          return false;
        }
      }
    }
    return true;
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
            discountedPrice: parseFloat(newDiscountedPrice.toFixed(2)),
          };
        }
        return item;
      })
    );

    setDiscountValue("");
    setShowDiscountModal(false);
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

    setOrderDiscount({
      type: discountType,
      value: discountNum,
    });

    setDiscountValue("");
    setShowDiscountModal(false);
    showAlert("Order discount applied successfully", "success");
  };

  // Remove order discount
  const handleRemoveOrderDiscount = () => {
    setOrderDiscount(null);
    showAlert("Order discount removed", "info");
  };
  const handleRemoveDiscount = (productId: number) => {
    setCart(
      cart.map((item) => {
        if (item.product.id === productId) {
          const retailPrice = convertToNumber(item.product.retailPrice);
          return {
            ...item,
            discount: undefined,
            discountedPrice: retailPrice,
          };
        }
        return item;
      })
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

  // Clear all
  const handleClearAll = () => {
    setCart([]);
    setSelectedCustomer(null);
    setOrderDiscount(null);
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
      const retailPrice = convertToNumber(item.product.retailPrice);
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
      user_id: currentUser.id,
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
    console.log("========================");

    try {
      await createSale(saleData).unwrap();

      showAlert(
        `Sale completed successfully!${
          dueAmount > 0 ? ` Due amount: ${dueAmount.toFixed(2)}৳` : ""
        }`,
        "success"
      );

      handleClearAll();
      setShowPaymentModal(false);
    } catch (error: any) {
      console.error("Sale creation failed:", error);
      console.error("Error details:", error?.data);
      showAlert(
        error?.data?.message || error?.data?.error || "Failed to complete sale",
        "error"
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
        "error"
      );
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
      (item) => item.product.id === selectedProductForSerials.id
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
            : item
        )
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

      // Check if we're in exchange modal
      if (showExchangeModal) {
        const existingItem = exchangeNewProducts.find(
          (item) => item.product.id === selectedProductForSerials.id
        );

        if (existingItem) {
          // Update existing item with new serials
          setExchangeNewProducts(
            exchangeNewProducts.map((item) =>
              item.product.id === selectedProductForSerials.id
                ? {
                    ...item,
                    quantity: selectedSerials.length,
                    selectedSerials: selectedSerials,
                  }
                : item
            )
          );
        } else {
          // Add new item with serials
          const retailPrice = convertToNumber(
            selectedProductForSerials.retailPrice
          );
          const newItem: CartItem = {
            product: selectedProductForSerials,
            quantity: selectedSerials.length,
            price: retailPrice,
            discountedPrice: retailPrice,
            selectedSerials,
          };
          setExchangeNewProducts([...exchangeNewProducts, newItem]);
        }
      } else {
        // Original logic for regular cart
        const existingItem = cart.find(
          (item) => item.product.id === selectedProductForSerials.id
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
                : item
            )
          );
        } else {
          addProductToCart(selectedProductForSerials, selectedSerials);
        }
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

  // Handle sale selection for refund/exchange
  const handleSelectSale = async (sale: Sale) => {
    setSelectedSale(sale);

    // If sale has items, prepare return items
    if (sale.SalesItems && sale.SalesItems.length > 0) {
      const returnItemsData: ReturnItem[] = sale.SalesItems.map((item) => {
        const discountValue = item.discount
          ? convertToNumber(item.discount)
          : 0;

        return {
          id: item.id,
          product_id: item.product_id,
          quantity: item.quantity,
          returnQuantity: 0,
          unitPrice: convertToNumber(item.unitPrice),
          discount: discountValue,
          returnReason: "",
          Products: item.Products
            ? {
                id: item.Products.id,
                name: item.Products.name,
                specification: item.Products.specification,
                retailPrice: convertToNumber(item.Products.retailPrice),
                wholesalePrice: convertToNumber(item.Products.wholesalePrice),
                purchasePrice: convertToNumber(item.Products.purchasePrice),
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

      setReturnItems(returnItemsData);
      // Clear any previously selected serials
      setSelectedReturnSerials({});
    }
  };

  // Handle purchase selection for refund
  const handleSelectPurchase = async (purchase: Purchase) => {
    setSelectedPurchase(purchase);

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
                  // specification: item.Products.specification,
                  retailPrice: convertToNumber(item.Products.retailPrice),
                  wholesalePrice: convertToNumber(item.Products.wholesalePrice),
                  purchasePrice: convertToNumber(item.Products.purchasePrice),
                  useIndividualSerials: item.Products.useIndividualSerials,
                  productCode: item.Products.productCode,
                }
              : undefined,
            serials:
              item.purchaseItemSerials
                ?.map((s) => s.ProductSerials?.serial)
                .filter((s): s is string => !!s) || [],
          };
        }
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
                retailPrice: convertToNumber(item.Products.retailPrice),
                wholesalePrice: convertToNumber(item.Products.wholesalePrice),
                purchasePrice: convertToNumber(item.Products.purchasePrice),
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
  const handleExchangeItemSerialSelection = (itemId: number, serial: string) => {
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
        (item) => item.product.id === selectedExchangeProductForSerials.id
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
              : item
          )
        );
      } else {
        // Add new item with serials
        const retailPrice = convertToNumber(
          selectedExchangeProductForSerials.retailPrice
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
            "error"
          );
          return false;
        }

        // Validate serials belong to the original sale
        const originalSerials = item.serials || [];
        const invalidSerials = selectedSerials.filter(
          (serial) => !originalSerials.includes(serial)
        );

        if (invalidSerials.length > 0) {
          showAlert(
            `Invalid serial(s) selected for ${
              item.Products.name
            }: ${invalidSerials.join(", ")}`,
            "error"
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
    // Check if product uses individual serials
    if (product.useIndividualSerials) {
      // Show exchange-specific serial selection
      setSelectedExchangeProductForSerials(product);
      setSelectedExchangeSerials([]);
      setShowExchangeSerialModal(true);
      return;
    }

    const existingItem = exchangeNewProducts.find(
      (item) => item.product.id === product.id
    );
    const retailPrice = convertToNumber(product.retailPrice);

    if (existingItem) {
      setExchangeNewProducts(
        exchangeNewProducts.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      const newItem: CartItem = {
        product,
        quantity: 1,
        price: retailPrice,
        discountedPrice: retailPrice,
      };
      setExchangeNewProducts([...exchangeNewProducts, newItem]);
    }
  };
  // Remove product from exchange cart
  const handleRemoveExchangeProduct = (productId: number) => {
    // Check if the product exists in exchangeNewProducts
    const productExists = exchangeNewProducts.some(
      (item) => item.product.id === productId
    );
    
    if (!productExists) {
      console.log("Product not found in exchangeNewProducts:", productId);
      console.log("Current exchangeNewProducts:", exchangeNewProducts);
      return;
    }
    
    // Remove the product
    const updatedProducts = exchangeNewProducts.filter(
      (item) => item.product.id !== productId
    );
    
    console.log("Removing product:", productId);
    console.log("Updated products:", updatedProducts);
    
    setExchangeNewProducts(updatedProducts);
  };
  // Handle create sale return with serial support
  const handleCreateSaleReturn = async () => {
    if (!selectedSale || !currentUser) {
      showAlert("Please select a sale and ensure you're logged in", "error");
      return;
    }

    const itemsToReturn = returnItems.filter((item) => item.returnQuantity > 0);
    if (itemsToReturn.length === 0) {
      showAlert("Please select items to return", "error");
      return;
    }
    if (!validateReturnItems(itemsToReturn)) {
      showAlert("Error in validation of return items", "error");
      return;
    }

    // Validate serials for serialized products
    for (const item of itemsToReturn) {
      if (item.Products?.useIndividualSerials) {
        const selectedSerials = selectedReturnSerials[item.id] || [];
        if (selectedSerials.length !== item.returnQuantity) {
          showAlert(
            `Please select exactly ${item.returnQuantity} serial(s) for ${item.Products.name}`,
            "error"
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
      const itemDiscount = item.discount || 0;
      const itemPrice = convertToNumber(item.unitPrice) - itemDiscount;
      return total + itemPrice * item.returnQuantity;
    }, 0);

    try {
      if (!selectedSale.customer_id) {
        showAlert("Selected sale doesn't have a customer", "error");
        return;
      }

      // Prepare return data
      const returnData: any = {
        sales_id: selectedSale.id,
        customer_id: selectedSale.customer_id,
        user_id: currentUser.id,
        total_payback: total_payback,
        note: returnReason,
        items: itemsToReturn.map((item) => ({
          sales_item_id: item.id,
          product_id: item.product_id,
          quantity: item.returnQuantity,
          unitPrice: convertToNumber(item.unitPrice),
          discount: convertToNumber(item.discount || 0),
          returnReason: item.returnReason,
          serials: selectedReturnSerials[item.id] || [],
        })),
      };

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
      showAlert(
        error?.data?.message || "Failed to create sale return",
        "error"
      );
    }
  };
  // Handle create purchase return
  const handleCreatePurchaseReturn = async () => {
    if (!selectedPurchase || !currentUser) {
      showAlert(
        "Please select a purchase and ensure you're logged in",
        "error"
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
            "error"
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
        "error"
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
      (item) => item.exchangeQuantity > 0
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

  // Handle create service
  const handleCreateService = async () => {
    if (!serviceDetails.description || !currentUser) {
      showAlert("Please provide service description", "error");
      return;
    }

    try {
      const serviceData = {
        customer_id: selectedCustomer?.id,
        user_id: currentUser.id,
        service_product_name:
          serviceProduct?.product?.name || "General Service",
        service_description: serviceDetails.description,
        service_cost: serviceDetails.cost,
        service_status: "Pending",
        assigned_technician: serviceDetails.assignedTechnician,
        warranty_claim: serviceType === "warranty",
        product_serial: serviceProduct?.serial,
        sale_id: serviceProduct?.sale_id,
        date: new Date().toISOString().split("T")[0],
      };

      await createService(serviceData).unwrap();
      showAlert("Service created successfully!", "success");
      setShowServiceModal(false);
      // Reset state
      setServiceProduct(null);
      setServiceDetails({
        description: "",
        cost: 0,
        assignedTechnician: "",
      });
    } catch (error: any) {
      console.error("Service creation failed:", error);
      showAlert(error?.data?.message || "Failed to create service", "error");
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

  // Render serial selection modal
  const renderSerialModal = () => (
    <div className="fixed inset-0 flex backdrop-blur-sm items-center justify-center z-[10000] p-4">
      <div
        className={`p-6 rounded-xl border w-full max-w-md transform transition-all duration-300 scale-100 max-h-[80vh] overflow-y-auto ${
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
        className={`p-6 rounded-xl border w-full max-w-md transform transition-all duration-300 scale-100 max-h-[80vh] overflow-y-auto ${
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
            Select Serials for Exchange - {selectedExchangeProductForSerials?.name}
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
                    selectedExchangeSerials.includes(serial.serial)
                      ? isDarkMode
                        ? "border-blue-500 bg-blue-900/20"
                        : "border-blue-400 bg-blue-50"
                      : isDarkMode
                      ? "border-gray-700 hover:bg-gray-800"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => handleNewExchangeSerialSelection(serial.serial)}
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
              <p className={`${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                No serials available for this product
              </p>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleAddExchangeWithSerials}
              disabled={selectedExchangeSerials.length === 0 || loadingSerials}
              className={`flex-1 py-3 rounded-lg font-medium ${
                selectedExchangeSerials.length === 0 || loadingSerials
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-600 text-white"
              }`}
            >
              {loadingSerials
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
    <div className="fixed inset-0 flex backdrop-blur-sm items-center justify-center z-[10000] p-4">
      <div
        className={`p-6 rounded-xl border w-full max-w-4xl transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto ${
          isDarkMode
            ? "bg-gray-900 border-gray-700"
            : "bg-white border-gray-200"
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
                  ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
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
                                      sale.createdAt
                                    ).toLocaleDateString()}
                                  </div>
                                  <div>
                                    Total:{" "}
                                    {convertToNumber(sale.totalAmount).toFixed(
                                      2
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
                                        purchase.createdAt
                                      ).toLocaleDateString()}
                                    </div>
                                    <div>
                                      Total:{" "}
                                      {convertToNumber(
                                        purchase.totalAmount
                                      ).toFixed(2)}
                                      ৳
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
                    Total: $
                    {convertToNumber(selectedSale.totalAmount).toFixed(2)}
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
                            Original Price:{" "}
                            {convertToNumber(item.unitPrice).toFixed(2)}৳
                            {item.discount && item.discount > 0 && (
                              <span className="ml-2 text-red-500">
                                (Discount: {item.discount}৳)
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
                                item.returnQuantity - 1
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
                                item.returnQuantity + 1
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
                                      serial
                                    )
                                  }
                                  className={`px-2 py-1 text-xs border rounded ${
                                    selectedReturnSerials[item.id]?.includes(
                                      serial
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
                                    serial
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
                                (i) => i.id === item.id
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
                    Total: $
                    {convertToNumber(selectedPurchase.totalAmount).toFixed(2)}
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
                          Original Price:{" "}
                          {convertToNumber(item.unitPrice).toFixed(2)}৳
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
                              item.returnQuantity - 1
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
                              item.returnQuantity + 1
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
                                    serial
                                  )
                                }
                                className={`px-2 py-1 text-xs border rounded ${
                                  selectedReturnSerials[item.id]?.includes(
                                    serial
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
                                  serial
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
                              (i) => i.id === item.id
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
                    0
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
                      0
                    )
                    .toFixed(2)}
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
                      0
                    )
                    .toFixed(2)}
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
                      }, 0)
                      .toFixed(2)}
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
            {["cash", "credit", "store_credit"].map((method) => (
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

        {/* Return Reason */}
        <div className="mb-6">
          <label
            className={`block mb-2 font-medium ${
              isDarkMode ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Overall Return Reason
          </label>
          <textarea
            value={returnReason}
            onChange={(e) => setReturnReason(e.target.value)}
            className={`w-full p-3 border rounded-lg ${
              isDarkMode
                ? "bg-gray-800 border-gray-600 text-white"
                : "bg-white border-gray-300"
            }`}
            rows={3}
            placeholder="Enter return reason..."
          />
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
              !returnReason.trim()
            }
            className={`flex-1 py-3 rounded-lg font-medium ${
              creatingSalesReturn ||
              creatingPurchaseReturn ||
              !(refundType === "sale" ? selectedSale : selectedPurchase) ||
              returnItems.filter((item) => item.returnQuantity > 0).length ===
                0 ||
              !returnReason.trim()
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
    <div className="fixed inset-0 flex backdrop-blur-sm items-center justify-center z-[10000] p-4">
      <div
        className={`p-6 rounded-xl border w-full max-w-6xl transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto ${
          isDarkMode
            ? "bg-gray-900 border-gray-700"
            : "bg-white border-gray-200"
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
                                        sale.createdAt
                                      ).toLocaleDateString()}
                                    </div>
                                    <div>
                                      Total:{" "}
                                      {convertToNumber(
                                        sale.totalAmount
                                      ).toFixed(2)}
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
                          exchangeSelectedSale.createdAt
                        ).toLocaleDateString()}
                      </p>
                      <p
                        className={`text-sm ${
                          isDarkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        Total:{" "}
                        {convertToNumber(
                          exchangeSelectedSale.totalAmount
                        ).toFixed(2)}
                        ৳
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
                              Price:{" "}
                              {convertToNumber(item.unitPrice).toFixed(2)}৳
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
                                  item.exchangeQuantity - 1
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
                                  item.exchangeQuantity + 1
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
                                        serial
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
                                      serial
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
                                  (i) => i.id === item.id
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
            {showExchangeModal && exchangeProductSearchTerm.length >= 2 && (
              <div className="mb-6">
                <div
                  className={`border rounded-lg shadow-lg max-h-60 overflow-y-auto ${
                    isDarkMode
                      ? "bg-gray-900 border-gray-700 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                >
                  <div className={`px-3 py-2 text-xs ${
                    isDarkMode ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-600"
                  }`}>
                    Found {exchangeSearchProductsData?.length || 0} product(s)
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {exchangeProductsLoading ? (
                      <div className="p-4 text-center">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-500 mb-2" />
                        <p className="text-gray-500">Searching...</p>
                      </div>
                    ) : exchangeSearchProductsData && exchangeSearchProductsData.length > 0 ? (
                      exchangeSearchProductsData.map((product) => {
                        const retailPrice = convertToNumber(product.retailPrice);
                        return (
                          <div
                            key={product.id}
                            className={`p-3 border-b cursor-pointer transition-colors ${
                              isDarkMode
                                ? "border-gray-700 hover:bg-gray-800"
                                : "border-gray-200 hover:bg-gray-50"
                            }`}
                            onClick={() => {
                              handleAddExchangeProduct(product);
                              setExchangeProductSearchTerm(""); // Clear search term
                            }}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex-1">
                                <div className="font-medium">{product.name}</div>
                                <div
                                  className={`text-sm ${
                                    isDarkMode ? "text-gray-400" : "text-gray-500"
                                  }`}
                                >
                                  {product.specification || "No specification"}
                                </div>
                                {product.useIndividualSerials && (
                                  <div className="text-xs text-blue-500 mt-1">
                                    Requires serial selection
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="text-green-600 font-semibold">
                                  {retailPrice.toFixed(2)} ৳
                                </span>
                                <span
                                  className={`text-xs ${
                                    isDarkMode ? "text-gray-400" : "text-gray-500"
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
                          {item.discountedPrice.toFixed(2)}৳ × {item.quantity}
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
                                (p) => p.product.id === item.product.id
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
                                (p) => p.product.id === item.product.id
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
                          0
                        )
                        .toFixed(2)}
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
                      {exchangeNewProducts
                        .reduce(
                          (sum, item) =>
                            sum + item.discountedPrice * item.quantity,
                          0
                        )
                        .toFixed(2)}
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
                        {Math.abs(calculateExchangeDifference()).toFixed(2)}৳
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
    <div className="fixed inset-0 flex backdrop-blur-sm items-center justify-center z-[10000] p-4">
      <div
        className={`p-6 rounded-xl border w-full max-w-2xl transform transition-all duration-300 scale-100 ${
          isDarkMode
            ? "bg-gray-900 border-gray-700"
            : "bg-white border-gray-200"
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
            onClick={() => setShowServiceModal(false)}
            className={`p-2 rounded-lg ${
              isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Service Type Selection */}
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
              onClick={() => setServiceType("normal")}
              className={`flex-1 py-2 rounded ${
                serviceType === "normal"
                  ? "bg-blue-500 text-white"
                  : isDarkMode
                  ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Normal Service
            </button>
            <button
              onClick={() => setServiceType("warranty")}
              className={`flex-1 py-2 rounded ${
                serviceType === "warranty"
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

        {/* For warranty claims, show product search */}
        {serviceType === "warranty" && (
          <div className="mb-6">
            <label
              className={`block mb-2 font-medium ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Search Product by Serial
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className={`flex-1 p-3 border rounded-lg ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-600 text-white"
                    : "bg-white border-gray-300"
                }`}
                placeholder="Enter product serial number..."
              />
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 rounded-lg">
                Search
              </button>
            </div>
            <p
              className={`text-sm mt-2 ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              For warranty claims, verify the product is still under warranty
            </p>
          </div>
        )}

        {/* Service Details */}
        <div className="space-y-4 mb-6">
          <div>
            <label
              className={`block mb-2 font-medium ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Service Description
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
                Service Cost ($)
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
                placeholder="0.00"
                min="0"
                step="0.01"
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
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleCreateService}
            disabled={creatingService || !serviceDetails.description.trim()}
            className={`flex-1 py-3 rounded-lg font-medium ${
              creatingService || !serviceDetails.description.trim()
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600 text-white"
            }`}
          >
            {creatingService ? "Creating..." : "Create Service"}
          </button>
          <button
            onClick={() => setShowServiceModal(false)}
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

  // Render discount modal
  const renderDiscountModal = () => (
    <div className="fixed inset-0 flex backdrop-blur-sm items-center justify-center z-[10000] p-4">
      <div
        className={`p-6 rounded-xl border w-full max-w-md transform transition-all duration-300 scale-100 ${
          isDarkMode
            ? "bg-gray-900 border-gray-700"
            : "bg-white border-gray-200"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          className={`text-lg font-bold mb-4 ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}
        >
          {discountProductId
            ? "Apply Product Discount"
            : "Apply Order Discount"}
        </h3>
        <div className="space-y-4">
          <div>
            <label
              className={`block mb-2 font-medium ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Discount Type
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setDiscountType("percentage")}
                className={`flex-1 py-2 rounded ${
                  discountType === "percentage"
                    ? "bg-blue-500 text-white"
                    : isDarkMode
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Percentage (%)
              </button>
              <button
                onClick={() => setDiscountType("fixed")}
                className={`flex-1 py-2 rounded ${
                  discountType === "fixed"
                    ? "bg-blue-500 text-white"
                    : isDarkMode
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Fixed Amount ($)
              </button>
            </div>
          </div>
          <div>
            <label
              className={`block mb-2 font-medium ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Discount Value
            </label>
            <input
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              className={`w-full p-3 border rounded-lg ${
                isDarkMode
                  ? "bg-gray-800 border-gray-600 text-white"
                  : "bg-white border-gray-300"
              }`}
              placeholder={
                discountType === "percentage"
                  ? "Enter percentage (0-100)"
                  : "Enter amount"
              }
              min="0"
              max={discountType === "percentage" ? "100" : undefined}
              step="0.01"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={
                discountProductId
                  ? handleApplyDiscount
                  : handleApplyOrderDiscount
              }
              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium"
            >
              Apply Discount
            </button>
            <button
              onClick={() => {
                setShowDiscountModal(false);
                setDiscountProductId(null);
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

  // Update the desktop view action buttons section
  const renderDesktopActionButtons = () => (
    <div
      className={`rounded-2xl border p-1 backdrop-blur ${
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
            setDiscountProductId(null); // Set to null for order discount
            setShowDiscountModal(true);
          }}
          className="py-1 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <Percent size={14} />
          Discount
        </button>

        {/* Refund Button */}
        <button
          onClick={handleRefund}
          className="py-1 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <RefreshCw size={14} />
          Refund
        </button>

        {/* Exchange Button */}
        <button
          onClick={handleExchange}
          className="py-1 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeftRight size={14} />
          Exchange
        </button>

        {/* Service Button */}
        <button
          onClick={handleService}
          className="py-1 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <Wrench size={14} />
          Service
        </button>

        {/* Other Action Buttons */}
        {["Pre Order", "Delivery"].map((label) => (
          <button
            key={label}
            className={`py-1 rounded-xl font-bold border transition-colors flex items-center justify-center gap-1 cursor-pointer ${
              isDarkMode
                ? "border-gray-600 bg-gray-800/50 hover:bg-gray-700 text-white"
                : "border-gray-300 bg-white/50 hover:bg-gray-100 text-gray-800"
            }`}
            onClick={() =>
              showAlert(`${label} functionality coming soon`, "info")
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* Order Discount Display */}
      {orderDiscount && (
        <div
          className={`mt-2 p-2 rounded-lg border ${
            isDarkMode
              ? "border-blue-500 bg-blue-900/20"
              : "border-blue-300 bg-blue-50"
          }`}
        >
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm font-medium">Order Discount Applied</div>
              <div className="text-xs">
                {orderDiscount.type === "percentage"
                  ? `${orderDiscount.value}%`
                  : `$${orderDiscount.value.toFixed(2)}`}
              </div>
            </div>
            <button
              onClick={handleRemoveOrderDiscount}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              Remove
            </button>
          </div>
        </div>
      )}

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
        className={`w-full mt-1 text-white font-bold py-1 rounded-xl text-lg transition-colors flex items-center justify-center gap-1 cursor-pointer ${
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
          onClick={() => {
            if (cart.length === 0) {
              showAlert("Add products to cart first", "info");
              return;
            }
            setPaymentAmount(orderSummary.total.toString());
            setShowPaymentModal(true);
          }}
          className="flex-1 bg-green-200 hover:bg-green-300 text-black py-1 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
        >
          Cash IN
        </button>
        <button
          onClick={() =>
            showAlert("Cash Out functionality coming soon", "info")
          }
          className="flex-1 bg-red-200 hover:bg-red-300 text-black py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
        >
          Cash Out
        </button>
      </div>

      {/* Clear Button */}
      <button
        onClick={handleClearAll}
        disabled={cart.length === 0 && !selectedCustomer && !orderDiscount}
        className={`w-full mt-1 py-1 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer ${
          cart.length === 0 && !selectedCustomer && !orderDiscount
            ? "bg-gray-300 cursor-not-allowed dark:bg-gray-700"
            : "bg-gray-400 hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-500"
        } ${isDarkMode ? "text-gray-800" : "text-gray-800"}`}
      >
        <Trash2 size={16} />
        CLEAR ALL
      </button>
    </div>
  );

  // Update order summary display
  const renderOrderSummary = () => (
    <div
      className={`rounded-2xl border p-2 backdrop-blur ${
        isDarkMode
          ? "bg-gray-800/50 border-gray-700"
          : "bg-white/50 border-gray-200"
      }`}
    >
      <h2
        className={`text-xl font-bold mb-4 ${
          isDarkMode ? "text-white" : "text-gray-900"
        }`}
      >
        Order Summary
      </h2>

      <div className="space-y-3">
        <div className="flex justify-between items-center py-1">
          <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
            Subtotal:
          </span>
          <span
            className={`font-medium ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {orderSummary.subtotal.toFixed(2)} ৳
          </span>
        </div>

        {orderSummary.productDiscount > 0 && (
          <div className="flex justify-between">
            <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
              Product Discounts:
            </span>
            <span className="font-medium text-red-500">
              -{orderSummary.productDiscount.toFixed(2)}৳
            </span>
          </div>
        )}

        {orderSummary.orderDiscount > 0 && (
          <div className="flex justify-between">
            <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
              Order Discount:
            </span>
            <span className="font-medium text-red-500">
              -{orderSummary.orderDiscount.toFixed(2)}৳
            </span>
          </div>
        )}

        <div
          className={`border-t pt-3 mt-2 ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <div className="flex justify-between items-center">
            <span
              className={`text-lg font-bold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Total:
            </span>
            <span className="text-2xl font-bold text-green-600">
              {orderSummary.total.toFixed(2)} ৳
            </span>
          </div>
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
          backdrop-blur-sm border-l border-white/10
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
        ) : isTablet ? (
          /* Tablet View */
          <div className="grid grid-cols-2 gap-1 h-full p-1">
            {/* LEFT SIDE - Products & Cart */}
            <div className="col-span-1 flex flex-col gap-1 h-full">
              {/* PRODUCT SEARCH SECTION */}
              <div
                className={`rounded-lg border p-2 backdrop-blur ${
                  isDarkMode
                    ? "bg-gray-800/50 border-gray-700"
                    : "bg-white/50 border-gray-200"
                }`}
                ref={productSearchRef}
              >
                <label className="block text-xs font-medium mb-1">
                  <Search className="inline mr-1" size={12} />
                  Search Products
                </label>
                <div className="flex items-center gap-1">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      onChange={(e) => {
                        debouncedProductSearch(e.target.value);
                        if (e.target.value.length < 2) {
                          setShowProductResults(false);
                        }
                      }}
                      className={`w-full p-1.5 border rounded-lg text-xs ${
                        isDarkMode
                          ? "bg-gray-800 border-gray-600 text-white"
                          : "bg-white border-gray-300"
                      }`}
                      placeholder="Product Name/Barcode..."
                      onFocus={() => {
                        if (productSearchTerm.length >= 2) {
                          setShowProductResults(true);
                        }
                      }}
                    />
                    {productsLoading && (
                      <div className="absolute right-2 top-1.5">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Rest of tablet view - similar structure but responsive */}
              {/* For brevity, using responsive versions of the components */}
            </div>

            {/* RIGHT SIDE - Customers & Actions */}
            <div className="col-span-1 flex flex-col gap-1 h-full">
              {/* CUSTOMER SEARCH */}
              <div
                className={`rounded-lg border p-2 backdrop-blur relative ${
                  isDarkMode
                    ? "bg-gray-800/50 border-gray-700"
                    : "bg-white/50 border-gray-200"
                }`}
                ref={customerSearchRef}
              >
                <div className="flex justify-between items-center mb-1">
                  <label
                    className={`block text-xs font-medium ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    <Search className="inline mr-1" size={12} />
                    Search Customers
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    onChange={(e) => {
                      debouncedCustomerSearch(e.target.value);
                      if (e.target.value.length < 2) {
                        setShowCustomerResults(false);
                      }
                    }}
                    className={`w-full p-1.5 border rounded-lg text-xs ${
                      isDarkMode
                        ? "bg-gray-800 border-gray-600 text-white"
                        : "bg-white border-gray-300"
                    }`}
                    placeholder="Customer Name/Phone..."
                    onFocus={() => {
                      if (customerSearchTerm.length >= 2) {
                        setShowCustomerResults(true);
                      }
                    }}
                  />
                  {customersLoading && (
                    <div className="absolute right-2 top-1.5">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Rest of tablet view */}
            </div>
          </div>
        ) : (
          /* Desktop View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 h-full p-1">
            {/* LEFT SIDE */}
            <div className="col-span-1 md:col-span-2 lg:col-span-2 flex flex-col gap-2">
              {/* PRODUCT SEARCH SECTION */}
              <div
                className={`rounded-2xl border p-2 backdrop-blur ${
                  isDarkMode
                    ? "bg-gray-800/50 border-gray-700"
                    : "bg-white/50 border-gray-200"
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
                          className={`w-full p-2 border rounded-xl pl-2 ${
                            isDarkMode
                              ? "bg-gray-800 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500"
                              : "bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
                className={`rounded-2xl border p-2 backdrop-blur overflow-auto flex-1 ${
                  isDarkMode
                    ? "bg-gray-800/50 border-gray-700"
                    : "bg-white/50 border-gray-200"
                }`}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2
                    className={`text-xl font-bold ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Product Details
                  </h2>
                  {cart.length > 0 && (
                    <span
                      className={`text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
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
                          <th className="py-3 px-2">Qty</th>
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
                            item.discountedPrice
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
                              <td className="py-3 px-2 text-left">
                                <div>
                                  <div
                                    className={`font-medium ${
                                      isDarkMode
                                        ? "text-white"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {item.product.name}
                                  </div>
                                  <div
                                    className={`text-sm ${
                                      isDarkMode
                                        ? "text-gray-400"
                                        : "text-gray-500"
                                    }`}
                                  >
                                    {item.product.specification}
                                  </div>
                                  {item.selectedSerials &&
                                    item.selectedSerials.length > 0 && (
                                      <div className="text-xs text-blue-500 mt-1">
                                        Serials:{" "}
                                        {item.selectedSerials.join(", ")}
                                      </div>
                                    )}
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
                                  {price.toFixed(2)} ৳
                                </div>
                              </td>
                              <td className="py-3 px-2">
                                {item.discount ? (
                                  <div className="flex flex-col items-center">
                                    <span className="text-red-500 font-medium">
                                      {item.discount.type === "percentage"
                                        ? `${item.discount.value}%`
                                        : `${item.discount.value.toFixed(2)} ৳`}
                                    </span>
                                    <div className="text-xs text-gray-500">
                                      Saved:{" "}
                                      {(
                                        (convertToNumber(
                                          item.product.retailPrice
                                        ) -
                                          item.discountedPrice) *
                                        item.quantity
                                      ).toFixed(2)}
                                      ৳
                                    </div>
                                    <button
                                      onClick={() =>
                                        handleRemoveDiscount(item.product.id)
                                      }
                                      className="text-xs text-red-500 hover:text-red-700 mt-1 transition-colors cursor-pointer"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setDiscountProductId(item.product.id);
                                      setDiscountValue("");
                                      setShowDiscountModal(true);
                                    }}
                                    className="text-blue-500 hover:text-blue-700 text-sm font-medium transition-colors cursor-pointer"
                                  >
                                    Add Discount
                                  </button>
                                )}
                              </td>
                              <td className="py-3 px-2">
                                <div
                                  className={`font-semibold ${
                                    isDarkMode ? "text-white" : "text-gray-900"
                                  }`}
                                >
                                  {total.toFixed(2)} ৳
                                </div>
                                {item.discount && (
                                  <div
                                    className={`text-xs line-through ${
                                      isDarkMode
                                        ? "text-gray-500"
                                        : "text-gray-400"
                                    }`}
                                  >
                                    {(price * item.quantity).toFixed(2)} ৳
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-2">
                                <button
                                  onClick={() =>
                                    handleRemoveProduct(item.product.id)
                                  }
                                  className="p-2 bg-red-500 hover:bg-red-600 text-white rounded transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <Trash2 size={14} />
                                  <span className="text-xs">Remove</span>
                                </button>
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
                className={`rounded-2xl border p-2 backdrop-blur relative ${
                  isDarkMode
                    ? "bg-gray-800/50 border-gray-700"
                    : "bg-white/50 border-gray-200"
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
                    className={`w-full p-2 border rounded-xl ${
                      isDarkMode
                        ? "bg-gray-800 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500"
                        : "bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
                className={`rounded-2xl border p-2 backdrop-blur flex-1 flex flex-col ${
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
                      className={`py-4 px-2 mr-2 rounded-lg border overflow-hidden max-h-[calc(100%-3rem)] ${
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
                    <div className="flex rounded-xl p-2 justify-between backdrop-blur font-bold">
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
            className={`border rounded-2xl shadow-xl max-h-200 overflow-y-auto ${
              isDarkMode
                ? "bg-gray-900 border-gray-700 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          >
            {searchProductsData.length === 0 ? (
              <div className="p-4 text-center">
                <Search className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p className="text-gray-500">No products found</p>
              </div>
            ) : (
              searchProductsData.map((product) => {
                const retailPrice = convertToNumber(product.retailPrice);
                return (
                  <div
                    key={product.id}
                    className={`p-3 border-b cursor-pointer transition-colors ${
                      isDarkMode
                        ? "border-gray-700 hover:bg-gray-800"
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
                          className={`text-sm ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {product.specification || "No specification"}
                        </div>
                        {product.useIndividualSerials && (
                          <div className="text-xs text-blue-500 mt-1">
                            Requires serial selection
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-green-600 font-semibold">
                          {retailPrice.toFixed(2)} ৳
                        </span>
                        <span
                          className={`text-xs ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Stock: {product.quantity}
                        </span>
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
            className={`border rounded-lg shadow-xl max-h-60 overflow-y-auto ${
              isDarkMode
                ? "bg-gray-900 border-gray-700 text-white"
                : "bg-white border-gray-200 text-gray-900"
            }`}
          >
            {searchCustomersData.length === 0 ? (
              <div className="p-4 text-center">
                <Search className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p className="text-gray-500">No customers found</p>
              </div>
            ) : (
              searchCustomersData.map((customer) => (
                <div
                  key={customer.id}
                  className={`p-3 border-b cursor-pointer transition-colors ${
                    isDarkMode
                      ? "border-gray-700 hover:bg-gray-800"
                      : "border-gray-200 hover:bg-gray-50"
                  } ${
                    selectedCustomer?.id === customer.id
                      ? isDarkMode
                        ? "bg-blue-900/30"
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
                        className={`text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {customer.phone}
                      </div>
                      {customer.email && (
                        <div
                          className={`text-xs ${
                            isDarkMode ? "text-gray-500" : "text-gray-400"
                          }`}
                        >
                          {customer.email}
                        </div>
                      )}
                    </div>
                    {selectedCustomer?.id === customer.id && (
                      <Check className="text-green-500" size={16} />
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
        <div className="fixed inset-0 flex backdrop-blur-sm items-center justify-center z-[10000] p-4">
          <div
            className={`p-6 rounded-xl border w-full max-w-md transform transition-all duration-300 scale-100 ${
              isDarkMode
                ? "bg-gray-900 border-gray-700"
                : "bg-white border-gray-200"
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
        <div className="fixed inset-0 flex backdrop-blur-sm items-center justify-center z-[10000] p-4">
          <div
            className={`p-6 rounded-xl border w-full max-w-2xl max-h-[90vh] overflow-y-auto ${
              isDarkMode
                ? "bg-gray-900 border-gray-700"
                : "bg-white border-gray-200"
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
                      {orderSummary.subtotal.toFixed(2)}৳
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
                        -{orderSummary.productDiscount.toFixed(2)}৳
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
                        -{orderSummary.orderDiscount.toFixed(2)}৳
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
                        {orderSummary.total.toFixed(2)}৳
                      </span>
                    </div>
                  </div>
                </div>
              </div>
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
                  const retailPrice = convertToNumber(item.product.retailPrice);
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
                                {retailPrice.toFixed(2)}৳
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
                            {(item.discountedPrice * item.quantity).toFixed(2)}৳
                          </div>
                          {item.discountedPrice !== retailPrice && (
                            <div className="text-xs text-red-500">
                              Save:{" "}
                              {(
                                (retailPrice - item.discountedPrice) *
                                item.quantity
                              ).toFixed(2)}
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

            {/* Payment Section */}
            <div className="space-y-4">
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
                        onClick={() => setPaymentAmount(amount.toFixed(2))}
                        className={`flex-1 py-1.5 text-sm rounded ${
                          isDarkMode
                            ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                            : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                        }`}
                      >
                        {amount.toFixed(2)}৳
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
                        {parseFloat(paymentAmount).toFixed(2)}৳
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
                          orderSummary.total - parseFloat(paymentAmount)
                        ).toFixed(2)}
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

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-300 dark:border-gray-700">
                <button
                  onClick={handlePayment}
                  disabled={creatingSale || !paymentAmount}
                  className={`flex-1 py-3 rounded-lg font-bold text-lg transition-colors ${
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
                  className={`flex-1 py-3 rounded-lg font-medium text-lg ${
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
    </div>
  );
};

export default POSPanel;

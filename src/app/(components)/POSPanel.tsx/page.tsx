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
  Product,
  Customer,
} from "@/state/api";

interface CartItem {
  product: Product;
  quantity: number;
  price: number;
  discount?: {
    type: "percentage" | "fixed";
    value: number;
  };
  discountedPrice: number;
}

const POSPanel = () => {
  const dispatch = useAppDispatch();
  const showPanel = useAppSelector((state) => state.global.isPOSPanelOpen);
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);

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
      skip: productSearchTerm.length < 2,
    });

  const { data: searchCustomersData, isLoading: customersLoading } =
    useSearchCustomersQuery(customerSearchTerm, {
      skip: customerSearchTerm.length < 2,
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
  const [orderSummary, setOrderSummary] = useState({
    subtotal: 0,
    discount: 0,
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
  
  // Responsive states
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [activeTab, setActiveTab] = useState<"products" | "customers" | "cart">("products");

  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Update current date and time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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

  const calculateOrderSummary = () => {
    const subtotal = cart.reduce(
      (sum, item) => sum + item.discountedPrice * item.quantity,
      0
    );

    const discount = cart.reduce((sum, item) => {
      if (item.discount) {
        const originalPrice = item.price * item.quantity;
        const discountedPrice = item.discountedPrice * item.quantity;
        return sum + (originalPrice - discountedPrice);
      }
      return sum;
    }, 0);

    const total = subtotal;
    const dueAmount = total - orderSummary.advancePaid;

    setOrderSummary({
      ...orderSummary,
      subtotal,
      discount,
      total,
      dueAmount,
    });
  };

  // Add product to cart
  const handleAddProduct = (product: Product) => {
    const existingItem = cart.find((item) => item.product.id === product.id);
    const retailPrice = convertToNumber(product.retailPrice);

    if (existingItem) {
      setCart(
        cart.map((item) =>
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
      setCart([...cart, newItem]);
    }

    // Switch to cart tab on mobile after adding product
    if (isMobile) {
      setActiveTab("cart");
    }
    
    // Hide search results after adding
    setShowProductResults(false);
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
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  // Apply discount
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
    setOrderSummary({
      subtotal: 0,
      discount: 0,
      total: 0,
      dueAmount: 0,
      advancePaid: 0,
    });
    setPaymentAmount("");
    showAlert("Cart cleared successfully", "success");
  };

  // Handle payment
  const handlePayment = () => {
    const paidAmount = parseFloat(paymentAmount) || 0;
    const change = paidAmount - orderSummary.total;

    if (change < 0) {
      showAlert(
        `Insufficient payment. Due amount: $${(
          orderSummary.total - paidAmount
        ).toFixed(2)}`,
        "error"
      );
      return;
    }

    // Create sale data
    const saleData = {
      customer_id: selectedCustomer?.id,
      items: cart.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
        unitPrice: item.discountedPrice,
        discount: item.discount,
      })),
      totalAmount: orderSummary.total,
      totalPaid: paidAmount,
      discount: orderSummary.discount,
    };

    // Call API to create sale
    createSale(saleData)
      .unwrap()
      .then(() => {
        showAlert("Sale completed successfully!", "success");
        handleClearAll();
        setShowPaymentModal(false);
      })
      .catch((error) => {
        console.error("Sale creation failed:", error);
        showAlert("Failed to complete sale. Please try again.", "error");
      });
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
    } catch (error) {
      showAlert("Failed to add customer. Please try again.", "error");
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
    <div className={`fixed bottom-0 left-0 right-0 z-40 border-t ${
      isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
    }`}>
      <div className="flex justify-around items-center h-16">
        <button
          onClick={() => setActiveTab("products")}
          className={`flex flex-col items-center justify-center flex-1 py-2 ${
            activeTab === "products"
              ? isDarkMode ? "text-blue-400" : "text-blue-600"
              : isDarkMode ? "text-gray-400" : "text-gray-500"
          }`}
        >
          <Search size={20} />
          <span className="text-xs mt-1">Products</span>
        </button>
        
        <button
          onClick={() => setActiveTab("customers")}
          className={`flex flex-col items-center justify-center flex-1 py-2 ${
            activeTab === "customers"
              ? isDarkMode ? "text-blue-400" : "text-blue-600"
              : isDarkMode ? "text-gray-400" : "text-gray-500"
          }`}
        >
          <UserPlus size={20} />
          <span className="text-xs mt-1">Customers</span>
        </button>
        
        <button
          onClick={() => setActiveTab("cart")}
          className={`flex flex-col items-center justify-center flex-1 py-2 relative ${
            activeTab === "cart"
              ? isDarkMode ? "text-blue-400" : "text-blue-600"
              : isDarkMode ? "text-gray-400" : "text-gray-500"
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
    <div className={`sticky top-0 z-30 p-4 border-b ${
      isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-bold ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}>
            POS System
          </h2>
          <p className={`text-sm ${
            isDarkMode ? "text-gray-400" : "text-gray-500"
          }`}>
            {date} {time}
          </p>
        </div>
        <button
          onClick={() => dispatch(setIsPOSPanelOpen(false))}
          className={`p-2 rounded-lg ${
            isDarkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          <X size={24} />
        </button>
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
        <h3 className={`text-lg font-bold mb-4 ${
          isDarkMode ? "text-white" : "text-gray-900"
        }`}>
          Apply Discount
        </h3>
        <div className="space-y-4">
          <div>
            <label className={`block mb-2 font-medium ${
              isDarkMode ? "text-gray-300" : "text-gray-700"
            }`}>
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
            <label className={`block mb-2 font-medium ${
              isDarkMode ? "text-gray-300" : "text-gray-700"
            }`}>
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
              onClick={handleApplyDiscount}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium"
            >
              Apply Discount
            </button>
            <button
              onClick={() => setShowDiscountModal(false)}
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
          ${isMobile ? "flex flex-col" : ""}
        `}
      >
        {/* Mobile Header */}
        {isMobile && <MobileHeader />}
        
        {/* Mobile View */}
        {isMobile ? (
          <div className="flex-1 overflow-hidden pb-16">
            {/* Product Search Tab */}
            {activeTab === "products" && (
              <div className="h-full overflow-y-auto">
                <div className="p-3">
                  <div className="mb-3" ref={productSearchRef}>
                    <label className="block text-sm font-medium mb-2">
                      <Search className="inline mr-2" size={16} />
                      Search Products
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        onChange={(e) => {
                          debouncedProductSearch(e.target.value);
                          if (e.target.value.length < 2) {
                            setShowProductResults(false);
                          }
                        }}
                        className={`w-full p-3 border rounded-xl ${
                          isDarkMode
                            ? "bg-gray-800 border-gray-600 text-white"
                            : "bg-white border-gray-300"
                        }`}
                        placeholder="Search products..."
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
                  
                  {/* Product List */}
                  <div className="grid grid-cols-2 gap-2">
                    {posProducts?.slice(0, 8).map((product) => {
                      const retailPrice = convertToNumber(product.retailPrice);
                      return (
                        <div
                          key={product.id}
                          onClick={() => handleAddProduct(product)}
                          className={`p-2 border rounded-lg cursor-pointer ${
                            isDarkMode
                              ? "border-gray-700 hover:bg-gray-800"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <div className="font-medium text-sm truncate">
                            {product.name}
                          </div>
                          <div className={`text-xs mt-1 ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}>
                            {product.specification?.substring(0, 30)}...
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-green-600 font-bold text-sm">
                              {retailPrice.toFixed(2)} ৳
                            </span>
                            <span className={`text-xs ${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}>
                              Stock: {product.quantity}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Customers Tab */}
            {activeTab === "customers" && (
              <div className="h-full overflow-y-auto">
                <div className="p-3">
                  <div className="mb-3" ref={customerSearchRef}>
                    <label className="block text-sm font-medium mb-2">
                      <Search className="inline mr-2" size={16} />
                      Search Customers
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        onChange={(e) => {
                          debouncedCustomerSearch(e.target.value);
                          if (e.target.value.length < 2) {
                            setShowCustomerResults(false);
                          }
                        }}
                        className={`w-full p-3 border rounded-xl ${
                          isDarkMode
                            ? "bg-gray-800 border-gray-600 text-white"
                            : "bg-white border-gray-300"
                        }`}
                        placeholder="Search customers..."
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

                  {/* Selected Customer */}
                  {selectedCustomer && (
                    <div className="mb-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-bold text-sm">{selectedCustomer.name}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-300">
                            {selectedCustomer.phone}
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedCustomer(null)}
                          className="p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30"
                        >
                          <X size={16} className="text-red-500" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Add Customer Button */}
                  <button
                    onClick={() => setShowAddCustomerModal(true)}
                    className={`w-full py-3 mb-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
                      isDarkMode
                        ? "bg-gray-800 hover:bg-gray-700 text-white"
                        : "bg-gray-900 hover:bg-gray-800 text-white"
                    }`}
                  >
                    <UserPlus size={18} />
                    Add New Customer
                  </button>

                  {/* Customers List */}
                  <div className="space-y-2">
                    {allCustomers?.slice(0, 8).map((customer) => (
                      <div
                        key={customer.id}
                        onClick={() => handleSelectCustomer(customer)}
                        className={`p-3 border rounded-lg cursor-pointer ${
                          selectedCustomer?.id === customer.id
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : isDarkMode
                            ? "border-gray-700 hover:bg-gray-800"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div className="font-medium text-sm">{customer.name}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {customer.phone}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Cart Tab */}
            {activeTab === "cart" && (
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto p-3">
                  {/* Cart Items */}
                  {cart.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-4">
                        <ShoppingCart className="w-16 h-16 mx-auto" />
                      </div>
                      <p className="text-gray-500 mb-2">Your cart is empty</p>
                      <button
                        onClick={() => setActiveTab("products")}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        Browse products →
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {cart.map((item, index) => {
                        const total = item.discountedPrice * item.quantity;
                        return (
                          <div
                            key={item.product.id}
                            className={`p-3 border rounded-lg ${
                              isDarkMode
                                ? "border-gray-700 bg-gray-800/50"
                                : "border-gray-200 bg-white"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="font-medium text-sm">{item.product.name}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {item.discountedPrice.toFixed(2)} × {item.quantity} ৳
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-sm">{total.toFixed(2)} ৳</div>
                                {item.discount && (
                                  <div className="text-xs text-red-500">
                                    Save: {(item.price * item.quantity - total).toFixed(2)} ৳
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateQuantity(item.product.id, -1);
                                  }}
                                  className={`w-7 h-7 flex items-center justify-center border rounded ${
                                    isDarkMode
                                      ? "border-gray-600 hover:bg-gray-700"
                                      : "border-gray-300 hover:bg-gray-100"
                                  }`}
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="w-8 text-center text-sm">{item.quantity}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateQuantity(item.product.id, 1);
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
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDiscountProductId(item.product.id);
                                    setShowDiscountModal(true);
                                  }}
                                  className="text-blue-500 hover:text-blue-700 text-sm"
                                >
                                  Discount
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveProduct(item.product.id);
                                  }}
                                  className="p-1.5 text-red-500 hover:text-red-700"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Order Summary & Actions */}
                {cart.length > 0 && (
                  <div className={`p-3 border-t ${
                    isDarkMode ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"
                  }`}>
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                        <span>{orderSummary.subtotal.toFixed(2)} ৳</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Discount:</span>
                        <span className="text-red-500">-{orderSummary.discount.toFixed(2)} ৳</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold pt-2 border-t dark:border-gray-700">
                        <span>Total:</span>
                        <span className="text-green-600">{orderSummary.total.toFixed(2)} ৳</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <button
                        onClick={handleClearAll}
                        className="py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 font-medium text-sm"
                      >
                        Clear All
                      </button>
                      <button
                        onClick={() => {
                          if (!selectedCustomer) {
                            showAlert("Please select a customer first", "info");
                            setActiveTab("customers");
                            return;
                          }
                          setShowPaymentModal(true);
                        }}
                        disabled={creatingSale}
                        className={`py-2 rounded-lg font-bold text-sm ${
                          creatingSale
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-green-500 hover:bg-green-600 text-white"
                        }`}
                      >
                        {creatingSale ? "Processing..." : "Checkout"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : isTablet ? (
          /* Tablet View - Optimized for no scrolling */
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

              {/* PRODUCT DETAILS TABLE */}
              <div
                className={`rounded-lg border p-2 backdrop-blur flex-1 overflow-hidden ${
                  isDarkMode
                    ? "bg-gray-800/50 border-gray-700"
                    : "bg-white/50 border-gray-200"
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <h2 className={`text-sm font-bold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}>
                    Product Details
                  </h2>
                  {cart.length > 0 && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      isDarkMode 
                        ? "bg-gray-700 text-gray-300" 
                        : "bg-gray-200 text-gray-700"
                    }`}>
                      {cart.length} item{cart.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {cart.length === 0 ? (
                  <div className={`text-center py-8 ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}>
                    <Search className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">No products added</p>
                  </div>
                ) : (
                  <div className="overflow-y-auto h-[calc(100%-2rem)]">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className={`border-b ${
                          isDarkMode
                            ? "border-gray-700 text-gray-300"
                            : "border-gray-200 text-gray-700"
                        }`}>
                          <th className="py-1 px-1 text-left">Product</th>
                          <th className="py-1 px-1">Qty</th>
                          <th className="py-1 px-1">Price</th>
                          <th className="py-1 px-1">Total</th>
                          <th className="py-1 px-1">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cart.map((item) => {
                          const price = convertToNumber(item.price);
                          const discountedPrice = convertToNumber(item.discountedPrice);
                          const total = discountedPrice * item.quantity;

                          return (
                            <tr
                              key={item.product.id}
                              className={`border-b ${
                                isDarkMode
                                  ? "border-gray-700 hover:bg-gray-800"
                                  : "border-gray-200 hover:bg-gray-50"
                              }`}
                            >
                              <td className="py-1 px-1 text-left">
                                <div className="max-w-[80px]">
                                  <div className={`font-medium truncate ${
                                    isDarkMode ? "text-white" : "text-gray-900"
                                  }`}>
                                    {item.product.name}
                                  </div>
                                </div>
                              </td>
                              <td className="py-1 px-1">
                                <div className="flex items-center justify-center">
                                  <button
                                    onClick={() => handleUpdateQuantity(item.product.id, -1)}
                                    className={`w-5 h-5 flex items-center justify-center border rounded ${
                                      isDarkMode
                                        ? "border-gray-600 hover:bg-gray-700"
                                        : "border-gray-300 hover:bg-gray-100"
                                    }`}
                                    disabled={item.quantity <= 1}
                                  >
                                    <Minus size={10} />
                                  </button>
                                  <span className={`w-6 text-center ${
                                    isDarkMode ? "text-white" : "text-gray-900"
                                  }`}>
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() => handleUpdateQuantity(item.product.id, 1)}
                                    className={`w-5 h-5 flex items-center justify-center border rounded ${
                                      isDarkMode
                                        ? "border-gray-600 hover:bg-gray-700"
                                        : "border-gray-300 hover:bg-gray-100"
                                    }`}
                                  >
                                    <Plus size={10} />
                                  </button>
                                </div>
                              </td>
                              <td className="py-1 px-1">
                                <div className={`${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                  {discountedPrice.toFixed(2)} ৳
                                </div>
                              </td>
                              <td className="py-1 px-1">
                                <div className={`font-semibold ${
                                  isDarkMode ? "text-white" : "text-gray-900"
                                }`}>
                                  {total.toFixed(2)} ৳
                                </div>
                              </td>
                              <td className="py-1 px-1">
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => {
                                      setDiscountProductId(item.product.id);
                                      setShowDiscountModal(true);
                                    }}
                                    className="text-blue-500 hover:text-blue-700 text-xs"
                                  >
                                    Disc
                                  </button>
                                  <button
                                    onClick={() => handleRemoveProduct(item.product.id)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 size={12} />
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
              <div
                className={`rounded-lg border p-2 backdrop-blur ${
                  isDarkMode
                    ? "bg-gray-800/50 border-gray-700"
                    : "bg-white/50 border-gray-200"
                }`}
              >
                <h2 className={`text-sm font-bold mb-2 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}>
                  Order Summary
                </h2>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className={`text-xs ${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    }`}>
                      Subtotal:
                    </span>
                    <span className={`text-xs font-medium ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}>
                      {orderSummary.subtotal.toFixed(2)} ৳
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs ${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    }`}>
                      Discount:
                    </span>
                    <span className="text-xs font-medium text-red-500">
                      -{orderSummary.discount.toFixed(2)} ৳
                    </span>
                  </div>
                  <div className={`border-t pt-1 mt-1 ${
                    isDarkMode ? "border-gray-700" : "border-gray-200"
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm font-bold ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}>
                        Total:
                      </span>
                      <span className="text-sm font-bold text-green-600">
                        {orderSummary.total.toFixed(2)} ৳
                      </span>
                    </div>
                  </div>
                </div>
              </div>
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
                  <label className={`block text-xs font-medium ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
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
              {/* Customers List */}
              <div
                className={`rounded-lg border p-2 backdrop-blur flex-1 overflow-hidden ${
                  isDarkMode
                    ? "bg-gray-800/50 border-gray-700"
                    : "bg-white/50 border-gray-200"
                }`}
              >
                <div className="mb-2">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className={`font-semibold text-xs ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}>
                      Selected Customer
                    </h3>
                  </div>
                  {selectedCustomer ? (
                    <div className={`p-1.5 rounded border text-xs ${
                      isDarkMode
                        ? "border-blue-500 bg-blue-900/20"
                        : "border-blue-300 bg-blue-50"
                    }`}>
                      <div className="flex justify-between items-center">
                        <div className="flex-1 truncate">
                          <div className="font-medium">{selectedCustomer.name}</div>
                          <div className="text-gray-600 dark:text-gray-300">
                            {selectedCustomer.phone}
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedCustomer(null)}
                          className="p-0.5 hover:bg-red-100 dark:hover:bg-red-900/30 ml-1"
                        >
                          <X size={12} className="text-red-500" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={`p-1.5 rounded border text-center text-xs ${
                      isDarkMode
                        ? "border-gray-700 bg-gray-800/30 text-gray-400"
                        : "border-gray-300 bg-gray-100/50 text-gray-500"
                    }`}>
                      No customer selected
                    </div>
                  )}
                </div>

                {/* All Customers List */}
                <div className="mb-2 flex-1 overflow-hidden">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className={`font-semibold text-xs ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}>
                      All Customers
                    </h3>
                    <span className={`text-xs ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}>
                      {allCustomers?.length || 0}
                    </span>
                  </div>
                  <div className="overflow-y-auto h-[calc(100%-2rem)]">
                    {allCustomersLoading ? (
                      <div className="flex flex-col justify-center items-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500 mb-1" />
                        <span className="text-xs">Loading...</span>
                      </div>
                    ) : allCustomers && allCustomers.length > 0 ? (
                      <div className="space-y-1">
                        {allCustomers.slice(0, 5).map((customer) => (
                          <div
                            key={customer.id}
                            className={`p-1.5 rounded border cursor-pointer text-xs ${
                              selectedCustomer?.id === customer.id
                                ? isDarkMode
                                  ? "border-blue-500 bg-blue-900/20"
                                  : "border-blue-400 bg-blue-50"
                                : isDarkMode
                                ? "border-gray-700 hover:bg-gray-800/70"
                                : "border-gray-200 hover:bg-gray-50"
                            }`}
                            onClick={() => handleSelectCustomer(customer)}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex-1 truncate">
                                <div className={`font-medium ${
                                  selectedCustomer?.id === customer.id
                                    ? "text-blue-500"
                                    : isDarkMode
                                    ? "text-white"
                                    : "text-gray-900"
                                }`}>
                                  {customer.name}
                                </div>
                                <div className="truncate">
                                  {customer.phone}
                                </div>
                              </div>
                              {selectedCustomer?.id === customer.id && (
                                <Check size={10} className="text-green-500 ml-1" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={`text-center py-4 text-xs ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}>
                        No customers found
                      </div>
                    )}
                  </div>
                </div>

                {/* Fixed Bottom Section */}
                <div className="mt-auto pt-2 border-t border-gray-700/50">
                  <button
                    onClick={() => setShowAddCustomerModal(true)}
                    className={`w-full py-1.5 rounded text-xs font-medium flex items-center justify-center gap-1 ${
                      isDarkMode
                        ? "bg-gray-700 hover:bg-gray-600 text-white"
                        : "bg-gray-800 hover:bg-gray-900 text-white"
                    }`}
                  >
                    <UserPlus size={12} />
                    Add Customer
                  </button>

                  {/* Date and Time Display */}
                  <div className="mt-1 pt-2 border-t border-gray-300 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Calendar size={10} className={isDarkMode ? "text-blue-400" : "text-blue-600"} />
                        <div>
                          <div className={`text-[10px] ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}>
                            DATE
                          </div>
                          <div className={`text-xs font-bold ${
                            isDarkMode ? "text-white" : "text-gray-900"
                          }`}>
                            {date.split(',')[1]}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={10} className={isDarkMode ? "text-green-400" : "text-green-600"} />
                        <div>
                          <div className={`text-[10px] ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}>
                            TIME
                          </div>
                          <div className={`text-xs font-bold font-mono ${
                            isDarkMode ? "text-white" : "text-gray-900"
                          }`}>
                            {time}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div
                className={`rounded-lg border p-2 backdrop-blur ${
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
                        showAlert("Add products first", "info");
                        return;
                      }
                      setShowDiscountModal(true);
                    }}
                    className="py-1.5 rounded bg-blue-500 hover:bg-blue-600 text-white text-xs flex items-center justify-center gap-1"
                  >
                    <Percent size={10} />
                    Discount
                  </button>

                  {/* Action Buttons */}
                  {['Refund', 'Pre Order', 'Quotation', 'Exchange', 'Delivery', 'Warranty', 'Service'].map((label) => (
                    <button
                      key={label}
                      className={`py-1.5 rounded text-xs border ${
                        isDarkMode
                          ? "border-gray-600 bg-gray-800/50 hover:bg-gray-700 text-white"
                          : "border-gray-300 bg-white/50 hover:bg-gray-100 text-gray-800"
                      }`}
                      onClick={() => showAlert(`${label} coming soon`, "info")}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Confirm Sell Button */}
                <button
                  onClick={() => {
                    if (cart.length === 0) {
                      showAlert("Add products first", "info");
                      return;
                    }
                    if (!selectedCustomer) {
                      showAlert("Select customer first", "info");
                      return;
                    }
                    setShowPaymentModal(true);
                  }}
                  disabled={creatingSale}
                  className={`w-full mt-1 text-white text-sm py-1.5 rounded ${
                    creatingSale
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-500 hover:bg-green-600"
                  }`}
                >
                  {creatingSale ? "Processing..." : "Confirm Sell"}
                </button>

                {/* Cash Buttons */}
                <div className="flex gap-1 mt-1">
                  <button
                    onClick={() => {
                      if (cart.length === 0) {
                        showAlert("Add products first", "info");
                        return;
                      }
                      setPaymentAmount(orderSummary.total.toString());
                      setShowPaymentModal(true);
                    }}
                    className="flex-1 bg-green-200 hover:bg-green-300 text-black py-1.5 rounded text-xs"
                  >
                    Cash IN
                  </button>
                  <button
                    onClick={() => showAlert("Cash Out coming soon", "info")}
                    className="flex-1 bg-red-200 hover:bg-red-300 text-black py-1.5 rounded text-xs"
                  >
                    Cash Out
                  </button>
                </div>

                {/* Clear Button */}
                <button
                  onClick={handleClearAll}
                  disabled={cart.length === 0 && !selectedCustomer}
                  className={`w-full mt-1 py-1.5 rounded text-xs ${
                    cart.length === 0 && !selectedCustomer
                      ? "bg-gray-300 cursor-not-allowed dark:bg-gray-700"
                      : "bg-gray-400 hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-500"
                  }`}
                >
                  <Trash2 className="inline mr-1" size={12} />
                  CLEAR ALL
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Desktop View - Original layout */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 h-full p-1">
            {/* LEFT SIDE (2 COLUMN 4 ROW) */}
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
                  {/* Product Search */}
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
                                      isDarkMode ? "text-white" : "text-gray-900"
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
                                      isDarkMode ? "text-white" : "text-gray-900"
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
                                  <div className="flex flex-col">
                                    <span className="text-red-500 font-medium">
                                      {item.discount.type === "percentage"
                                        ? `${item.discount.value}%`
                                        : `${item.discount.value.toFixed(2)} ৳`}
                                    </span>
                                    <span
                                      className={`text-xs ${
                                        isDarkMode
                                          ? "text-gray-400"
                                          : "text-gray-500"
                                      }`}
                                    >
                                      Save: {orderSummary.discount.toFixed(2)} ৳
                                    </span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setDiscountProductId(item.product.id);
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
                    <span
                      className={isDarkMode ? "text-gray-300" : "text-gray-600"}
                    >
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
                  <div className="flex justify-between items-center py-1">
                    <span
                      className={isDarkMode ? "text-gray-300" : "text-gray-600"}
                    >
                      Discount:
                    </span>
                    <span className="font-medium text-red-500">
                      - {orderSummary.discount.toFixed(2)} ৳
                    </span>
                  </div>
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
                {/* Selected Customer Display - ALWAYS AT TOP */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
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
                      className={`p-1 rounded-lg border ${
                        isDarkMode
                          ? "border-blue-500 bg-blue-900/20"
                          : "border-blue-300 bg-blue-50"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            <span className="pr-4">{selectedCustomer.name}</span>
                            <span className="pr-4">({selectedCustomer.phone})</span>
                            <span className="pr-4 underline">{selectedCustomer.email}</span>
                          </div>
                          {/* <div
                            className={`text-xs mt-1 ${
                              isDarkMode ? "text-gray-300" : "text-gray-600"
                            }`}
                          > 
                            {selectedCustomer.phone} 
                          </div>
                          {selectedCustomer.email && (
                            <div
                              className={`text-xs mt-0.5 ${
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              {selectedCustomer.email}
                            </div>
                          )} */}
                        </div>
                        <button
                          onClick={() => {
                            setSelectedCustomer(null);
                            showAlert("Customer removed", "info");
                          }}
                          className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                            isDarkMode
                              ? "hover:bg-red-900/50"
                              : "hover:bg-red-100"
                          }`}
                          title="Remove customer"
                        >
                          <X size={14} className="text-red-500" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`p-3 rounded-lg border text-center ${
                        isDarkMode
                          ? "border-gray-700 bg-gray-800/30 text-gray-400"
                          : "border-gray-300 bg-gray-100/50 text-gray-500"
                      }`}
                    >
                      <div className="text-sm">No customer selected</div>
                    </div>
                  )}
                </div>

                {/* All Customers List - FROM DATABASE */}
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
                      <div className="space-y-1.5">
                        {allCustomers.map((customer) => (
                          <div
                            key={customer.id}
                            className={`p-2 rounded-lg border cursor-pointer transition-all duration-200 ${
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
                                  <span className="pr-4">({customer.phone})</span>
                                  <span className="pr-4 underline">{customer.email}</span>
                                </div>
                                {/* <div className="flex items-center gap-1.5 mt-0.5">
                                  <div
                                    className={`text-xs ${
                                      isDarkMode
                                        ? "text-gray-400"
                                        : "text-gray-600"
                                    }`}
                                  >
                                    {customer.phone}
                                  </div>
                                  {customer.email && (
                                    <>
                                      <div
                                        className={`text-xs ${
                                          isDarkMode
                                            ? "text-gray-600"
                                            : "text-gray-400"
                                        }`}
                                      >
                                        •
                                      </div>
                                      <div
                                        className={`text-xs truncate ${
                                          isDarkMode
                                            ? "text-gray-500"
                                            : "text-gray-500"
                                        }`}
                                        title={customer.email}
                                      >
                                        {customer.email}
                                      </div>
                                    </>
                                  )}
                                </div> */}
                              </div>
                              {/* {selectedCustomer?.id === customer.id && (
                                <div className="ml-2 flex-shrink-0">
                                  <div className="bg-green-500 text-white p-1 rounded-full">
                                    <Check size={10} />
                                  </div>
                                </div>
                              )} */}
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
                <div className="mt-auto border-gray-700/50">
                  {/* Add New Customer Button */}
                  <button
                    onClick={() => setShowAddCustomerModal(true)}
                    className={`w-full py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                      isDarkMode
                        ? "bg-gray-700 hover:bg-gray-600 text-white shadow-md"
                        : "bg-gray-800 hover:bg-gray-900 text-white shadow-sm"
                    }`}
                  >
                    <UserPlus size={12} />
                    Add New Customer
                  </button>

                  {/* Date and Time Display - Professional POS Style */}
                  <div className="pt-3 border-t border-gray-300 dark:border-gray-700">
                    <div className="flex items-center justify-between rounded-lg ">
                      <div className="flex items-center">
                        <div
                          className={`p-2 rounded-2xl flex items-center gap-2 ${
                            isDarkMode ? "bg-gray-700" : "bg-white shadow-sm"
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
                        {/* <div>
                          <div
                            className={`text-sm font-bold ${
                              isDarkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {date}
                          </div>
                        </div> */}
                      </div>

                      <div className="">
                        <div
                          className={`p-2 rounded-2xl flex items-center gap-2 ${
                            isDarkMode ? "bg-gray-700" : "bg-white shadow-sm"
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
                        {/* <div>
                          <div
                            className={`text-sm font-bold font-mono tracking-wider ${
                              isDarkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {time}
                          </div>
                        </div> */}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div
                className={`rounded-2xl border p-2 backdrop-blur ${
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
                      setShowDiscountModal(true);
                    }}
                    className="py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Percent size={14} />
                    Discount
                  </button>

                  {/* Other Action Buttons */}
                  {[
                    { label: "Refund" },
                    { label: "Pre Order" },
                    { label: "Quotation" },
                    { label: "Exchange" },
                    { label: "Delivery" },
                    { label: "Warranty" },
                    { label: "Service" },
                  ].map(({ label }) => (
                    <button
                      key={label}
                      className={`py-2 rounded-xl font-bold border transition-colors flex items-center justify-center gap-2 cursor-pointer ${
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
                  className={`w-full mt-2 text-white font-bold py-2 rounded-xl text-lg transition-colors flex items-center justify-center gap-2 cursor-pointer ${
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
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => {
                      if (cart.length === 0) {
                        showAlert("Add products to cart first", "info");
                        return;
                      }
                      setPaymentAmount(orderSummary.total.toString());
                      setShowPaymentModal(true);
                    }}
                    className="flex-1 bg-green-200 hover:bg-green-300 text-black py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Cash IN
                  </button>
                  <button
                    onClick={() =>
                      showAlert("Cash Out functionality coming soon", "info")
                    }
                    className="flex-1 bg-red-200 hover:bg-red-300 text-black py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Cash Out
                  </button>
                </div>

                {/* Clear Button */}
                <button
                  onClick={handleClearAll}
                  disabled={cart.length === 0 && !selectedCustomer}
                  className={`w-full mt-2 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                    cart.length === 0 && !selectedCustomer
                      ? "bg-gray-300 cursor-not-allowed dark:bg-gray-700"
                      : "bg-gray-400 hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-500"
                  } ${isDarkMode ? "text-gray-800" : "text-gray-800"}`}
                >
                  <Trash2 size={16} />
                  CLEAR ALL
                </button>
              </div>
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
              {['Name', 'Phone', 'Email', 'Address'].map((field) => (
                <div key={field}>
                  <label className={`block mb-2 font-medium ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                    {field} {['Name', 'Phone'].includes(field) ? '*' : ''}
                  </label>
                  {field === 'Address' ? (
                    <textarea
                      value={newCustomer.address}
                      onChange={(e) =>
                        setNewCustomer({ ...newCustomer, address: e.target.value })
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
                      type={field === 'Email' ? 'email' : field === 'Phone' ? 'tel' : 'text'}
                      value={newCustomer[field.toLowerCase() as keyof typeof newCustomer]}
                      onChange={(e) =>
                        setNewCustomer({ ...newCustomer, [field.toLowerCase()]: e.target.value })
                      }
                      className={`w-full p-3 border rounded-lg ${
                        isDarkMode
                          ? "bg-gray-800 border-gray-600 text-white"
                          : "bg-white border-gray-300"
                      }`}
                      placeholder={`Enter ${field.toLowerCase()}`}
                      required={['Name', 'Phone'].includes(field)}
                    />
                  )}
                </div>
              ))}
              <div className="flex gap-3">
                <button
                  onClick={handleAddNewCustomer}
                  disabled={creatingCustomer || !newCustomer.name.trim() || !newCustomer.phone.trim()}
                  className={`flex-1 py-3 rounded-lg font-medium ${
                    creatingCustomer || !newCustomer.name.trim() || !newCustomer.phone.trim()
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-500 hover:bg-green-600 text-white"
                  }`}
                >
                  {creatingCustomer ? "Adding..." : "Add Customer"}
                </button>
                <button
                  onClick={() => {
                    setShowAddCustomerModal(false);
                    setNewCustomer({ name: "", email: "", phone: "", address: "" });
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

      {/* DISCOUNT MODAL */}
      {showDiscountModal && renderDiscountModal()}

      {/* PAYMENT MODAL */}
      {showPaymentModal && (
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
              Complete Payment
            </h3>
            <div className="space-y-4">
              <div className="text-center p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {orderSummary.total.toFixed(2)} ৳
                </div>
                <div
                  className={`${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Total Amount Due
                </div>
              </div>
              <div>
                <label
                  className={`block mb-2 font-medium ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Amount Paid
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className={`w-full p-3 border rounded-lg text-lg ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-600 text-white"
                      : "bg-white border-gray-300"
                  }`}
                  placeholder="Enter amount paid"
                  min="0"
                  step="0.01"
                  autoFocus
                />
              </div>
              {paymentAmount && (
                <div
                  className={`text-center p-3 rounded-lg ${
                    isDarkMode ? "bg-gray-800" : "bg-gray-100"
                  }`}
                >
                  <div
                    className={`text-lg font-semibold ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Change: 
                    {(parseFloat(paymentAmount) - orderSummary.total).toFixed(
                      2
                    )} ৳
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handlePayment}
                  disabled={creatingSale || !paymentAmount}
                  className={`flex-1 py-3 rounded-lg font-bold transition-colors cursor-pointer ${
                    creatingSale || !paymentAmount
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-500 hover:bg-green-600 text-white"
                  }`}
                >
                  {creatingSale ? "Processing..." : "Complete Sale"}
                </button>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className={`flex-1 py-3 rounded-lg font-medium transition-colors cursor-pointer ${
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
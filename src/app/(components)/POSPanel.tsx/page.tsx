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
  DollarSign,
  UserPlus,
  X,
  Barcode,
  Check,
  AlertCircle,
} from "lucide-react";
import { debounce } from "lodash";
import {
  useSearchProductsQuery,
  useSearchCustomersQuery,
  useCreateSaleFromPOSMutation,
  useScanBarcodeQuery,
  useGetPOSProductsQuery,
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

  const { data: posProducts, refetch: refetchPOSProducts } =
    useGetPOSProductsQuery();
  const [createSale, { isLoading: creatingSale }] =
    useCreateSaleFromPOSMutation();

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

    // Convert retailPrice to number
    const retailPrice = convertToNumber(product.retailPrice);

    if (existingItem) {
      // Increase quantity
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      // Add new product
      const newItem: CartItem = {
        product,
        quantity: 1,
        price: retailPrice,
        discountedPrice: retailPrice,
      };
      setCart([...cart, newItem]);
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

  return (
    <div className="w-0 h-0 overflow-hidden">
      {/* === FULL SCREEN SLIDING PANEL === */}
      <div
        className={`
          fixed inset-0 z-50
          backdrop-blur-sm border-l border-white/10
          transition-transform duration-500 ease-[cubic-bezier(.25,.8,.25,1)]
          p-2 overflow-hidden mt-12
          ${showPanel ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 grid-rows-5 gap-2 h-full">
          {/* === LEFT SIDE (2 COLUMN 4 ROW) === */}
          <div className="col-span-2 row-span-5 flex flex-col h-full gap-2">
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
                  <label className="block text-sm font-medium mb-1">
                    <Search className="inline mr-2" size={16} />
                    Search Products
                  </label>
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
              className={`rounded-2xl border p-4 backdrop-blur overflow-auto flex-1 ${
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
                                ${price.toFixed(2)}
                              </div>
                            </td>
                            <td className="py-3 px-2">
                              {item.discount ? (
                                <div className="flex flex-col">
                                  <span className="text-red-500 font-medium">
                                    {item.discount.type === "percentage"
                                      ? `${item.discount.value}%`
                                      : `$${item.discount.value.toFixed(2)}`}
                                  </span>
                                  <span
                                    className={`text-xs ${
                                      isDarkMode
                                        ? "text-gray-400"
                                        : "text-gray-500"
                                    }`}
                                  >
                                    Save: $
                                    {orderSummary.discount.toFixed(2)}
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
                                ${total.toFixed(2)}
                              </div>
                              {item.discount && (
                                <div
                                  className={`text-xs line-through ${
                                    isDarkMode
                                      ? "text-gray-500"
                                      : "text-gray-400"
                                  }`}
                                >
                                  ${(price * item.quantity).toFixed(2)}
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
              className={`rounded-2xl border p-4 backdrop-blur ${
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
                    ${orderSummary.subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span
                    className={isDarkMode ? "text-gray-300" : "text-gray-600"}
                  >
                    Discount:
                  </span>
                  <span className="font-medium text-red-500">
                    -${orderSummary.discount.toFixed(2)}
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
                      ${orderSummary.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* === RIGHT SIDE (CUSTOMER & ACTIONS) === */}
          <div className="col-span-1 row-span-5 flex flex-col gap-2">
            {/* CUSTOMER SEARCH */}
            <div
              className={`rounded-2xl border p-2 backdrop-blur relative ${
                isDarkMode
                  ? "bg-gray-800/50 border-gray-700"
                  : "bg-white/50 border-gray-200"
              }`}
              ref={customerSearchRef}
            >
              <label
                className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
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
              className={`rounded-2xl border p-4 backdrop-blur flex-1 ${
                isDarkMode
                  ? "bg-gray-800/50 border-gray-700"
                  : "bg-white/50 border-gray-200"
              }`}
            >
              {/* Selected Customer Display - ALWAYS AT TOP */}
              <div className="mb-4">
                <h3
                  className={`font-semibold mb-2 ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Selected Customer
                </h3>
                {selectedCustomer ? (
                  <div
                    className={`p-3 rounded-lg border ${
                      isDarkMode
                        ? "border-blue-900 bg-blue-900/20"
                        : "border-blue-200 bg-blue-50"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="font-medium">
                          {selectedCustomer.name}
                        </div>
                        <div
                          className={`text-sm ${
                            isDarkMode ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {selectedCustomer.phone}
                        </div>
                        {selectedCustomer.email && (
                          <div
                            className={`text-xs ${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            {selectedCustomer.email}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedCustomer(null);
                          showAlert("Customer removed", "info");
                        }}
                        className={`p-1 rounded transition-colors cursor-pointer ${
                          isDarkMode
                            ? "hover:bg-red-900/50"
                            : "hover:bg-red-100"
                        }`}
                        title="Remove customer"
                      >
                        <X size={16} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`p-3 rounded-lg border text-center ${
                      isDarkMode
                        ? "border-gray-700 bg-gray-800/50 text-gray-400"
                        : "border-gray-300 bg-gray-100/50 text-gray-500"
                    }`}
                  >
                    No customer selected
                  </div>
                )}
              </div>

              {/* All Customers List - FROM DATABASE */}
              <div className="mb-3">
                <h3
                  className={`font-semibold mb-2 ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  All Customers
                </h3>
                <div className="overflow-y-auto max-h-[200px]">
                  {/* You need to fetch all customers from your API */}
                  {/* For now, I'll show search results or a placeholder */}
                  {searchCustomersData && searchCustomersData.length > 0 ? (
                    <div className="space-y-2">
                      {searchCustomersData.map((customer) => (
                        <div
                          key={customer.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedCustomer?.id === customer.id
                              ? isDarkMode
                                ? "border-blue-500 bg-blue-900/30"
                                : "border-blue-500 bg-blue-100"
                              : isDarkMode
                              ? "border-gray-700 hover:bg-gray-800"
                              : "border-gray-200 hover:bg-gray-100"
                          }`}
                          onClick={() => handleSelectCustomer(customer)}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <div
                                className={`font-medium ${
                                  selectedCustomer?.id === customer.id
                                    ? "text-blue-500"
                                    : isDarkMode
                                    ? "text-white"
                                    : "text-gray-900"
                                }`}
                              >
                                {customer.name}
                              </div>
                              <div
                                className={`text-sm ${
                                  isDarkMode ? "text-gray-400" : "text-gray-600"
                                }`}
                              >
                                {customer.phone}
                              </div>
                            </div>
                            {selectedCustomer?.id === customer.id && (
                              <Check className="text-green-500" size={16} />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      className={`text-center py-3 ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      <Search className="mx-auto h-6 w-6 mb-2 opacity-50" />
                      <p className="text-sm">Search for customers above</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Add New Customer Button */}
              <button
                onClick={() =>
                  showAlert(
                    "Add new customer functionality coming soon",
                    "info"
                  )
                }
                className={`w-full py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                  isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                }`}
              >
                <UserPlus size={16} />
                Add New Customer
              </button>
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
                  <>
                    Confirm Sell
                  </>
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
                          ${retailPrice.toFixed(2)}
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

      {/* ALERT MODAL */}
      {showAlertModal && (
        <div className="fixed inset-0 flex backdrop-blur-sm items-center justify-center z-[10000]">
          <div
            className={`p-6 rounded-xl border w-96 transform transition-all duration-300 scale-100 ${
              isDarkMode
                ? "bg-gray-900 border-gray-700"
                : "bg-white border-gray-200"
            }`}
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
      {showDiscountModal && (
        <div className="fixed inset-0 flex backdrop-blur-sm items-center justify-center z-[10000]">
          <div
            className={`p-6 rounded-xl border w-96 transform transition-all duration-300 scale-100 ${
              isDarkMode
                ? "bg-gray-900 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <h3
              className={`text-lg font-bold mb-4 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Apply Discount
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
                    className={`flex-1 py-2 rounded transition-colors cursor-pointer ${
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
                    className={`flex-1 py-2 rounded transition-colors cursor-pointer ${
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
                  onClick={handleApplyDiscount}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Apply Discount
                </button>
                <button
                  onClick={() => setShowDiscountModal(false)}
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

      {/* PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 flex backdrop-blur-sm items-center justify-center z-[10000]">
          <div
            className={`p-6 rounded-xl border w-96 transform transition-all duration-300 scale-100 ${
              isDarkMode
                ? "bg-gray-900 border-gray-700"
                : "bg-white border-gray-200"
            }`}
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
                  ${orderSummary.total.toFixed(2)}
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
                    Change: $
                    {(parseFloat(paymentAmount) - orderSummary.total).toFixed(
                      2
                    )}
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

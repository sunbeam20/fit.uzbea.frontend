"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/app/redux";
import {
  TrendingUp,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Download,
  ChevronDown,
  Calendar,
  User,
  DollarSign,
  X,
  Package,
  CreditCard,
  Building,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Tag,
  Percent,
  Hash,
  Phone,
  Mail,
  MapPin,
  ShoppingCart,
  Receipt,
  RefreshCw,
  AlertTriangle,
  Undo2,
} from "lucide-react";
import {
  useGetSalesQuery,
  useUpdateSaleMutation,
  useDeleteSaleMutation,
  useGetProductsQuery,
  useGetCustomersQuery,
} from "@/state/api";
import type { Sale, SaleItem, Product, Customer } from "@/state/api";
import ProviderWrapper from "../(components)/ProviderWrapper";

const SalesPage = () => {
  const router = useRouter();
  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed
  );
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);

  // API calls
  const { data: sales = [], isLoading, error, refetch } = useGetSalesQuery();
  const { data: products = [] } = useGetProductsQuery();
  const { data: customers = [] } = useGetCustomersQuery();

  const [updateSale] = useUpdateSaleMutation();
  const [deleteSale] = useDeleteSaleMutation();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [showFilterStatusDropdown, setShowFilterStatusDropdown] =
    useState(false);

  // Sale form state
  const [saleForm, setSaleForm] = useState({
    customer_id: 0,
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    paymentMethod: "cash" as "cash" | "card" | "bank_transfer" | "mobile_payment",
    status: "pending" as "pending" | "completed" | "cancelled" | "partially_paid",
    notes: "",
    discount: 0,
    tax: 0,
    shipping: 0,
    dueDate: new Date().toISOString().split("T")[0] || "",
    items: [] as Array<{
      productId: number;
      productCode: string;
      productName: string;
      quantity: number;
      price: number;
      total: number;
      discount: number;
    }>,
  });

  // Dropdown states
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Refs for dropdown closing
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const paymentDropdownRef = useRef<HTMLDivElement>(null);
  const customerDropdownRef = useRef<HTMLDivElement>(null);
  const filterStatusDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target as Node)
      ) {
        setShowStatusDropdown(false);
      }
      if (
        paymentDropdownRef.current &&
        !paymentDropdownRef.current.contains(event.target as Node)
      ) {
        setShowPaymentDropdown(false);
      }
      if (
        customerDropdownRef.current &&
        !customerDropdownRef.current.contains(event.target as Node)
      ) {
        setShowCustomerDropdown(false);
      }
      if (
        filterStatusDropdownRef.current &&
        !filterStatusDropdownRef.current.contains(event.target as Node)
      ) {
        setShowFilterStatusDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const itemsPerPage = 10;

  const getContentMargin = () => {
    return "ml-0";
  };

  const getFilterStatusDisplayText = () => {
    switch (statusFilter) {
      case "all":
        return "All Status";
      case "completed":
        return "Completed";
      case "pending":
        return "Pending";
      case "partially_paid":
        return "Partially Paid";
      case "cancelled":
        return "Cancelled";
      default:
        return "All Status";
    }
  };
  
  // Filter sales based on search and status
  const filteredSales = sales
    .filter(
      (sale) =>
        sale.Customers?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.saleNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.Customers?.phone?.includes(searchTerm) ||
        sale.id.toString().includes(searchTerm)
    )
    .filter((sale) => {
      if (statusFilter === "all") return true;
      if (statusFilter === "completed")
        return Number(sale.totalPaid) >= Number(sale.totalAmount);
      if (statusFilter === "pending")
        return Number(sale.totalPaid) === 0;
      if (statusFilter === "partially_paid")
        return Number(sale.totalPaid) > 0 && Number(sale.totalPaid) < Number(sale.totalAmount);
      if (statusFilter === "cancelled")
        return sale.status === "Cancelled";
      return true;
    });

  const handleDeleteSale = async (id: number) => {
    if (confirm("Are you sure you want to delete this sale?")) {
      try {
        await deleteSale(id).unwrap();
      } catch (error) {
        console.error("Failed to delete sale:", error);
        alert("Failed to delete sale. Please try again.");
      }
    }
  };

  const handleEditSale = (sale: Sale) => {
    const totalPaid = Number(sale.totalPaid);
    const totalAmount = Number(sale.totalAmount);
    
    let status: "pending" | "completed" | "cancelled" | "partially_paid" = "pending";
    if (totalPaid >= totalAmount) status = "completed";
    else if (totalPaid > 0) status = "partially_paid";
    else if (sale.status === "Cancelled") status = "cancelled";
    
    setSaleForm({
      customer_id: sale.customer_id || 0,
      customerName: sale.Customers?.name || "",
      customerEmail: sale.Customers?.email || "",
      customerPhone: sale.Customers?.phone || "",
      customerAddress: sale.Customers?.address || "",
      paymentMethod: "cash", // Default, you might want to get this from sale data
      status,
      notes: "",
      discount: sale.totaldiscount || 0,
      tax: 0, // You might want to add tax to your Sale model
      shipping: 0, // You might want to add shipping to your Sale model
      dueDate: sale.dueDate ? sale.dueDate.split("T")[0] : new Date().toISOString().split("T")[0],
      items: (sale.SalesItems || []).map((item) => ({
        productId: item.product_id,
        productCode: item.Products?.productCode || "",
        productName: item.Products?.name || "",
        quantity: item.quantity,
        price: Number(item.unitPrice),
        total: item.quantity * Number(item.unitPrice),
        discount: item.discount || 0,
      })),
    });
    setEditingSale(sale);
    setShowSaleModal(true);
  };

  const handleSaveSale = async () => {
    try {
      const subtotal = saleForm.items.reduce((sum, item) => sum + item.total, 0);
      const discountAmount = saleForm.discount;
      const taxAmount = saleForm.tax;
      const shippingAmount = saleForm.shipping;
      const totalAmount = subtotal - discountAmount + taxAmount + shippingAmount;
      
      let totalPaid = 0;
      if (saleForm.status === "completed") totalPaid = totalAmount;
      else if (saleForm.status === "partially_paid") {
        // For partially paid, you might want to add a field for amount paid
        totalPaid = Math.min(totalAmount * 0.5, totalAmount); // Example: 50% paid
      }

      const saleData = {
        customer_id: saleForm.customer_id,
        totalPaid,
        totalAmount,
        totaldiscount: discountAmount,
        dueDate: saleForm.dueDate,
        status: saleForm.status.charAt(0).toUpperCase() + saleForm.status.slice(1), // Capitalize first letter
      };

      if (editingSale) {
        await updateSale({
          id: editingSale.id,
          sale: saleData,
        }).unwrap();
      }

      setShowSaleModal(false);
      setEditingSale(null);
    } catch (error) {
      console.error("Failed to save sale:", error);
      alert("Failed to update sale. Please try again.");
    }
  };

  const selectCustomer = (customer: Customer) => {
    setSaleForm({
      ...saleForm,
      customer_id: customer.id,
      customerName: customer.name,
      customerEmail: customer.email || "",
      customerPhone: customer.phone,
      customerAddress: customer.address || "",
    });
    setShowCustomerDropdown(false);
  };

  const getStatusDisplayText = () => {
    switch (saleForm.status) {
      case "completed":
        return "Completed";
      case "pending":
        return "Pending";
      case "cancelled":
        return "Cancelled";
      case "partially_paid":
        return "Partially Paid";
      default:
        return "Select Status";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "partially_paid":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentDisplayText = () => {
    switch (saleForm.paymentMethod) {
      case "cash":
        return "Cash";
      case "card":
        return "Credit Card";
      case "bank_transfer":
        return "Bank Transfer";
      case "mobile_payment":
        return "Mobile Payment";
      default:
        return "Select Payment Method";
    }
  };

  const getCustomerDisplayText = () => {
    return saleForm.customerName || "Select Customer";
  };

  const updateItemField = (productId: number, field: string, value: any) => {
    setSaleForm({
      ...saleForm,
      items: saleForm.items.map(item => 
        item.productId === productId 
          ? { 
              ...item, 
              [field]: value,
              total: field === 'quantity' || field === 'price' || field === 'discount'
                ? (field === 'quantity' ? value : item.quantity) * 
                  (field === 'price' ? value : item.price) -
                  (field === 'discount' ? value : item.discount)
                : item.total
            } 
          : item
      ),
    });
  };

  const removeItem = (productId: number) => {
    setSaleForm({
      ...saleForm,
      items: saleForm.items.filter(item => item.productId !== productId),
    });
  };

  const addNewItem = () => {
    setSaleForm({
      ...saleForm,
      items: [
        ...saleForm.items,
        {
          productId: 0,
          productCode: "",
          productName: "",
          quantity: 1,
          price: 0,
          total: 0,
          discount: 0,
        }
      ],
    });
  };

  const selectProductForItem = (itemIndex: number, productId: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const updatedItems = [...saleForm.items];
      updatedItems[itemIndex] = {
        ...updatedItems[itemIndex],
        productId: product.id,
        productCode: product.productCode,
        productName: product.name,
        price: product.retailPrice,
        total: updatedItems[itemIndex].quantity * product.retailPrice,
      };
      setSaleForm({ ...saleForm, items: updatedItems });
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSales = filteredSales.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);

  const subtotal = saleForm.items.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = saleForm.discount;
  const taxAmount = saleForm.tax;
  const shippingAmount = saleForm.shipping;
  const totalAmount = subtotal - discountAmount + taxAmount + shippingAmount;

  if (isLoading) {
    return (
      <div
        className={`${getContentMargin()} p-6 min-h-screen bg-gray-50 flex items-center justify-center`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading sales...</p>
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
          <TrendingUp className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Error Loading Sales
          </h3>
          <p className="text-red-600 mb-4">Failed to load sales data</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => refetch()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
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
              <TrendingUp className="w-6 h-6" />
              Sales
            </h1>
            <p className="mt-1">Manage your sales transactions</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
{/* Stats Cards - Updated with dark mode support */}
<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
  {/* Total Sales Card - Blue */}
  <div className={`rounded-lg p-4 shadow-sm border transition-all duration-300 hover:shadow-md ${
    isDarkMode
      ? "bg-blue-900/30 border-blue-800 text-white"
      : "bg-blue-50 border-blue-200 text-blue-900"
  }`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">Total Sales</p>
        <p className="text-2xl font-bold mt-2">{sales.length}</p>
      </div>
      <div className={`p-3 rounded-lg ${
        isDarkMode ? "bg-blue-800/50" : "bg-blue-100"
      }`}>
        <TrendingUp className={`w-6 h-6 ${
          isDarkMode ? "text-blue-300" : "text-blue-600"
        }`} />
      </div>
    </div>
  </div>

  {/* Completed Card - Green */}
  <div className={`rounded-lg p-4 shadow-sm border transition-all duration-300 hover:shadow-md ${
    isDarkMode
      ? "bg-green-900/30 border-green-800 text-white"
      : "bg-green-50 border-green-200 text-green-900"
  }`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">Completed</p>
        <p className="text-2xl font-bold mt-2">
          {sales.filter((s) => Number(s.totalPaid) >= Number(s.totalAmount)).length}
        </p>
      </div>
      <div className={`p-3 rounded-lg ${
        isDarkMode ? "bg-green-800/50" : "bg-green-100"
      }`}>
        <CheckCircle className={`w-6 h-6 ${
          isDarkMode ? "text-green-300" : "text-green-600"
        }`} />
      </div>
    </div>
  </div>

  {/* Pending Card - Orange */}
  <div className={`rounded-lg p-4 shadow-sm border transition-all duration-300 hover:shadow-md ${
    isDarkMode
      ? "bg-orange-900/30 border-orange-800 text-white"
      : "bg-orange-50 border-orange-200 text-orange-900"
  }`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">Pending</p>
        <p className="text-2xl font-bold mt-2">
          {sales.filter((s) => Number(s.totalPaid) === 0).length}
        </p>
      </div>
      <div className={`p-3 rounded-lg ${
        isDarkMode ? "bg-orange-800/50" : "bg-orange-100"
      }`}>
        <Clock className={`w-6 h-6 ${
          isDarkMode ? "text-orange-300" : "text-orange-600"
        }`} />
      </div>
    </div>
  </div>

  {/* Total Revenue Card - Purple */}
  <div className={`rounded-lg p-4 shadow-sm border transition-all duration-300 hover:shadow-md ${
    isDarkMode
      ? "bg-purple-900/30 border-purple-800 text-white"
      : "bg-purple-50 border-purple-200 text-purple-900"
  }`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">Total Revenue</p>
        <p className="text-2xl font-bold mt-2">
          ৳ {sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0).toFixed(2)}
        </p>
      </div>
      <div className={`p-3 rounded-lg ${
        isDarkMode ? "bg-purple-800/50" : "bg-purple-100"
      }`}>
        <DollarSign className={`w-6 h-6 ${
          isDarkMode ? "text-purple-300" : "text-purple-600"
        }`} />
      </div>
    </div>
  </div>
</div>

      {/* Filters and Search */}
      <div
        className={`rounded-lg shadow-sm border mb-6 ${
          isDarkMode
            ? "bg-gray-800/50 border-gray-700"
            : "bg-white/50 border-gray-200"
        }`}
      >
        <div className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative ">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by customer name, phone, or sale ID..."
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

            <div className="relative" ref={filterStatusDropdownRef}>
              <button
                onClick={() =>
                  setShowFilterStatusDropdown(!showFilterStatusDropdown)
                }
                className={`flex items-center justify-between px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer ${
                  isDarkMode
                    ? "bg-gray-800/50 border-gray-700"
                    : "bg-white/50 border-gray-200"
                }`}
              >
                <span>{getFilterStatusDisplayText()}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {showFilterStatusDropdown && (
                <ul
                  className={`absolute z-10 w-full mt-1 border rounded-lg shadow-lg ${
                    isDarkMode
                      ? "bg-gray-800/90 border-gray-700"
                      : "bg-white/50 border-gray-200"
                  }`}
                >
                  <li>
                    <button
                      onClick={() => {
                        setStatusFilter("all");
                        setShowFilterStatusDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 hover:text-black cursor-pointer"
                    >
                      All Status
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        setStatusFilter("completed");
                        setShowFilterStatusDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 hover:text-black cursor-pointer"
                    >
                      Completed
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        setStatusFilter("pending");
                        setShowFilterStatusDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 hover:text-black cursor-pointer"
                    >
                      Pending
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        setStatusFilter("partially_paid");
                        setShowFilterStatusDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 hover:text-black cursor-pointer"
                    >
                      Partially Paid
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        setStatusFilter("cancelled");
                        setShowFilterStatusDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 hover:text-black cursor-pointer"
                    >
                      Cancelled
                    </button>
                  </li>
                </ul>
              )}
            </div>

            <div className="flex gap-2">
              <button
                className={`px-4 py-2 border rounded-lg cursor-not-allowed flex items-center gap-2 ${
                  isDarkMode
                    ? "bg-gray-800/50 border-gray-700"
                    : "bg-white/50 border-gray-200"
                }`}
              >
                <Filter className="w-4 h-4" />
                Filter
              </button>
              <button
                className={`px-4 py-2 border rounded-lg cursor-not-allowed flex items-center gap-2 ${
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

      {/* Sales Table */}
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
                isDarkMode ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Sale ID
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">
                  Amount
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
              {currentSales.map((sale) => {
                const totalPaid = Number(sale.totalPaid);
                const totalAmount = Number(sale.totalAmount);
                let status: string;
                if (totalPaid >= totalAmount) status = "completed";
                else if (totalPaid > 0) status = "partially_paid";
                else if (sale.status === "Cancelled") status = "cancelled";
                else status = "pending";

                return (
                  <tr
                    key={sale.id}
                    className="hover:bg-gray-300 hover:text-black"
                  >
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div
                        className="text-sm font-medium text-blue-600 cursor-pointer hover:underline"
                        onClick={() => router.push(`/sale/${sale.id}`)}
                      >
                        #{sale.saleNo || `SALE-${sale.id.toString().padStart(5, '0')}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div
                        className="text-sm font-medium text-blue-600 cursor-pointer hover:underline"
                        onClick={() => router.push(`/sale/${sale.id}`)}
                      >
                        {sale.Customers?.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm">
                        {/* {new Date(sale.createdAt).toDateString()}, */}
                        {/* {new Date(sale.createdAt).toTimeString()}, */}
                        {new Date(sale.createdAt).toLocaleDateString("en-gb", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        {/* {new Date(sale.createdAt).toLocaleTimeString()}, */}
                        {/* {new Date(sale.createdAt).toString()}, */}
                        {/* {new Date(sale.createdAt).toTimeString()}, */}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm font-medium">
                        ৳{totalAmount.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-2 rounded-lg text-xs font-bold capitalize ${getStatusColor(status)}`}
                      >
                        {status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                      <div className="flex-1 items-center space-x-2">
                        <button
                          onClick={() => router.push(`/sale/${sale.id}`)}
                          className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditSale(sale)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="Edit Sale"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSale(sale.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Delete Sale"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {currentSales.length === 0 && (
            <div className="text-center py-12">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No sales found
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "No sales recorded yet"}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {indexOfFirstItem + 1} to{" "}
                {Math.min(indexOfLastItem, filteredSales.length)} of{" "}
                {filteredSales.length} results
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

      {/* Edit Sale Modal */}
      {showSaleModal && editingSale && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg border max-w-5xl w-full max-h-[90vh] overflow-y-auto ${
            isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
          }`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Edit className="w-6 h-6" />
                    Edit Sale #{editingSale.saleNo || `SALE-${editingSale.id.toString().padStart(5, '0')}`}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Created: {new Date(editingSale.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setShowSaleModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Customer & Payment Info */}
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-bold mb-3 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Customer Information
                    </h3>
                    <div className="relative" ref={customerDropdownRef}>
                      <label className="block text-sm font-medium mb-1">
                        Customer *
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setShowCustomerDropdown(!showCustomerDropdown)
                        }
                        className={`flex items-center justify-between w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                          isDarkMode ? "border-gray-700" : "border-gray-200"
                        }`}
                      >
                        <span>{getCustomerDisplayText()}</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      {showCustomerDropdown && (
                        <ul
                          className={`absolute z-10 w-full mt-1 border rounded-lg shadow-lg max-h-60 overflow-y-auto ${
                            isDarkMode ? "bg-gray-900" : "bg-white"
                          }`}
                        >
                          {customers.map((customer) => (
                            <li key={customer.id}>
                              <button
                                type="button"
                                onClick={() => selectCustomer(customer)}
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 hover:text-black flex justify-between items-center cursor-pointer"
                              >
                                <span>{customer.name}</span>
                                <span className="text-sm text-gray-500">
                                  {customer.phone}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          <Phone className="w-3 h-3 inline mr-1" />
                          Phone
                        </label>
                        <input
                          type="text"
                          value={saleForm.customerPhone}
                          disabled
                          className={`w-full px-3 py-2 border rounded-lg bg-gray-50 ${
                            isDarkMode ? "border-gray-700" : "border-gray-200"
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          <Mail className="w-3 h-3 inline mr-1" />
                          Email
                        </label>
                        <input
                          type="email"
                          value={saleForm.customerEmail}
                          disabled
                          className={`w-full px-3 py-2 border rounded-lg bg-gray-50 ${
                            isDarkMode ? "border-gray-700" : "border-gray-200"
                          }`}
                        />
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <label className="block text-sm font-medium mb-1">
                        <MapPin className="w-3 h-3 inline mr-1" />
                        Address
                      </label>
                      <textarea
                        value={saleForm.customerAddress}
                        disabled
                        rows={2}
                        className={`w-full px-3 py-2 border rounded-lg bg-gray-50 ${
                          isDarkMode ? "border-gray-700" : "border-gray-200"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-bold mb-3 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Payment & Status
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative" ref={paymentDropdownRef}>
                        <label className="block text-sm font-medium mb-1">
                          Payment Method
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setShowPaymentDropdown(!showPaymentDropdown)
                          }
                          className={`flex items-center justify-between w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                            isDarkMode ? "border-gray-700" : "border-gray-200"
                          }`}
                        >
                          <span>{getPaymentDisplayText()}</span>
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        {showPaymentDropdown && (
                          <ul className="absolute z-10 w-full mt-1 border border-gray-300 rounded-lg shadow-lg">
                            <li>
                              <button
                                type="button"
                                onClick={() => {
                                  setSaleForm({
                                    ...saleForm,
                                    paymentMethod: "cash",
                                  });
                                  setShowPaymentDropdown(false);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 hover:text-black cursor-pointer"
                              >
                                Cash
                              </button>
                            </li>
                            <li>
                              <button
                                type="button"
                                onClick={() => {
                                  setSaleForm({
                                    ...saleForm,
                                    paymentMethod: "card",
                                  });
                                  setShowPaymentDropdown(false);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 hover:text-black cursor-pointer"
                              >
                                Credit Card
                              </button>
                            </li>
                            <li>
                              <button
                                type="button"
                                onClick={() => {
                                  setSaleForm({
                                    ...saleForm,
                                    paymentMethod: "bank_transfer",
                                  });
                                  setShowPaymentDropdown(false);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 hover:text-black cursor-pointer"
                              >
                                Bank Transfer
                              </button>
                            </li>
                            <li>
                              <button
                                type="button"
                                onClick={() => {
                                  setSaleForm({
                                    ...saleForm,
                                    paymentMethod: "mobile_payment",
                                  });
                                  setShowPaymentDropdown(false);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 hover:text-black cursor-pointer"
                              >
                                Mobile Payment
                              </button>
                            </li>
                          </ul>
                        )}
                      </div>

                      <div className="relative" ref={statusDropdownRef}>
                        <label className="block text-sm font-medium mb-1">
                          Status
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setShowStatusDropdown(!showStatusDropdown)
                          }
                          className={`flex items-center justify-between w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                            isDarkMode ? "border-gray-700" : "border-gray-200"
                          }`}
                        >
                          <span>{getStatusDisplayText()}</span>
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        {showStatusDropdown && (
                          <ul className="absolute z-10 w-full mt-1 border border-gray-300 rounded-lg shadow-lg">
                            <li>
                              <button
                                type="button"
                                onClick={() => {
                                  setSaleForm({ ...saleForm, status: "pending" });
                                  setShowStatusDropdown(false);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 hover:text-black cursor-pointer"
                              >
                                Pending
                              </button>
                            </li>
                            <li>
                              <button
                                type="button"
                                onClick={() => {
                                  setSaleForm({
                                    ...saleForm,
                                    status: "completed",
                                  });
                                  setShowStatusDropdown(false);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 hover:text-black cursor-pointer"
                              >
                                Completed
                              </button>
                            </li>
                            <li>
                              <button
                                type="button"
                                onClick={() => {
                                  setSaleForm({
                                    ...saleForm,
                                    status: "partially_paid",
                                  });
                                  setShowStatusDropdown(false);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 hover:text-black cursor-pointer"
                              >
                                Partially Paid
                              </button>
                            </li>
                            <li>
                              <button
                                type="button"
                                onClick={() => {
                                  setSaleForm({
                                    ...saleForm,
                                    status: "cancelled",
                                  });
                                  setShowStatusDropdown(false);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 hover:text-black cursor-pointer"
                              >
                                Cancelled
                              </button>
                            </li>
                          </ul>
                        )}
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="block text-sm font-medium mb-1">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={saleForm.dueDate}
                        onChange={(e) =>
                          setSaleForm({ ...saleForm, dueDate: e.target.value })
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                          isDarkMode ? "border-gray-700" : "border-gray-200"
                        }`}
                      />
                    </div>

                    <div className="mt-3">
                      <label className="block text-sm font-medium mb-1">
                        <FileText className="w-3 h-3 inline mr-1" />
                        Notes
                      </label>
                      <textarea
                        value={saleForm.notes}
                        onChange={(e) =>
                          setSaleForm({ ...saleForm, notes: e.target.value })
                        }
                        rows={3}
                        placeholder="Add any notes about this sale..."
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                          isDarkMode ? "border-gray-700" : "border-gray-200"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Middle Column - Products */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4" />
                        Products
                      </h3>
                      <button
                        onClick={addNewItem}
                        className="text-sm bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600"
                      >
                        Add Item
                      </button>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium">Product</th>
                            <th className="px-3 py-2 text-center text-xs font-medium">Quantity</th>
                            <th className="px-3 py-2 text-center text-xs font-medium">Price</th>
                            <th className="px-3 py-2 text-center text-xs font-medium">Discount</th>
                            <th className="px-3 py-2 text-center text-xs font-medium">Total</th>
                            <th className="px-3 py-2 text-center text-xs font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {saleForm.items.map((item, index) => (
                            <tr key={index} className="border-b">
                              <td className="px-3 py-2">
                                <div>
                                  <div className="font-medium">{item.productName || "Select Product"}</div>
                                  <div className="text-xs text-gray-500">{item.productCode}</div>
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => updateItemField(item.productId, 'quantity', parseInt(e.target.value) || 1)}
                                  className="w-16 px-2 py-1 border rounded text-center"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.price}
                                  onChange={(e) => updateItemField(item.productId, 'price', parseFloat(e.target.value) || 0)}
                                  className="w-24 px-2 py-1 border rounded text-center"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.discount}
                                  onChange={(e) => updateItemField(item.productId, 'discount', parseFloat(e.target.value) || 0)}
                                  className="w-20 px-2 py-1 border rounded text-center"
                                />
                              </td>
                              <td className="px-3 py-2 text-center font-medium">
                                ৳{item.total.toFixed(2)}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <button
                                  onClick={() => removeItem(item.productId)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {saleForm.items.length === 0 && (
                            <tr>
                              <td colSpan={6} className="px-3 py-4 text-center text-gray-500">
                                No products added
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Summary Section */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-bold mb-3 flex items-center gap-2">
                      <Receipt className="w-4 h-4" />
                      Summary
                    </h3>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>৳{subtotal.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <div className="flex items-center gap-2">
                          <Tag className="w-3 h-3" />
                          <span>Discount:</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={saleForm.discount}
                            onChange={(e) => setSaleForm({...saleForm, discount: parseFloat(e.target.value) || 0})}
                            className="w-20 px-2 py-1 border rounded text-sm"
                          />
                        </div>
                        <span>-৳{discountAmount}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <div className="flex items-center gap-2">
                          <Percent className="w-3 h-3" />
                          <span>Tax:</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={saleForm.tax}
                            onChange={(e) => setSaleForm({...saleForm, tax: parseFloat(e.target.value) || 0})}
                            className="w-20 px-2 py-1 border rounded text-sm"
                          />
                        </div>
                        <span>+৳{taxAmount.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <div className="flex items-center gap-2">
                          <Building className="w-3 h-3" />
                          <span>Shipping:</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={saleForm.shipping}
                            onChange={(e) => setSaleForm({...saleForm, shipping: parseFloat(e.target.value) || 0})}
                            className="w-20 px-2 py-1 border rounded text-sm"
                          />
                        </div>
                        <span>+৳{shippingAmount.toFixed(2)}</span>
                      </div>
                      
                      <div className="border-t pt-2 font-bold text-lg">
                        <div className="flex justify-between">
                          <span>Total:</span>
                          <span>৳{totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mt-6 pt-6 border-t">
                <div className="text-sm text-gray-500">
                  Last updated: {editingSale.updatedAt ? new Date(editingSale.updatedAt).toLocaleString() : 'Never'}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowSaleModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSale}
                    disabled={!saleForm.customer_id || saleForm.items.length === 0}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Update Sale
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </ProviderWrapper>
  );
};

export default SalesPage;
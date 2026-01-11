"use client";
import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppSelector } from "@/app/redux";
import {
  ArrowLeft,
  Edit,
  Trash2,
  TrendingUp,
  User,
  Calendar,
  FileText,
  DollarSign,
  Package,
  Printer,
  Download,
  X,
  ChevronDown,
  RefreshCw,
  Tag,
  Percent,
  Layers,
  Hash,
  Clock,
  CreditCard,
  Building,
  ShoppingCart,
  Receipt,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Plus,
  Minus,
  FileEdit,
  Save,
  PercentIcon,
} from "lucide-react";
import {
  useGetSaleQuery,
  useUpdateSaleMutation,
  useDeleteSaleMutation,
  useGetProductsQuery,
  useGetCustomersQuery,
} from "@/state/api";
import type { Sale, SaleItem, Product, Customer } from "@/state/api";
import ProviderWrapper from "@/app/(components)/ProviderWrapper";

const SingleSalePage = () => {
  const params = useParams();
  const router = useRouter();
  const saleId = parseInt(params.id as string);

  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed
  );
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);

  // API calls
  const { data: sale, isLoading, error, refetch } = useGetSaleQuery(saleId);
  const { data: products = [] } = useGetProductsQuery();
  const { data: customers = [] } = useGetCustomersQuery();
  const [updateSale] = useUpdateSaleMutation();
  const [deleteSale] = useDeleteSaleMutation();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    customer_id: 0,
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    paymentMethod: "cash" as "cash" | "card" | "bank_transfer" | "mobile_payment",
    status: "pending" as "pending" | "completed" | "cancelled" | "partially_paid",
    notes: "",
    totaldiscount: 0,
    tax: 0,
    shipping: 0,
    dueDate: "",
    totalPaid: 0,
    items: [] as Array<{
      id: number;
      productId: number;
      productCode: string;
      productName: string;
      quantity: number;
      price: number;
      discount: number;
      total: number;
      unitPrice: number;
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
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Initialize edit form when sale data is loaded
  useEffect(() => {
    if (sale) {
      const totalPaid = Number(sale.totalPaid);
      const totalAmount = Number(sale.totalAmount);
      
      let status: "pending" | "completed" | "cancelled" | "partially_paid" = "pending";
      if (totalPaid >= totalAmount) status = "completed";
      else if (totalPaid > 0) status = "partially_paid";
      else if (sale.status === "Cancelled") status = "cancelled";
      
      setEditForm({
        customer_id: sale.customer_id || 0,
        customerName: sale.Customers?.name || "",
        customerEmail: sale.Customers?.email || "",
        customerPhone: sale.Customers?.phone || "",
        customerAddress: sale.Customers?.address || "",
        paymentMethod: "cash",
        status,
        notes: "",
        totaldiscount: Number(sale.totaldiscount) || 0,
        tax: 0,
        shipping: 0,
        dueDate: sale.dueDate ? new Date(sale.dueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        totalPaid: totalPaid,
        items: (sale.SalesItems || []).map((item) => ({
          id: item.id,
          productId: item.product_id,
          productCode: item.Products?.productCode || "",
          productName: item.Products?.name || "",
          quantity: item.quantity,
          price: Number(item.unitPrice),
          discount: Number(item.discount) || 0,
          total: item.quantity * Number(item.unitPrice) - (Number(item.discount) || 0),
          unitPrice: Number(item.unitPrice),
        })),
      });
    }
  }, [sale]);

  const getContentMargin = () => {
    return "ml-0";
  };

  const handleDelete = async () => {
    try {
      await deleteSale(saleId).unwrap();
      router.push("/sale");
    } catch (error) {
      console.error("Failed to delete sale:", error);
      alert("Failed to delete sale. Please try again.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      if (!sale) {
        console.error("Sale data not available");
        alert("Sale data not available. Please try again.");
        return;
      }

      const subtotal = editForm.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const totalAmount = subtotal - editForm.totaldiscount + editForm.tax + editForm.shipping;
      
      let totalPaid = editForm.totalPaid;
      if (editForm.status === "completed") totalPaid = totalAmount;
      else if (editForm.status === "partially_paid") {
        // Keep the current totalPaid value for partially paid
      }

      const updateData = {
        customer_id: editForm.customer_id,
        totalPaid,
        totalAmount,
        totaldiscount: editForm.totaldiscount,
        dueDate: editForm.dueDate,
      };

      await updateSale({
        id: saleId,
        sale: updateData,
      }).unwrap();

      setShowEditModal(false);
      refetch();
    } catch (error) {
      console.error("Failed to update sale:", error);
      alert("Failed to update sale. Please try again.");
    }
  };

  const selectCustomer = (customer: Customer) => {
    setEditForm({
      ...editForm,
      customer_id: customer.id,
      customerName: customer.name,
      customerEmail: customer.email || "",
      customerPhone: customer.phone,
      customerAddress: customer.address || "",
    });
    setShowCustomerDropdown(false);
  };

  const getStatusDisplayText = () => {
    switch (editForm.status) {
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

  const getPaymentDisplayText = () => {
    switch (editForm.paymentMethod) {
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
    return editForm.customerName || "Select Customer";
  };

  const updateItemField = (itemId: number, field: string, value: any) => {
    setEditForm({
      ...editForm,
      items: editForm.items.map(item => 
        item.id === itemId 
          ? { 
              ...item, 
              [field]: value,
              total: field === 'quantity' || field === 'price' || field === 'discount'
                ? (field === 'quantity' ? value : item.quantity) * 
                  (field === 'price' ? value : item.unitPrice) -
                  (field === 'discount' ? value : item.discount)
                : item.total
            } 
          : item
      ),
    });
  };

  const getStatusColor = (status?: string) => {
    const saleStatus = status?.toLowerCase();
    switch (saleStatus) {
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

  // Calculate totals
  const subtotal = editForm.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const discountAmount = editForm.totaldiscount;
  const taxAmount = editForm.tax;
  const shippingAmount = editForm.shipping;
  const totalAmount = subtotal - discountAmount + taxAmount + shippingAmount;
  const dueAmount = totalAmount - editForm.totalPaid;

  if (isLoading) {
    return (
      <div
        className={`${getContentMargin()} p-6 min-h-screen flex items-center justify-center`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading sale details...</p>
        </div>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div
        className={`${getContentMargin()} p-6 min-h-screen flex items-center justify-center`}
      >
        <div className="text-center">
          <TrendingUp className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Sale Not Found
          </h3>
          <p className="text-red-600 mb-4">
            The sale you're looking for doesn't exist or has been removed.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push("/sale")}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Back to Sales
            </button>
            <button
              onClick={refetch}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const originalDueAmount = Number(sale.totalAmount) - Number(sale.totalPaid);
  const originalNetRevenue = Number(sale.totalAmount) - (Number(sale.totaldiscount) || 0);

  return (
    <ProviderWrapper>
    <div
      className={`${getContentMargin()} p-6 min-h-full border rounded-xl shadow-2xl transition-all duration-300 mt-12 ${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/50 border-gray-200"}`}
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => router.push("/sale")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              Sale Details
            </h1>
            <div className="mt-1 text-gray-600 flex flex-wrap gap-4">
              <span className="flex items-center gap-1">
                <Tag className="w-4 h-4" />
                Invoice: {sale.saleNo}
              </span>
              {sale.status && (
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(sale.status)}`}
                >
                  {sale.status}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Created: {new Date(sale.createdAt).toLocaleDateString()}
            </span>
            <span className="text-sm text-gray-600 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Updated: {new Date(sale.updatedAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={handleEdit}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            {/* <button
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button> */}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <div className={`rounded-lg shadow-sm border overflow-hidden ${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/50 border-gray-200"}`}>
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Customer Name
                  </label>
                  <p className="text-lg font-semibold">
                    {sale.Customers?.name || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Phone Number
                  </label>
                  <p className="text-lg">{sale.Customers?.phone || "N/A"}</p>
                </div>
                {sale.Customers?.email && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Email
                    </label>
                    <p className="text-lg">{sale.Customers.email}</p>
                  </div>
                )}
                {sale.Customers?.address && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Address
                    </label>
                    <p className="text-lg">{sale.Customers.address}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sales Person Information */}
          <div className={`rounded-lg shadow-sm border overflow-hidden ${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/50 border-gray-200"}`}>
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Sales Person Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Sales Person Name
                  </label>
                  <p className="text-lg font-semibold">
                    {sale.Users?.name || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Email
                  </label>
                  <p className="text-lg">{sale.Users?.email || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className={`rounded-lg shadow-sm border overflow-hidden ${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/50 border-gray-200"}`}>
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Items Sold ({sale.SalesItems.length} items)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Product Details
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Discount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                    {sale.SalesItems.map((item) => {
                      const subtotal = item.quantity * Number(item.unitPrice);
                      const itemDiscount = Number(item.discount) || 0;
                      const netSubtotal = subtotal - itemDiscount;

                      return (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium">
                              {item.Products?.name || "N/A"}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              <div>Code: {item.Products?.productCode || "N/A"}</div>
                              {item.Products?.specification && (
                                <div>Spec: {item.Products.specification}</div>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                                  item.Products?.productType === "New" 
                                    ? "bg-blue-100 text-blue-800" 
                                    : "bg-purple-100 text-purple-800"
                                }`}>
                                  {item.Products?.productType}
                                </span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                                  item.Products?.status === "Active"
                                    ? "bg-green-100 text-green-800"
                                    : item.Products?.status === "Unavailable"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}>
                                  {item.Products?.status}
                                </span>
                              </div>
                              {item.salesItemSerials && item.salesItemSerials.length > 0 && (
                                <div className="mt-2">
                                  <div className="font-medium text-xs">Serials:</div>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {item.salesItemSerials.map((serial, index) => (
                                      <span key={serial.id} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs">
                                        {serial.ProductSerials?.serial}
                                        {serial.ProductSerials?.warranty === "Yes" && (
                                          <span className="text-green-600">✓</span>
                                        )}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium">{item.quantity}</div>
                            {item.Products?.useIndividualSerials && (
                              <div className="text-xs text-gray-500">Serialized</div>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm">
                              ৳{Number(item.unitPrice).toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Retail: ৳{Number(item.Products?.retailPrice || 0).toFixed(2)}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm">
                              ৳{itemDiscount.toFixed(2)}
                            </div>
                            {itemDiscount > 0 && (
                              <div className="text-xs text-gray-500">
                                {((itemDiscount / subtotal) * 100).toFixed(1)}%
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium">
                              ৳{netSubtotal.toFixed(2)}
                            </div>
                            {itemDiscount > 0 && (
                              <div className="text-xs text-gray-500 line-through">
                                ৳{subtotal.toFixed(2)}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Sale Summary */}
          <div className={`rounded-lg shadow-sm border p-6 ${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/50 border-gray-200"}`}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Sale Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Items</span>
                <span className="font-semibold">
                  {sale.SalesItems.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Gross Amount</span>
                <span className="font-semibold">
                  ৳{Number(sale.totalAmount).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center gap-1">
                  <Percent className="w-4 h-4" />
                  Total Discount
                </span>
                <span className="font-semibold text-orange-600">
                  ৳{Number(sale.totaldiscount || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Net Amount</span>
                <span className="font-semibold text-blue-600">
                  ৳{originalNetRevenue.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Paid</span>
                <span className="font-semibold text-green-600">
                  ৳{Number(sale.totalPaid).toFixed(2)}
                </span>
              </div>
              <div className={`border-t pt-3 flex justify-between items-center ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                <span className="text-lg font-bold">Due Amount</span>
                <span
                  className={`text-lg font-bold ${
                    originalDueAmount > 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  ৳{originalDueAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Payment Status</span>
                <span
                  className={`font-semibold ${
                    originalDueAmount === 0 ? "text-green-600" : "text-yellow-600"
                  }`}
                >
                  {originalDueAmount === 0 ? "Fully Paid" : "Partial Payment"}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className={`rounded-lg shadow-sm border p-6 ${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/50 border-gray-200"}`}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Payment Information
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Invoice Number</span>
                <span className="font-mono font-semibold">
                  {sale.saleNo}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Due Date</span>
                <span className="font-semibold">
                  {sale.dueDate
                    ? new Date(sale.dueDate).toLocaleDateString()
                    : "Not Set"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Payment Ratio</span>
                <span className="font-semibold">
                  {((Number(sale.totalPaid) / Number(sale.totalAmount)) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Created Date</span>
                <span className="font-semibold">
                  {new Date(sale.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Last Updated</span>
                <span className="font-semibold">
                  {new Date(sale.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Product Statistics */}
          <div className={`rounded-lg shadow-sm border p-6 ${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/50 border-gray-200"}`}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Product Statistics
            </h3>
            <div className="space-y-3">
              {(() => {
                const productTypes = sale.SalesItems.reduce((acc, item) => {
                  const type = item.Products?.productType || "Unknown";
                  acc[type] = (acc[type] || 0) + item.quantity;
                  return acc;
                }, {} as Record<string, number>);

                return Object.entries(productTypes).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-gray-600">{type} Products</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ));
              })()}
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-gray-600">Serialized Items</span>
                <span className="font-semibold">
                  {sale.SalesItems.filter(item => 
                    item.salesItemSerials && item.salesItemSerials.length > 0
                  ).length}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className={`rounded-lg shadow-sm border p-6 ${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/50 border-gray-200"}`}>
            <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={handlePrint}
                className={`w-full text-left p-3 border rounded-lg hover:bg-gray-50 hover:text-black transition-colors flex items-center gap-2 ${isDarkMode ? "bg-gray-700/50 border-gray-600" : "bg-white/50 border-gray-200"}`}
              >
                <Printer className="w-4 h-4" />
                <div>
                  <div className="font-medium">Print Invoice</div>
                  <div className="text-sm text-gray-500">
                    Generate printable invoice
                  </div>
                </div>
              </button>
              <button 
                onClick={() => router.push(`/sale/${saleId}/return`)}
                className={`w-full text-left p-3 border rounded-lg hover:bg-gray-50 hover:text-black transition-colors flex items-center gap-2 ${isDarkMode ? "bg-gray-700/50 border-gray-600" : "bg-white/50 border-gray-200"}`}
              >
                <RefreshCw className="w-4 h-4" />
                <div>
                  <div className="font-medium">Create Return</div>
                  <div className="text-sm text-gray-500">
                    Return items from this sale
                  </div>
                </div>
              </button>
              <button className={`w-full text-left p-3 border rounded-lg hover:bg-gray-50 hover:text-black transition-colors flex items-center gap-2 ${isDarkMode ? "bg-gray-700/50 border-gray-600" : "bg-white/50 border-gray-200"}`}>
                <Download className="w-4 h-4" />
                <div>
                  <div className="font-medium">Download PDF</div>
                  <div className="text-sm text-gray-500">
                    Download as PDF file
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Edit Sale Modal */}
      {showEditModal && sale && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg border max-w-5xl w-full max-h-[90vh] overflow-y-auto ${
            isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
          }`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <FileEdit className="w-6 h-6" />
                    Edit Sale #{sale.saleNo}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Created: {new Date(sale.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
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
                          value={editForm.customerPhone}
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
                          value={editForm.customerEmail}
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
                        value={editForm.customerAddress}
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
                                  setEditForm({
                                    ...editForm,
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
                                  setEditForm({
                                    ...editForm,
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
                                  setEditForm({
                                    ...editForm,
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
                                  setEditForm({
                                    ...editForm,
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
                                  setEditForm({ ...editForm, status: "pending" });
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
                                  setEditForm({
                                    ...editForm,
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
                                  setEditForm({
                                    ...editForm,
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
                                  setEditForm({
                                    ...editForm,
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
                        value={editForm.dueDate}
                        onChange={(e) =>
                          setEditForm({ ...editForm, dueDate: e.target.value })
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
                        value={editForm.notes}
                        onChange={(e) =>
                          setEditForm({ ...editForm, notes: e.target.value })
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

                {/* Middle and Right Column - Products & Summary */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-bold mb-3 flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      Products ({editForm.items.length} items)
                    </h3>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium">Product</th>
                            <th className="px-3 py-2 text-center text-xs font-medium">Quantity</th>
                            <th className="px-3 py-2 text-center text-xs font-medium">Price</th>
                            <th className="px-3 py-2 text-center text-xs font-medium">Discount</th>
                            <th className="px-3 py-2 text-center text-xs font-medium">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {editForm.items.map((item) => (
                            <tr key={item.id} className="border-b">
                              <td className="px-3 py-2">
                                <div>
                                  <div className="font-medium">{item.productName}</div>
                                  <div className="text-xs text-gray-500">{item.productCode}</div>
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex items-center justify-center">
                                  <button
                                    onClick={() => updateItemField(item.id, 'quantity', Math.max(1, item.quantity - 1))}
                                    className="w-6 h-6 rounded border flex items-center justify-center hover:bg-gray-100"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => updateItemField(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                    className="w-16 px-2 py-1 border rounded text-center mx-2"
                                  />
                                  <button
                                    onClick={() => updateItemField(item.id, 'quantity', item.quantity + 1)}
                                    className="w-6 h-6 rounded border flex items-center justify-center hover:bg-gray-100"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.unitPrice}
                                  onChange={(e) => updateItemField(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                  className="w-24 px-2 py-1 border rounded text-center"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex items-center justify-center">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={item.discount}
                                    onChange={(e) => updateItemField(item.id, 'discount', parseFloat(e.target.value) || 0)}
                                    className="w-20 px-2 py-1 border rounded text-center"
                                  />
                                  <span className="ml-2 text-xs text-gray-500">
                                    ৳
                                  </span>
                                </div>
                              </td>
                              <td className="px-3 py-2 text-center font-medium">
                                ৳{item.total.toFixed(2)}
                              </td>
                            </tr>
                          ))}
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
                            value={editForm.totaldiscount}
                            onChange={(e) => setEditForm({...editForm, totaldiscount: parseFloat(e.target.value) || 0})}
                            className="w-20 px-2 py-1 border rounded text-sm"
                          />
                        </div>
                        <span>-৳{discountAmount.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <div className="flex items-center gap-2">
                          <PercentIcon className="w-3 h-3" />
                          <span>Tax:</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editForm.tax}
                            onChange={(e) => setEditForm({...editForm, tax: parseFloat(e.target.value) || 0})}
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
                            value={editForm.shipping}
                            onChange={(e) => setEditForm({...editForm, shipping: parseFloat(e.target.value) || 0})}
                            className="w-20 px-2 py-1 border rounded text-sm"
                          />
                        </div>
                        <span>+৳{shippingAmount.toFixed(2)}</span>
                      </div>
                      
                      <div className="border-t pt-2">
                        <div className="flex justify-between items-center font-bold text-lg">
                          <span>Total Amount:</span>
                          <span>৳{totalAmount.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="border-t pt-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span>Amount Paid:</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max={totalAmount}
                              value={editForm.totalPaid}
                              onChange={(e) => setEditForm({...editForm, totalPaid: Math.min(parseFloat(e.target.value) || 0, totalAmount)})}
                              className="w-28 px-2 py-1 border rounded text-sm"
                            />
                          </div>
                          <span className="font-medium text-green-600">
                            ৳{editForm.totalPaid.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="border-t pt-2 font-bold text-lg">
                        <div className="flex justify-between">
                          <span>Remaining Due:</span>
                          <span className={`${dueAmount > 0 ? "text-red-600" : "text-green-600"}`}>
                            ৳{dueAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mt-6 pt-6 border-t">
                <div className="text-sm text-gray-500">
                  Last updated: {sale.updatedAt ? new Date(sale.updatedAt).toLocaleString() : 'Never'}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={!editForm.customer_id || editForm.items.length === 0}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Update Sale
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg border max-w-md w-full ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-lg font-bold">Delete Sale</h3>
              </div>

              <p className="text-gray-600 mb-6">
                Are you sure you want to delete sale <strong>{sale.saleNo}</strong>?
                This action cannot be undone and will remove all associated
                records including sales items and serial number history.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Delete Sale
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </ProviderWrapper>
  );
};

export default SingleSalePage;
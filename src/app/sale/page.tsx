"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/app/redux";
import {
  TrendingUp,
  Plus,
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
  RefreshCw,
} from "lucide-react";
import {
  useGetSalesQuery,
  useCreateSaleMutation,
  useUpdateSaleMutation,
  useDeleteSaleMutation,
  useGetProductsQuery,
  useGetCustomersQuery,
} from "@/state/api";

interface SaleItem {
  id: number;
  product_id: number;
  quantity: number;
  unitPrice: number;
  Products: {
    id: number;
    name: string;
    retailPrice: number;
    specification?: string;
  };
}

interface Sale {
  id: number;
  totalAmount: number;
  totalPaid: number;
  dueDate: string;
  customer_id: number;
  user_id: number;
  Customers: {
    id: number;
    name: string;
    email?: string;
    phone: string;
    address?: string;
  };
  Users: {
    id: number;
    name: string;
    email: string;
  };
  SalesItems: SaleItem[];
  created_at: string;
  updated_at: string;
}

interface Product {
  id: number;
  name: string;
  retailPrice: number;
  wholesalePrice: number;
  purchasePrice: number;
  quantity: number;
  specification?: string;
}

interface Customer {
  id: number;
  name: string;
  email?: string;
  phone: string;
  address?: string;
}

const SalesPage = () => {
  const router = useRouter();
  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed
  );

  // API calls
  const { data: sales = [], isLoading, error, refetch } = useGetSalesQuery();
  const { data: products = [] } = useGetProductsQuery();
  const { data: customers = [] } = useGetCustomersQuery();

  const [createSale] = useCreateSaleMutation();
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
    customerPhone: "",
    customerAddress: "",
    paymentMethod: "cash" as "cash" | "card" | "bank_transfer",
    status: "pending" as "completed" | "pending" | "cancelled",
    items: [] as Array<{
      productId: number;
      quantity: number;
      price: number;
      total: number;
    }>,
    dueDate: new Date().toISOString().split("T")[0],
  });

  // Dropdown states
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Refs for dropdown closing
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const paymentDropdownRef = useRef<HTMLDivElement>(null);
  const productDropdownRef = useRef<HTMLDivElement>(null);
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
        productDropdownRef.current &&
        !productDropdownRef.current.contains(event.target as Node)
      ) {
        setShowProductDropdown(false);
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
      default:
        return "All Status";
    }
  };
  // Filter sales based on search and status
  const filteredSales = sales
    .filter(
      (sale) =>
        sale.Customers?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.id.toString().includes(searchTerm)
    )
    .filter((sale) => {
      if (statusFilter === "all") return true;
      if (statusFilter === "completed")
        return Number(sale.totalPaid) >= Number(sale.totalAmount);
      if (statusFilter === "pending")
        return Number(sale.totalPaid) < Number(sale.totalAmount);
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

  const handleAddSale = () => {
    setSaleForm({
      customer_id: 0,
      customerName: "",
      customerPhone: "",
      customerAddress: "",
      paymentMethod: "cash",
      status: "pending",
      items: [],
      dueDate: new Date().toISOString().split("T")[0],
    });
    setEditingSale(null);
    setShowSaleModal(true);
  };

  const handleEditSale = (sale: Sale) => {
    setSaleForm({
      customer_id: sale.customer_id,
      customerName: sale.Customers?.name || "",
      customerPhone: sale.Customers?.phone || "",
      customerAddress: sale.Customers?.address || "",
      paymentMethod: "cash", // You might want to add this field to your Sale model
      status:
        Number(sale.totalPaid) >= Number(sale.totalAmount)
          ? "completed"
          : "pending",
      items: sale.SalesItems.map((item) => ({
        productId: item.product_id,
        quantity: item.quantity,
        price: Number(item.unitPrice),
        total: item.quantity * Number(item.unitPrice),
      })),
      dueDate: sale.dueDate.split("T")[0],
    });
    setEditingSale(sale);
    setShowSaleModal(true);
  };

  const handleSaveSale = async () => {
    try {
      const totalAmount = saleForm.items.reduce(
        (sum, item) => sum + item.total,
        0
      );
      const totalPaid = saleForm.status === "completed" ? totalAmount : 0;

      const saleData = {
        customer_id: saleForm.customer_id,
        user_id: 1, // You'll need to get this from your auth context
        totalAmount,
        totalPaid,
        dueDate: saleForm.dueDate,
        items: saleForm.items.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
          unitPrice: item.price,
        })),
      };

      if (editingSale) {
        await updateSale({
          id: editingSale.id,
          sale: saleData,
        }).unwrap();
      } else {
        await createSale(saleData).unwrap();
      }

      setShowSaleModal(false);
      setEditingSale(null);
    } catch (error) {
      console.error("Failed to save sale:", error);
      alert(
        `Failed to ${editingSale ? "update" : "create"} sale. Please try again.`
      );
    }
  };

  const addProductToSale = (productId: number) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      const existingItemIndex = saleForm.items.findIndex(
        (item) => item.productId === productId
      );

      if (existingItemIndex >= 0) {
        // Update quantity if product already exists
        const updatedItems = [...saleForm.items];
        updatedItems[existingItemIndex].quantity += 1;
        updatedItems[existingItemIndex].total =
          updatedItems[existingItemIndex].quantity *
          updatedItems[existingItemIndex].price;
        setSaleForm({ ...saleForm, items: updatedItems });
      } else {
        // Add new product
        const newItem = {
          productId,
          quantity: 1,
          price: Number(product.retailPrice),
          total: Number(product.retailPrice),
        };
        setSaleForm({ ...saleForm, items: [...saleForm.items, newItem] });
      }
    }
    setShowProductDropdown(false);
  };

  const selectCustomer = (customer: Customer) => {
    setSaleForm({
      ...saleForm,
      customer_id: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerAddress: customer.address || "",
    });
    setShowCustomerDropdown(false);
  };

  const removeProductFromSale = (productId: number) => {
    setSaleForm({
      ...saleForm,
      items: saleForm.items.filter((item) => item.productId !== productId),
    });
  };

  const updateProductQuantity = (productId: number, quantity: number) => {
    if (quantity < 1) return;

    const updatedItems = saleForm.items.map((item) =>
      item.productId === productId
        ? { ...item, quantity, total: quantity * item.price }
        : item
    );
    setSaleForm({ ...saleForm, items: updatedItems });
  };

  const getStatusDisplayText = () => {
    switch (saleForm.status) {
      case "completed":
        return "Completed";
      case "pending":
        return "Pending";
      case "cancelled":
        return "Cancelled";
      default:
        return "Select Status";
    }
  };

  const getPaymentDisplayText = () => {
    switch (saleForm.paymentMethod) {
      case "cash":
        return "Cash";
      case "card":
        return "Card";
      case "bank_transfer":
        return "Bank Transfer";
      default:
        return "Select Payment Method";
    }
  };

  const getCustomerDisplayText = () => {
    return saleForm.customerName || "Select Customer";
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSales = filteredSales.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);

  const totalAmount = saleForm.items.reduce((sum, item) => sum + item.total, 0);

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
    <div
      className={`${getContentMargin()} p-6 min-h-full border rounded-xl shadow-2xl transition-all duration-300 mt-20`}
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
          <button
            onClick={handleAddSale}
            className="mt-4 md:mt-0 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Sale
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Total Sales</p>
              <p className="text-2xl font-bold">{sales.length}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Completed</p>
              <p className="text-2xl font-bold text-green-500">
                {
                  sales.filter(
                    (s) => Number(s.totalPaid) >= Number(s.totalAmount)
                  ).length
                }
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>

        <div className="rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Pending</p>
              <p className="text-2xl font-bold text-orange-500">
                {
                  sales.filter(
                    (s) => Number(s.totalPaid) < Number(s.totalAmount)
                  ).length
                }
              </p>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg">
              <User className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </div>

        <div className="rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-purple-500">
                ৳
                {sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0)}
              </p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="rounded-lg shadow-sm border mb-6">
        <div className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by customer name or sale ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="relative" ref={filterStatusDropdownRef}>
              <button
                onClick={() =>
                  setShowFilterStatusDropdown(!showFilterStatusDropdown)
                }
                className="flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <span>{getFilterStatusDisplayText()}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {showFilterStatusDropdown && (
                <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                  <li>
                    <button
                      onClick={() => {
                        setStatusFilter("all");
                        setShowFilterStatusDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100"
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
                      className="w-full text-left px-4 py-2 hover:bg-gray-100"
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
                      className="w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Pending
                    </button>
                  </li>
                </ul>
              )}
            </div>

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

      {/* Sales Table */}
      <div className="rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Sale ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentSales.map((sale) => {
                const isCompleted =
                  Number(sale.totalPaid) >= Number(sale.totalAmount);
                const status = isCompleted ? "completed" : "pending";

                return (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className="text-sm font-medium text-blue-600 cursor-pointer hover:underline"
                        onClick={() => router.push(`/sale/${sale.id}`)}
                      >
                        #{sale.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">{sale.Customers?.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        {new Date(sale.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">
                        ৳{Number(sale.totalAmount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          status === "completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/sale/${sale.id}`)}
                          className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditSale(sale)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSale(sale.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
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
                  : "Get started by creating your first sale"}
              </p>
              {!searchTerm && statusFilter === "all" && (
                <button
                  onClick={handleAddSale}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  New Sale
                </button>
              )}
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

      {/* Add/Edit Sale Modal */}
      {showSaleModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-lg border max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">
                  {editingSale ? "Edit Sale" : "New Sale"}
                </h2>
                <button
                  onClick={() => setShowSaleModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Customer & Payment Info */}
                <div className="space-y-4">
                  <div className="relative" ref={customerDropdownRef}>
                    <label className="block text-sm font-medium mb-1">
                      Customer *
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setShowCustomerDropdown(!showCustomerDropdown)
                      }
                      className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    >
                      <span>{getCustomerDisplayText()}</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {showCustomerDropdown && (
                      <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {customers.map((customer) => (
                          <li key={customer.id}>
                            <button
                              type="button"
                              onClick={() => selectCustomer(customer)}
                              className="w-full text-left px-3 py-2 hover:bg-gray-100 flex justify-between items-center"
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

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Customer Phone
                    </label>
                    <input
                      type="text"
                      value={saleForm.customerPhone}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Customer Address
                    </label>
                    <textarea
                      value={saleForm.customerAddress}
                      disabled
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={saleForm.dueDate}
                      onChange={(e) =>
                        setSaleForm({ ...saleForm, dueDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative" ref={paymentDropdownRef}>
                      <label className="block text-sm font-medium mb-1">
                        Payment Method
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setShowPaymentDropdown(!showPaymentDropdown)
                        }
                        className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      >
                        <span>{getPaymentDisplayText()}</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      {showPaymentDropdown && (
                        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
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
                              className="w-full text-left px-3 py-2 hover:bg-gray-100"
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
                              className="w-full text-left px-3 py-2 hover:bg-gray-100"
                            >
                              Card
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
                              className="w-full text-left px-3 py-2 hover:bg-gray-100"
                            >
                              Bank Transfer
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
                        className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      >
                        <span>{getStatusDisplayText()}</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      {showStatusDropdown && (
                        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                          <li>
                            <button
                              type="button"
                              onClick={() => {
                                setSaleForm({ ...saleForm, status: "pending" });
                                setShowStatusDropdown(false);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-gray-100"
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
                              className="w-full text-left px-3 py-2 hover:bg-gray-100"
                            >
                              Completed
                            </button>
                          </li>
                        </ul>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Products */}
                <div className="space-y-4">
                  <div className="relative" ref={productDropdownRef}>
                    <label className="block text-sm font-medium mb-1">
                      Add Products
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setShowProductDropdown(!showProductDropdown)
                      }
                      className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    >
                      <span>Select Product</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {showProductDropdown && (
                      <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {products.map((product) => (
                          <li key={product.id}>
                            <button
                              type="button"
                              onClick={() => addProductToSale(product.id)}
                              className="w-full text-left px-3 py-2 hover:bg-gray-100 flex justify-between items-center"
                            >
                              <div>
                                <div className="font-medium">
                                  {product.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Stock: {product.quantity}
                                </div>
                              </div>
                              <span className="text-sm text-gray-500">
                                ৳{Number(product.retailPrice)}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Selected Products */}
                  <div className="border rounded-lg">
                    <div className="p-3 border-b bg-gray-50">
                      <h3 className="font-medium">Selected Products</h3>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {saleForm.items.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          No products added
                        </div>
                      ) : (
                        saleForm.items.map((item) => {
                          const product = products.find(
                            (p) => p.id === item.productId
                          );
                          return (
                            <div
                              key={item.productId}
                              className="p-3 border-b flex items-center justify-between"
                            >
                              <div className="flex-1">
                                <div className="font-medium">
                                  {product?.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ৳{item.price.toFixed(2)} each
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    updateProductQuantity(
                                      item.productId,
                                      item.quantity - 1
                                    )
                                  }
                                  className="w-6 h-6 rounded border flex items-center justify-center hover:bg-gray-100"
                                >
                                  -
                                </button>
                                <span className="w-8 text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    updateProductQuantity(
                                      item.productId,
                                      item.quantity + 1
                                    )
                                  }
                                  className="w-6 h-6 rounded border flex items-center justify-center hover:bg-gray-100"
                                >
                                  +
                                </button>
                                <span className="w-20 text-right font-medium">
                                  ৳{item.total.toFixed(2)}
                                </span>
                                <button
                                  onClick={() =>
                                    removeProductFromSale(item.productId)
                                  }
                                  className="text-red-500 hover:text-red-700 p-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    {saleForm.items.length > 0 && (
                      <div className="p-3 border-t bg-gray-50">
                        <div className="flex justify-between items-center font-bold">
                          <span>Total Amount:</span>
                          <span>৳{totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowSaleModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSale}
                  disabled={
                    !saleForm.customer_id || saleForm.items.length === 0
                  }
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingSale ? "Update" : "Create"} Sale
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesPage;

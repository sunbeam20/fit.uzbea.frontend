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
} from "lucide-react";
import {
  useGetSaleQuery,
  useUpdateSaleMutation,
  useDeleteSaleMutation,
} from "@/state/api";

interface SaleItem {
  id: number;
  product_id: number;
  quantity: number;
  unitPrice: number;
  Products: {
    name: string;
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
  Customers?: {
    id: number;
    name: string;
    email?: string;
    phone: string;
    address?: string;
  };
  Users?: {
    id: number;
    name: string;
    email: string;
  };
  SalesItems: SaleItem[];
  created_at: string;
  updated_at: string;
}

const SingleSalePage = () => {
  const params = useParams();
  const router = useRouter();
  const saleId = parseInt(params.id as string);

  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed
  );

  // API calls
  const { 
    data: sale, 
    isLoading, 
    error, 
    refetch 
  } = useGetSaleQuery(saleId);
  const [updateSale] = useUpdateSaleMutation();
  const [deleteSale] = useDeleteSaleMutation();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    totalPaid: 0,
    status: "pending" as "pending" | "completed" | "cancelled",
  });

  // Dropdown states
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Refs for dropdown closing
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Initialize edit form when sale data is loaded
  useEffect(() => {
    if (sale) {
      setEditForm({
        customerName: sale.Customers?.name || "",
        customerPhone: sale.Customers?.phone || "",
        customerAddress: sale.Customers?.address || "",
        totalPaid: Number(sale.totalPaid),
        status: Number(sale.totalPaid) >= Number(sale.totalAmount) ? "completed" : "pending",
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
      // Check if sale data is available
      if (!sale) {
        console.error("Sale data not available");
        alert("Sale data not available. Please try again.");
        return;
      }

      // Calculate due amount based on total paid
      const dueAmount = Number(sale.totalAmount) - editForm.totalPaid;
      
      const updateData = {
        totalPaid: editForm.totalPaid,
        // You might need to update customer information separately
        // based on your API structure
      };

      await updateSale({
        id: saleId,
        sale: updateData
      }).unwrap();
      
      setShowEditModal(false);
      refetch(); // Refresh the data
      
    } catch (error) {
      console.error("Failed to update sale:", error);
      alert("Failed to update sale. Please try again.");
    }
  };

  const getStatusDisplayText = () => {
    switch (editForm.status) {
      case "completed": return "Completed";
      case "pending": return "Pending";
      case "cancelled": return "Cancelled";
      default: return "Select Status";
    }
  };

  const getSaleStatus = () => {
    if (!sale) return "pending";
    return Number(sale.totalPaid) >= Number(sale.totalAmount) ? "completed" : "pending";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className={`${getContentMargin()} p-6 min-h-screen bg-gray-50 flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading sale details...</p>
        </div>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className={`${getContentMargin()} p-6 min-h-screen bg-gray-50 flex items-center justify-center`}>
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

  const dueAmount = sale ? Number(sale.totalAmount) - Number(sale.totalPaid) : 0;
  const currentStatus = getSaleStatus();

  return (
    <div className={`${getContentMargin()} p-6 min-h-full border rounded-xl shadow-2xl transition-all duration-300 mt-20`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => router.push("/sale")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              Sale Details
            </h1>
            <p className="mt-1 text-gray-600">Sale ID: #{sale.id}</p>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentStatus)}`}>
              {currentStatus}
            </span>
            <span className="text-sm text-gray-600">
              {sale.created_at ? new Date(sale.created_at).toLocaleDateString() : 'N/A'}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <div className="rounded-lg shadow-sm border overflow-hidden">
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
                  <p className="text-lg font-semibold">{sale.Customers?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Phone Number
                  </label>
                  <p className="text-lg">{sale.Customers?.phone || 'N/A'}</p>
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

          {/* Items Table */}
          <div className="rounded-lg shadow-sm border overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Items Sold
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sale.SalesItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium">{item.Products.name}</div>
                          {item.Products.specification && (
                            <div className="text-sm text-gray-500">
                              {item.Products.specification}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm">{item.quantity}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm">৳{Number(item.unitPrice)}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium">
                            ৳{(item.quantity * Number(item.unitPrice)).toFixed(2)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Sale Summary */}
          <div className="rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Sale Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Amount</span>
                <span className="font-semibold">৳{Number(sale.totalAmount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Paid</span>
                <span className="font-semibold text-green-600">৳{Number(sale.totalPaid)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Due Amount</span>
                <span className={`font-semibold ${dueAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ৳{dueAmount}
                </span>
              </div>
              <div className="border-t pt-3 flex justify-between items-center">
                <span className="text-lg font-bold">Status</span>
                <span className={`text-lg font-bold ${
                  currentStatus === "completed" ? "text-green-600" : "text-yellow-600"
                }`}>
                  {currentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Payment Information
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Due Date</span>
                <span className="font-semibold">
                  {sale.dueDate ? new Date(sale.dueDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Sales Person</span>
                <span className="font-semibold">{sale.Users?.name || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={handlePrint}
                className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <div>
                  <div className="font-medium">Print Invoice</div>
                  <div className="text-sm text-gray-500">Generate printable invoice</div>
                </div>
              </button>
              <button className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" />
                <div>
                  <div className="font-medium">Download PDF</div>
                  <div className="text-sm text-gray-500">Download as PDF file</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Sale Modal */}
      {showEditModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-lg border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Edit Sale Payment</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      value={editForm.customerName}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Customer Phone
                    </label>
                    <input
                      type="text"
                      value={editForm.customerPhone}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Total Amount
                  </label>
                  <input
                    type="number"
                    value={sale ? Number(sale.totalAmount) : 0}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Amount Paid *
                  </label>
                  <input
                    type="number"
                    value={editForm.totalPaid}
                    onChange={(e) => {
                      const paid = parseFloat(e.target.value) || 0;
                      const maxAmount = sale ? Number(sale.totalAmount) : 0;
                      setEditForm({ 
                        ...editForm, 
                        totalPaid: Math.min(paid, maxAmount),
                        status: paid >= maxAmount ? "completed" : "pending"
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    max={sale ? Number(sale.totalAmount) : 0}
                    min="0"
                    step="0.01"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Maximum: ৳{sale ? Number(sale.totalAmount) : 0}
                  </p>
                </div>

                <div className="relative" ref={statusDropdownRef}>
                  <label className="block text-sm font-medium mb-1">
                    Status
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
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
                            setEditForm({ ...editForm, status: "pending" });
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
                            setEditForm({ ...editForm, status: "completed" });
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

                {/* Summary Preview */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium mb-3">Payment Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Amount:</span>
                      <span>৳{sale ? Number(sale.totalAmount) : 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Amount Paid:</span>
                      <span className="text-green-600">৳{editForm.totalPaid}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span>Remaining Due:</span>
                      <span className={`${(sale ? Number(sale.totalAmount) : 0) - editForm.totalPaid > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ৳{(sale ? Number(sale.totalAmount) : 0) - editForm.totalPaid}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Update Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-lg border max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-lg font-bold">Delete Sale</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete sale <strong>#{sale.id}</strong>? 
                This action cannot be undone and will remove all associated records.
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
  );
};

export default SingleSalePage;
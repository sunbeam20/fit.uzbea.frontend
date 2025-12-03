"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppSelector } from "@/app/redux";
import {
  ArrowLeftRight,
  ArrowLeft,
  Edit,
  Trash2,
  User,
  Calendar,
  FileText,
  DollarSign,
  Package,
  Printer,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  X,
} from "lucide-react";
import {
  useGetExchangeQuery,
  useDeleteExchangeMutation,
  useUpdateExchangeMutation,
} from "@/state/api";

interface ExchangeItem {
  id: number;
  old_product_id: number;
  old_product_name: string;
  new_product_id: number;
  new_product_name: string;
  quantity: number;
  unit_price: number;
  note: string;
}

interface Exchange {
  id: number;
  exchange_number: string;
  original_invoice: string;
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  date: string;
  total_paid: number;
  total_payback: number;
  net_amount: number;
  reason: string;
  status: string;
  items: ExchangeItem[];
  created_at: string;
  updated_at: string;
}

const SingleExchangePage = () => {
  const params = useParams();
  const router = useRouter();
  const exchangeId = parseInt(params.id as string);

  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed
  );

  // API calls
  const { 
    data: exchange, 
    isLoading, 
    error, 
    refetch 
  } = useGetExchangeQuery(exchangeId);
  const [deleteExchange] = useDeleteExchangeMutation();
  const [updateExchange] = useUpdateExchangeMutation();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);

  const getContentMargin = () => {
    return "ml-0";
  };

  const handleDelete = async () => {
    try {
      await deleteExchange(exchangeId).unwrap();
      router.push("/exchange");
    } catch (error) {
      console.error("Failed to delete exchange:", error);
      alert("Failed to delete exchange. Please try again.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEdit = () => {
    if (exchange) {
      setEditFormData({
        customer_name: exchange.customer_name,
        customer_phone: exchange.customer_phone || "",
        customer_address: exchange.customer_address || "",
        reason: exchange.reason,
        status: exchange.status,
        date: exchange.date.split('T')[0], // Format date for input
      });
      setShowEditModal(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!exchange || !editFormData) return;

    try {
      await updateExchange({
        id: exchangeId,
        ...editFormData
      }).unwrap();
      setShowEditModal(false);
      refetch(); // Refresh the data
    } catch (error) {
      console.error("Failed to update exchange:", error);
      alert("Failed to update exchange. Please try again.");
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
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
          <p className="mt-4 text-gray-600">Loading exchange details...</p>
        </div>
      </div>
    );
  }

  if (error || !exchange) {
    return (
      <div className={`${getContentMargin()} p-6 min-h-screen bg-gray-50 flex items-center justify-center`}>
        <div className="text-center">
          <ArrowLeftRight className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Exchange Not Found
          </h3>
          <p className="text-red-600 mb-4">
            The exchange you're looking for doesn't exist or has been removed.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push("/exchange")}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Back to Exchanges
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

  return (
    <div className={`${getContentMargin()} p-6 min-h-full border rounded-xl shadow-2xl transition-all duration-300 mt-20`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => router.push("/exchange")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ArrowLeftRight className="w-6 h-6" />
              Exchange Details
            </h1>
            <p className="mt-1 text-gray-600">Exchange: {exchange.exchange_number}</p>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(exchange.status)}`}>
              {exchange.status}
            </span>
            <span className="text-sm text-gray-600">
              {new Date(exchange.date).toLocaleDateString()}
            </span>
            <span className={`text-sm font-medium ${
              exchange.net_amount >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              Net: ৳{Math.abs(exchange.net_amount)} {exchange.net_amount >= 0 ? '(Due)' : '(Refund)'}
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
                  <p className="text-lg font-semibold">{exchange.customer_name}</p>
                </div>
                {exchange.customer_phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Phone Number
                    </label>
                    <p className="text-lg">{exchange.customer_phone}</p>
                  </div>
                )}
                {exchange.customer_address && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Address
                    </label>
                    <p className="text-lg">{exchange.customer_address}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Exchange Items */}
          <div className="rounded-lg shadow-sm border overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Exchange Items
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Returned Product
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        New Product
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {exchange.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-red-600">
                            {item.old_product_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {item.old_product_id}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-green-600">
                            {item.new_product_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {item.new_product_id}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm">{item.quantity}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm">৳{item.unit_price}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm max-w-xs">{item.note || 'No notes'}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Exchange Details */}
          <div className="rounded-lg shadow-sm border overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Exchange Details
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Exchange Number
                    </label>
                    <p className="text-lg font-semibold">{exchange.exchange_number}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Original Invoice
                    </label>
                    <p className="text-lg font-semibold text-blue-600">{exchange.original_invoice}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Exchange Reason
                  </label>
                  <p className="text-lg">{exchange.reason}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Financial Summary */}
          <div className="rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Financial Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  Total Paid
                </span>
                <span className="font-semibold text-green-600">৳{exchange.total_paid}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  Total Payback
                </span>
                <span className="font-semibold text-red-600">৳{exchange.total_payback}</span>
              </div>
              <div className="border-t pt-3 flex justify-between items-center">
                <span className="text-lg font-bold">Net Amount</span>
                <span className={`text-lg font-bold ${
                  exchange.net_amount >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ৳{Math.abs(exchange.net_amount)} {exchange.net_amount >= 0 ? '(Due)' : '(Refund)'}
                </span>
              </div>
            </div>
          </div>

          {/* Exchange Information */}
          <div className="rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5" />
              Exchange Information
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status</span>
                <span className={`font-semibold ${
                  exchange.status === "completed" ? "text-green-600" :
                  exchange.status === "pending" ? "text-yellow-600" : "text-red-600"
                }`}>
                  {exchange.status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Exchange Date</span>
                <span className="font-semibold">
                  {new Date(exchange.date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Items Exchanged</span>
                <span className="font-semibold">{exchange.items.length}</span>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Additional Information
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Created</span>
                <span className="text-sm">
                  {new Date(exchange.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Last Updated</span>
                <span className="text-sm">
                  {new Date(exchange.updated_at).toLocaleDateString()}
                </span>
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
                  <div className="font-medium">Print Exchange Slip</div>
                  <div className="text-sm text-gray-500">Generate printable exchange slip</div>
                </div>
              </button>
              <button className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" />
                <div>
                  <div className="font-medium">Download PDF</div>
                  <div className="text-sm text-gray-500">Download as PDF file</div>
                </div>
              </button>
              <button
                onClick={() => router.push("/exchange/new")}
                className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <ArrowLeftRight className="w-4 h-4" />
                <div>
                  <div className="font-medium">New Exchange</div>
                  <div className="text-sm text-gray-500">Process new exchange</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-lg border max-w-md w-full bg-white">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-lg font-bold">Delete Exchange</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete exchange <strong>{exchange.exchange_number}</strong>? 
                This action cannot be undone and will affect your inventory and financial records.
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
                  Delete Exchange
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Exchange Modal */}
      {showEditModal && editFormData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Edit Exchange - {exchange.exchange_number}
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      value={editFormData.customer_name}
                      onChange={(e) => handleInputChange('customer_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={editFormData.customer_phone}
                      onChange={(e) => handleInputChange('customer_phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    value={editFormData.customer_address}
                    onChange={(e) => handleInputChange('customer_address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Exchange Date *
                    </label>
                    <input
                      type="date"
                      value={editFormData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status *
                    </label>
                    <select
                      value={editFormData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exchange Reason
                  </label>
                  <textarea
                    value={editFormData.reason}
                    onChange={(e) => handleInputChange('reason', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    rows={3}
                    placeholder="Enter the reason for this exchange..."
                  />
                </div>

                {/* Display read-only exchange items */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Exchange Items</h3>
                  <div className="space-y-2">
                    {exchange.items.map((item, index) => (
                      <div key={item.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <p className="font-medium text-red-600">{item.old_product_name}</p>
                              <p className="text-sm text-gray-600">Returned Product</p>
                            </div>
                            <div className="text-gray-400">→</div>
                            <div className="flex-1">
                              <p className="font-medium text-green-600">{item.new_product_name}</p>
                              <p className="text-sm text-gray-600">New Product</p>
                            </div>
                          </div>
                          <div className="flex gap-4 mt-2 text-sm text-gray-600">
                            <span>Qty: {item.quantity}</span>
                            <span>Price: ৳{item.unit_price}</span>
                            {item.note && <span>Note: {item.note}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Update Exchange
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SingleExchangePage;
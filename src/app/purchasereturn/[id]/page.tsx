"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppSelector } from "@/app/redux";
import {
  Redo2,
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
  CreditCard,
  Coins,
  RefreshCw,
  Truck,
  X,
} from "lucide-react";
import {
  useGetPurchaseReturnQuery,
  useUpdatePurchaseReturnMutation,
  useDeletePurchaseReturnMutation,
} from "@/state/api";

interface PurchaseReturnItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  return_reason: string;
}

interface PurchaseReturn {
  id: number;
  return_number: string;
  original_invoice: string;
  supplier_name: string;
  supplier_phone?: string;
  supplier_address?: string;
  date: string;
  total_amount: number;
  reason: string;
  status: "completed" | "pending" | "rejected";
  refund_method: string;
  items: PurchaseReturnItem[];
  created_at: string;
  updated_at: string;
}

const SinglePurchaseReturnPage = () => {
  const params = useParams();
  const router = useRouter();
  const purchaseReturnId = parseInt(params.id as string);

  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed
  );

  // API calls
  const { 
    data: purchaseReturn, 
    isLoading, 
    error, 
    refetch 
  } = useGetPurchaseReturnQuery(purchaseReturnId);
  const [updatePurchaseReturn] = useUpdatePurchaseReturnMutation();
  const [deletePurchaseReturn] = useDeletePurchaseReturnMutation();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const getContentMargin = () => {
    return "ml-0";
  };

  const handleDelete = async () => {
    try {
      await deletePurchaseReturn(purchaseReturnId).unwrap();
      router.push("/purchasereturn");
    } catch (error) {
      console.error("Failed to delete purchase return:", error);
      alert("Failed to delete purchase return. Please try again.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
  };

  const handleSaveEdit = async (formData: any) => {
    try {
      await updatePurchaseReturn({
        id: purchaseReturnId,
        ...formData
      }).unwrap();
      
      refetch();
      handleCloseEditModal();
      alert('Purchase return updated successfully!');
    } catch (error) {
      console.error("Failed to update purchase return:", error);
      alert("Failed to update purchase return. Please try again.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRefundMethodIcon = (method: string) => {
    switch (method) {
      case "Cash": return <Coins className="w-5 h-5" />;
      case "Credit Card": return <CreditCard className="w-5 h-5" />;
      case "Bank Transfer": return <DollarSign className="w-5 h-5" />;
      case "Credit Note": return <FileText className="w-5 h-5" />;
      default: return <DollarSign className="w-5 h-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className={`${getContentMargin()} p-6 min-h-screen bg-gray-50 flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading purchase return details...</p>
        </div>
      </div>
    );
  }

  if (error || !purchaseReturn) {
    return (
      <div className={`${getContentMargin()} p-6 min-h-screen bg-gray-50 flex items-center justify-center`}>
        <div className="text-center">
          <Redo2 className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Purchase Return Not Found
          </h3>
          <p className="text-red-600 mb-4">
            The purchase return you're looking for doesn't exist or has been removed.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push("/purchasereturn")}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Back to Purchase Returns
            </button>
            <button
              onClick={refetch}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`${getContentMargin()} p-6 min-h-full border rounded-xl shadow-2xl transition-all duration-300 mt-20`}>
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.push("/purchasereturn")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Redo2 className="w-6 h-6" />
                Purchase Return Details
              </h1>
              <p className="mt-1 text-gray-600">Return: {purchaseReturn.return_number}</p>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(purchaseReturn.status)}`}>
                {purchaseReturn.status}
              </span>
              <span className="text-sm text-gray-600">
                {new Date(purchaseReturn.date).toLocaleDateString()}
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
            {/* Supplier Information */}
            <div className="rounded-lg shadow-sm border overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Supplier Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Supplier Name
                    </label>
                    <p className="text-lg font-semibold">{purchaseReturn.supplier_name}</p>
                  </div>
                  {purchaseReturn.supplier_phone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Phone Number
                      </label>
                      <p className="text-lg">{purchaseReturn.supplier_phone}</p>
                    </div>
                  )}
                  {purchaseReturn.supplier_address && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Address
                      </label>
                      <p className="text-lg">{purchaseReturn.supplier_address}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Return Items */}
            <div className="rounded-lg shadow-sm border overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Returned Items
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
                          Price
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          Reason
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {purchaseReturn.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium">{item.product_name}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm">{item.quantity}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm">৳{item.price}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium">৳{item.quantity * item.price}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm max-w-xs">{item.return_reason}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Return Details */}
            <div className="rounded-lg shadow-sm border overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Return Details
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Return Number
                      </label>
                      <p className="text-lg font-semibold">{purchaseReturn.return_number}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Original Invoice
                      </label>
                      <p className="text-lg font-semibold text-blue-600">{purchaseReturn.original_invoice}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Return Reason
                    </label>
                    <p className="text-lg">{purchaseReturn.reason}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Refund Summary */}
            <div className="rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Refund Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Refund Amount</span>
                  <span className="text-2xl font-bold text-green-600">৳{purchaseReturn.total_amount}</span>
                </div>
              </div>
            </div>

            {/* Refund Information */}
            <div className="rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Refund Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Refund Method</span>
                  <span className="font-semibold flex items-center gap-2">
                    {getRefundMethodIcon(purchaseReturn.refund_method)}
                    {purchaseReturn.refund_method}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status</span>
                  <span className={`font-semibold ${
                    purchaseReturn.status === "completed" ? "text-green-600" :
                    purchaseReturn.status === "pending" ? "text-yellow-600" : "text-red-600"
                  }`}>
                    {purchaseReturn.status}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Return Date</span>
                  <span className="font-semibold">
                    {new Date(purchaseReturn.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Shipping Information */}
            <div className="rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Shipping Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Return Status</span>
                  <span className={`font-semibold ${
                    purchaseReturn.status === "completed" ? "text-green-600" : "text-yellow-600"
                  }`}>
                    {purchaseReturn.status === "completed" ? "Returned" : "In Process"}
                  </span>
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
                    {new Date(purchaseReturn.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Last Updated</span>
                  <span className="text-sm">
                    {new Date(purchaseReturn.updated_at).toLocaleDateString()}
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
                    <div className="font-medium">Print Return Slip</div>
                    <div className="text-sm text-gray-500">Generate printable return slip</div>
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
                  onClick={() => router.push("/purchasereturn")}
                  className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <Redo2 className="w-4 h-4" />
                  <div>
                    <div className="font-medium">All Returns</div>
                    <div className="text-sm text-gray-500">View all purchase returns</div>
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
                  <h3 className="text-lg font-bold">Delete Purchase Return</h3>
                </div>
                
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete purchase return <strong>{purchaseReturn.return_number}</strong>? 
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
                    Delete Return
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Purchase Return Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Edit Purchase Return
              </h2>
              <button
                onClick={handleCloseEditModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const data = Object.fromEntries(formData.entries());
                  handleSaveEdit(data);
                }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Return Number
                    </label>
                    <input
                      type="text"
                      name="return_number"
                      defaultValue={purchaseReturn.return_number}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Original Invoice
                    </label>
                    <input
                      type="text"
                      name="original_invoice"
                      defaultValue={purchaseReturn.original_invoice}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Supplier Name
                    </label>
                    <input
                      type="text"
                      name="supplier_name"
                      defaultValue={purchaseReturn.supplier_name}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Supplier Phone
                    </label>
                    <input
                      type="tel"
                      name="supplier_phone"
                      defaultValue={purchaseReturn.supplier_phone}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      name="date"
                      defaultValue={purchaseReturn.date}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      name="status"
                      defaultValue={purchaseReturn.status}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Refund Method
                    </label>
                    <select
                      name="refund_method"
                      defaultValue={purchaseReturn.refund_method}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Credit Note">Credit Note</option>
                      <option value="Supplier Credit">Supplier Credit</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Amount
                    </label>
                    <input
                      type="number"
                      name="total_amount"
                      step="0.01"
                      defaultValue={purchaseReturn.total_amount}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason
                  </label>
                  <textarea
                    name="reason"
                    defaultValue={purchaseReturn.reason}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier Address
                  </label>
                  <textarea
                    name="supplier_address"
                    defaultValue={purchaseReturn.supplier_address}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Items Section */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Return Items</h3>
                  <div className="space-y-4">
                    {purchaseReturn.items.map((item, index) => (
                      <div key={item.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Product
                          </label>
                          <input
                            type="text"
                            name={`items[${index}].product_name`}
                            defaultValue={item.product_name}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                            placeholder="Product name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quantity
                          </label>
                          <input
                            type="number"
                            name={`items[${index}].quantity`}
                            defaultValue={item.quantity}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                            placeholder="Quantity"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Price
                          </label>
                          <input
                            type="number"
                            name={`items[${index}].price`}
                            step="0.01"
                            defaultValue={item.price}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                            placeholder="Price"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reason
                          </label>
                          <input
                            type="text"
                            name={`items[${index}].return_reason`}
                            defaultValue={item.return_reason}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                            placeholder="Return reason"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={handleCloseEditModal}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                  >
                    Update Return
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SinglePurchaseReturnPage;
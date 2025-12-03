"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppSelector } from "@/app/redux";
import {
  ArrowLeft,
  Edit,
  Trash2,
  PackagePlus,
  User,
  Calendar,
  FileText,
  DollarSign,
  Package,
  Printer,
  Download,
  Truck,
  X,
  RefreshCw,
} from "lucide-react";
import {
  useGetPurchaseQuery,
  useUpdatePurchaseMutation,
  useDeletePurchaseMutation,
} from "@/state/api";

// Use the types from your API
type Purchase = import('@/state/api').Purchase;
type PurchaseItem = import('@/state/api').PurchaseItem;

const SinglePurchasePage = () => {
  const params = useParams();
  const router = useRouter();
  const purchaseId = parseInt(params.id as string);

  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed
  );

  // API calls
  const { 
    data: purchaseResponse, 
    isLoading, 
    error, 
    refetch,
    isError 
  } = useGetPurchaseQuery(purchaseId);
  
  const [updatePurchase] = useUpdatePurchaseMutation();
  const [deletePurchase] = useDeletePurchaseMutation();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Safely extract purchase data from response
  const purchase = (purchaseResponse as any)?.data || purchaseResponse;

  // Debug logging
  useEffect(() => {
    console.log('Purchase ID:', purchaseId);
    console.log('Purchase response:', purchaseResponse);
    console.log('Purchase data:', purchase);
    console.log('Error:', error);
    console.log('Loading:', isLoading);
  }, [purchaseId, purchaseResponse, purchase, error, isLoading]);

  const getContentMargin = () => {
    return "ml-0";
  };

  // Helper function to safely parse dates
  const safeDateParse = (dateString: string | null | undefined): Date => {
    if (!dateString) return new Date();
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? new Date() : date;
  };

  // Helper function to format date for display
  const formatDateForDisplay = (dateString: string | null | undefined): string => {
    const date = safeDateParse(dateString);
    return date.toLocaleDateString();
  };

  // Helper function to format date for form input
  const formatDateForInput = (dateString: string | null | undefined): string => {
    const date = safeDateParse(dateString);
    return date.toISOString().split('T')[0];
  };

  // Helper function to get display data
  const getPurchaseDisplayData = (purchase: Purchase) => {
    const totalAmount = Number(purchase.totalAmount) || 0;
    const totalPaid = Number(purchase.totalPaid) || 0;
    const balanceDue = totalAmount - totalPaid;
    
    return {
      id: purchase.id,
      invoice_number: `PUR-${purchase.id.toString().padStart(3, '0')}`,
      supplier_name: purchase.Suppliers?.name || 'Unknown Supplier',
      supplier_phone: purchase.Suppliers?.phone || 'N/A',
      supplier_address: purchase.Suppliers?.address || 'N/A',
      date: formatDateForDisplay(purchase.created_at),
      total_amount: totalAmount,
      total_paid: totalPaid,
      balance_due: balanceDue,
      due_date: formatDateForDisplay(purchase.dueDate),
      status: "received" as const,
      payment_status: totalPaid >= totalAmount ? "paid" : balanceDue > 0 ? "pending" : "overdue",
      items: (purchase.PurchasesItems || []).map(item => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.Products?.name || 'Unknown Product',
        quantity: item.quantity,
        price: Number(item.unitPrice) || 0,
        total: item.quantity * (Number(item.unitPrice) || 0)
      })),
      notes: purchase.note || 'No notes',
      created_at: purchase.created_at,
      updated_at: purchase.updated_at
    };
  };

  const handleDelete = async () => {
    try {
      await deletePurchase(purchaseId).unwrap();
      router.push("/purchase");
    } catch (error) {
      console.error("Failed to delete purchase:", error);
      alert("Failed to delete purchase. Please try again.");
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
      const purchaseData = {
        totalAmount: parseFloat(formData.total_amount),
        totalPaid: parseFloat(formData.total_paid || 0),
        dueDate: formData.due_date || new Date().toISOString(),
        note: formData.notes || '',
        supplier_id: parseInt(formData.supplier_id),
      };

      await updatePurchase({
        id: purchaseId,
        data: purchaseData
      }).unwrap();

      refetch();
      handleCloseEditModal();
      alert('Purchase updated successfully!');
    } catch (error) {
      console.error('Failed to update purchase:', error);
      alert('Failed to update purchase. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className={`${getContentMargin()} p-6 min-h-screen bg-gray-50 flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading purchase details...</p>
        </div>
      </div>
    );
  }

  if (isError || !purchase) {
    return (
      <div className={`${getContentMargin()} p-6 min-h-screen bg-gray-50 flex items-center justify-center`}>
        <div className="text-center">
          <PackagePlus className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">
            {isError ? 'Error Loading Purchase' : 'Purchase Not Found'}
          </h3>
          <p className="text-red-600 mb-4">
            {isError 
              ? 'Failed to load purchase details. Please try again.'
              : 'The purchase you\'re looking for doesn\'t exist or has been removed.'
            }
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push("/purchase")}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Back to Purchases
            </button>
            {isError && (
              <button
                onClick={refetch}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const displayData = getPurchaseDisplayData(purchase);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "received":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <>
      <div className={`${getContentMargin()} p-6 min-h-full border rounded-xl shadow-2xl transition-all duration-300 mt-20`}>
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.push("/purchase")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <PackagePlus className="w-6 h-6" />
                Purchase Details
              </h1>
              <p className="mt-1 text-gray-600">Invoice: {displayData.invoice_number}</p>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(displayData.status)}`}>
                {displayData.status}
              </span>
              <span className="text-sm text-gray-600">
                {displayData.date}
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
                    <p className="text-lg font-semibold">{displayData.supplier_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Phone Number
                    </label>
                    <p className="text-lg">{displayData.supplier_phone}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Address
                    </label>
                    <p className="text-lg">{displayData.supplier_address}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="rounded-lg shadow-sm border overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Purchased Items
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
                      {displayData.items.map((item) => (
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
                            <div className="text-sm font-medium">৳{item.total}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-right font-semibold">
                          Total:
                        </td>
                        <td className="px-4 py-3 font-bold">
                          ৳{displayData.total_amount}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Purchase Summary */}
            <div className="rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Purchase Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Amount</span>
                  <span className="font-semibold">৳{displayData.total_amount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Paid</span>
                  <span className="font-semibold text-green-600">৳{displayData.total_paid}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Balance Due</span>
                  <span className={`font-semibold ${
                    displayData.balance_due > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    ৳{displayData.balance_due}
                  </span>
                </div>
                <div className="border-t pt-3 flex justify-between items-center">
                  <span className="text-lg font-bold">Payment Status</span>
                  <span className={`text-lg font-bold ${
                    displayData.payment_status === "paid" ? "text-green-600" :
                    displayData.payment_status === "pending" ? "text-yellow-600" : "text-red-600"
                  }`}>
                    {displayData.payment_status.toUpperCase()}
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
                  <span className="font-semibold">{displayData.due_date}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Payment Status</span>
                  <span className={`font-semibold ${getPaymentStatusColor(displayData.payment_status).replace('bg-', 'text-')}`}>
                    {displayData.payment_status}
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
                    {formatDateForDisplay(purchase.created_at)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Last Updated</span>
                  <span className="text-sm">
                    {formatDateForDisplay(purchase.updated_at)}
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-gray-600">Notes</span>
                  <span className="text-sm text-right max-w-xs">
                    {displayData.notes}
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
                <button
                  onClick={() => router.push("/purchase")}
                  className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <PackagePlus className="w-4 h-4" />
                  <div>
                    <div className="font-medium">All Purchases</div>
                    <div className="text-sm text-gray-500">View all purchases</div>
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
                  <h3 className="text-lg font-bold">Delete Purchase</h3>
                </div>
                
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete purchase <strong>{displayData.invoice_number}</strong>? 
                  This action cannot be undone and will affect your inventory.
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
                    Delete Purchase
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Purchase Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="rounded-lg border shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Edit Purchase
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
                      Invoice Number
                    </label>
                    <input
                      type="text"
                      value={displayData.invoice_number}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Supplier ID
                    </label>
                    <input
                      type="number"
                      name="supplier_id"
                      defaultValue={purchase.supplier_id}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      name="due_date"
                      defaultValue={formatDateForInput(purchase.dueDate)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Amount
                    </label>
                    <input
                      type="number"
                      name="total_amount"
                      step="0.01"
                      defaultValue={Number(purchase.totalAmount)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Paid
                    </label>
                    <input
                      type="number"
                      name="total_paid"
                      step="0.01"
                      defaultValue={Number(purchase.totalPaid)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    defaultValue={purchase.note || ''}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Items Display (Read-only) */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Purchase Items</h3>
                  <div className="space-y-4">
                    {displayData.items.map((item) => (
                      <div key={item.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-gray-50">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Product
                          </label>
                          <input
                            type="text"
                            value={item.product_name}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quantity
                          </label>
                          <input
                            type="number"
                            value={item.quantity}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Price
                          </label>
                          <input
                            type="number"
                            value={item.price}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Total
                          </label>
                          <input
                            type="number"
                            value={item.total}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                            readOnly
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
                    Update Purchase
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

export default SinglePurchasePage;
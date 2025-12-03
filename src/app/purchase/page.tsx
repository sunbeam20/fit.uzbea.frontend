"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/app/redux";
import {
  PackagePlus,
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
  Package,
  X,
} from "lucide-react";
import {
  useGetPurchasesQuery,
  useCreatePurchaseMutation,
  useUpdatePurchaseMutation,
  useDeletePurchaseMutation,
} from "@/state/api";

// Use the types from your API instead of redefining them locally
type Purchase = import("@/state/api").Purchase;
type PurchaseItem = import("@/state/api").PurchaseItem;

// Helper interface for display data
interface PurchaseDisplayData {
  id: number;
  invoice_number: string;
  supplier_name: string;
  supplier_phone?: string;
  supplier_address?: string;
  date: string;
  total_amount: number;
  status: "received" | "pending" | "cancelled";
  payment_status: "paid" | "pending" | "overdue";
  items: Array<{
    id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  notes?: string;
  created_at: string;
  updated_at: string;
}

const PurchasesPage = () => {
  const router = useRouter();
  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed
  );

  // API calls
  const {
    data: apiResponse,
    isLoading,
    error,
    refetch,
  } = useGetPurchasesQuery();

  const [createPurchase] = useCreatePurchaseMutation();
  const [updatePurchase] = useUpdatePurchaseMutation();
  const [deletePurchase] = useDeletePurchaseMutation();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [showStatusFilter, setShowStatusFilter] = useState(false);

  const itemsPerPage = 10;

  // Safely get purchases array from API response
  const purchases =
    (apiResponse as any)?.data ||
    (Array.isArray(apiResponse) ? apiResponse : []);

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
  const formatDateForDisplay = (
    dateString: string | null | undefined
  ): string => {
    const date = safeDateParse(dateString);
    return date.toISOString().split("T")[0];
  };

  // Helper function to format date for form input
  const formatDateForInput = (
    dateString: string | null | undefined
  ): string => {
    const date = safeDateParse(dateString);
    return date.toLocaleDateString("en-CA"); // YYYY-MM-DD format
  };

  const getFilterDisplayText = () => {
    switch (statusFilter) {
      case "all":
        return "All Status";
      case "received":
        return "Received";
      case "pending":
        return "Pending";
      case "cancelled":
        return "Cancelled";
      default:
        return "All Status";
    }
  };

  // Helper function to get display values
  const getPurchaseDisplayData = (purchase: Purchase): PurchaseDisplayData => {
    return {
      id: purchase.id,
      invoice_number: `PUR-${purchase.id.toString().padStart(3, "0")}`,
      supplier_name: purchase.Suppliers?.name || "Unknown Supplier",
      supplier_phone: purchase.Suppliers?.phone || undefined,
      supplier_address: purchase.Suppliers?.address || undefined,
      date: formatDateForDisplay(purchase.created_at),
      total_amount: Number(purchase.totalAmount),
      status: "received", // Default status since it's not in your schema
      payment_status:
        Number(purchase.totalPaid) >= Number(purchase.totalAmount)
          ? "paid"
          : "pending",
      items: (purchase.PurchasesItems || []).map((item) => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.Products?.name || "Unknown Product",
        quantity: item.quantity,
        price: Number(item.unitPrice),
        total: item.quantity * Number(item.unitPrice),
      })),
      notes: purchase.note || undefined,
      created_at: purchase.created_at,
      updated_at: purchase.updated_at,
    };
  };

  // Safely filter purchases
  const filteredPurchases = Array.isArray(purchases)
    ? purchases
        .filter((purchase) => {
          const displayData = getPurchaseDisplayData(purchase);
          return (
            displayData.invoice_number
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            displayData.supplier_name
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
          );
        })
        .filter((purchase) => {
          const displayData = getPurchaseDisplayData(purchase);
          return statusFilter === "all" || displayData.status === statusFilter;
        })
    : [];

  const handleDeletePurchase = async (id: number) => {
    if (confirm("Are you sure you want to delete this purchase?")) {
      try {
        await deletePurchase(id).unwrap();
        alert("Purchase deleted successfully!");
      } catch (error) {
        console.error("Failed to delete purchase:", error);
        alert("Failed to delete purchase. Please try again.");
      }
    }
  };

  const handleNewPurchase = () => {
    setEditingPurchase(null);
    setIsModalOpen(true);
  };

  const handleEditPurchase = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPurchase(null);
  };

  const handleSavePurchase = async (formData: any) => {
    try {
      const purchaseData = {
        totalAmount: parseFloat(formData.total_amount),
        totalPaid: parseFloat(formData.total_paid || 0),
        dueDate: formData.due_date || new Date().toISOString(),
        note: formData.notes || "",
        supplier_id: parseInt(formData.supplier_id),
        user_id: 1, // You'll need to get this from auth context
        items: [
          {
            product_id: parseInt(formData.product_id),
            quantity: parseInt(formData.quantity),
            unitPrice: parseFloat(formData.price),
          },
        ],
      };

      if (editingPurchase) {
        await updatePurchase({
          id: editingPurchase.id,
          data: purchaseData,
        }).unwrap();
        alert("Purchase updated successfully!");
      } else {
        await createPurchase(purchaseData).unwrap();
        alert("Purchase created successfully!");
      }
      refetch();
      handleCloseModal();
    } catch (error) {
      console.error("Failed to save purchase:", error);
      alert("Failed to save purchase. Please try again.");
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPurchases = filteredPurchases.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage);

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

  if (isLoading) {
    return (
      <div
        className={`${getContentMargin()} p-6 min-h-screen bg-gray-50 flex items-center justify-center`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading purchases...</p>
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
          <PackagePlus className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Error Loading Purchases
          </h3>
          <p className="text-red-600 mb-4">
            Failed to load purchases. Please try again.
          </p>
          <button
            onClick={refetch}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={`${getContentMargin()} p-6 min-h-full border rounded-xl shadow-2xl transition-all duration-300 mt-20`}
      >
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <PackagePlus className="w-6 h-6" />
                Purchases
              </h1>
              <p className="mt-1">Manage your purchase transactions</p>
            </div>
            <button
              onClick={handleNewPurchase}
              className="mt-4 md:mt-0 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Purchase
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="rounded-lg p-4 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Total Purchases</p>
                <p className="text-2xl font-bold">{purchases.length}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <PackagePlus className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="rounded-lg p-4 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Received</p>
                <p className="text-2xl font-bold text-green-500">
                  {
                    purchases.filter(
                      (p: Purchase) =>
                        getPurchaseDisplayData(p).status === "received"
                    ).length
                  }
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </div>

          <div className="rounded-lg p-4 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Pending</p>
                <p className="text-2xl font-bold text-orange-500">
                  {
                    purchases.filter(
                      (p: Purchase) =>
                        getPurchaseDisplayData(p).status === "pending"
                    ).length
                  }
                </p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </div>

          <div className="rounded-lg p-4 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Total Cost</p>
                <p className="text-2xl font-bold text-purple-500">
                  ৳
                  {purchases.reduce(
                    (sum: number, purchase: { totalAmount: any }) =>
                      sum + Number(purchase.totalAmount),
                    0
                  )}
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
                    placeholder="Search by invoice or supplier..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowStatusFilter(!showStatusFilter)}
                  className="flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <span>{getFilterDisplayText()}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showStatusFilter && (
                  <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter("all");
                          setShowStatusFilter(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100"
                      >
                        All Status
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter("received");
                          setShowStatusFilter(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100"
                      >
                        Received
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter("pending");
                          setShowStatusFilter(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100"
                      >
                        Pending
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter("cancelled");
                          setShowStatusFilter(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100"
                      >
                        Cancelled
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

        {/* Purchases Table */}
        <div className="rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Supplier
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
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentPurchases.map((purchase) => {
                  const displayData = getPurchaseDisplayData(purchase);
                  return (
                    <tr key={purchase.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className="text-sm font-medium text-blue-600 cursor-pointer hover:underline"
                          onClick={() =>
                            router.push(`/purchase/${purchase.id}`)
                          }
                        >
                          {displayData.invoice_number}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          {displayData.supplier_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          {new Date(displayData.date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">
                          ৳{displayData.total_amount}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            displayData.status
                          )}`}
                        >
                          {displayData.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(
                            displayData.payment_status
                          )}`}
                        >
                          {displayData.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              router.push(`/purchase/${purchase.id}`)
                            }
                            className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditPurchase(purchase)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePurchase(purchase.id)}
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

            {currentPurchases.length === 0 && (
              <div className="text-center py-12">
                <PackagePlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No purchases found
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "Get started by creating your first purchase"}
                </p>
                {!searchTerm && statusFilter === "all" && (
                  <button
                    onClick={handleNewPurchase}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    New Purchase
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
                  {Math.min(indexOfLastItem, filteredPurchases.length)} of{" "}
                  {filteredPurchases.length} results
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
      </div>

      {/* Purchase Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="rounded-lg border shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <PackagePlus className="w-5 h-5" />
                {editingPurchase ? "Edit Purchase" : "New Purchase"}
              </h2>
              <button
                onClick={handleCloseModal}
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
                  handleSavePurchase(data);
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
                      name="invoice_number"
                      defaultValue={
                        editingPurchase
                          ? `PUR-${editingPurchase.id
                              .toString()
                              .padStart(3, "0")}`
                          : `PUR-${Date.now()}`
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
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
                      defaultValue={editingPurchase?.supplier_id}
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
                      defaultValue={
                        editingPurchase?.dueDate
                          ? formatDateForInput(editingPurchase.dueDate)
                          : formatDateForInput(new Date().toISOString())
                      }
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
                      defaultValue={
                        editingPurchase
                          ? Number(editingPurchase.totalAmount)
                          : ""
                      }
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
                      defaultValue={
                        editingPurchase ? Number(editingPurchase.totalPaid) : 0
                      }
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
                    defaultValue={editingPurchase?.note || ""}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Items Section */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Purchase Items</h3>
                  <div className="space-y-4">
                    {editingPurchase?.PurchasesItems?.map((item, index) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg"
                      >
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Product ID
                          </label>
                          <input
                            type="number"
                            name="product_id"
                            defaultValue={item.product_id}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quantity
                          </label>
                          <input
                            type="number"
                            name="quantity"
                            defaultValue={item.quantity}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Price
                          </label>
                          <input
                            type="number"
                            name="price"
                            step="0.01"
                            defaultValue={Number(item.unitPrice)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                            required
                          />
                        </div>
                      </div>
                    ))}
                    {!editingPurchase && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Product ID
                          </label>
                          <input
                            type="number"
                            name="product_id"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                            placeholder="Product ID"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quantity
                          </label>
                          <input
                            type="number"
                            name="quantity"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                            placeholder="Quantity"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Price
                          </label>
                          <input
                            type="number"
                            name="price"
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                            placeholder="Price"
                            required
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                  >
                    {editingPurchase ? "Update Purchase" : "Create Purchase"}
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

export default PurchasesPage;

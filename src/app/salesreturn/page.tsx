"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/app/redux";
import {
  Undo2,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Package,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  X,
  ChevronDown,
} from "lucide-react";
import {
  useGetSalesReturnsQuery,
  useDeleteSalesReturnMutation,
} from "@/state/api";

interface SalesReturnItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  return_reason: string;
}

interface SalesReturn {
  id: number;
  return_number: string;
  original_invoice: string;
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  date: string;
  total_amount: number;
  reason: string;
  status: "completed" | "pending" | "rejected";
  refund_method: string;
  items: SalesReturnItem[];
  created_at: string;
  updated_at: string;
}

const SalesReturnPage = () => {
  const router = useRouter();
  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed
  );

  // API calls
  const {
    data: salesReturns = [],
    isLoading,
    error,
    refetch,
  } = useGetSalesReturnsQuery();
  const [deleteSalesReturn] = useDeleteSalesReturnMutation();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReturn, setEditingReturn] = useState<SalesReturn | null>(null);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showModalStatus, setShowModalStatus] = useState(false);
  const [showModalRefund, setShowModalRefund] = useState(false);

  const itemsPerPage = 10;

  const getContentMargin = () => {
    return "ml-0";
  };

  const filteredSalesReturns = salesReturns
    .filter(
      (returnItem) =>
        returnItem.return_number
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        returnItem.customer_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        returnItem.original_invoice
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    )
    .filter(
      (returnItem) =>
        statusFilter === "all" || returnItem.status === statusFilter
    );

  const handleDeleteSalesReturn = async (id: number) => {
    if (confirm("Are you sure you want to delete this sales return?")) {
      try {
        await deleteSalesReturn(id).unwrap();
      } catch (error) {
        console.error("Failed to delete sales return:", error);
        alert("Failed to delete sales return. Please try again.");
      }
    }
  };

  const getFilterDisplayText = () => {
    switch (statusFilter) {
      case "all":
        return "All Status";
      case "completed":
        return "Completed";
      case "pending":
        return "Pending";
      case "rejected":
        return "Rejected";
      default:
        return "All Status";
    }
  };

  const handleNewReturn = () => {
    setEditingReturn(null);
    setIsModalOpen(true);
  };

  const handleEditReturn = (returnItem: SalesReturn) => {
    setEditingReturn(returnItem);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingReturn(null);
  };

  const handleSaveReturn = async (formData: any) => {
    try {
      // Here you would typically call your API to create/update the sales return
      console.log("Saving sales return:", formData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Refresh the data
      refetch();
      handleCloseModal();

      alert(
        editingReturn
          ? "Sales return updated successfully!"
          : "Sales return created successfully!"
      );
    } catch (error) {
      console.error("Failed to save sales return:", error);
      alert("Failed to save sales return. Please try again.");
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSalesReturns = filteredSalesReturns.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredSalesReturns.length / itemsPerPage);

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

  if (isLoading) {
    return (
      <div
        className={`${getContentMargin()} p-6 min-h-screen bg-gray-50 flex items-center justify-center`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading sales returns...</p>
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
          <Undo2 className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Error Loading Sales Returns
          </h3>
          <p className="text-red-600 mb-4">
            Failed to load sales returns. Please try again.
          </p>
          <button
            onClick={refetch}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
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
                <Undo2 className="w-6 h-6" />
                Sales Returns
              </h1>
              <p className="mt-1">Manage your sales return transactions</p>
            </div>
            <button
              onClick={handleNewReturn}
              className="mt-4 md:mt-0 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Return
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="rounded-lg p-4 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Total Returns</p>
                <p className="text-2xl font-bold">{salesReturns.length}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Undo2 className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="rounded-lg p-4 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Completed</p>
                <p className="text-2xl font-bold text-green-500">
                  {salesReturns.filter((r) => r.status === "completed").length}
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
                  {salesReturns.filter((r) => r.status === "pending").length}
                </p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </div>

          <div className="rounded-lg p-4 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Total Refunded</p>
                <p className="text-2xl font-bold text-purple-500">
                  ৳
                  {salesReturns.reduce(
                    (sum, returnItem) => sum + returnItem.total_amount,
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
                    placeholder="Search by return number, customer, or invoice..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowStatusFilter(!showStatusFilter)}
                  className="flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <span>{getFilterDisplayText()}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showStatusFilter && (
                  <ul className="absolute z-10 w-full mt-1 border border-gray-300 rounded-lg shadow-lg">
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
                          setStatusFilter("completed");
                          setShowStatusFilter(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100"
                      >
                        Completed
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
                          setStatusFilter("rejected");
                          setShowStatusFilter(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100"
                      >
                        Rejected
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

        {/* Sales Returns Table */}
        <div className="rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Return Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Original Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Reason
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
                {currentSalesReturns.map((returnItem) => (
                  <tr key={returnItem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className="text-sm font-medium text-blue-600 cursor-pointer hover:underline"
                        onClick={() =>
                          router.push(`/salesreturn/${returnItem.id}`)
                        }
                      >
                        {returnItem.return_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">{returnItem.customer_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {returnItem.original_invoice}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        {new Date(returnItem.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-red-600">
                        ৳{returnItem.total_amount}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className="text-sm max-w-xs truncate"
                        title={returnItem.reason}
                      >
                        {returnItem.reason}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          returnItem.status
                        )}`}
                      >
                        {returnItem.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            router.push(`/salesreturn/${returnItem.id}`)
                          }
                          className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditReturn(returnItem)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSalesReturn(returnItem.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {currentSalesReturns.length === 0 && (
              <div className="text-center py-12">
                <Undo2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No sales returns found
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "Get started by processing your first return"}
                </p>
                {!searchTerm && statusFilter === "all" && (
                  <button
                    onClick={handleNewReturn}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    New Return
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
                  {Math.min(indexOfLastItem, filteredSalesReturns.length)} of{" "}
                  {filteredSalesReturns.length} results
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

      {/* Sales Return Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="rounded-lg border shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Undo2 className="w-5 h-5" />
                {editingReturn ? "Edit Sales Return" : "New Sales Return"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {/* Sales Return Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const data = Object.fromEntries(formData.entries());
                  handleSaveReturn(data);
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
                      defaultValue={
                        editingReturn?.return_number || `RET-${Date.now()}`
                      }
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
                      defaultValue={editingReturn?.original_invoice}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      name="customer_name"
                      defaultValue={editingReturn?.customer_name}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Phone
                    </label>
                    <input
                      type="tel"
                      name="customer_phone"
                      defaultValue={editingReturn?.customer_phone}
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
                      defaultValue={
                        editingReturn?.date ||
                        new Date().toISOString().split("T")[0]
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowModalStatus(!showModalStatus)}
                        className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      >
                        <span>{editingReturn?.status || "pending"}</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <input
                        type="hidden"
                        name="status"
                        defaultValue={editingReturn?.status || "pending"}
                      />
                      {showModalStatus && (
                        <ul className="absolute z-10 w-full mt-1 border border-gray-300 rounded-lg shadow-lg">
                          <li>
                            <button
                              type="button"
                              onClick={() => {
                                const input = document.querySelector(
                                  'input[name="status"]'
                                ) as HTMLInputElement;
                                if (input) input.value = "pending";
                                setShowModalStatus(false);
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
                                const input = document.querySelector(
                                  'input[name="status"]'
                                ) as HTMLInputElement;
                                if (input) input.value = "completed";
                                setShowModalStatus(false);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100"
                            >
                              Completed
                            </button>
                          </li>
                          <li>
                            <button
                              type="button"
                              onClick={() => {
                                const input = document.querySelector(
                                  'input[name="status"]'
                                ) as HTMLInputElement;
                                if (input) input.value = "rejected";
                                setShowModalStatus(false);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100"
                            >
                              Rejected
                            </button>
                          </li>
                        </ul>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Refund Method
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowModalRefund(!showModalRefund)}
                        className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      >
                        <span>{editingReturn?.refund_method || "cash"}</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <input
                        type="hidden"
                        name="refund_method"
                        defaultValue={editingReturn?.refund_method || "cash"}
                      />
                      {showModalRefund && (
                        <ul className="absolute z-10 w-full mt-1 border border-gray-300 rounded-lg shadow-lg">
                          <li>
                            <button
                              type="button"
                              onClick={() => {
                                const input = document.querySelector(
                                  'input[name="refund_method"]'
                                ) as HTMLInputElement;
                                if (input) input.value = "cash";
                                setShowModalRefund(false);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100"
                            >
                              Cash
                            </button>
                          </li>
                          <li>
                            <button
                              type="button"
                              onClick={() => {
                                const input = document.querySelector(
                                  'input[name="refund_method"]'
                                ) as HTMLInputElement;
                                if (input) input.value = "bank_transfer";
                                setShowModalRefund(false);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100"
                            >
                              Bank Transfer
                            </button>
                          </li>
                          <li>
                            <button
                              type="button"
                              onClick={() => {
                                const input = document.querySelector(
                                  'input[name="refund_method"]'
                                ) as HTMLInputElement;
                                if (input) input.value = "credit_card";
                                setShowModalRefund(false);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100"
                            >
                              Credit Card
                            </button>
                          </li>
                          <li>
                            <button
                              type="button"
                              onClick={() => {
                                const input = document.querySelector(
                                  'input[name="refund_method"]'
                                ) as HTMLInputElement;
                                if (input) input.value = "store_credit";
                                setShowModalRefund(false);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100"
                            >
                              Store Credit
                            </button>
                          </li>
                        </ul>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Amount
                    </label>
                    <input
                      type="number"
                      name="total_amount"
                      step="0.01"
                      defaultValue={editingReturn?.total_amount}
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
                    defaultValue={editingReturn?.reason}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Address
                  </label>
                  <textarea
                    name="customer_address"
                    defaultValue={editingReturn?.customer_address}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Items Section */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Return Items</h3>
                  <div className="space-y-4">
                    {/* You can add dynamic item fields here */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Product
                        </label>
                        <input
                          type="text"
                          name="items[0].product_name"
                          defaultValue={editingReturn?.items[0]?.product_name}
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
                          name="items[0].quantity"
                          defaultValue={editingReturn?.items[0]?.quantity}
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
                          name="items[0].price"
                          step="0.01"
                          defaultValue={editingReturn?.items[0]?.price}
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
                          name="items[0].return_reason"
                          defaultValue={editingReturn?.items[0]?.return_reason}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                          placeholder="Return reason"
                        />
                      </div>
                    </div>
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
                    {editingReturn ? "Update Return" : "Create Return"}
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

export default SalesReturnPage;

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/app/redux";
import {
  CircleDollarSign,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Download,
  Calendar,
  Tag,
  User,
  Coins,
  CreditCard,
  Banknote,
} from "lucide-react";

interface Expense {
  id: number;
  description: string;
  category: string;
  amount: number;
  date: string;
  paidTo: string;
  paymentMethod: string;
  status: "paid" | "pending" | "cancelled";
  receiptNumber?: string;
  notes?: string;
}

const ExpensesPage = () => {
  const router = useRouter();
  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed
  );

  // Mock data - replace with actual API calls
  const [expenses, setExpenses] = useState<Expense[]>([
    {
      id: 1,
      description: "Office Rent",
      category: "Rent",
      amount: 15000,
      date: "2024-01-15",
      paidTo: "Building Management",
      paymentMethod: "Bank Transfer",
      status: "paid",
      receiptNumber: "RCP-001"
    },
    {
      id: 2,
      description: "Internet Bill",
      category: "Utilities",
      amount: 2500,
      date: "2024-01-16",
      paidTo: "Internet Provider Co.",
      paymentMethod: "Credit Card",
      status: "paid",
      receiptNumber: "RCP-002"
    },
    {
      id: 3,
      description: "Employee Bonus",
      category: "Salaries",
      amount: 8000,
      date: "2024-01-17",
      paidTo: "John Smith",
      paymentMethod: "Cash",
      status: "pending"
    },
    {
      id: 4,
      description: "Office Supplies",
      category: "Supplies",
      amount: 1200,
      date: "2024-01-18",
      paidTo: "Stationery Store",
      paymentMethod: "Cash",
      status: "paid",
      receiptNumber: "RCP-003"
    },
    {
      id: 5,
      description: "Marketing Campaign",
      category: "Marketing",
      amount: 5000,
      date: "2024-01-19",
      paidTo: "Digital Ads Agency",
      paymentMethod: "Bank Transfer",
      status: "paid",
      receiptNumber: "RCP-004"
    }
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getContentMargin = () => {
    return "ml-0";
  };

  const categories = Array.from(new Set(expenses.map(expense => expense.category)));

  const filteredExpenses = expenses.filter(expense =>
    expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.paidTo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(expense =>
    categoryFilter === "all" || expense.category === categoryFilter
  ).filter(expense =>
    statusFilter === "all" || expense.status === statusFilter
  );

  const handleDeleteExpense = (id: number) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      setExpenses(expenses.filter(expense => expense.id !== id));
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentExpenses = filteredExpenses.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      "Rent": "bg-red-100 text-red-800",
      "Utilities": "bg-blue-100 text-blue-800",
      "Salaries": "bg-green-100 text-green-800",
      "Supplies": "bg-yellow-100 text-yellow-800",
      "Marketing": "bg-purple-100 text-purple-800",
      "Maintenance": "bg-orange-100 text-orange-800",
      "Travel": "bg-indigo-100 text-indigo-800",
      "Other": "bg-gray-100 text-gray-800"
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "Cash": return <Coins className="w-4 h-4" />;
      case "Bank Card": return <CreditCard className="w-4 h-4" />;
      case "Bank Transfer": return <Banknote className="w-4 h-4" />;
      default: return <CircleDollarSign className="w-4 h-4" />;
    }
  };

  return (
    <div className={`${getContentMargin()} p-6 min-h-full border rounded-xl shadow-2xl transition-all duration-300 mt-20`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CircleDollarSign className="w-6 h-6" />
              Expenses
            </h1>
            <p className="mt-1">Manage your business expenses</p>
          </div>
          <button
            onClick={() => router.push("/expenses/new")}
            className="mt-4 md:mt-0 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Expense
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Total Expenses</p>
              <p className="text-2xl font-bold">{expenses.length}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <CircleDollarSign className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Paid</p>
              <p className="text-2xl font-bold text-green-500">
                {expenses.filter(e => e.status === "paid").length}
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
                {expenses.filter(e => e.status === "pending").length}
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
              <p className="text-sm">Total Amount</p>
              <p className="text-2xl font-bold text-purple-500">
                ৳{expenses.reduce((sum, expense) => sum + expense.amount, 0)}
              </p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Tag className="w-6 h-6 text-purple-500" />
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
                  placeholder="Search by description, recipient, or receipt..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>

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

      {/* Expenses Table */}
      <div className="rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Paid To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Payment
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
              {currentExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className="text-sm font-medium text-blue-600 cursor-pointer hover:underline"
                      onClick={() => router.push(`/expenses/${expense.id}`)}
                    >
                      {expense.description}
                    </div>
                    {expense.receiptNumber && (
                      <div className="text-xs text-gray-500 mt-1">
                        Receipt: {expense.receiptNumber}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(expense.category)}`}>
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-red-600">
                      ৳{expense.amount}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      {new Date(expense.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">{expense.paidTo}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm">
                      {getPaymentMethodIcon(expense.paymentMethod)}
                      {expense.paymentMethod}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      expense.status === "paid"
                        ? "bg-green-100 text-green-800"
                        : expense.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {expense.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => router.push(`/expenses/${expense.id}`)}
                        className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => router.push(`/expenses/edit/${expense.id}`)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
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

          {currentExpenses.length === 0 && (
            <div className="text-center py-12">
              <CircleDollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No expenses found
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || categoryFilter !== "all" || statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Get started by recording your first expense"}
              </p>
              {!searchTerm && categoryFilter === "all" && statusFilter === "all" && (
                <button
                  onClick={() => router.push("/expenses/new")}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  New Expense
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
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredExpenses.length)} of{" "}
                {filteredExpenses.length} results
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
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
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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
  );
};

export default ExpensesPage;
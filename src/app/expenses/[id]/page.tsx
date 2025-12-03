"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppSelector } from "@/app/redux";
import {
  CircleDollarSign,
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  Tag,
  User,
  FileText,
  CreditCard,
  Coins,
  Banknote,
  Receipt,
  Download,
  Printer,
} from "lucide-react";

interface Expense {
  id: number;
  description: string;
  category: string;
  amount: number;
  date: string;
  paidTo: string;
  paidToPhone?: string;
  paidToAddress?: string;
  paymentMethod: string;
  status: "paid" | "pending" | "cancelled";
  receiptNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const SingleExpensePage = () => {
  const params = useParams();
  const router = useRouter();
  const expenseId = params.id as string;

  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed
  );

  // Mock data - replace with actual API call
  const [expense, setExpense] = useState<Expense>({
    id: 1,
    description: "Office Rent",
    category: "Rent",
    amount: 15000,
    date: "2024-01-15",
    paidTo: "Building Management",
    paidToPhone: "+1234567890",
    paidToAddress: "123 Business Tower, Downtown, City",
    paymentMethod: "Bank Transfer",
    status: "paid",
    receiptNumber: "RCP-001",
    notes: "Monthly office rent payment for January 2024",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z"
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getContentMargin = () => {
    return "ml-0";
  };

  const handleDelete = () => {
    // Handle delete logic
    setShowDeleteConfirm(false);
    router.push("/expenses");
  };

  const handlePrint = () => {
    window.print();
  };

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
      case "Cash": return <Coins className="w-5 h-5" />;
      case "Bank Card": return <CreditCard className="w-5 h-5" />;
      case "Bank Transfer": return <Banknote className="w-5 h-5" />;
      default: return <CircleDollarSign className="w-5 h-5" />;
    }
  };

  return (
    <div className={`${getContentMargin()} p-6 min-h-full border rounded-xl shadow-2xl transition-all duration-300 mt-20`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => router.push("/expenses")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CircleDollarSign className="w-6 h-6" />
              Expense Details
            </h1>
            <p className="mt-1 text-gray-600">{expense.description}</p>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(expense.category)}`}>
              {expense.category}
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              expense.status === "paid"
                ? "bg-green-100 text-green-800"
                : expense.status === "pending"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
            }`}>
              {expense.status}
            </span>
            <span className="text-sm text-gray-600">
              {new Date(expense.date).toLocaleDateString()}
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
              onClick={() => router.push(`/expenses/edit/${expenseId}`)}
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
          {/* Expense Information */}
          <div className="rounded-lg shadow-sm border overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Expense Information
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Description
                    </label>
                    <p className="text-lg font-semibold">{expense.description}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Category
                    </label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(expense.category)}`}>
                      {expense.category}
                    </span>
                  </div>
                </div>

                {expense.receiptNumber && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Receipt Number
                    </label>
                    <p className="text-lg font-mono">{expense.receiptNumber}</p>
                  </div>
                )}

                {expense.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Notes
                    </label>
                    <p className="text-lg">{expense.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recipient Information */}
          <div className="rounded-lg shadow-sm border overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Recipient Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Paid To
                  </label>
                  <p className="text-lg font-semibold">{expense.paidTo}</p>
                </div>
                {expense.paidToPhone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Phone Number
                    </label>
                    <p className="text-lg">{expense.paidToPhone}</p>
                  </div>
                )}
                {expense.paidToAddress && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Address
                    </label>
                    <p className="text-lg">{expense.paidToAddress}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Amount Summary */}
          <div className="rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <CircleDollarSign className="w-5 h-5" />
              Amount Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Amount</span>
                <span className="text-2xl font-bold text-red-600">৳{expense.amount}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Total Paid</span>
                  <span className="text-lg font-bold text-red-600">৳{expense.amount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Information
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Payment Method</span>
                <span className="font-semibold flex items-center gap-2">
                  {getPaymentMethodIcon(expense.paymentMethod)}
                  {expense.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status</span>
                <span className={`font-semibold ${
                  expense.status === "paid" ? "text-green-600" :
                  expense.status === "pending" ? "text-yellow-600" : "text-red-600"
                }`}>
                  {expense.status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Date</span>
                <span className="font-semibold">
                  {new Date(expense.date).toLocaleDateString()}
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
                  {new Date(expense.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Last Updated</span>
                <span className="text-sm">
                  {new Date(expense.updatedAt).toLocaleDateString()}
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
                  <div className="font-medium">Print Receipt</div>
                  <div className="text-sm text-gray-500">Generate printable receipt</div>
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
                onClick={() => router.push("/expenses/new")}
                className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <CircleDollarSign className="w-4 h-4" />
                <div>
                  <div className="font-medium">New Expense</div>
                  <div className="text-sm text-gray-500">Record new expense</div>
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
                <h3 className="text-lg font-bold">Delete Expense</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete the expense <strong>"{expense.description}"</strong>? 
                This action cannot be undone.
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
                  Delete Expense
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SingleExpensePage;
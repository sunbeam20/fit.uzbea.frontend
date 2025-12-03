"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppSelector } from "@/app/redux";
import {
  ArrowLeft,
  Edit,
  Trash2,
  User,
  Calendar,
  FileText,
  DollarSign,
  ListChecks,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Package,
  X,
} from "lucide-react";
import {
  useGetServiceQuery,
  useDeleteServiceMutation,
  useUpdateServiceMutation,
} from "@/state/api";

interface Service {
  id: number;
  serviceProductName: string;
  serviceDescription: string;
  serviceCost: number;
  serviceStatus: string;
  customer_id: number | null;
  user_id: number | null;
  created_at?: string;
  updated_at?: string;
  Customers?: {
    id: number;
    name: string;
    email: string | null;
    phone: string;
    address: string | null;
  } | null;
  Users?: {
    id: number;
    name: string;
    email: string;
  } | null;
}

const SingleServicePage = () => {
  const params = useParams();
  const router = useRouter();
  const serviceId = parseInt(params.id as string);

  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed
  );

  // API calls
  const { 
    data: service, 
    isLoading, 
    error, 
    refetch 
  } = useGetServiceQuery(serviceId);
  const [deleteService] = useDeleteServiceMutation();
  const [updateService] = useUpdateServiceMutation();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);

  const getContentMargin = () => {
    return "ml-0";
  };

  const handleDelete = async () => {
    try {
      await deleteService(serviceId).unwrap();
      router.push("/service");
    } catch (error) {
      console.error("Failed to delete service:", error);
      alert("Failed to delete service. Please try again.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEdit = () => {
    if (service) {
      setEditFormData({
        service_product_name: service.service_product_name,
        service_description: service.service_description,
        service_cost: service.service_cost,
        service_status: service.service_status,
        customer_name: service.customer_name || "",
        customer_phone: service.customer_phone || "",
        customer_address: service.customer_address || "",
        assigned_technician: service.assigned_technician || "",
        date: service.date || new Date().toISOString().split('T')[0],
      });
      setShowEditModal(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!service || !editFormData) return;

    try {
      // Prepare the update data according to API requirements
      const { id, ...serviceData } = {
        ...service,
        service_product_name: editFormData.service_product_name,
        service_description: editFormData.service_description,
        service_cost: editFormData.service_cost,
        service_status: editFormData.service_status,
        customer_name: editFormData.customer_name,
        customer_phone: editFormData.customer_phone,
        customer_address: editFormData.customer_address,
        assigned_technician: editFormData.assigned_technician,
        date: editFormData.date,
      };

      await updateService({
        id: serviceId,
        service: serviceData
      }).unwrap();
      setShowEditModal(false);
      refetch();
    } catch (error) {
      console.error("Failed to update service:", error);
      alert("Failed to update service. Please try again.");
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setEditFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in progress":
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "in progress":
      case "in_progress":
        return <Clock className="w-4 h-4" />;
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatStatus = (status: string) => {
    return status?.replace("_", " ") || "Unknown";
  };

  if (isLoading) {
    return (
      <div className={`${getContentMargin()} p-6 min-h-screen bg-gray-50 flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading service details...</p>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className={`${getContentMargin()} p-6 min-h-screen bg-gray-50 flex items-center justify-center`}>
        <div className="text-center">
          <ListChecks className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Service Not Found
          </h3>
          <p className="text-red-600 mb-4">
            The service you're looking for doesn't exist or has been removed.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push("/service")}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Back to Services
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
            onClick={() => router.push("/service")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ListChecks className="w-6 h-6" />
              Service Details
            </h1>
            <p className="mt-1 text-gray-600">Service ID: #{service.id}</p>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(service.service_status)}`}>
              {getStatusIcon(service.service_status)}
              {formatStatus(service.service_status)}
            </span>
            <span className="text-sm text-gray-600">
              Service Cost: ৳{Number(service.service_cost).toFixed(2)}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <FileText className="w-4 h-4" />
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
          {/* Service Product Information */}
          <div className="rounded-lg shadow-sm border overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Service Product Information
              </h2>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Product Name
                  </label>
                  <p className="text-lg font-semibold">{service.service_product_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Service Description
                  </label>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{service.service_description}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          {service.customer_name && (
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
                    <p className="text-lg font-semibold">{service.customer_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Phone Number
                    </label>
                    <p className="text-lg">{service.customer_phone}</p>
                  </div>
                  {service.customer_phone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        <Mail className="w-4 h-4 inline mr-1" />
                        Email Address
                      </label>
                      <p className="text-lg">{service.customer_phone}</p>
                    </div>
                  )}
                  {service.customer_address && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        Address
                      </label>
                      <p className="text-lg">{service.customer_address}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Service Assigned To */}
          {service.assigned_technician && (
            <div className="rounded-lg shadow-sm border overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Assigned Technician
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Technician Name
                    </label>
                    <p className="text-lg font-semibold">{service.assigned_technician}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Email
                    </label>
                    <p className="text-lg">{service.customer_phone}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Cost Summary */}
          <div className="rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Cost Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Service Cost</span>
                <span className="text-2xl font-bold text-blue-600">
                  ৳{Number(service.service_cost).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t">
                <span className="text-gray-600">Status</span>
                <span className={`font-semibold ${
                  service.service_status?.toLowerCase() === "completed" ? "text-green-600" :
                  service.service_status?.toLowerCase() === "in progress" || service.service_status?.toLowerCase() === "in_progress" ? "text-blue-600" :
                  service.service_status?.toLowerCase() === "pending" ? "text-yellow-600" : "text-red-600"
                }`}>
                  {formatStatus(service.service_status)}
                </span>
              </div>
            </div>
          </div>

          {/* Service Information */}
          <div className="rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <ListChecks className="w-5 h-5" />
              Service Information
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Service ID</span>
                <span className="font-semibold">#{service.id}</span>
              </div>
              {service.created_at && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Created Date</span>
                  <span className="text-sm font-medium">
                    {new Date(service.created_at).toLocaleDateString()}
                  </span>
                </div>
              )}
              {service.updated_at && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Last Updated</span>
                  <span className="text-sm">
                    {new Date(service.updated_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Customer Summary */}
          {service.customer_name && (
            <div className="rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-bold mb-4">Customer Summary</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">{service.customer_name}</div>
                    <div className="text-sm text-gray-500">{service.customer_phone}</div>
                  </div>
                </div>
                {service.customer_phone && (
                  <div className="text-sm text-gray-600 flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {service.customer_phone}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={handlePrint}
                className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                <div>
                  <div className="font-medium">Print Service Report</div>
                  <div className="text-sm text-gray-500">Generate printable report</div>
                </div>
              </button>
              <button
                onClick={handleEdit}
                className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                <div>
                  <div className="font-medium">Update Service</div>
                  <div className="text-sm text-gray-500">Edit service details</div>
                </div>
              </button>
              <button
                onClick={() => router.push("/service/new")}
                className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <ListChecks className="w-4 h-4" />
                <div>
                  <div className="font-medium">New Service</div>
                  <div className="text-sm text-gray-500">Create new service</div>
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
                <h3 className="text-lg font-bold">Delete Service</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete service for <strong>{service.service_product_name}</strong>? 
                This action cannot be undone and all service records will be permanently removed.
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
                  Delete Service
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {showEditModal && editFormData && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="border rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Edit Service - #{service.id}
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                {/* Service Product Information */}
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Service Product Information
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        value={editFormData.service_product_name}
                        onChange={(e) => handleInputChange('service_product_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        placeholder="Enter product name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Service Description *
                      </label>
                      <textarea
                        value={editFormData.service_description}
                        onChange={(e) => handleInputChange('service_description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        rows={4}
                        placeholder="Describe the service required..."
                      />
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Customer Name
                      </label>
                      <input
                        type="text"
                        value={editFormData.customer_name}
                        onChange={(e) => handleInputChange('customer_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        placeholder="Enter customer name"
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
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      <textarea
                        value={editFormData.customer_address}
                        onChange={(e) => handleInputChange('customer_address', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        rows={2}
                        placeholder="Enter customer address"
                      />
                    </div>
                  </div>
                </div>

                {/* Assignment Information */}
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <ListChecks className="w-5 h-5" />
                    Assignment Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Assigned Technician
                      </label>
                      <input
                        type="text"
                        value={editFormData.assigned_technician}
                        onChange={(e) => handleInputChange('assigned_technician', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        placeholder="Enter technician name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Service Cost (৳) *
                      </label>
                      <input
                        type="number"
                        value={editFormData.service_cost}
                        onChange={(e) => handleInputChange('service_cost', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status *
                      </label>
                      <select
                        value={editFormData.service_status}
                        onChange={(e) => handleInputChange('service_status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
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
                Update Service
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SingleServicePage;
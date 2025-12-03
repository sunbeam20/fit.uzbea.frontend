"use client";

import { useGetDashboardMetricsQuery } from "@/state/api";
import { ListChecks, CheckCircle, Clock, AlertCircle } from "lucide-react";
import React from "react";

const CardServiceSummary = () => {
  const { data: dashboardMetrics, isLoading } = useGetDashboardMetricsQuery();
  const serviceData = dashboardMetrics?.serviceSummary || [];

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'in progress':
        return <Clock className="w-4 h-4" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="shadow-2xl rounded-2xl border">
        <div className="m-5">Loading...</div>
      </div>
    );
  }

  return (
    <div className="shadow-2xl rounded-2xl border">
      <div className="px-7 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recent Services</h3>
          <ListChecks className="w-5 h-5 text-gray-400" />
        </div>
      </div>
      
      <div className="overflow-auto">
        {serviceData.length === 0 ? (
          <div className="px-7 py-10 text-center text-gray-500">
            No service records found
          </div>
        ) : (
          <div className="px-4">
            {serviceData.slice(0, 5).map((service, index) => (
              <div
                key={service.id || index}
                className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ListChecks className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">
                      {service.serviceProductName || 'Unknown Product'}
                    </div>
                    <div className="text-xs text-gray-500 line-clamp-1">
                      {service.serviceDescription || 'No description'}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-1">
                  <div className="font-bold text-sm">
                    {service.serviceCost?.toLocaleString('en', { minimumFractionDigits: 2 }) || '0.00'} ৳
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${getStatusColor(service.serviceStatus || '')}`}>
                    {getStatusIcon(service.serviceStatus || '')}
                    {service.serviceStatus || 'Unknown'}
                  </div>
                </div>
              </div>
            ))}
            
            {serviceData.length > 5 && (
              <div className="p-4 text-center text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                View all {serviceData.length} services
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CardServiceSummary;
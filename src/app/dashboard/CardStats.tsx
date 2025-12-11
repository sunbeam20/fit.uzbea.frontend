"use client";

import { useGetDashboardMetricsQuery } from "@/state/api";
import { 
  ShoppingBag, 
  TrendingUp, 
  RefreshCw,
  ListChecks,
  Package,
  TrendingDown
} from "lucide-react";
import React from "react";
import numeral from "numeral";

const CardStats = () => {
  const { data: dashboardMetrics, isLoading } = useGetDashboardMetricsQuery();

  const stats = React.useMemo(() => {
    if (!dashboardMetrics) return [];
    
    const saleSummary = dashboardMetrics.saleSummary || [];
    const purchaseSummary = dashboardMetrics.purchaseSummary || [];
    const exchangeSummary = dashboardMetrics.exchangeSummary || [];
    const serviceSummary = dashboardMetrics.serviceSummary || [];

    // Calculate totals safely
    const totalSales = saleSummary.reduce((sum, item) => 
      sum + (item.totalAmount || 0), 0);
    
    const totalPurchases = purchaseSummary.reduce((sum, item) => 
      sum + (item.totalAmount || 0), 0);
    
    const totalExchanges = exchangeSummary.reduce((sum, item) => 
      sum + (Math.abs(item.totalPaid || 0)), 0);
    
    const totalServices = serviceSummary.reduce((sum, item) => 
      sum + (item.serviceCost || 0), 0);

    return [
      {
        title: "Total Sales",
        value: totalSales,
        icon: <ShoppingBag className="w-5 h-5" />,
        color: "text-blue-600",
        bgColor: "bg-blue-100",
        change: "+15.3%",
        trend: "up" as const,
      },
      {
        title: "Total Purchases",
        value: totalPurchases,
        icon: <Package className="w-5 h-5" />,
        color: "text-green-600",
        bgColor: "bg-green-100",
        change: "+8.2%",
        trend: "up" as const,
      },
      {
        title: "Total Exchanges",
        value: totalExchanges,
        icon: <RefreshCw className="w-5 h-5" />,
        color: "text-purple-600",
        bgColor: "bg-purple-100",
        change: "+3.4%",
        trend: "up" as const,
      },
      {
        title: "Services Revenue",
        value: totalServices,
        icon: <ListChecks className="w-5 h-5" />,
        color: "text-orange-600",
        bgColor: "bg-orange-100",
        change: "+15.7%",
        trend: "up" as const,
      },
    ];
  }, [dashboardMetrics]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="shadow-lg rounded-2xl border p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-8 bg-gray-300 rounded w-2/3 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="shadow-lg rounded-2xl border p-6 transition-all duration-300 hover:shadow-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <div className={stat.color}>
                {stat.icon}
              </div>
            </div>
            <div className="text-sm font-medium">
              <span className={`inline-flex items-center ${
                stat.trend === 'up' 
                  ? 'text-green-600' 
                  : stat.trend === 'down'
                  ? 'text-red-600'
                  : 'text-gray-600'
              }`}>
                {stat.trend === 'up' ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : stat.trend === 'down' ? (
                  <TrendingDown className="w-4 h-4 mr-1" />
                ) : null}
                {stat.change}
              </span>
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-1">
            {numeral(stat.value).format("0,0.00")} ৳
          </h3>
          <p className="text-sm text-gray-600">
            {stat.title}
          </p>
        </div>
      ))}
    </div>
  );
};

export default CardStats;
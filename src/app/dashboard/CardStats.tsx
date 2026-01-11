"use client";

import { useGetDashboardMetricsQuery } from "@/state/api";
import { 
  ShoppingBag, 
  TrendingUp, 
  RefreshCw,
  ListChecks,
  Package,
  TrendingDown,
  Users
} from "lucide-react";
import React from "react";
import numeral from "numeral";
import { useSelector } from "react-redux";
import { RootState } from "@/app/redux";

const CardStats = () => {
  const { data: dashboardMetrics, isLoading } = useGetDashboardMetricsQuery();
  const isDarkMode = useSelector((state: RootState) => state.global.isDarkMode);

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
        icon: ShoppingBag,
        color: "blue",
        change: "+15.3%",
        trend: "up" as const,
      },
      {
        title: "Total Purchases",
        value: totalPurchases,
        icon: Package,
        color: "green",
        change: "+8.2%",
        trend: "up" as const,
      },
      {
        title: "Total Exchanges",
        value: totalExchanges,
        icon: RefreshCw,
        color: "purple",
        change: "+3.4%",
        trend: "up" as const,
      },
      {
        title: "Services Revenue",
        value: totalServices,
        icon: ListChecks,
        color: "orange",
        change: "+15.7%",
        trend: "up" as const,
      },
    ];
  }, [dashboardMetrics]);

  // Color configuration for light and dark modes
  const colorConfig = {
    blue: {
      light: {
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-900",
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
      },
      dark: {
        bg: "bg-blue-900/30",
        border: "border-blue-800",
        text: "text-white",
        iconBg: "bg-blue-800/50",
        iconColor: "text-blue-300",
      }
    },
    green: {
      light: {
        bg: "bg-green-50",
        border: "border-green-200",
        text: "text-green-900",
        iconBg: "bg-green-100",
        iconColor: "text-green-600",
      },
      dark: {
        bg: "bg-green-900/30",
        border: "border-green-800",
        text: "text-white",
        iconBg: "bg-green-800/50",
        iconColor: "text-green-300",
      }
    },
    purple: {
      light: {
        bg: "bg-purple-50",
        border: "border-purple-200",
        text: "text-purple-900",
        iconBg: "bg-purple-100",
        iconColor: "text-purple-600",
      },
      dark: {
        bg: "bg-purple-900/30",
        border: "border-purple-800",
        text: "text-white",
        iconBg: "bg-purple-800/50",
        iconColor: "text-purple-300",
      }
    },
    orange: {
      light: {
        bg: "bg-orange-50",
        border: "border-orange-200",
        text: "text-orange-900",
        iconBg: "bg-orange-100",
        iconColor: "text-orange-600",
      },
      dark: {
        bg: "bg-orange-900/30",
        border: "border-orange-800",
        text: "text-white",
        iconBg: "bg-orange-800/50",
        iconColor: "text-orange-300",
      }
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div 
            key={i} 
            className={`rounded-xl p-6 shadow-lg border ${
              isDarkMode
                ? "bg-gray-800/30 border-gray-700"
                : "bg-gray-50 border-gray-200"
            } animate-pulse`}
          >
            <div className="flex items-center justify-between">
              <div className="w-full">
                <div className={`h-4 rounded w-1/3 mb-4 ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-200"
                }`}></div>
                <div className={`h-8 rounded w-2/3 mb-2 ${
                  isDarkMode ? "bg-gray-600" : "bg-gray-300"
                }`}></div>
                <div className={`h-3 rounded w-1/2 ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-200"
                }`}></div>
              </div>
              <div className={`p-3 rounded-lg ${
                isDarkMode ? "bg-gray-700/50" : "bg-gray-100"
              }`}>
                <div className={`w-6 h-6 ${
                  isDarkMode ? "bg-gray-600" : "bg-gray-300"
                } rounded`}></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const colors = colorConfig[stat.color as keyof typeof colorConfig];
        const themeColors = isDarkMode ? colors.dark : colors.light;
        const IconComponent = stat.icon;

        return (
          <div
            key={index}
            className={`rounded-xl p-6 shadow-lg border transition-all duration-300 hover:shadow-xl ${
              themeColors.bg
            } ${themeColors.border} ${themeColors.text}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{stat.title}</p>
                <p className="text-3xl font-bold mt-2">
                  {numeral(stat.value).format("0,0.00")} ৳
                </p>
                <div className="text-sm font-medium mt-2">
                  <span className={`inline-flex items-center ${
                    stat.trend === 'up' 
                      ? (isDarkMode ? 'text-green-300' : 'text-green-600')
                      : stat.trend === 'down'
                      ? (isDarkMode ? 'text-red-300' : 'text-red-600')
                      : (isDarkMode ? 'text-gray-300' : 'text-gray-600')
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
              <div className={`p-3 rounded-lg ${themeColors.iconBg}`}>
                <IconComponent className={`w-6 h-6 ${themeColors.iconColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CardStats;
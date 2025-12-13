"use client";

import { useGetDashboardMetricsQuery } from "@/state/api";
import { ShoppingBag } from "lucide-react";
import React from "react";
import Rating from "../(components)/Rating";
import { useAppDispatch, useAppSelector } from "@/app/redux";

const CardPopularProducts = () => {
  const { data: dashboardMetrics, isLoading } = useGetDashboardMetricsQuery();
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  
  // SAFE: Create a copy of the array before sorting
  const popularProducts = React.useMemo(() => {
    const products = dashboardMetrics?.popularProducts || [];
    // Create a shallow copy to avoid modifying the original array
    return [...products]
      .sort((a, b) => (b.quantity || 0) - (a.quantity || 0))
      .slice(0, 5);
  }, [dashboardMetrics?.popularProducts]);

  return (
    <div className={`shadow-2xl rounded-2xl ${isDarkMode ? "border bg-gray-800/50 border-gray-700" : "border bg-white/50 border-gray-200"}`}>
      {isLoading ? (
        <div className="m-5">Loading...</div>
      ) : (
        <>
          <div className="px-7 pt-5 pb-2">
            <h3 className="text-lg font-semibold">Popular Products</h3>
            <p className="text-sm text-gray-500">Top selling products</p>
          </div>
          
          <div className="overflow-auto">
            {popularProducts.length === 0 ? (
              <div className="px-7 py-10 text-center text-gray-500">
                No product data available
              </div>
            ) : (
              <>
                {popularProducts.map((product, index) => (
                  <div
                    key={product.id || index}
                    className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-300 rounded-lg flex items-center justify-center text-blue-600 font-bold">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex flex-col justify-between gap-1 min-w-0">
                        <div className="font-medium text-sm truncate">{product.name || 'Unnamed Product'}</div>
                        <div className="flex items-center gap-2">
                          <Rating rating={Math.min(Math.round((product.quantity || 0) / 20), 5)} />
                          <span className="text-xs text-gray-500">
                            {Math.round((product.quantity || 0) / 20)}/5
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <div className="font-bold text-sm text-blue-600">
                        {(product.retailPrice || 0).toLocaleString('en', { minimumFractionDigits: 2 })} ৳
                      </div>
                      <div className="text-xs flex items-center bg-green-50 text-green-700 px-2 py-1 rounded-full">
                        <ShoppingBag className="w-3 h-3 mr-1" />
                        {product.quantity || 0 } Sold
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
            
            {dashboardMetrics?.popularProducts && dashboardMetrics.popularProducts.length > 5 && (
              <div className="p-4 text-center text-sm text-blue-600 hover:text-blue-800 cursor-pointer border-t">
                View all {dashboardMetrics.popularProducts.length} products
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CardPopularProducts;
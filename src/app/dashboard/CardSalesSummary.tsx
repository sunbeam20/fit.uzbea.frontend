"use client";

import { useGetDashboardMetricsQuery } from "@/state/api";
import { TrendingUp, TrendingDown } from "lucide-react";
import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import numeral from "numeral";
import { useAppDispatch, useAppSelector } from "@/app/redux";

// Format date helper function
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (error) {
    return dateString;
  }
};

const CardSalesSummary = () => {
  const { data, isLoading, isError } = useGetDashboardMetricsQuery();
  const [timeframe, setTimeframe] = useState("weekly");
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);

  // Process sale data for chart
  const chartData = React.useMemo(() => {
    if (!data?.saleSummary) return [];
    
    return data.saleSummary.map((item, index) => ({
      ...item,
      formattedDate: formatDate(item.dueDate || item.created_at || new Date().toISOString()),
      name: `Day ${index + 1}`,
    }));
  }, [data?.saleSummary]);

  const totalValueSum = chartData.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  const avgSale = chartData.length > 0 ? totalValueSum / chartData.length : 0;

  if (isError) {
    return (
      <div className="shadow-2xl rounded-2xl border p-6">
        <div className="text-red-600 text-center">Failed to fetch sales data</div>
      </div>
    );
  }

  return (
    <div className={`shadow-2xl rounded-2xl p-6 ${isDarkMode ? "border bg-gray-800/50 border-gray-700" : "border bg-white/50 border-gray-200"}`}>
      {isLoading ? (
        <div className="text-center">Loading sales data...</div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold">Sales Summary</h2>
              <p className="text-sm text-gray-500">Revenue Overview</p>
            </div>
            {/* <div className="flex gap-2">
              {['daily', 'weekly', 'monthly'].map((item) => (
                <button
                  key={item}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    timeframe === item
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  onClick={() => setTimeframe(item)}
                >
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </button>
              ))}
            </div> */}
          </div>

          <div className="flex justify-between items-center mb-8">
            <div>
              <p className="text-xs text-gray-400">Total Revenue</p>
              <span className="md:text-xl font-bold">
                {numeral(totalValueSum).format("0,0.00")} ৳
              </span>
            </div>
            {/* <div className="text-right">
              <p className="text-xs text-gray-400">Avg. Sale</p>
              <span className="md:text-xl font-semibold">
                {numeral(avgSale).format("0,0.00")} ৳
              </span>
            </div> */}
          </div>

          <div className="flex items-center mb-6">
            <span className={`inline-flex items-center ${totalValueSum > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {totalValueSum > 0 ? (
                <TrendingUp className="w-5 h-5 mr-1" />
              ) : (
                <TrendingDown className="w-5 h-5 mr-1" />
              )}
              {totalValueSum > 0 ? '+' : ''}{Math.abs(totalValueSum / 1000).toFixed(1)}%
            </span>
            <span className="text-gray-500 ml-2">from last period</span>
          </div>

          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="formattedDate" 
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => numeral(value).format("0a")}
                />
                <Tooltip
                  formatter={(value: number) => [
                    `${numeral(value).format("0,0.00")} ৳`,
                    "Sales"
                  ]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="totalAmount"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};

export default CardSalesSummary;
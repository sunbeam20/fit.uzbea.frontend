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

const CardSalesSummary = () => {
  const { data, isLoading, isError } = useGetDashboardMetricsQuery();
  const saleData = data?.saleSummary || [];

  const [timeframe, setTimeframe] = useState("weekly");

  const totalValueSum = saleData.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0) || 0;
  const avgSale = saleData.length > 0 ? totalValueSum / saleData.length : 0;

  if (isError) {
    return (
      <div className="shadow-2xl rounded-2xl border">
        <div className="m-5 text-red-600">Failed to fetch sales data</div>
      </div>
    );
  }

  return (
    <div className="shadow-2xl rounded-2xl flex flex-col justify-between border">
      {isLoading ? (
        <div className="m-5">Loading...</div>
      ) : (
        <>
          <div className="px-7 pt-5">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold">Sales Summary</h2>
                <p className="text-sm text-gray-500">Total revenue overview</p>
              </div>
              <div className="flex gap-2">
                {['daily', 'weekly', 'monthly'].map((item) => (
                  <button
                    key={item}
                    className={`px-3 py-1 text-sm rounded-lg ${
                      timeframe === item
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    onClick={() => setTimeframe(item)}
                  >
                    {item.charAt(0).toUpperCase() + item.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="px-7">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-xs text-gray-400">Total Revenue</p>
                <span className="text-3xl font-bold">
                  {numeral(totalValueSum).format("0,0.00")} ৳
                </span>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Avg. Sale</p>
                <span className="text-lg font-semibold">
                  {numeral(avgSale).format("0,0.00")} ৳
                </span>
              </div>
            </div>

            <div className="text-sm flex items-center mb-4">
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
          </div>

          <div className="px-7 pb-7">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={saleData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
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
                  labelFormatter={(label) => {
                    const date = new Date(label);
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
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
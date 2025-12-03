"use client";

import { useGetDashboardMetricsQuery } from "@/state/api";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import numeral from "numeral";
import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CardExchangeSummary = () => {
  const { data, isLoading } = useGetDashboardMetricsQuery();
  const exchangeData = data?.exchangeSummary || [];

  const lastDataPoint = exchangeData[exchangeData.length - 1] || null;

  return (
    <div className="flex flex-col justify-between shadow-2xl rounded-2xl border">
      {isLoading ? (
        <div className="m-5">Loading...</div>
      ) : (
        <>
          <div className="flex items-center justify-between px-7 pt-5 pb-2">
            <h3 className="text-lg font-semibold">Exchange Summary</h3>
            <RefreshCw className="w-5 h-5 text-gray-400" />
          </div>

          <div className="px-7 pb-7">
            <div className="mb-4">
              <p className="text-xs text-gray-500">Total Exchanges</p>
              <div className="flex items-center">
                <p className="text-2xl font-bold">
                  {lastDataPoint
                    ? numeral(lastDataPoint.totalPaid).format("0,0.00")
                    : "0"}{" "}
                  &#2547;
                </p>
                {lastDataPoint && (
                  <p
                    className={`text-sm ${
                      lastDataPoint.totalPaid! >= 0
                        ? "text-green-500"
                        : "text-red-500"
                    } flex ml-3`}
                  >
                    {lastDataPoint.totalPaid! >= 0 ? (
                      <TrendingUp className="w-5 h-5 mr-1" />
                    ) : (
                      <TrendingDown className="w-5 h-5 mr-1" />
                    )}
                    {Math.abs(lastDataPoint.totalPaid || 0) > 0 ? "12%" : "0%"}
                  </p>
                )}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={exchangeData}>
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
                    "Amount"
                  ]}
                  labelFormatter={(label) => {
                    const date = new Date(label);
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                />
                <Bar
                  dataKey="totalPaid"
                  fill="#a855f7"
                  radius={[4, 4, 0, 0]}
                  name="Amount Paid"
                />
                <Bar
                  dataKey="totalPayback"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  name="Amount Payback"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};

export default CardExchangeSummary;
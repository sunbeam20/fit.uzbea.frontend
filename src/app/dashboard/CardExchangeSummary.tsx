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
  
  // Process exchange data for chart
  const chartData = React.useMemo(() => {
    if (!data?.exchangeSummary) return [];
    
    return data.exchangeSummary.map((item, index) => ({
      ...item,
      formattedDate: new Date(item.created_at || new Date().toISOString())
        .toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      name: `Exchange ${index + 1}`,
    }));
  }, [data?.exchangeSummary]);

  const lastDataPoint = chartData[chartData.length - 1] || null;
  const totalExchanges = chartData.reduce((acc, curr) => acc + (Math.abs(curr.totalPaid || 0)), 0);

  return (
    <div className="shadow-2xl rounded-2xl border p-6">
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Exchange Summary</h3>
            <RefreshCw className="w-5 h-5 text-gray-400" />
          </div>

          <div className="mb-8">
            <p className="text-xs text-gray-500">Total Exchange Value</p>
            <div className="flex items-center">
              <p className="text-2xl font-bold">
                {numeral(totalExchanges).format("0,0.00")} ৳
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
                  {lastDataPoint.totalPaid! > 0 ? "+" : ""}
                  {Math.abs(lastDataPoint.totalPaid || 0) > 0 ? "12%" : "0%"}
                </p>
              )}
            </div>
          </div>
          
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
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
                  formatter={(value: number, name: string) => [
                    `${numeral(value).format("0,0.00")} ৳`,
                    name === "totalPaid" ? "Amount Paid" : "Amount Payback"
                  ]}
                  labelFormatter={(label) => `Date: ${label}`}
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
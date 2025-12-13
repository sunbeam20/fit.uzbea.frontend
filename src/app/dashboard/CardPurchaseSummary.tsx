"use client";

import { useGetDashboardMetricsQuery } from "@/state/api";
import { TrendingDown, TrendingUp } from "lucide-react";
import numeral from "numeral";
import React from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useAppDispatch, useAppSelector } from "@/app/redux";

const CardPurchaseSummary = () => {
  const { data, isLoading } = useGetDashboardMetricsQuery();
    const isDarkMode = useAppSelector((state) => state.global.isDarkMode);

  // Process purchase data for chart
  const chartData = React.useMemo(() => {
    if (!data?.purchaseSummary) return [];

    return data.purchaseSummary.map((item, index) => ({
      ...item,
      formattedDate: new Date(
        item.dueDate || item.created_at || new Date().toISOString()
      ).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      name: `Purchase ${index + 1}`,
    }));
  }, [data?.purchaseSummary]);

  const lastDataPoint = chartData[chartData.length - 1] || null;
  const totalPurchases = chartData.reduce(
    (acc, curr) => acc + (curr.totalAmount || 0),
    0
  );

  return (
    <div className={`shadow-2xl rounded-2xl p-6 ${isDarkMode ? "border bg-gray-800/50 border-gray-700" : "border bg-white/50 border-gray-200"}`}>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          <div>
            <h3 className="text-lg font-semibold ">Purchase Summary</h3>
            <p className="text-sm text-gray-500 mb-6">Purchase Overview</p>
          </div>

          <div className="mb-8">
            <p className="text-xs text-gray-500">Total Purchased</p>
            <div className="flex items-center">
              <p className="md:text-xl font-bold">
                {numeral(totalPurchases).format("0,0.00")} ৳
              </p>
            </div>
          </div>
          {lastDataPoint && lastDataPoint.totalAmount > 0 && (
            <p className={`text-sm text-green-500 flex mb-6`}>
              <TrendingUp className="w-5 h-5 mr-1" />
              {(
                (lastDataPoint.totalAmount /
                  (totalPurchases / chartData.length)) *
                100
              ).toFixed(1)}
              %
            </p>
          )}

          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
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
                    "Amount",
                  ]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="totalAmount"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};

export default CardPurchaseSummary;

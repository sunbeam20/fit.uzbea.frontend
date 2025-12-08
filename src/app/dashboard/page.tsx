"use client";

import CardPopularProducts from "./CardPopularProducts";
import CardPurchaseSummary from "./CardPurchaseSummary";
import CardSalesSummary from "./CardSalesSummary";
import CardExchangeSummary from "./CardExchangeSummary";
import CardServiceSummary from "./CardServiceSummary";
import CardStats from "./CardStats";
import { useAppSelector } from "../redux";

const Dashboard = () => {
  
  const showPanel = useAppSelector((state) => state.global.isPOSPanelOpen);
  return (
    <div className={`flex flex-col gap-8 pb-4 mt-12 ${ showPanel ? "hidden" : ""}`}>
      {/* Stats Cards - Full width */}
      <div className="w-full">
        <CardStats />
      </div>

      {/* Third Row: Services & Products side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <CardPopularProducts />
        <CardServiceSummary />
      </div>
      {/* First Row: Sales Summary */}
      <div className="w-full">
        <CardSalesSummary />
      </div>

      {/* Second Row: Purchase & Exchange Charts side by side */}
      <div className="grid grid-cols-2 lg:grid-cols-2 gap-8">
        <CardPurchaseSummary />
        <CardExchangeSummary />
      </div>
    </div>
  );
};

export default Dashboard;

"use client";

import CardPopularProducts from "./CardPopularProducts";
import CardPurchaseSummary from "./CardPurchaseSummary";
import CardSalesSummary from "./CardSalesSummary";
import CardExchangeSummary from "./CardExchangeSummary";
import CardServiceSummary from "./CardServiceSummary";
import CardStats from "./CardStats";
import { useAppSelector } from "../redux";
import logo from "../../../public/floppy.jpg";
import Image from "next/image";

const Dashboard = () => {
  const showPanel = useAppSelector((state) => state.global.isPOSPanelOpen);
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  return (
    <>
      {showPanel ? (
        <div
          className={`fixed inset-0 flex items-center justify-center -ml-8 ${
            isDarkMode ? "bg-black" : "invert"
          }`}
        >
          {/* Container with circular border */}
          <div className="relative md:w-240 md:h-240 rounded-full overflow-hidden border-8 border-white shadow-2xl">
            <Image
              src={logo}
              alt="Floppy IT"
              className="object-cover"
              fill
              priority
            />
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-8 pb-4 mt-12">
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
        </>
      )}
    </>
  );
};

export default Dashboard;

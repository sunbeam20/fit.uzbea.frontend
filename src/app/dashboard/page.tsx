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
          <div className="relative w-240 h-240 md:w-240 md:h-240 rounded-full overflow-hidden border-8 border-white shadow-2xl">
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
        <div className="grid grid-cols-4 mt-12 gap-8">
          {/* Stats Cards */}
          <div className="col-span-4">
            <CardStats />
          </div>
          {/* Charts Row */}
          <div className="col-span-4 row-span-1">
            <CardPopularProducts />
          </div>
          <div className="col-span-2 row-span-1">
            <CardSalesSummary />
          </div>
          <div className="col-span-2 row-span-1">
            <CardPurchaseSummary />
          </div>
          <div className="col-span-4 row-span-1">
            <CardServiceSummary />
          </div>
          {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-8">
              <CardPopularProducts />
              <CardServiceSummary />
              <CardExchangeSummary />
            </div>{" "}
            <div className="space-y-8">
              <CardSalesSummary />
              <CardPurchaseSummary />
            </div>
          </div> */}
          {/* Services Row
          <div className="w-full">
            <CardServiceSummary />
          </div> */}
        </div>
      )}
    </>
  );
};

export default Dashboard;

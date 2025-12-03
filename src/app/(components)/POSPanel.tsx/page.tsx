"use client";

import { useAppDispatch, useAppSelector } from "@/app/redux";
import { setIsPOSPanelOpen } from "@/state";
import { Menu, X } from "lucide-react";

const POSPanel = () => {
  const dispatch = useAppDispatch();
  const showPanel = useAppSelector((state) => state.global.isPOSPanelOpen);
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);

  const togglePanel = () => {
    dispatch(setIsPOSPanelOpen(!showPanel));
  };

  // Button click handlers
  const handleAddProduct = () => {
    console.log("Add Product clicked");
    // Add your add product logic here
  };

  const handleDiscount = () => {
    console.log("Discount clicked");
    // Add discount logic here
  };

  const handleSalesReturn = () => {
    console.log("Sales Return clicked");
    // Add sales return logic here
  };

  const handlePreOrder = () => {
    console.log("Pre Order clicked");
    // Add pre-order logic here
  };

  const handleQuotation = () => {
    console.log("Quotation clicked");
    // Add quotation logic here
  };

  const handleInvoice = () => {
    console.log("Invoice clicked");
    // Add invoice logic here
  };

  const handleExchange = () => {
    console.log("Exchange clicked");
    // Add exchange logic here
  };

  const handleRefund = () => {
    console.log("Refund clicked");
    // Add refund logic here
  };

  const handleDelivery = () => {
    console.log("Delivery clicked");
    // Add delivery logic here
  };

  const handleWarranty = () => {
    console.log("Warranty clicked");
    // Add warranty logic here
  };

  const handleService = () => {
    console.log("Service clicked");
    // Add service logic here
  };

  const handleStock = () => {
    console.log("Stock clicked");
    // Add stock logic here
  };

  const handleConfirmSell = () => {
    console.log("Confirm Sell clicked");
    // Add confirm sell logic here
  };

  const handleCashIn = () => {
    console.log("Cash IN clicked");
    // Add cash in logic here
  };

  const handleCashOut = () => {
    console.log("Cash Out clicked");
    // Add cash out logic here
  };

  const handleClear = () => {
    console.log("CLEAR clicked");
    // Add clear logic here
  };

  return (
    <div className="w-0 h-0 overflow-hidden">

      {/* TOGGLE BUTTON */}
      {/* <button
        onClick={togglePanel}
        className="absolute top-5 right-5 z-50 bg-white/10 backdrop-blur-xl 
                   border border-white/20 p-3 rounded-2xl text-white"
      >
        {showPanel ? <X size={20} /> : <Menu size={20} />}
      </button> */}

      {/* === FULL SCREEN SLIDING PANEL === */}
      <div
        className={`
          fixed inset-0 z-50
          backdrop-blur-sm border-l border-white/10
          transition-transform duration-500 ease-[cubic-bezier(.25,.8,.25,1)]
          p-4 overflow-hidden mt-16
          ${showPanel ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <div className="grid grid-cols-1 gap-4 h-full">

          {/* LEFT SIDE */}
          <div className="xl:col-span-2 flex flex-col h-full overflow-hidden gap-4">

            {/* PRODUCT TABLE */}
            <div className="rounded-2xl border p-4 flex-1 overflow-auto backdrop-blur">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b font-bold text-xl">
                    <th className="py-2">Product Name</th>
                    <th className="py-2">Qty</th>
                    <th className="py-2">Price</th>
                    <th className="py-2">Amount</th>
                  </tr>
                </thead>
                <tbody className="">
                  <tr className="border-b">
                    <td className="py-2">HP Dragonfly g2 16/512GB</td>
                    <td>2</td>
                    <td>120'000</td>
                    <td>110'000</td>
                  </tr>
                  <tr>
                    <td className="py-2">Dell Latitude 7200 8/256GB</td>
                    <td>3</td>
                    <td>60'000</td>
                    <td>54'000</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* TOTALS */}
            <div className="rounded-2xl border p-4 backdrop-blur overflow-auto">
              <div className="flex justify-between text-lg">
                <span>Product Cost:</span>
                <span className="font-semibold">164'000</span>
              </div>

              <div className="mt-2 text-sm space-y-1">
                <div className="flex justify-between"><span>Total:</span><span>180'000</span></div>
                <div className="flex justify-between"><span>Discount:</span><span>16'000</span></div>
                <div className="flex justify-between"><span>Advance:</span><span>10'000</span></div>
                <div className="flex justify-between"><span>Due:</span><span>2'000</span></div>
              </div>

              <div className="text-right font-bold text-xl mt-2">Total Sum: 156'000</div>
            </div>
          </div>

          {/* RIGHT SIDE BUTTONS */}
          <div className="rounded-2xl flex flex-col h-full overflow-hidden gap-3 border backdrop-blur-xl p-4">

            <div className="grid grid-cols-3 gap-3 overflow-auto flex-1">
              {[
                { label: "Add Product", onClick: handleAddProduct },
                { label: "% Discount", onClick: handleDiscount },
                { label: "Sales Return", onClick: handleSalesReturn },
                { label: "Pre Order", onClick: handlePreOrder },
                { label: "Quotation", onClick: handleQuotation },
                { label: "Invoice", onClick: handleInvoice },
                { label: "Exchange", onClick: handleExchange },
                { label: "Refund", onClick: handleRefund },
                { label: "Delivery", onClick: handleDelivery },
                { label: "Warranty", onClick: handleWarranty },
                { label: "Service", onClick: handleService },
                { label: "Stock", onClick: handleStock },
              ].map((button, i) => (
                <button
                  key={i}
                  onClick={button.onClick}
                  className={`py-3 rounded-xl font-bold border backdrop-blur-lg transition-colors cursor-pointer ${isDarkMode? "hover:bg-gray-800": "hover:bg-gray-300"}`}
                >
                  {button.label}
                </button>
              ))}
            </div>

            <button 
              onClick={handleConfirmSell}
              className="w-full bg-green-500 text-white font-bold py-3 rounded-xl text-lg hover:bg-green-600 transition-colors cursor-pointer"
            >
              Confirm Sell
            </button>

            <div className="flex gap-3">
              <button 
                onClick={handleCashIn}
                className="flex-1 bg-green-200 text-black py-3 rounded-lg font-semibold hover:bg-green-300 transition-colors cursor-pointer"
              >
                Cash IN
              </button>
              <button 
                onClick={handleCashOut}
                className="flex-1 bg-red-200 text-black py-3 rounded-lg font-semibold hover:bg-red-300 transition-colors cursor-pointer"
              >
                Cash Out
              </button>
            </div>

            <button 
              onClick={handleClear}
              className="w-full bg-gray-400 text-black py-3 rounded-lg font-semibold hover:bg-gray-500 transition-colors cursor-pointer"
            >
              CLEAR
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default POSPanel;
"use client";

import { useAppDispatch, useAppSelector } from "@/app/redux";
import { setIsPOSPanelOpen } from "@/state";
import { Menu, X, Search, SearchIcon } from "lucide-react";

const POSPanel = () => {
  const dispatch = useAppDispatch();
  const showPanel = useAppSelector((state) => state.global.isPOSPanelOpen);
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);

  const togglePanel = () => {
    dispatch(setIsPOSPanelOpen(!showPanel));
  };

  // Button click handlers (keep your existing handlers)
  const handleAddProduct = () => {
    console.log("Add Product clicked");
  };

  const handleDiscount = () => {
    console.log("Discount clicked");
  };

  const handleSalesReturn = () => {
    console.log("Sales Return clicked");
  };

  const handlePreOrder = () => {
    console.log("Pre Order clicked");
  };

  const handleQuotation = () => {
    console.log("Quotation clicked");
  };

  const handleInvoice = () => {
    console.log("Invoice clicked");
  };

  const handleExchange = () => {
    console.log("Exchange clicked");
  };

  const handleRefund = () => {
    console.log("Refund clicked");
  };

  const handleDelivery = () => {
    console.log("Delivery clicked");
  };

  const handleWarranty = () => {
    console.log("Warranty clicked");
  };

  const handleService = () => {
    console.log("Service clicked");
  };

  const handleStock = () => {
    console.log("Stock clicked");
  };

  const handleConfirmSell = () => {
    console.log("Confirm Sell clicked");
  };

  const handleCashIn = () => {
    console.log("Cash IN clicked");
  };

  const handleCashOut = () => {
    console.log("Cash Out clicked");
  };

  const handleClear = () => {
    console.log("CLEAR clicked");
  };

  return (
    <div className="w-0 h-0 overflow-hidden">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 grid-rows-5 gap-4 h-full">
          {/* === LEFT SIDE (2 COLUMN 4 ROW) === */}
          <div className="col-span-2 row-span-5 flex flex-col h-full gap-4">
            {/* SEARCH BAR */}
            {/* LEFT: PRODUCT SEARCH */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border p-4 backdrop-blur">
                {" "}
                <label className="block text-sm font-medium mb-1">
                  Search Products
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full p-3 border rounded-xl dark:bg-gray-800"
                        placeholder="Enter product name, code, barcode or scan..."
                      />
                      <button className="absolute right-3 top-3">🔍</button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleAddProduct}
                      className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      {/* <SearchIcon>Search Product</SearchIcon> */}
                      Search Product
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {/* ROW 1: PRODUCT DETAILS with quantity controls and remove option */}
            <div className="rounded-2xl border p-4 backdrop-blur overflow-auto h-15/20">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Product Details</h2>
              </div>

              <table className="w-full text-left">
                <thead>
                  <tr className="border-b font-bold">
                    <th className="py-2">No</th>
                    <th className="py-2">Product Name</th>
                    <th className="py-2">Qty</th>
                    <th className="py-2">Price</th>
                    <th className="py-2">Discounted Price</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">1</td>
                    <td className="py-2">HP Dragonfly g2 16/512GB</td>
                    <td className="py-2">
                      <div className="flex items-center space-x-2">
                        <button className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                          -
                        </button>
                        <span className="w-12 text-center">2</span>
                        <button className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                          +
                        </button>
                      </div>
                    </td>
                    <td className="py-2">120'000</td>
                    <td className="py-2">110'000</td>
                    <td className="py-2">
                      <button
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                        onClick={() => console.log("Remove product 1")}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2">2</td>
                    <td className="py-2">Dell Latitude 7200 8/256GB</td>
                    <td className="py-2">
                      <div className="flex items-center space-x-2">
                        <button className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                          -
                        </button>
                        <span className="w-12 text-center">3</span>
                        <button className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                          +
                        </button>
                      </div>
                    </td>
                    <td className="py-2">60'000</td>
                    <td className="py-2">54'000</td>
                    <td className="py-2">
                      <button
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                        onClick={() => console.log("Remove product 2")}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            {/* ROW 2: TOTALS (uneditable) */}
            <div className="rounded-2xl border p-4 backdrop-blur overflow-auto h-4/20">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold">Final Summary</h2>
                <span className="text-sm text-gray-500">
                  All amounts are calculated automatically
                </span>
              </div>

              <div className="flex justify-between text-lg mb-2">
                <span>Product Cost:</span>
                <span className="font-semibold">164'000</span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>180'000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>9'000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service Charge:</span>
                    <span>1'000</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span className="text-red-500">-16'000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Advance Paid:</span>
                    <span className="text-green-500">-10'000</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Due Amount:</span>
                    <span>2'000</span>
                  </div>
                </div>
              </div>

              <div className="text-right font-bold text-2xl mt-4 pt-4 border-t">
                Total Payable: 156'000
              </div>
            </div>
          </div>

          {/* === RIGHT SIDE (1 COLUMN 4 ROW) === */}
          <div className="col-span-1 row-span-5 flex flex-col gap-4">
            {/* TOP ROW: CUSTOMER Lists */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border p-4 backdrop-blur">
                {" "}
                <label className="block text-sm font-medium mb-1">
                  Search Customers
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full p-3 border rounded-xl dark:bg-gray-800"
                        placeholder="Enter Customer name..."
                      />
                      <button className="absolute right-3 top-3">🔍</button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleAddProduct}
                      className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      {/* <SearchIcon>Search Product</SearchIcon> */}
                      Search Customer
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border p-4 backdrop-blur-xl h-10/20">
              <h2 className="text-lg font-bold mb-3">Customer Lists</h2>

              <div className="space-y-3">
                {/* Customer 1 */}
                <div className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">John Doe</h3>
                      <p className="text-sm text-gray-500">+1234567890</p>
                      <p className="text-sm text-gray-500">john@example.com</p>
                    </div>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                      Regular
                    </span>
                  </div>
                  <div className="mt-2 text-sm">
                    <p>Total Purchases: 12</p>
                    <p>Last Purchase: 2 days ago</p>
                  </div>
                </div>

                {/* Customer 2 */}
                <div className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">Jane Smith</h3>
                      <p className="text-sm text-gray-500">+0987654321</p>
                      <p className="text-sm text-gray-500">jane@example.com</p>
                    </div>
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                      VIP
                    </span>
                  </div>
                  <div className="mt-2 text-sm">
                    <p>Total Purchases: 45</p>
                    <p>Last Purchase: Yesterday</p>
                  </div>
                </div>

                {/* Customer 3 */}
                <div className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">Bob Johnson</h3>
                      <p className="text-sm text-gray-500">+1122334455</p>
                      <p className="text-sm text-gray-500">bob@example.com</p>
                    </div>
                    <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                      New
                    </span>
                  </div>
                  <div className="mt-2 text-sm">
                    <p>Total Purchases: 3</p>
                    <p>Last Purchase: 1 week ago</p>
                  </div>
                </div>

                {/* Add more customers as needed */}
                <button className="w-full p-3 border border-dashed rounded-lg text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  + Load More Customers
                </button>
              </div>
            </div>

            {/* BOTTOM ROW: Action buttons (as before) */}
            <div className="rounded-2xl border p-4 backdrop-blur-xl flex-1 flex flex-col gap-3 h-1/20">
              <div className="grid grid-cols-2 gap-3 overflow-auto flex-1">
                {[
                  { label: "% Discount", onClick: handleDiscount },
                  { label: "Refund", onClick: handleRefund },
                  { label: "Pre Order", onClick: handlePreOrder },
                  { label: "Quotation", onClick: handleQuotation },
                  { label: "Exchange", onClick: handleExchange },
                  { label: "Delivery", onClick: handleDelivery },
                  { label: "Warranty", onClick: handleWarranty },
                  { label: "Service", onClick: handleService },
                ].map((button, i) => (
                  <button
                    key={i}
                    onClick={button.onClick}
                    className={`py-3 rounded-xl shadow-2xl font-bold border backdrop-blur-lg transition-colors cursor-pointer ${
                      isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-300"
                    }`}
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
    </div>
  );
};

export default POSPanel;

"use client";
import { useAppDispatch, useAppSelector } from "@/app/redux";
import { setIsSidebarCollapsed } from "@/state";
import {
  ArrowLeftRight,
  CircleDollarSign,
  DollarSign,
  House,
  Layout,
  ListCheck,
  ListChecks,
  LucideIcon,
  Menu,
  Package,
  PackagePlus,
  PackageSearch,
  Redo2,
  Settings,
  TrendingUp,
  Truck,
  Undo2,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import logo from "../../../../public/floppy.jpg";

interface SidebarLinkProps {
  href: string;
  icon: LucideIcon;
  label: string;
  isCollapsed: boolean;
}

const SidebarLink = ({
  href,
  icon: Icon,
  label,
  isCollapsed,
}: SidebarLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname === href || (pathname === "/" && href === "/dashboard");

  return (
    <Link href={href}>
      <div
        className={`cursor-pointer flex items-center ${
          isCollapsed ? "justify-center py-4" : "justify-start px-8 py-4"
        } hover:text-blue-500 hover:bg-blue-100 gap-3 transition-colors ${
          isActive ? "bg-blue-200 text-blue-500" : ""
        }`}
      >
        <Icon className="w-6 h-6" />
        <span className={`${isCollapsed ? "hidden" : "block"} font-medium `}>
          {label}
        </span>
      </div>
    </Link>
  );
};

const Sidebar = () => {
  const dispatch = useAppDispatch();
  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed
  );

  const toggleSidebar = () => {
    dispatch(setIsSidebarCollapsed(!isSidebarCollapsed));
  };

  const sidebarClassNames = `fixed flex flex-col mt-20 ${
    isSidebarCollapsed ? "w-0 md:w-16" : "w-72 md:w-64"
  } transition-all overflow-hidden h-full shadow-md z-40`;

  return (
    <div className={sidebarClassNames}>
      {/* {top logo} */}
      {/* <div
        className={`flex gap-3 h-16 items-center ${
          isSidebarCollapsed ? "px-4" : "px-8"
        }`}
      >
        <Image src={logo} alt="logo" className="rounded w-7 h-7" />
        <h1
          className={`whitespace-nowrap transition-all duration-1000 ease-in-out ${
            isSidebarCollapsed
              ? "opacity-0 scale-x-0 w-0"
              : "opacity-100 scale-x-100 w-auto"
          } font-extrabold text-lg`}
        >
          FLOPPY IT
        </h1>
        <button
          className="md:hidden px-3 py-3 rounded-full hover:bg-blue-100"
          onClick={toggleSidebar}
        >
          <Menu className="w-6 h-6" />
        </button>
      </div> */}
      {/* Links */}
      <div className="flex-grow">
        <SidebarLink
          href="/dashboard"
          icon={Layout}
          label="Dashboard"
          isCollapsed={isSidebarCollapsed}
        />
        <SidebarLink
          href="/product"
          icon={Package}
          label="Products"
          isCollapsed={isSidebarCollapsed}
        />
        <SidebarLink
          href="/sale"
          icon={TrendingUp}
          label="Sales"
          isCollapsed={isSidebarCollapsed}
        />
        <SidebarLink
          href="/salesreturn"
          icon={Undo2}
          label="Sales Return"
          isCollapsed={isSidebarCollapsed}
        />
        <SidebarLink
          href="/purchase"
          icon={PackagePlus}
          label="Purchases"
          isCollapsed={isSidebarCollapsed}
        />
        <SidebarLink
          href="/purchasereturn"
          icon={Redo2}
          label="Purchase Return"
          isCollapsed={isSidebarCollapsed}
        />
        <SidebarLink
          href="/exchange"
          icon={ArrowLeftRight}
          label="Exchange"
          isCollapsed={isSidebarCollapsed}
        />
        <SidebarLink
          href="/service"
          icon={ListChecks}
          label="Service"
          isCollapsed={isSidebarCollapsed}
        />
        <SidebarLink
          href="/enquiry"
          icon={PackageSearch}
          label="Enquiry"
          isCollapsed={isSidebarCollapsed}
        />
        <SidebarLink
          href="/expenses"
          icon={CircleDollarSign}
          label="Expenses"
          isCollapsed={isSidebarCollapsed}
        />
        <SidebarLink
          href="/delivery"
          icon={Truck}
          label="Delivery"
          isCollapsed={isSidebarCollapsed}
        />
        <SidebarLink
          href="/users"
          icon={User}
          label="User"
          isCollapsed={isSidebarCollapsed}
        />
        <SidebarLink
          href="/settings"
          icon={Settings}
          label="Settings"
          isCollapsed={isSidebarCollapsed}
        />
      </div>
      {/* footer */}
      <div className={`${isSidebarCollapsed ? "hidden" : "block"} mb-10`}>
        <p className="text-center text-xs text-gray-500">&copy; 2025 Sunbeam</p>
      </div>
    </div>
  );
};

export default Sidebar;

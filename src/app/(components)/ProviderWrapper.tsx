"use client";

import { ReactNode } from "react";
import DashboardWrapper from "../dashboard/dashboardWrapper";
import POSPanel from "../(components)/POSPanel/page";

interface ProviderWrapperProps {
  children: ReactNode;
}

export default function ProviderWrapper({ children }: ProviderWrapperProps) {
  return (
    <DashboardWrapper>
      {children}
      <POSPanel />
    </DashboardWrapper>
  );
}
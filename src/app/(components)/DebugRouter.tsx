// components/DebugRouter.tsx
"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export const DebugRouter = () => {
  const pathname = usePathname();
  
  useEffect(() => {
    console.log('🔗 Current route:', pathname);
  }, [pathname]);
  
  return null;
};
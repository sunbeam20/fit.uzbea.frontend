"use client";
import Dashboard from "@/app/dashboard/page";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/app/redux";
import Link from "next/link";

export default function Home() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  if (isAuthenticated) {
    return (
      // <div className="min-h-screen flex items-center justify-center">
      //   <div className="text-center">
      //     <h1 className="text-3xl font-bold mb-4">Welcome to FLOPPY IT</h1>
      //     <p>You are logged in. Go to your dashboard.</p>
      //     <Link href="/dashboard" className="text-blue-600 hover:underline">
      //       Go to Dashboard
      //     </Link>
      //   </div>
      // </div>
      <Dashboard/>
    );
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Welcome to FLOPPY IT</h1>
          <p>Please log in to continue.</p>
          <Link href="/login" className="text-blue-600 hover:underline">
            Go to Login
          </Link>
        </div>
      </div>
      {/* <Dashboard /> */}
    </>
  );
}

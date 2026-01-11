import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import StoreProvider from "./redux";
import { DebugRouter } from "./(components)/DebugRouter";
import AuthInitializer from "./(components)/AuthInitializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FLOPPY IT",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* StoreProvider must be the outermost wrapper */}
        <StoreProvider>
          <AuthInitializer>
            <DebugRouter />
            {/* AuthGuard will be called inside DashboardWrapper */}
            {children}
          </AuthInitializer>
        </StoreProvider>
      </body>
    </html>
  );
}

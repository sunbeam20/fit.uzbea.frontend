"use client";
import Dashboard from "@/app/dashboard/page";
import { useSelector } from "react-redux";
import { RootState } from "@/app/redux";
import Link from "next/link";
import Image from "next/image";
import ProviderWrapper from "./(components)/ProviderWrapper";
import {
  Laptop,
  ShoppingCart,
  BarChart3,
  Users,
  Package,
  ArrowRight,
  Shield,
  Clock,
  CheckCircle,
  Store,
  Smartphone,
  Headphones,
  Monitor,
} from "lucide-react";
import logo from "../../public/floppy.jpg";

export default function Home() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  if (isAuthenticated) {
    return (
      <ProviderWrapper>
        <Dashboard />
      </ProviderWrapper>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950">
      {/* Header */}
      <header className="px-6 py-4 border-b border-gray-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br bg-black rounded-lg flex items-center justify-center">
              <Image
                src={logo}
                alt="logo"
                className="rounded w-8 h-8 flex-shrink-0"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">FLOPPY IT</h1>
              {/* <p className="text-xs text-gray-600 dark:text-gray-400">Laptops & PC Accessories</p> */}
            </div>
          </div>
          <Link
            href="/login"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Content */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-full">
              <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Trusted Since 2015
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              We Ensure Quality
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                Choice is Your!
              </span>
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
              Your one-stop destination for laptops, gaming rigs, and premium PC
              accessories. Quality products backed by expert support and
              comprehensive warranties.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="group px-8 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all inline-flex items-center justify-center gap-2"
              >
                <span>Explore Products</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="px-8 py-3.5 bg-gray-800 border border-gray-700 text-gray-300 font-semibold rounded-xl bg-gray-750 transition-colors"
              >
                Get Consultation
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              {
                icon: ShoppingCart,
                title: "Smart POS",
                description:
                  "Fast checkout with barcode scanning and multiple payment options",
              },
              {
                icon: Package,
                title: "Inventory",
                description:
                  "Real-time stock tracking and automatic reorder alerts",
              },
              {
                icon: Users,
                title: "CRM",
                description:
                  "Complete customer management with purchase history",
              },
              {
                icon: BarChart3,
                title: "Analytics",
                description: "Sales insights and business performance reports",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-700 transition-colors"
              >
                <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Product Categories */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white text-center mb-8">
              Shop by Category
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Laptop, name: "Laptops", count: "50+ Models" },
                { icon: Monitor, name: "Monitors", count: "30+ Variants" },
                {
                  icon: Smartphone,
                  name: "Mobile & Tablets",
                  count: "40+ Items",
                },
                { icon: Headphones, name: "Audio Gear", count: "25+ Brands" },
              ].map((category, index) => (
                <div
                  key={index}
                  className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-700 transition-colors group"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <category.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-semibold text-white mb-1">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-400">{category.count}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-gradient-to-r from-blue-900/20 to-cyan-900/20 rounded-2xl p-8 mb-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Shield,
                  title: "Warranty & Support",
                  items: [
                    "1-3 Years Warranty",
                    "24/7 Technical Support",
                    "Free Delivery",
                  ],
                },
                {
                  icon: Clock,
                  title: "Fast Delivery",
                  items: [
                    "Same-day in Metro Cities",
                    "2-3 Days Nationwide",
                    "Easy Returns",
                  ],
                },
                {
                  icon: CheckCircle,
                  title: "Secure Payment",
                  items: [
                    "0% EMI Available",
                    "Multiple Payment Options",
                    "SSL Secured",
                  ],
                },
              ].map((benefit, index) => (
                <div key={index}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center">
                      <benefit.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">
                      {benefit.title}
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {benefit.items.map((item, idx) => (
                      <li key={idx} className="flex items-center text-gray-400">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-1">500+</div>
              <div className="text-sm text-gray-400">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-1">1000+</div>
              <div className="text-sm text-gray-400">Products Sold</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-1">4.8★</div>
              <div className="text-sm :text-gray-400">Customer Rating</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-1">50+</div>
              <div className="text-sm text-gray-400">Brand Partners</div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Experience Tech Excellence?
            </h2>
            <p className="text-lg text-gray-300 mb-8 max-w-xl mx-auto">
              Join our retail management system to streamline your business
              operations.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all"
            >
              <Store className="w-5 h-5" />
              <span>Start Free Trial</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-9 h-9 bg-gradient-to-br from-gray-600 to-gray-500 rounded flex items-center justify-center">
                <Image
                  src={logo}
                  alt="logo"
                  className="rounded w-8 h-8 flex-shrink-0"
                />
              </div>
              <span className="text-lg font-semibold text-white">
                FLOPPY IT
              </span>
            </div>
            <div className="flex gap-6 text-sm">
              <a
                href="#"
                className="text-gray-400 hover:text-blue-400 transition-colors"
              >
                Terms
              </a>
              <a
                href="#"
                className="\text-gray-400 \hover:text-blue-400 transition-colors"
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-blue-400 transition-colors"
              >
                Contact
              </a>
            </div>
            <div className="mt-4 md:mt-0 text-sm text-gray-400">
              © {new Date().getFullYear()} FLOPPY IT. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

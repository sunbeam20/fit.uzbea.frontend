import { Facebook, Mail, MessageCircle } from "lucide-react";
const Footer = () => {
  return (
    <footer className="w-full border-t border-gray-300 mt-12">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              FLOPPY IT
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 max-w-md">
              Your trusted partner for IT solutions and business management.
              Streamlining operations with innovative technology.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://www.facebook.com/mdshuvo022021"
                className="text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                target="_blank"
              >
                <Facebook className="size-6" />
              </a>
              <a
                href="mailto:itfloppy@gmail.com"
                className="text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                target="_blank"
              >
                <Mail className="size-6" />
              </a>
              <a
                href="https://wasap.my/8801979022021"
                className="text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                target="_blank"
              >
                <MessageCircle className="size-6"/>
              </a>
            </div>
            <span className="text-gray-400 text-sm">Designed by Sunbeam</span>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="/dashboard"
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 text-sm transition-colors"
                >
                  Dashboard
                </a>
              </li>
              <li>
                <a
                  href="/product"
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 text-sm transition-colors"
                >
                  Products
                </a>
              </li>
              <li>
                <a
                  href="/sale"
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 text-sm transition-colors"
                >
                  Sales
                </a>
              </li>
              <li>
                <a
                  href="/purchase"
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 text-sm transition-colors"
                >
                  Purchase
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white uppercase tracking-wider mb-4">
              Support
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 text-sm transition-colors"
                >
                  Help Center
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 text-sm transition-colors"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 text-sm transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 text-sm transition-colors"
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            &copy; 2025 Floppy IT. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a
              href="#"
              className="text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 text-sm transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 text-sm transition-colors"
            >
              Terms of Service
            </a>
            <a
              href="#"
              className="text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 text-sm transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

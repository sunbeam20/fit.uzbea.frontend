import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface Product {
  id: number;
  productCode: string;
  name: string;
  specification?: string | null;
  description?: string | null;
  quantity: number;
  useIndividualSerials: boolean;
  status: "Active" | "Unavailable" | "Discontinued";
  category_id: number;
  supplier_id?: number;
  created_by?: number;
  updated_by?: number;
  createdAt: string;
  updatedAt: string;
  Categories?: {
    id: number;
    name: string;
  };
  supplier?: {
    id: number;
    suppId?: string;
    name: string;
    email?: string;
    phone: string;
    address?: string;
  };
  productSerials?: ProductSerial[];
  creator?: {
    id: number;
    userId?: string;
    name: string;
    email: string;
  };
  updater?: {
    id: number;
    userId?: string;
    name: string;
    email: string;
  };
}

export interface ProductSerial {
  id: number;
  serial: string;
  product_id: number;
  status:
    | "Available"
    | "Sold"
    | "Returned"
    | "Unavailable"
    | "InService"
    | "Exchanged";
  warranty: "Yes" | "No";
  purchasePrice: number;
  wholesalePrice: number;
  retailPrice: number;
  productType: "New" | "PreOwned";
  supplier_id?: number;
  createdAt: string;
  updatedAt: string;
  supplier?: {
    id: number;
    suppId?: string;
    name: string;
    email?: string;
    phone: string;
    address?: string;
  };
  saleInfo?: {
    saleNo: string;
    customerName: string;
    saleDate: string;
    soldPrice: number;
  } | null;
}

export interface CreateProductRequest {
  name: string;
  specification?: string;
  description?: string;
  quantity: number;
  useIndividualSerials: boolean;
  category_id: number;
  supplier_id?: number;
  userId?: number;
  serials?: Array<{
    serial: string;
    warranty?: "Yes" | "No";
    purchasePrice: number;
    wholesalePrice: number;
    retailPrice: number;
    productType: "New" | "PreOwned";
    supplier_id?: number;
  }>;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {}

export interface Category {
  id: number;
  name: string;
}

export interface Sale {
  id: number;
  saleNo: string;
  totalAmount: number;
  totalPaid: number;
  totaldiscount?: number;
  dueDate?: string | null;
  customer_id?: number;
  user_id: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  Customers?: {
    id: number;
    custId?: string;
    name: string;
    email?: string;
    phone: string;
    address?: string;
  };
  Users?: {
    id: number;
    userId?: string;
    name: string;
    email: string;
  };
  SalesItems: SaleItem[];
  Payments?: Payment[];
}

export interface SaleItem {
  id: number;
  quantity: number;
  unitPrice: number;
  discount?: number;
  sales_id: number;
  product_id: number;
  Products?: {
    id: number;
    productCode?: string;
    name: string;
    specification?: string;
    useIndividualSerials: boolean;
    status: "Active" | "Unavailable" | "Discontinued";
  };
  salesItemSerials?: Array<{
    id: number;
    salesItem_id: number;
    serial_id: number;
    soldPrice: number;
    soldAt: string;
    ProductSerials?: ProductSerial;
  }>;
}

export interface CreateSaleRequest {
  customer_id?: number;
  user_id: number;
  totalAmount: number;
  totalPaid?: number;
  totaldiscount?: number;
  dueDate?: string;
  items: Array<{
    product_id: number;
    quantity: number;
    unitPrice: number;
    discount?: number;
    serials?: string[];
  }>;
}

export interface CreateSaleFromPOSRequest {
  customer_id?: number;
  items: Array<{
    product_id: number;
    quantity: number;
    unitPrice: number;
    discount?: {
      type: "percentage" | "fixed";
      value: number;
    };
  }>;
  totalAmount: number;
  totalPaid?: number;
  discount?: number;
}

export interface UpdateSaleRequest {
  totalPaid?: number;
  dueDate?: string;
  customer_id?: number;
  user_id?: number;
  totaldiscount?: number;
}

export interface SalesStats {
  totalSales: number;
  totalRevenue: number;
  totalPaid: number;
  totalDiscount?: number;
  pendingSales: number;
  completedSales: number;
  totalDue: number;
  netRevenue?: number;
}

export interface SalesReturn {
  id: number;
  returnNo: string;
  total_payback: number;
  note: string;
  sales_id: number;
  user_id: number;
  customer_id: number;
  createdAt: string;
  updatedAt: string;
  Sales?: Sale;
  Users?: {
    id: number;
    userId?: string;
    name: string;
    email: string;
  };
  Customers?: {
    id: number;
    custId?: string;
    name: string;
    email?: string;
    phone: string;
    address?: string;
  };
  SalesReturnItems?: SalesReturnItem[];
}

export interface SalesReturnItem {
  id: number;
  quantity: number;
  unitPrice: number;
  product_id: number;
  salesReturn_id: number;
  productSerialsId?: number;
  Products?: Product;
  salesReturnItemSerials?: Array<{
    id: number;
    salesReturnItem_id: number;
    serial_id: number;
    returnedPrice: number; // Added: from SalesReturnItemSerials
    returnedAt: string;
    ProductSerials?: ProductSerial;
  }>;
}

export interface Purchase {
  id: number;
  purchaseNo: string;
  totalAmount: number;
  totalPaid: number;
  dueDate: string;
  note?: string;
  supplier_id: number;
  user_id: number;
  createdAt: string;
  updatedAt: string;
  Suppliers?: Supplier;
  Users?: {
    id: number;
    userId?: string;
    name: string;
    email: string;
  };
  PurchasesItems: PurchaseItem[];
}

export interface PurchaseItem {
  id: number;
  quantity: number;
  unitPrice: number;
  purchase_id: number;
  product_id: number;
  Products?: Product;
  purchaseItemSerials?: Array<{
    id: number;
    purchaseItem_id: number;
    serial_id: number;
    purchasedPrice: number; // Added: from PurchaseItemSerials
    purchasedAt: string;
    ProductSerials?: ProductSerial;
  }>;
}

export interface CreatePurchaseData {
  totalAmount: number;
  totalPaid: number;
  dueDate: string;
  note?: string;
  supplier_id: number;
  user_id: number;
  items: Array<{
    product_id: number;
    quantity: number;
    unitPrice: number;
    serials?: string[];
  }>;
}

export interface UpdatePurchaseData {
  totalAmount?: number;
  totalPaid?: number;
  dueDate?: string;
  note?: string;
  supplier_id?: number;
  items?: Array<{
    product_id: number;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface Supplier {
  id: number;
  suppId?: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
}

export interface PurchaseReturn {
  id: number;
  returnNo: string;
  totalPaid: number;
  note: string;
  purchase_id: number;
  user_id: number;
  supplier_id: number;
  createdAt: string;
  updatedAt: string;
  Purchases?: Purchase;
  Users?: {
    id: number;
    userId?: string;
    name: string;
    email: string;
  };
  Suppliers?: Supplier;
  PurchasesReturnItems?: PurchaseReturnItem[];
}

export interface PurchaseReturnItem {
  id: number;
  quantity: number;
  unitPrice: number;
  products_id: number;
  purchaseReturn_id: number;
  Products?: Product;
  purchaseReturnItemSerials?: Array<{
    id: number;
    purchaseReturnItem_id: number;
    serial_id: number;
    returnedPrice: number; // Added: from PurchaseReturnItemSerials
    returnedAt: string;
    ProductSerials?: ProductSerial;
  }>;
}

export interface Exchange {
  id: number;
  exchangeNo: string;
  totalPaid: number;
  totalPayback: number;
  note: string;
  sales_id: number;
  user_id: number;
  customer_id: number;
  createdAt: string;
  updatedAt: string;
  Sales?: Sale;
  Users?: {
    id: number;
    userId?: string;
    name: string;
    email: string;
  };
  Customers?: {
    id: number;
    custId?: string;
    name: string;
    email?: string;
    phone: string;
    address?: string;
  };
  ExchangeItems?: ExchangeItem[];
}

export interface ExchangeItem {
  id: number;
  quantity: number;
  unitPrice: number;
  note: string;
  oldProduct_id: number;
  newProduct_id: number;
  exchangeId?: number;
  createdAt: string;
  updatedAt: string;
  oldProduct?: Product;
  newProduct?: Product;
  exchangeItemSerials?: Array<{
    id: number;
    exchangeItem_id: number;
    serial_id_old: number;
    serial_id_new: number;
    exchangePrice: number; // Added: from ExchangeItemSerials
    exchangedAt: string;
    OldProductSerials?: ProductSerial;
    NewProductSerials?: ProductSerial;
  }>;
}

export interface Service {
  id: number;
  serviceNo: string;
  serviceProductName: string;
  serviceDescription: string;
  serviceCost: number;
  serviceStatus: string;
  customer_id?: number;
  user_id?: number;
  createdAt: string;
  updatedAt: string;
  Customers?: {
    id: number;
    custId?: string;
    name: string;
    email?: string;
    phone: string;
    address?: string;
  };
  Users?: {
    id: number;
    userId?: string;
    name: string;
    email: string;
  };
}

export interface Customer {
  id: number;
  custId?: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  Sales?: Array<{
    id: number;
    saleNo?: string;
    totalAmount: number;
    totalPaid: number;
    createdAt: string;
  }>;
  SalesReturn?: Array<{
    id: number;
    returnNo?: string;
    total_payback: number;
    createdAt: string;
  }>;
  Exchanges?: Array<{
    id: number;
    exchangeNo?: string;
    totalPaid: number;
    totalPayback: number;
    createdAt: string;
  }>;
  Services?: Array<{
    id: number;
    serviceNo?: string;
    serviceProductName: string;
    serviceCost: number;
    serviceStatus: string;
  }>;
}

export interface CreateCustomerRequest {
  name: string;
  email?: string;
  phone: string;
  address?: string;
}

export interface UpdateCustomerRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface User {
  user: any;
  id: number;
  userId?: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  password?: string;
  status: "Active" | "Inactive";
  role_id: number;
  createdAt: string;
  updatedAt: string;
  Roles?: {
    id: number;
    name: string;
  };
}

export interface Roles {
  id: number;
  name: string;
}

export interface SaleSummary extends Omit<Sale, "SalesItems"> {
  created_at: string;
}

export interface PurchaseSummary extends Omit<Purchase, "PurchasesItems"> {
  created_at: string;
}

export interface ExchangeSummary extends Omit<Exchange, "ExchangeItems"> {
  created_at: string;
}

export interface ServiceSummary extends Omit<Service, "Customers" | "Users"> {}

export interface CreateSalesReturnRequest {
  sales_id: number;
  user_id: number;
  customer_id: number;
  total_payback?: number;
  note: string;
  items?: Array<{
    product_id: number;
    quantity: number;
    unitPrice: number;
    productSerialsId?: number;
  }>;
}

export interface SalesReturnItemFrontend {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  return_reason: string;
}

export interface SalesReturnFrontend extends Omit<SalesReturn, "SalesReturnItems"> {
  return_number: string;
  original_invoice: string;
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  date: string;
  total_amount: number;
  reason: string;
  status: "completed" | "pending" | "rejected";
  refund_method: string;
  items: SalesReturnItemFrontend[];
  created_at: string;
  updated_at: string;
}

export interface PurchaseReturnItemFrontend {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  return_reason: string;
}

export interface PurchaseReturnFrontend extends Omit<PurchaseReturn, "PurchasesReturnItems"> {
  return_number: string;
  original_invoice: string;
  supplier_name: string;
  supplier_phone?: string;
  supplier_address?: string;
  date: string;
  total_amount: number;
  reason: string;
  status: "completed" | "pending" | "rejected";
  refund_method: string;
  items: PurchaseReturnItemFrontend[];
  created_at: string;
  updated_at: string;
}

export interface ExchangeItemFrontend {
  id: number;
  old_product_id: number;
  old_product_name: string;
  new_product_id: number;
  new_product_name: string;
  quantity: number;
  unit_price: number;
  note: string;
}

export interface ExchangeFrontend extends Omit<Exchange, "ExchangeItems"> {
  exchange_number: string;
  original_invoice: string;
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  date: string;
  total_paid: number;
  total_payback: number;
  net_amount: number;
  reason: string;
  status: string;
  items: ExchangeItemFrontend[];
  created_at: string;
  updated_at: string;
}

export interface ServiceFrontend extends Omit<Service, "Customers" | "Users"> {
  service_number: string;
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  service_product_name: string;
  service_description: string;
  service_cost: number;
  service_status: string;
  assigned_technician: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: number;
  name: string;
  description: string;
}

export interface RolePermission {
  id: number;
  role_id: number;
  permission_id: number;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  permissions?: Permission;
}

export interface RoleWithPermissions {
  id: number;
  name: string;
  rolePermissions: RolePermission[];
}

export interface UpdateRolePermissionsRequest {
  role_id: number;
  permissions: {
    permission_id: number;
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
  }[];
}

export interface UserPermissionOverride {
  pageAccess: string[];
  dataPermissions: {
    [key: string]: boolean;
  };
}

export interface CustomerStats {
  totalCustomers: number;
  customersWithSales: number;
  customersWithoutSales: number;
  topCustomers: Array<{
    id: number;
    name: string;
    totalSales: number;
    totalRevenue: number;
  }>;
}

export interface PaginatedCustomersResponse {
  customers: Customer[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface DashboardMetrics {
  popularProducts: Product[];
  saleSummary: SaleSummary[];
  purchaseSummary: PurchaseSummary[];
  exchangeSummary: ExchangeSummary[];
  serviceSummary: ServiceSummary[];
}
// Transaction interfaces for product history
export interface ProductTransaction {
  id: number;
  date: string;
  quantity: number;
  price: number;
  total: number;
  customer?: string;
  supplier?: string;
  invoiceNumber?: string;
  status?: string;
  serial?: string;
  isOldProduct?: boolean;
  oldProductName?: string;
  newProductName?: string;
}
export interface Transaction {
  id: number;
  date: string;
  quantity: number;
  price: number;
  total: number;
  customer?: string;
  supplier?: string;
  invoiceNumber?: string;
  status?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role_id?: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ErrorResponse {
  message: string;
  error?: string;
  duplicates?: string[];
}

// Payment type for Cash In (due payments)
export interface Payment {
  id: number;
  sale_id: number;
  customer_id: number;
  user_id: number;
  amount: number;
  payment_method: string;
  payment_date: string;
  notes?: string;
  reference_number?: string;
  createdAt: string;
  updatedAt: string;
  Sales?: Sale;
  Customers?: Customer;
  Users?: User;
}
// PreOrder type
export interface PreOrder {
  id: number;
  productName: string;
  quantity: number;
  specification?: string;
  details?: string;
  price: number;
  totalAmount: number;
  amountPaid: number;
  remainingAmount: number;
  deliveryDate: string;
  status: "pending" | "confirmed" | "delivered" | "cancelled";
  customer_id?: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  notes?: string;
  user_id: number;
  createdAt: string;
  updatedAt: string;
  Customers?: Customer;
  Users?: User;
}

// Expense type
export interface Expense {
  id: number;
  category_id: number;
  amount: number;
  date: string;
  details: string;
  month?: string;
  sale_id?: number;
  customer_id?: number;
  vendor_name?: string;
  user_id: number;
  createdAt: string;
  updatedAt: string;
  ExpenseCategories?: ExpenseCategory;
  Sales?: Sale;
  Customers?: Customer;
  Users?: User;
}

// ExpenseCategory type
export interface ExpenseCategory {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export const api = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "/https://fit-uzbea-backend.vercel.app/",
    prepareHeaders: (headers, { endpoint }) => {
      headers.set("Content-Type", "application/json");

      if (endpoint === "getMe" || endpoint.includes("auth")) {
        headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
        headers.set("Pragma", "no-cache");
        headers.set("Expires", "0");
      }

      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
        console.log("🔐 Authorization header set for", endpoint);
      } else {
        console.log("🔐 No token for", endpoint);
      }

      return headers;
    },
  }),
  reducerPath: "api",
  tagTypes: [
    "DashboardMetrics",
    "Product",
    "Category",
    "ProductSales",
    "ProductExchanges",
    "ProductSalesReturns",
    "ProductPurchases",
    "SalesReturn",
    "PurchaseReturn",
    "Exchange",
    "Service",
    "Sale",
    "Customer",
    "Purchase",
    "User",
    "Supplier",
    "Permission",
    "Role",
    "PreOrder",
    "Payment",
    "Expense",
  ],
  endpoints: (build) => ({
    getDashboardMetrics: build.query<DashboardMetrics, void>({
      query: () => "/dashboard",
      providesTags: ["DashboardMetrics"],
    }),

    searchProducts: build.query<Product[], string>({
      query: (searchTerm) => ({
        url: `product/search`,
        params: { query: searchTerm },
      }),
      providesTags: ["Product"],
    }),

    searchCustomers: build.query<Customer[], string>({
      query: (searchTerm) => ({
        url: `customer/search`,
        params: { query: searchTerm },
      }),
      providesTags: ["Customer"],
    }),

    createSaleFromPOS: build.mutation<
      Sale,
      {
        customer_id?: number;
        items: Array<{
          product_id: number;
          quantity: number;
          unitPrice: number;
          discount?: {
            type: "percentage" | "fixed";
            value: number;
          };
        }>;
        totalAmount: number;
        totalPaid?: number;
        discount?: number;
      }
    >({
      query: (saleData) => ({
        url: "/sale",
        method: "POST",
        body: saleData,
      }),
      invalidatesTags: ["Sale", "Product"],
    }),

    getPOSProducts: build.query<Product[], void>({
      query: () => "/products/pos",
      providesTags: ["Product"],
    }),

    scanBarcode: build.query<Product, string>({
      query: (barcode) => `/products/barcode/${barcode}`,
      providesTags: ["Product"],
    }),

    getProducts: build.query<Product[], void>({
      query: () => "/product",
      providesTags: ["Product"],
    }),

    getProduct: build.query<Product, number>({
      query: (id) => `/product/${id}`,
      providesTags: (result, error, id) => [{ type: "Product", id }],
    }),

    createProduct: build.mutation<Product, CreateProductRequest>({
      query: (product) => ({
        url: "/product",
        method: "POST",
        body: product,
      }),
      invalidatesTags: ["Product"],
    }),

    updateProduct: build.mutation<
      Product,
      { id: number; product: Partial<CreateProductRequest> }
    >({
      query: ({ id, product }) => ({
        url: `/product/${id}`,
        method: "PUT",
        body: product,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Product", id }],
    }),

    deleteProduct: build.mutation<void, number>({
      query: (id) => ({
        url: `/product/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Product"],
    }),

    getCategories: build.query<Category[], void>({
      query: () => "/categories",
      providesTags: ["Category"],
    }),

    createCategory: build.mutation<Category, Partial<Category>>({
      query: (category) => ({
        url: "/categories",
        method: "POST",
        body: category,
      }),
      invalidatesTags: ["Category"],
    }),

    updateCategory: build.mutation<
      Category,
      { id: number; category: Partial<Category> }
    >({
      query: ({ id, category }) => ({
        url: `/categories/${id}`,
        method: "PUT",
        body: category,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Category", id }],
    }),

    deleteCategory: build.mutation<void, number>({
      query: (id) => ({
        url: `/categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Category"],
    }),

    getProductSales: build.query<Transaction[], number>({
      query: (productId) => `product/${productId}/sales`,
      providesTags: (result, error, productId) => [
        { type: "ProductSales", id: productId },
      ],
    }),

    getProductExchanges: build.query<Transaction[], number>({
      query: (productId) => `product/${productId}/exchanges`,
      providesTags: (result, error, productId) => [
        { type: "ProductExchanges", id: productId },
      ],
    }),

    getProductSalesReturns: build.query<Transaction[], number>({
      query: (productId) => `product/${productId}/sales-returns`,
      providesTags: (result, error, productId) => [
        { type: "ProductSalesReturns", id: productId },
      ],
    }),

    getProductPurchases: build.query<Transaction[], number>({
      query: (productId) => `product/${productId}/purchases`,
      providesTags: (result, error, productId) => [
        { type: "ProductPurchases", id: productId },
      ],
    }),

    getSales: build.query<Sale[], void>({
      query: () => "/sale",
      providesTags: ["Sale"],
    }),

    getSale: build.query<Sale, number>({
      query: (id) => `/sale/${id}`,
      providesTags: (result, error, id) => [{ type: "Sale", id }],
    }),

    createSale: build.mutation<Sale, CreateSaleRequest>({
      query: (sale) => ({
        url: "/sale",
        method: "POST",
        body: sale,
      }),
      invalidatesTags: ["Sale", "Product"],
    }),

    updateSale: build.mutation<Sale, { id: number; sale: UpdateSaleRequest }>({
      query: ({ id, sale }) => ({
        url: `/sale/${id}`,
        method: "PUT",
        body: sale,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Sale", id },
        "Sale",
      ],
    }),

    deleteSale: build.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/sale/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Sale", "Product"],
    }),

    getSalesStats: build.query<SalesStats, void>({
      query: () => "/sale/stats",
      providesTags: ["Sale"],
    }),

    getSalesByDateRange: build.query<
      Sale[],
      { startDate: string; endDate: string }
    >({
      query: ({ startDate, endDate }) =>
        `/sales/date-range?startDate=${startDate}&endDate=${endDate}`,
      providesTags: ["Sale"],
    }),

    getSalesReturns: build.query<SalesReturn[], void>({
      query: () => "salesreturn",
      providesTags: ["SalesReturn"],
    }),

    getSalesReturn: build.query<SalesReturn, number>({
      query: (id) => `salesreturn/${id}`,
      providesTags: (result, error, id) => [{ type: "SalesReturn", id }],
    }),

    createSalesReturn: build.mutation<SalesReturn, CreateSalesReturnRequest>({
      query: (salesReturn) => ({
        url: "salesreturn",
        method: "POST",
        body: salesReturn,
      }),
      invalidatesTags: ["SalesReturn"],
    }),

    updateSalesReturn: build.mutation<
      SalesReturn,
      { id: number; salesReturn: Partial<SalesReturn> }
    >({
      query: ({ id, salesReturn }) => ({
        url: `salesreturn/${id}`,
        method: "PUT",
        body: salesReturn,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "SalesReturn", id }],
    }),

    deleteSalesReturn: build.mutation<void, number>({
      query: (id) => ({
        url: `salesreturn/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SalesReturn"],
    }),

    getPurchases: build.query<Purchase[], void>({
      query: () => "/purchase",
      providesTags: ["Purchase"],
    }),

    getPurchaseStatistics: build.query<any, void>({
      query: () => "/purchase/statistics",
    }),

    getPurchasesBySupplier: build.query<Purchase[], number>({
      query: (supplierId) => `/supplier/${supplierId}`,
      providesTags: ["Purchase"],
    }),

    getPurchase: build.query<Purchase, number>({
      query: (id) => `/purchase/${id}`,
      providesTags: (result, error, id) => [{ type: "Purchase", id }],
    }),

    createPurchase: build.mutation<Purchase, CreatePurchaseData>({
      query: (purchaseData) => ({
        url: "/purchase",
        method: "POST",
        body: purchaseData,
      }),
      invalidatesTags: ["Purchase"],
    }),

    updatePurchase: build.mutation<
      Purchase,
      { id: number; data: UpdatePurchaseData }
    >({
      query: ({ id, data }) => ({
        url: `/purchase/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Purchase", id },
        "Purchase",
      ],
    }),

    deletePurchase: build.mutation<void, number>({
      query: (id) => ({
        url: `/purchase/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Purchase"],
    }),

    getPurchaseReturns: build.query<PurchaseReturn[], void>({
      query: () => "purchasereturn",
      providesTags: ["PurchaseReturn"],
    }),

    getPurchaseReturn: build.query<PurchaseReturn, number>({
      query: (id) => `purchasereturn/${id}`,
      providesTags: (result, error, id) => [{ type: "PurchaseReturn", id }],
    }),

    createPurchaseReturn: build.mutation<
      PurchaseReturn,
      Partial<PurchaseReturn>
    >({
      query: (purchaseReturn) => ({
        url: "purchasereturn",
        method: "POST",
        body: purchaseReturn,
      }),
      invalidatesTags: ["PurchaseReturn"],
    }),

    updatePurchaseReturn: build.mutation<
      PurchaseReturn,
      { id: number; purchaseReturn: Partial<PurchaseReturn> }
    >({
      query: ({ id, purchaseReturn }) => ({
        url: `purchasereturn/${id}`,
        method: "PUT",
        body: purchaseReturn,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "PurchaseReturn", id },
      ],
    }),

    deletePurchaseReturn: build.mutation<void, number>({
      query: (id) => ({
        url: `purchasereturn/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["PurchaseReturn"],
    }),

    getExchanges: build.query<Exchange[], void>({
      query: () => "exchange",
      providesTags: ["Exchange"],
    }),

    getExchange: build.query<Exchange, number>({
      query: (id) => `exchange/${id}`,
      providesTags: (result, error, id) => [{ type: "Exchange", id }],
    }),

    createExchange: build.mutation<Exchange, Partial<Exchange>>({
      query: (exchange) => ({
        url: "exchange",
        method: "POST",
        body: exchange,
      }),
      invalidatesTags: ["Exchange"],
    }),

    updateExchange: build.mutation<
      Exchange,
      { id: number; exchange: Partial<Exchange> }
    >({
      query: ({ id, exchange }) => ({
        url: `exchange/${id}`,
        method: "PUT",
        body: exchange,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Exchange", id }],
    }),

    deleteExchange: build.mutation<void, number>({
      query: (id) => ({
        url: `exchange/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Exchange"],
    }),

    getServices: build.query<Service[], void>({
      query: () => "service",
      providesTags: ["Service"],
    }),

    getService: build.query<Service, number>({
      query: (id) => `service/${id}`,
      providesTags: (result, error, id) => [{ type: "Service", id }],
    }),

    createService: build.mutation<Service, Partial<Service>>({
      query: (service) => ({
        url: "service",
        method: "POST",
        body: service,
      }),
      invalidatesTags: ["Service"],
    }),

    updateService: build.mutation<
      Service,
      { id: number; service: Partial<Service> }
    >({
      query: ({ id, service }) => ({
        url: `service/${id}`,
        method: "PUT",
        body: service,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Service", id }],
    }),

    deleteService: build.mutation<void, number>({
      query: (id) => ({
        url: `service/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Service"],
    }),

    getCustomers: build.query<Customer[], void>({
      query: () => "/customer",
      providesTags: ["Customer"],
    }),

    getCustomersWithPagination: build.query<
      PaginatedCustomersResponse,
      { page?: number; limit?: number; search?: string }
    >({
      query: ({ page = 1, limit = 10, search = "" }) =>
        `/customers/pagination?page=${page}&limit=${limit}&search=${search}`,
      providesTags: ["Customer"],
    }),

    getCustomer: build.query<Customer, number>({
      query: (id) => `/customer/${id}`,
      providesTags: (result, error, id) => [{ type: "Customer", id }],
    }),

    createCustomer: build.mutation<Customer, CreateCustomerRequest>({
      query: (customer) => ({
        url: "/customer",
        method: "POST",
        body: customer,
      }),
      invalidatesTags: ["Customer"],
    }),

    updateCustomer: build.mutation<
      Customer,
      { id: number; customer: UpdateCustomerRequest }
    >({
      query: ({ id, customer }) => ({
        url: `/customer/${id}`,
        method: "PUT",
        body: customer,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Customer", id },
        "Customer",
      ],
    }),

    deleteCustomer: build.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/customer/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Customer"],
    }),

    getCustomerStats: build.query<CustomerStats, void>({
      query: () => "/customer/stats",
      providesTags: ["Customer"],
    }),

    login: build.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["User"],
    }),

    register: build.mutation<AuthResponse, RegisterRequest>({
      query: (userData) => ({
        url: "/auth/register",
        method: "POST",
        body: userData,
      }),
      invalidatesTags: ["User"],
    }),

    logout: build.mutation<void, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["User"],
    }),

    getMe: build.query<User, void>({
      query: () => "/auth/me",
      providesTags: ["User"],
    }),

    updateProfile: build.mutation<User, Partial<User>>({
      query: (userData) => ({
        url: "/auth/profile",
        method: "PUT",
        body: userData,
      }),
      invalidatesTags: ["User"],
    }),

    getSuppliers: build.query<Supplier[], void>({
      query: () => "/supplier",
      providesTags: ["Supplier"],
    }),

    getSupplier: build.query<Supplier, number>({
      query: (id) => `/supplier/${id}`,
      providesTags: (result, error, id) => [{ type: "Supplier", id }],
    }),

    createSupplier: build.mutation<Supplier, Partial<Supplier>>({
      query: (supplier) => ({
        url: "/supplier",
        method: "POST",
        body: supplier,
      }),
      invalidatesTags: ["Supplier"],
    }),

    updateSupplier: build.mutation<
      Supplier,
      { id: number; supplier: Partial<Supplier> }
    >({
      query: ({ id, supplier }) => ({
        url: `/supplier/${id}`,
        method: "PUT",
        body: supplier,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Supplier", id }],
    }),

    deleteSupplier: build.mutation<void, number>({
      query: (id) => ({
        url: `/supplier/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Supplier"],
    }),

    searchSales: build.query<Sale[], string>({
      query: (searchTerm) =>
        `sale/search?query=${encodeURIComponent(searchTerm)}`,
      providesTags: ["Sale"],
    }),

    searchPurchases: build.query<Purchase[], string>({
      query: (searchTerm) =>
        `purchase/search?query=${encodeURIComponent(searchTerm)}`,
      providesTags: ["Purchase"],
    }),

    getProductSerials: build.query<ProductSerial[], number>({
      query: (productId) => `/product/${productId}/serials`,
      providesTags: (result, error, productId) => [
        { type: "Product", id: productId },
      ],
    }),

    getAvailableSerials: build.query<
      ProductSerial[],
      { productId: number; status?: string }
    >({
      query: ({ productId, status = "Available" }) =>
        `/product/${productId}/serials?status=${status}`,
      providesTags: (result, error, { productId }) => [
        { type: "Product", id: productId },
      ],
    }),

    getSaleByInvoice: build.query<Sale, string>({
      query: (invoiceNumber) => `/sale/invoice/${invoiceNumber}`,
      providesTags: (result, error, invoiceNumber) => [
        { type: "Sale", invoiceNumber },
      ],
    }),

    getPurchaseByInvoice: build.query<Purchase, string>({
      query: (invoiceNumber) => `/purchase/invoice/${invoiceNumber}`,
      providesTags: (result, error, invoiceNumber) => [
        { type: "Purchase", invoiceNumber },
      ],
    }),

    getAllUsers: build.query<
      {
        users: User[];
        totalCount: number;
        currentPage: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
      },
      {
        page?: number;
        limit?: number;
        search?: string;
        role?: string;
        status?: string;
      }
    >({
      query: ({
        page = 1,
        limit = 10,
        search = "",
        role = "all",
        status = "all",
      }) => ({
        url: `/users`,
        params: { page, limit, search, role, status },
      }),
      providesTags: ["User"],
    }),

    getUserStats: build.query<
      {
        stats: {
          totalUsers: number;
          activeUsers: number;
          inactiveUsers: number;
          adminUsers: number;
          salesUsers: number;
          managerUsers: number;
          otherUsers: number;
        };
      },
      void
    >({
      query: () => `/users/stats`,
      providesTags: ["User"],
    }),

    getUserById: build.query<User, number>({
      query: (id) => `/users/${id}`,
      providesTags: (result, error, id) => [{ type: "User", id }],
    }),

    createUser: build.mutation<
      User,
      {
        name: string;
        email: string;
        password: string;
        role_id: number;
        phone?: string;
        address?: string;
        status?: "Active" | "Inactive";
      }
    >({
      query: (userData) => ({
        url: `/users`,
        method: "POST",
        body: userData,
      }),
      invalidatesTags: ["User"],
    }),

    updateUser: build.mutation<
      User,
      {
        id: number;
        userData: {
          name?: string;
          email?: string;
          role_id?: number;
          phone?: string;
          address?: string;
          status?: "Active" | "Inactive";
        };
      }
    >({
      query: ({ id, userData }) => ({
        url: `/users/${id}`,
        method: "PUT",
        body: userData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "User", id }],
    }),

    deleteUser: build.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/users/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["User"],
    }),

    deactivateUser: build.mutation<User, number>({
      query: (id) => ({
        url: `/users/${id}/deactivate`,
        method: "PUT",
      }),
      invalidatesTags: (result, error, id) => [{ type: "User", id }],
    }),

    activateUser: build.mutation<User, number>({
      query: (id) => ({
        url: `/users/${id}/activate`,
        method: "PUT",
      }),
      invalidatesTags: (result, error, id) => [{ type: "User", id }],
    }),

    getRoles: build.query<
      Array<{
        id: number;
        name: string;
      }>,
      void
    >({
      query: () => `/users/roles`,
      transformResponse: (response: { success: boolean; roles: any[] }) => {
        return response.roles || [];
      },
      providesTags: ["User"],
    }),

    createRole: build.mutation<
      { id: number; name: string },
      { name: string; description?: string }
    >({
      query: (role) => ({
        url: "/roles",
        method: "POST",
        body: role,
      }),
      invalidatesTags: ["Role"],
    }),

    updateRole: build.mutation<
      { id: number; name: string },
      { id: number; role: { name: string; description?: string } }
    >({
      query: ({ id, role }) => ({
        url: `/roles/${id}`,
        method: "PUT",
        body: role,
      }),
      invalidatesTags: ["Role"],
    }),

    deleteRole: build.mutation<{ success: boolean; message: string }, number>({
      query: (id) => ({
        url: `/roles/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Role"],
    }),

    getPermissions: build.query<Permission[], void>({
      query: () => "/permissions",
      providesTags: ["Permission"],
    }),

    getRolePermissions: build.query<RoleWithPermissions, number>({
      query: (roleId) => `/roles/${roleId}/permissions`,
      providesTags: (result, error, roleId) => [{ type: "Role", id: roleId }],
    }),

    updateRolePermissions: build.mutation<
      { success: boolean; message: string },
      UpdateRolePermissionsRequest
    >({
      query: (data) => ({
        url: "/roles/permissions",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Role"],
    }),

    getUserPermissions: build.query<
      {
        rolePermissions: RolePermission[];
        userOverrides: UserPermissionOverride | null;
      },
      number
    >({
      query: (userId) => `/users/${userId}/permissions`,
      providesTags: (result, error, userId) => [{ type: "User", id: userId }],
    }),

    updateUserPermissions: build.mutation<
      { success: boolean; message: string },
      { userId: number; overrides: UserPermissionOverride }
    >({
      query: ({ userId, overrides }) => ({
        url: `/users/${userId}/permissions`,
        method: "PUT",
        body: { overrides },
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: "User", id: userId },
      ],
    }),
    createPreOrder: build.mutation<PreOrder, Partial<PreOrder>>({
      query: (preOrderData) => ({
        url: '/pre-orders',
        method: 'POST',
        body: preOrderData,
      }),
      invalidatesTags: ['Sale'], // Add this to invalidate sale cache if needed
    }),

    createPayment: build.mutation<Payment, Partial<Payment>>({
      query: (paymentData) => ({
        url: '/payments',
        method: 'POST',
        body: paymentData,
      }),
      invalidatesTags: ['Sale', 'Customer'], // Invalidate sale and customer cache
    }),

    getDueSales: build.query<Sale[], void>({
      query: () => '/sales/due',
      providesTags: ['Sale'], // Add tag for cache invalidation
    }),

    createExpense: build.mutation<Expense, Partial<Expense>>({
      query: (expenseData) => ({
        url: '/expenses',
        method: 'POST',
        body: expenseData,
      }),
      // Add tags if you have them for expenses
    }),

    getExpenseCategories: build.query<ExpenseCategory[], void>({
      query: () => '/expense-categories',
      providesTags: ['Category'], // Use existing category tag or create new one
    }),
  }),
});

export const {
  useGetDashboardMetricsQuery,
  useGetProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetProductSalesQuery,
  useGetProductExchangesQuery,
  useGetProductSalesReturnsQuery,
  useGetProductPurchasesQuery,
  useGetSalesReturnsQuery,
  useGetSalesReturnQuery,
  useCreateSalesReturnMutation,
  useUpdateSalesReturnMutation,
  useDeleteSalesReturnMutation,
  useGetPurchaseReturnsQuery,
  useGetPurchaseReturnQuery,
  useCreatePurchaseReturnMutation,
  useUpdatePurchaseReturnMutation,
  useDeletePurchaseReturnMutation,
  useGetExchangesQuery,
  useGetExchangeQuery,
  useCreateExchangeMutation,
  useUpdateExchangeMutation,
  useDeleteExchangeMutation,
  useGetServicesQuery,
  useGetServiceQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
  useGetSalesQuery,
  useGetSaleQuery,
  useCreateSaleMutation,
  useUpdateSaleMutation,
  useDeleteSaleMutation,
  useGetSalesStatsQuery,
  useGetSalesByDateRangeQuery,
  useGetCustomersQuery,
  useGetCustomersWithPaginationQuery,
  useGetCustomerQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useGetCustomerStatsQuery,
  useGetPurchasesQuery,
  useGetPurchaseStatisticsQuery,
  useGetPurchasesBySupplierQuery,
  useGetPurchaseQuery,
  useCreatePurchaseMutation,
  useUpdatePurchaseMutation,
  useDeletePurchaseMutation,
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetMeQuery,
  useUpdateProfileMutation,
  useSearchProductsQuery,
  useSearchCustomersQuery,
  useCreateSaleFromPOSMutation,
  useGetPOSProductsQuery,
  useScanBarcodeQuery,
  useGetSuppliersQuery,
  useGetSupplierQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
  useSearchSalesQuery,
  useSearchPurchasesQuery,
  useGetProductSerialsQuery,
  useGetAvailableSerialsQuery,
  useGetSaleByInvoiceQuery,
  useGetPurchaseByInvoiceQuery,
  useGetAllUsersQuery,
  useGetUserStatsQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useDeactivateUserMutation,
  useActivateUserMutation,
  useGetRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useGetPermissionsQuery,
  useGetRolePermissionsQuery,
  useUpdateRolePermissionsMutation,
  useGetUserPermissionsQuery,
  useUpdateUserPermissionsMutation,
  useCreatePreOrderMutation,
  useCreatePaymentMutation,
  useGetDueSalesQuery,
  useCreateExpenseMutation,
  useGetExpenseCategoriesQuery,
} = api;
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface Product {
  id: number;
  name: string;
  specification?: string | null;
  description?: string | null;
  quantity: number;
  purchasePrice: number;
  wholesalePrice: number;
  retailPrice: number;
  serial: string;
  warranty: "Yes" | "No";
  category_id: number;
  Categories?: {
    id: number;
    name: string;
  };
}
export interface Category {
  id: number;
  name: string;
}
export interface SaleSummary {
  id: number;
  totalAmount: number;
  totalPaid: number;
  dueDate: string;
  customer_id?: number;
  user_id: number;
}
export interface SaleItem {
  id: number;
  product_id: number;
  quantity: number;
  unitPrice: number;
  Products: {
    id: number;
    name: string;
    specification?: string;
    retailPrice: number;
    wholesalePrice: number;
    purchasePrice: number;
  };
}
export interface Sale {
  id: number;
  totalAmount: number;
  totalPaid: number;
  dueDate: string;
  customer_id: number;
  user_id: number;
  Customers: {
    id: number;
    name: string;
    email?: string;
    phone: string;
    address?: string;
  };
  Users: {
    id: number;
    name: string;
    email: string;
  };
  SalesItems: SaleItem[];
  created_at: string;
  updated_at: string;
}
export interface CreateSaleRequest {
  customer_id: number;
  user_id: number;
  totalAmount: number;
  totalPaid?: number;
  dueDate: string;
  items: Array<{
    product_id: number;
    quantity: number;
    unitPrice: number;
  }>;
}
export interface UpdateSaleRequest {
  totalPaid?: number;
  dueDate?: string;
  customer_id?: number;
  user_id?: number;
}
export interface SalesStats {
  totalSales: number;
  totalRevenue: number;
  totalPaid: number;
  pendingSales: number;
  completedSales: number;
  totalDue: number;
}
export interface SalesReturnItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  return_reason: string;
}
export interface SalesReturn {
  id: number;
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
  items: SalesReturnItem[];
  created_at: string;
  updated_at: string;
}
export interface PurchaseSummary {
  id: number;
  totalAmount: number;
  totalPaid: number;
  dueDate: string;
  note?: string;
  supplier_id: number;
  user_id: number;
}
export interface PurchaseItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  unitPrice: number;
  total: number;
  Products?: Product;
}
export interface Purchase {
  id: number;
  invoice_number?: string; // You might want to add this field to your schema
  supplier_name?: string;
  supplier_id: number;
  user_id: number;
  totalAmount: number;
  totalPaid: number;
  dueDate: string;
  note?: string;
  status?: "pending" | "received" | "cancelled"; // You might want to add this field
  payment_status?: "pending" | "paid" | "overdue"; // You might want to add this field
  created_at: string;
  updated_at: string;
  Suppliers?: Supplier;
  Users?: {
    id: number;
    name: string;
    email: string;
  };
  PurchasesItems: PurchaseItem[];
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
  name: string;
  email?: string;
  phone: string;
  address?: string;
}
export interface PurchaseReturnItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  return_reason: string;
}
export interface PurchaseReturn {
  id: number;
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
  items: PurchaseReturnItem[];
  created_at: string;
  updated_at: string;
}
export interface ExchangeSummary {
  id: number;
  totalPaid: number;
  totalPayback: number;
  note: string;
  sales_id: number;
  user_id: number;
  customer_id: number;
}
export interface ExchangeItem {
  id: number;
  old_product_id: number;
  old_product_name: string;
  new_product_id: number;
  new_product_name: string;
  quantity: number;
  unit_price: number;
  note: string;
}
export interface Exchange {
  id: number;
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
  items: ExchangeItem[];
  created_at: string;
  updated_at: string;
}
export interface ServiceSummary {
  id: number;
  serviceProductName: string;
  serviceDescription: string;
  serviceCost: number;
  serviceStatus: string;
  customer_id?: number;
  user_id?: number;
}
export interface Service {
  id: number;
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
export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  Sales: Array<{
    id: number;
    totalAmount: number;
    totalPaid: number;
    created_at: string;
  }>;
  SalesReturn: Array<{
    id: number;
    total_payback: number;
    created_at: string;
  }>;
  Exchanges: Array<{
    id: number;
    totalPaid: number;
    totalPayback: number;
    created_at: string;
  }>;
  Services: Array<{
    id: number;
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

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
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

export const api = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: "https://fit-uzbea-backend.vercel.app" || "/api",
    prepareHeaders: (headers) => {
      headers.set("Content-Type", "application/json");
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
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
  ],
  endpoints: (build) => ({
    getDashboardMetrics: build.query<DashboardMetrics, void>({
      query: () => "/dashboard",
      providesTags: ["DashboardMetrics"],
    }),

    // Products
    getProducts: build.query<Product[], void>({
      query: () => "/product",
      providesTags: ["Product"],
    }),
    getProduct: build.query<Product, number>({
      query: (id) => `/product/${id}`,
      providesTags: (result, error, id) => [{ type: "Product", id }],
    }),
    createProduct: build.mutation<Product, Partial<Product>>({
      query: (product) => ({
        url: "/product",
        method: "POST",
        body: product,
      }),
      invalidatesTags: ["Product"],
    }),
    updateProduct: build.mutation<
      Product,
      { id: number; product: Partial<Product> }
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
    // Categories
    getCategories: build.query<Category[], void>({
      query: () => "/categories",
      providesTags: ["Category"],
    }),
    // Product History
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
    // Sales
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
    // SalesReturns
    getSalesReturns: build.query<SalesReturn[], void>({
      query: () => "salesreturn",
      providesTags: ["SalesReturn"],
    }),
    getSalesReturn: build.query<SalesReturn, number>({
      query: (id) => `salesreturn/${id}`,
      providesTags: (result, error, id) => [{ type: "SalesReturn", id }],
    }),
    createSalesReturn: build.mutation<SalesReturn, Partial<SalesReturn>>({
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
    // Purchases
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
    // PurchaseReturns
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
    // Exchanges
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
    // Services
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
    // Customers
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
    searchCustomers: build.query<Customer[], string>({
      query: (query) => `/customers/search?query=${query}`,
      providesTags: ["Customer"],
    }),
    getCustomerStats: build.query<CustomerStats, void>({
      query: () => "/customer/stats",
      providesTags: ["Customer"],
    }),
    // Authentication
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
  useSearchCustomersQuery,
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
} = api;

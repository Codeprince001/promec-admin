export type PageMeta = { page: number; pageSize: number; total: number; totalPages: number };

export type Me = {
  id: string;
  email: string | null;
  phone: string | null;
  type: string;
  status: string;
  mfaEnabled: boolean;
  roles: string[];
  permissions: string[];
  customer: { firstName: string; lastName: string } | null;
};

export type LoginResult = {
  accessToken?: string;
  mfaRequired?: boolean;
  enrollmentRequired?: boolean;
  challengeId?: string;
  secret?: string;
  otpauthUrl?: string;
};

export type Order = {
  id: string;
  orderNo: string;
  status: string;
  paymentStatus: string;
  fulfilmentStatus: string;
  currency: string;
  subtotal: string;
  discountTotal: string;
  shippingTotal: string;
  grandTotal: string;
  couponCode: string | null;
  deliveryMethod: string;
  courierCode: string | null;
  shippingAddress: Record<string, string> | null;
  placedAt: string;
  items: { id: string; sku: string; name: string; qty: number; unitPrice: string; fitmentStatus: string | null }[];
  payments: { id: string; provider: string; reference: string | null; amount: string; status: string; method: string | null }[];
  shipments: { id: string; status: string; trackingNo: string | null; labelUrl: string | null; events: { id: string; status: string; note: string | null; occurredAt: string }[] }[];
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: string;
  condition: string;
  warrantyMonths: number;
  manufacturer: { id: string; name: string };
  category: { id: string; name: string; slug: string };
  partNumbers: { number: string; type: string }[];
  media: { url: string; alt: string | null }[];
  skus: { id: string; sku: string; price: { amount: string; currency: string }; availability: { qty: number; status: string } }[];
  store: { businessName: string } | null;
};

export type Category = { id: string; name: string; slug: string; path: string };
export type Manufacturer = { id: string; name: string; country: string | null; type: string };

export type Overview = {
  orders: number;
  paidOrders: number;
  gmv: string;
  currency: string;
  averageOrder: string;
  openTickets: number;
  lowStockSkus: number;
  trackedSkus: number;
  openReturns: number;
  openShipments: number;
  days: number;
  revenue: { date: string; orders: number; gmv: string }[];
  byStatus: { status: string; count: number; amount: string }[];
  byPayment: { status: string; count: number }[];
  recent: { id: string; orderNo: string; status: string; paymentStatus: string; grandTotal: string; placedAt: string }[];
};

export type Series = {
  kind: string;
  days: number;
  total: number;
  amount: string;
  series: { date: string; count: number; amount: string }[];
};

export type SettingsView = {
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  currency: string;
  paystackPublicKey: string;
  paystackSecretLast4: string;
  paystackSecretSource: 'account' | 'environment' | 'missing';
  webhookUrl: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  guestCheckout: boolean;
  nlSearch: boolean;
};

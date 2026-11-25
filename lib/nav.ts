export type NavItem = {
  href: string;
  label: string;
  group: string;
  permission?: string;
};

export const NAV: NavItem[] = [
  { group: 'Desk', href: '/', label: 'Overview' },
  { group: 'Desk', href: '/analytics', label: 'Analytics', permission: 'analytics.view' },
  { group: 'Desk', href: '/audit', label: 'Audit log', permission: 'audit.view' },
  { group: 'Commerce', href: '/orders', label: 'Orders', permission: 'orders.manage' },
  { group: 'Commerce', href: '/returns', label: 'Returns', permission: 'orders.manage' },
  { group: 'Commerce', href: '/shipments', label: 'Shipments', permission: 'orders.manage' },
  { group: 'Commerce', href: '/payments', label: 'Payments', permission: 'payments.manage' },
  { group: 'Catalogue', href: '/products', label: 'Products', permission: 'catalogue.manage' },
  { group: 'Catalogue', href: '/fitment', label: 'Fitment', permission: 'compatibility.manage' },
  { group: 'Catalogue', href: '/promotions', label: 'Promotions', permission: 'promotions.manage' },
  { group: 'Catalogue', href: '/part-requests', label: 'Part requests', permission: 'procurement.manage' },
  { group: 'Stock', href: '/inventory', label: 'Inventory', permission: 'inventory.manage' },
  { group: 'Marketplace', href: '/vendors', label: 'Vendors', permission: 'vendors.manage' },
  { group: 'Marketplace', href: '/withdrawals', label: 'Payouts', permission: 'vendors.manage' },
  { group: 'Trade', href: '/trade', label: 'Business accounts', permission: 'b2b.manage' },
  { group: 'Trade', href: '/quotes', label: 'Quotes', permission: 'b2b.manage' },
  { group: 'Supply', href: '/suppliers', label: 'Suppliers', permission: 'procurement.manage' },
  { group: 'Supply', href: '/purchase-orders', label: 'Purchase orders', permission: 'procurement.manage' },
  { group: 'Supply', href: '/rfqs', label: 'Supplier quotes', permission: 'procurement.manage' },
  { group: 'Supply', href: '/imports', label: 'Imports', permission: 'procurement.manage' },
  { group: 'People', href: '/customers', label: 'Customers', permission: 'users.manage' },
  { group: 'People', href: '/staff', label: 'Staff', permission: 'users.manage' },
  { group: 'People', href: '/roles', label: 'Roles', permission: 'users.manage' },
  { group: 'People', href: '/support', label: 'Support', permission: 'support.manage' },
  { group: 'Platform', href: '/settings', label: 'Settings', permission: 'users.manage' },
];

export function allowed(permissions: string[] | undefined, code?: string) {
  if (!code) return true;
  if (!permissions) return false;
  return permissions.includes('*') || permissions.includes(code);
}

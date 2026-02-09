/**
 * Order–Production–Stock–Delivery System
 * Google Apps Script Web App
 */

const SHEETS = {
  CONFIG: 'Config',
  USERS: 'Users',
  PRODUCTS: 'Products',
  CUSTOMERS: 'Customers',
  WAREHOUSES: 'Warehouses',
  STOCK_ON_HAND: 'StockOnHand',
  STOCK_RESERVATION: 'StockReservation',
  STOCK_LEDGER: 'StockLedger',
  ORDERS: 'Orders',
  ORDER_ITEMS: 'OrderItems',
  SHIPMENTS: 'Shipments',
};

const ORDER_STATUS = {
  NEW: 'NEW',
  IN_PROD: 'IN_PROD',
  READY_TO_SHIP: 'READY_TO_SHIP',
  SHIPPED: 'SHIPPED',
  CANCELLED: 'CANCELLED',
};

const ROLES = {
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
  VIEWER: 'VIEWER',
};

function doGet() {
  const template = HtmlService.createTemplateFromFile('views/index');
  template.appConfig = getClientConfig_();
  return template.evaluate()
    .setTitle('OPS System')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getClientConfig_() {
  const config = getConfig_();
  return {
    tenantId: config.TenantId || 'DEFAULT',
    locale: config.Locale || 'th',
  };
}

function getActiveUserEmail_() {
  const email = Session.getActiveUser().getEmail();
  return email || '';
}

function getAuthContext_() {
  const config = getConfig_();
  const email = getActiveUserEmail_();
  const allowedDomain = (config.AllowedDomain || '').toLowerCase();
  const fallbackPinEnabled = (config.FallbackPin || '').toString().trim().length > 0;
  const pinAuthenticated = PropertiesService.getUserProperties().getProperty('PIN_AUTH') === 'true';

  let requiresPin = false;
  if (!email) {
    requiresPin = fallbackPinEnabled;
  } else if (allowedDomain && !email.toLowerCase().endsWith(`@${allowedDomain}`)) {
    requiresPin = fallbackPinEnabled;
  }

  return {
    email,
    allowedDomain,
    requiresPin,
    pinAuthenticated,
  };
}

function assertRole_(allowedRoles) {
  const me = getMe_();
  if (!allowedRoles.includes(me.role)) {
    throw new Error('Access denied.');
  }
  return me;
}

function getMe_() {
  const auth = getAuthContext_();
  if (auth.requiresPin && !auth.pinAuthenticated) {
    return {
      email: auth.email,
      role: 'GUEST',
      name: 'Guest',
      requiresPin: true,
    };
  }

  const userRow = findUserByEmail_(auth.email);
  if (!userRow) {
    return {
      email: auth.email,
      role: ROLES.VIEWER,
      name: auth.email || 'Guest',
      requiresPin: auth.requiresPin,
    };
  }

  return {
    email: userRow.Email,
    role: userRow.Role || ROLES.VIEWER,
    name: userRow.Name || userRow.Email,
    tenantId: userRow.TenantId || getConfig_().TenantId || 'DEFAULT',
    requiresPin: auth.requiresPin,
  };
}

function loginWithPin(pin) {
  const config = getConfig_();
  if (!config.FallbackPin || pin !== config.FallbackPin) {
    throw new Error('Invalid PIN');
  }
  PropertiesService.getUserProperties().setProperty('PIN_AUTH', 'true');
  return { success: true };
}

function logoutPin() {
  PropertiesService.getUserProperties().deleteProperty('PIN_AUTH');
  return { success: true };
}

function getMe() {
  return getMe_();
}

function listOrders(filters) {
  const me = assertRole_([ROLES.ADMIN, ROLES.STAFF, ROLES.VIEWER]);
  const orders = readAll_(SHEETS.ORDERS).filter(row => row.TenantId === me.tenantId);
  if (filters && filters.status) {
    return orders.filter(order => order.Status === filters.status);
  }
  return orders;
}

function getOrder(orderId) {
  const me = assertRole_([ROLES.ADMIN, ROLES.STAFF, ROLES.VIEWER]);
  const orders = readAll_(SHEETS.ORDERS).filter(row => row.TenantId === me.tenantId);
  const order = orders.find(row => row.OrderId === orderId);
  if (!order) throw new Error('Order not found');
  const items = readAll_(SHEETS.ORDER_ITEMS).filter(row => row.OrderId === orderId && row.TenantId === me.tenantId);
  return { order, items };
}

function upsertOrder(order) {
  const me = assertRole_([ROLES.ADMIN, ROLES.STAFF]);
  const tenantId = me.tenantId;
  if (!order.OrderId) {
    order.OrderId = nextId_('ORD');
  }
  order.TenantId = tenantId;
  order.Status = order.Status || ORDER_STATUS.NEW;
  upsertRow_(SHEETS.ORDERS, 'OrderId', order);

  if (order.Items && order.Items.length) {
    order.Items.forEach(item => {
      item.OrderId = order.OrderId;
      item.TenantId = tenantId;
      appendRow_(SHEETS.ORDER_ITEMS, item);
    });
  }
  return order;
}

function setOrderStatus(orderId, status) {
  const me = assertRole_([ROLES.ADMIN, ROLES.STAFF]);
  updateRowById_(SHEETS.ORDERS, 'OrderId', orderId, { Status: status });
  return { success: true };
}

function listStock(filters) {
  const me = assertRole_([ROLES.ADMIN, ROLES.STAFF, ROLES.VIEWER]);
  let stock = readAll_(SHEETS.STOCK_ON_HAND).filter(row => row.TenantId === me.tenantId);
  if (filters && filters.sku) {
    stock = stock.filter(row => row.SKU === filters.sku);
  }
  return stock;
}

function receiveStock(payload) {
  const me = assertRole_([ROLES.ADMIN, ROLES.STAFF]);
  return receiveStock_(payload, me);
}

function reserveStock(orderId) {
  const me = assertRole_([ROLES.ADMIN, ROLES.STAFF]);
  return reserveStock_(orderId, me);
}

function shipOrder(orderId, shipmentPayload) {
  const me = assertRole_([ROLES.ADMIN, ROLES.STAFF]);
  return shipOrder_(orderId, shipmentPayload, me);
}

function cancelOrder(orderId) {
  const me = assertRole_([ROLES.ADMIN, ROLES.STAFF]);
  return cancelOrder_(orderId, me);
}

function listShipments(filters) {
  const me = assertRole_([ROLES.ADMIN, ROLES.STAFF, ROLES.VIEWER]);
  let shipments = readAll_(SHEETS.SHIPMENTS).filter(row => row.TenantId === me.tenantId);
  if (filters && filters.orderId) {
    shipments = shipments.filter(row => row.OrderId === filters.orderId);
  }
  return shipments;
}

function updateShipmentStatus(shipmentId, status) {
  const me = assertRole_([ROLES.ADMIN, ROLES.STAFF]);
  updateRowById_(SHEETS.SHIPMENTS, 'ShipmentId', shipmentId, { Status: status });
  return { success: true };
}

function generatePdf(type, refId) {
  const me = assertRole_([ROLES.ADMIN, ROLES.STAFF, ROLES.VIEWER]);
  return generatePdf_(type, refId, me);
}

function listUsers() {
  assertRole_([ROLES.ADMIN]);
  return readAll_(SHEETS.USERS);
}

function upsertUser(user) {
  assertRole_([ROLES.ADMIN]);
  if (!user.Email) throw new Error('Email is required');
  upsertRow_(SHEETS.USERS, 'Email', user);
  return { success: true };
}

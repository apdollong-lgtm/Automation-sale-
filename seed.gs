function seedDemoData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = Object.values(SHEETS);
  sheets.forEach(name => {
    if (!ss.getSheetByName(name)) {
      ss.insertSheet(name);
    }
  });

  seedSheet_(SHEETS.CONFIG, ['Key', 'Value'], [
    ['SpreadsheetId', ss.getId()],
    ['TenantId', 'DEFAULT'],
    ['Locale', 'th'],
    ['AllowedDomain', ''],
    ['FallbackPin', '1234'],
    ['DocsFolderId', ''],
  ]);

  seedSheet_(SHEETS.USERS, ['Email', 'Role', 'Name', 'Active', 'TenantId'], [
    ['admin@example.com', ROLES.ADMIN, 'Admin', true, 'DEFAULT'],
    ['staff@example.com', ROLES.STAFF, 'Staff', true, 'DEFAULT'],
    ['viewer@example.com', ROLES.VIEWER, 'Viewer', true, 'DEFAULT'],
  ]);

  seedSheet_(SHEETS.PRODUCTS, ['SKU', 'Name', 'Unit', 'Active', 'TenantId'], [
    ['SKU-001', 'สินค้า A', 'ชิ้น', true, 'DEFAULT'],
    ['SKU-002', 'สินค้า B', 'ชิ้น', true, 'DEFAULT'],
  ]);

  seedSheet_(SHEETS.CUSTOMERS, ['CustomerId', 'Name', 'Address', 'Phone', 'Active', 'TenantId'], [
    ['CUS-001', 'บริษัท เอ', 'กรุงเทพ', '0900000000', true, 'DEFAULT'],
  ]);

  seedSheet_(SHEETS.WAREHOUSES, ['WarehouseId', 'Name', 'Active', 'TenantId'], [
    ['WH-001', 'คลังหลัก', true, 'DEFAULT'],
  ]);

  seedSheet_(SHEETS.STOCK_ON_HAND, ['SKU', 'WarehouseId', 'Lot', 'OnHandQty', 'UpdatedAt', 'TenantId'], [
    ['SKU-001', 'WH-001', 'LOT-A', 100, new Date(), 'DEFAULT'],
    ['SKU-002', 'WH-001', 'LOT-A', 50, new Date(), 'DEFAULT'],
  ]);

  seedSheet_(SHEETS.STOCK_RESERVATION, ['OrderId', 'SKU', 'WarehouseId', 'Lot', 'ReservedQty', 'UpdatedAt', 'TenantId'], []);

  seedSheet_(SHEETS.STOCK_LEDGER, ['LedgerId', 'Timestamp', 'RefType', 'RefId', 'SKU', 'WarehouseId', 'Lot', 'QtyIn', 'QtyOut', 'UserEmail', 'Note', 'TenantId'], []);

  seedSheet_(SHEETS.ORDERS, ['OrderId', 'OrderDate', 'CustomerId', 'Status', 'DueDate', 'PICEmail', 'Total', 'TenantId'], [
    ['ORD-0001', new Date(), 'CUS-001', ORDER_STATUS.NEW, new Date(), 'staff@example.com', 0, 'DEFAULT'],
  ]);

  seedSheet_(SHEETS.ORDER_ITEMS, ['OrderId', 'SKU', 'Qty', 'UnitPrice', 'TenantId'], [
    ['ORD-0001', 'SKU-001', 5, 100, 'DEFAULT'],
  ]);

  seedSheet_(SHEETS.SHIPMENTS, ['ShipmentId', 'OrderId', 'Carrier', 'TrackingNo', 'ShipDate', 'DeliveredDate', 'Status', 'TenantId'], []);
}

function seedSheet_(sheetName, headers, rows) {
  const sheet = getSheet_(sheetName);
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  if (rows.length) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
}

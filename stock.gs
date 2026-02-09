function receiveStock_(payload, me) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const tenantId = me.tenantId;
    const sku = payload.SKU;
    const warehouseId = payload.WarehouseId;
    const lot = payload.Lot || '';
    const qty = Number(payload.Qty || 0);
    if (qty <= 0) throw new Error('Qty must be positive');

    const stockSheet = getSheet_(SHEETS.STOCK_ON_HAND);
    const values = stockSheet.getDataRange().getValues();
    const headers = values[0];
    const rowIndex = values.findIndex((row, idx) => idx > 0 && row[0] === sku && row[1] === warehouseId && row[2] === lot && row[5] === tenantId);
    if (rowIndex > 0) {
      const onHandIndex = headers.indexOf('OnHandQty');
      values[rowIndex][onHandIndex] = Number(values[rowIndex][onHandIndex] || 0) + qty;
      values[rowIndex][headers.indexOf('UpdatedAt')] = new Date();
      stockSheet.getRange(rowIndex + 1, 1, 1, headers.length).setValues([values[rowIndex]]);
    } else {
      appendRow_(SHEETS.STOCK_ON_HAND, {
        SKU: sku,
        WarehouseId: warehouseId,
        Lot: lot,
        OnHandQty: qty,
        UpdatedAt: new Date(),
        TenantId: tenantId,
      });
    }

    appendRow_(SHEETS.STOCK_LEDGER, {
      LedgerId: nextId_('LED'),
      Timestamp: new Date(),
      RefType: 'GRN',
      RefId: payload.RefId || '',
      SKU: sku,
      WarehouseId: warehouseId,
      Lot: lot,
      QtyIn: qty,
      QtyOut: 0,
      UserEmail: me.email,
      Note: payload.Note || 'Receive stock',
      TenantId: tenantId,
    });
    return { success: true };
  } finally {
    lock.releaseLock();
  }
}

function reserveStock_(orderId, me) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const tenantId = me.tenantId;
    const orderItems = readAll_(SHEETS.ORDER_ITEMS).filter(item => item.OrderId === orderId && item.TenantId === tenantId);
    if (!orderItems.length) throw new Error('Order items not found');
    const stock = readAll_(SHEETS.STOCK_ON_HAND).filter(row => row.TenantId === tenantId);

    orderItems.forEach(item => {
      const available = stock.filter(row => row.SKU === item.SKU)
        .reduce((sum, row) => sum + Number(row.OnHandQty || 0), 0);
      if (available < Number(item.Qty || 0)) {
        throw new Error(`Insufficient stock for ${item.SKU}`);
      }
    });

    orderItems.forEach(item => {
      appendRow_(SHEETS.STOCK_RESERVATION, {
        OrderId: orderId,
        SKU: item.SKU,
        WarehouseId: item.WarehouseId || '',
        Lot: item.Lot || '',
        ReservedQty: Number(item.Qty || 0),
        UpdatedAt: new Date(),
        TenantId: tenantId,
      });
    });

    updateRowById_(SHEETS.ORDERS, 'OrderId', orderId, { Status: ORDER_STATUS.READY_TO_SHIP });
    return { success: true };
  } finally {
    lock.releaseLock();
  }
}

function shipOrder_(orderId, shipmentPayload, me) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const tenantId = me.tenantId;
    const reservations = readAll_(SHEETS.STOCK_RESERVATION).filter(row => row.OrderId === orderId && row.TenantId === tenantId);
    if (!reservations.length) throw new Error('No reservations found');

    const stockSheet = getSheet_(SHEETS.STOCK_ON_HAND);
    const values = stockSheet.getDataRange().getValues();
    const headers = values[0];

    reservations.forEach(res => {
      const rowIndex = values.findIndex((row, idx) => idx > 0 && row[0] === res.SKU && row[1] === res.WarehouseId && row[2] === res.Lot && row[5] === tenantId);
      if (rowIndex < 0) throw new Error(`Stock not found for ${res.SKU}`);
      const onHandIndex = headers.indexOf('OnHandQty');
      const currentQty = Number(values[rowIndex][onHandIndex] || 0);
      const qtyOut = Number(res.ReservedQty || 0);
      if (currentQty < qtyOut) throw new Error(`Insufficient stock for ${res.SKU}`);
      values[rowIndex][onHandIndex] = currentQty - qtyOut;
      values[rowIndex][headers.indexOf('UpdatedAt')] = new Date();
      stockSheet.getRange(rowIndex + 1, 1, 1, headers.length).setValues([values[rowIndex]]);

      appendRow_(SHEETS.STOCK_LEDGER, {
        LedgerId: nextId_('LED'),
        Timestamp: new Date(),
        RefType: 'SHIP',
        RefId: orderId,
        SKU: res.SKU,
        WarehouseId: res.WarehouseId,
        Lot: res.Lot,
        QtyIn: 0,
        QtyOut: qtyOut,
        UserEmail: me.email,
        Note: 'Ship order',
        TenantId: tenantId,
      });
    });

    const shipment = {
      ShipmentId: nextId_('SHP'),
      OrderId: orderId,
      Carrier: shipmentPayload.Carrier || '',
      TrackingNo: shipmentPayload.TrackingNo || '',
      ShipDate: shipmentPayload.ShipDate || new Date(),
      DeliveredDate: shipmentPayload.DeliveredDate || '',
      Status: 'SHIPPED',
      TenantId: tenantId,
    };
    appendRow_(SHEETS.SHIPMENTS, shipment);

    updateRowById_(SHEETS.ORDERS, 'OrderId', orderId, { Status: ORDER_STATUS.SHIPPED });
    return shipment;
  } finally {
    lock.releaseLock();
  }
}

function cancelOrder_(orderId, me) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const tenantId = me.tenantId;
    const reservations = readAll_(SHEETS.STOCK_RESERVATION).filter(row => row.OrderId === orderId && row.TenantId === tenantId);
    if (reservations.length) {
      const sheet = getSheet_(SHEETS.STOCK_RESERVATION);
      const values = sheet.getDataRange().getValues();
      const headers = values[0];
      const orderIdIndex = headers.indexOf('OrderId');
      const tenantIndex = headers.indexOf('TenantId');
      const remaining = values.filter((row, idx) => idx === 0 || !(row[orderIdIndex] === orderId && row[tenantIndex] === tenantId));
      sheet.clearContents();
      sheet.getRange(1, 1, remaining.length, remaining[0].length).setValues(remaining);
    }
    updateRowById_(SHEETS.ORDERS, 'OrderId', orderId, { Status: ORDER_STATUS.CANCELLED });
    return { success: true };
  } finally {
    lock.releaseLock();
  }
}

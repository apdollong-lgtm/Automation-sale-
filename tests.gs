function testReserveShipFlow() {
  const me = { email: 'tester@example.com', tenantId: 'DEFAULT' };
  const orderId = 'ORD-0001';
  reserveStock_(orderId, me);
  shipOrder_(orderId, { Carrier: 'Test', TrackingNo: 'TRK-1' }, me);
}

function testCancelOrderReleasesReservation() {
  const me = { email: 'tester@example.com', tenantId: 'DEFAULT' };
  const orderId = 'ORD-0001';
  reserveStock_(orderId, me);
  cancelOrder_(orderId, me);
}

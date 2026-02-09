# Manual Test Plan

## Stock Reservation & Shipping
1. Create an order with items in `OrderItems`.
2. Call `reserveStock(orderId)`.
   - Expected: `StockReservation` rows added.
   - Expected: Order status becomes `READY_TO_SHIP`.
3. Call `shipOrder(orderId, shipmentPayload)`.
   - Expected: `StockOnHand` reduced.
   - Expected: `StockReservation` still present (historical), order status `SHIPPED`.
   - Expected: `StockLedger` appended.

## Cancel Releases Reservation
1. Create a new order and call `reserveStock(orderId)`.
2. Call `cancelOrder(orderId)`.
   - Expected: Reservation rows removed for that order.
   - Expected: Order status `CANCELLED`.

## Negative Stock Prevented
1. Attempt to reserve or ship more than available stock.
   - Expected: Error thrown and no stock movement.

## Concurrency (LockService)
1. Simulate two users reserving the same SKU simultaneously.
2. Confirm that `LockService` prevents double reservations and stock integrity remains valid.

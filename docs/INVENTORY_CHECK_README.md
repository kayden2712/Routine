# Warehouse Inventory Check Setup

## Scope

Implements complete "Kiem ke kho" flow for admin app (warehouse staff):

- Input actual quantity per item
- Auto discrepancy calculation and warning detection
- Discrepancy report with CSV/PDF export
- Confirm or mark item for recheck
- Audit log persistence

## Backend setup

1. Go to backend folder:
   - `cd be`
2. Run app (Flyway migration includes `V003__create_inventory_check_audit.sql`):
   - `./mvnw spring-boot:run`
3. Config threshold (optional) in `application.properties`:
   - `inventory.check.warning-threshold=0.1`

## Frontend setup (Admin)

1. Go to admin folder:
   - `cd fe/admin`
2. Install deps and run:
   - `npm install`
   - `npm run dev`
3. Open page:
   - `/inventory/check`

## Main files

- Backend service: `be/src/main/java/com/example/be/service/InventoryCheckService.java`
- Backend controller endpoints: `be/src/main/java/com/example/be/controller/InventoryController.java`
- Migration: `be/src/main/resources/db/migration/V003__create_inventory_check_audit.sql`
- Frontend page: `fe/admin/src/pages/InventoryCheckPage.tsx`
- Frontend components:
  - `fe/admin/src/components/inventory/InventoryCheckList.tsx`
  - `fe/admin/src/components/inventory/DiscrepancyReport.tsx`
  - `fe/admin/src/components/inventory/WarningModal.tsx`

## Tests

- Unit tests for discrepancy and threshold logic:
  - `be/src/test/java/com/example/be/service/InventoryDiscrepancyCalculatorTest.java`

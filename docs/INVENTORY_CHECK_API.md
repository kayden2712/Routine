# Inventory Check API

This module provides warehouse inventory check workflow.

## Swagger

- OpenAPI JSON: `/api/api-docs`
- Swagger UI: `/api/swagger-ui.html`

## Endpoints

### 1) List items for check

- Method: `GET`
- URL: `/api/inventory/items`
- Auth: `MANAGER`, `WAREHOUSE`
- Response: active stocktake metadata + list of check items.

### 2) Submit actual count

- Method: `POST`
- URL: `/api/inventory/check`
- Auth: `MANAGER`, `WAREHOUSE`
- Body:

```json
{
  "stocktakeId": 1,
  "itemId": 1001,
  "actualQty": 95,
  "note": "Found torn package"
}
```

- Logic: discrepancy = `actualQty - systemQty`.
- If discrepancy ratio exceeds configured threshold (`inventory.check.warning-threshold`, default `0.1`), status is `WARNING`.
- Behavior: this is temporary save while stocktake is active (`DANG_KIEM`), so item values can still be updated.

### 3) List stocktake sheets by date

- Method: `GET`
- URL: `/api/inventory/check-sessions`
- Auth: `MANAGER`, `WAREHOUSE`
- Response: list all stocktake sheets ordered by date (newest first), including progress per sheet (`checkedItems/totalItems`), status, and `evaluation` (`DU`, `THUA`, `THIEU`, `CHUA_KIEM`).

### 4) Approve stocktake (lock for editing)

- Method: `POST`
- URL: `/api/inventory/check/approve`
- Auth: `MANAGER`, `WAREHOUSE`
- Body:

```json
{
  "stocktakeId": 1
}
```

- Behavior: requires all items in that day stocktake to have `actualQty`. After approval, stocktake status is `HOAN_THANH` and all edits are blocked.

### 5) Get discrepancy report

- Method: `GET`
- URL: `/api/inventory/report?stocktakeId=1`
- Auth: `MANAGER`, `WAREHOUSE`
- Response: report summary + line items with status and warnings.

### 6) Confirm or request recheck

- Method: `POST`
- URL: `/api/inventory/confirm`
- Auth: `MANAGER`, `WAREHOUSE`
- Body:

```json
{
  "stocktakeId": 1,
  "itemId": 1001,
  "action": "CONFIRM",
  "note": "Approved"
}
```

```json
{
  "stocktakeId": 1,
  "itemId": 1001,
  "action": "RECHECK",
  "note": "Need recount"
}
```

## Audit log

Every check/confirm action is persisted to table `inventory_checks` with:

- item id
- system qty / actual qty
- discrepancy
- status
- checked by
- checked at

# Error Code Mapping

This document defines backend `errorCode` values returned in `ApiResponse.errorCode` and suggested frontend handling.

## Response shape

```json
{
  "success": false,
  "message": "...",
  "errorCode": "ORDER_STATUS_TRANSITION_INVALID"
}
```

## Auth and user

- `USER_EMAIL_ALREADY_REGISTERED`: Show duplicate email message on register/create forms.
- `USER_PHONE_ALREADY_REGISTERED`: Show duplicate phone message on register/profile forms.
- `CURRENT_USER_NOT_FOUND`: Force logout and redirect to login.
- `CURRENT_PASSWORD_INCORRECT`: Highlight current password field.
- `REFRESH_TOKEN_INVALID`: Clear session and redirect to login.
- `REFRESH_TOKEN_SUBJECT_NOT_FOUND`: Clear session and redirect to login.
- `STAFF_PASSWORD_REQUIRED`: Highlight password field in staff create form.

## Catalog and product

- `CATEGORY_NAME_REQUIRED`: Highlight category name field.
- `CATEGORY_NAME_ALREADY_EXISTS`: Show duplicate category name message.
- `PRODUCT_CODE_REQUIRED`: Highlight product code field.
- `PRODUCT_CODE_ALREADY_EXISTS`: Show duplicate product code message.
- `PRODUCT_GENDER_INVALID`: Show invalid gender value message.
- `PRODUCT_VARIANT_DUPLICATE`: Ask user to remove duplicated size/color variant.
- `PRODUCT_VARIANT_NOT_FOUND`: Show variant unavailable message and ask user to reselect.

## Cart and stock

- `CART_QUANTITY_INVALID`: Prevent submit and highlight quantity control.
- `STOCK_INSUFFICIENT`: Show out-of-stock toast and refresh product/cart data.

## Order workflow

- `STAFF_FALLBACK_NOT_AVAILABLE`: Show admin-only warning to configure staff accounts.
- `ORDER_STATUS_REQUIRED`: Block action and show status required validation.
- `ORDER_STATUS_TRANSITION_INVALID`: Refresh order detail and show transition not allowed.
- `ORDER_OWNERSHIP_MISMATCH`: Show forbidden order action message.
- `ORDER_CANCELLATION_REASON_REQUIRED`: Highlight cancellation reason field.
- `ORDER_ALREADY_CANCELLED`: Disable cancel action and refresh status.
- `ORDER_CANCELLATION_NOT_ALLOWED`: Show cancellation not allowed for current stage.
- `ORDER_CANCELLATION_IN_DELIVERY_NOT_ALLOWED`: Show cannot cancel while delivering.
- `ORDER_CANCEL_REQUEST_NOT_PENDING`: Refresh order and hide revoke action.
- `ORDER_RETURN_NOT_ALLOWED`: Show return request not allowed message.
- `ORDER_CONFIRMATION_NOT_ALLOWED`: Show cannot confirm completion in current state.
- `ORDER_ITEM_PRODUCT_MISSING`: Show order data integrity warning and reload order.
- `ORDER_ITEM_QUANTITY_INVALID`: Show invalid item quantity warning and reload order.

## Reviews

- `REVIEW_ALREADY_SUBMITTED`: Disable review button for reviewed product.
- `REVIEW_NOT_OWN_ORDER`: Show permission error for review action.
- `REVIEW_STATUS_NOT_ALLOWED`: Show message that review is available after successful delivery.
- `REVIEW_PRODUCT_NOT_IN_ORDER`: Show invalid reviewed product message.
- `REVIEW_IMAGE_LIMIT_EXCEEDED`: Show max image count validation.
- `REVIEW_IMAGE_INVALID_FORMAT`: Show unsupported image format validation.

## Generic and fallback

- `BAD_REQUEST`: Show generic validation message.
- `RESOURCE_NOT_FOUND`: Show not found page or inline empty-state message.
- `UNAUTHORIZED`: Redirect to login.
- `FORBIDDEN`: Show permission denied message.
- `VALIDATION_FAILED`: Show field-level validation list if available.
- `DATA_INTEGRITY_VIOLATION`: Show generic conflict message.
- `INTERNAL_SERVER_ERROR`: Show generic error and allow retry.

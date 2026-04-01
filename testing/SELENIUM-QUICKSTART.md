# Selenium Testcase Quickstart

## File test da tao
- `testing/customer-auth-basic.side`
- `testing/customer-other-features.side`

## Cac testcase co san
- `register_invalid_email`
- `register_empty_fullname`
- `login_invalid_password`

## Testsuite tinh nang khac (moi chuc nang la 1 suite)
- `Login Suite`
	- `auth_login_page_render`
	- `auth_login_invalid_credentials`
	- `auth_login_to_register_navigation`
- `Account Access Guard Suite`
	- `auth_account_requires_login`
- `Search Suite`
	- `nav_search_products_from_header`
	- `search_empty_keyword_goes_to_product_list`
	- `search_no_result_show_zero_count`
- `Support Center Suite`
	- `nav_support_center_page`
- `Wishlist Suite`
	- `nav_wishlist_filter_mode`
- `Navigation Redirect Suite`
	- `nav_alias_redirect_products`
	- `nav_alias_redirect_cart`
- `Cart Suite`
	- `cart_empty_state`
	- `cart_add_from_product_list`
- `Checkout Suite`
	- `checkout_requires_login_when_guest`
	- `checkout_require_shipping_fields`
- `Order Success Suite`
	- `order_success_page_direct_access`

## Cach chay bang Selenium IDE
1. Cai extension Selenium IDE tren Chrome/Edge.
2. Start frontend storefront (`fe/storefront`) de app chay o `http://localhost:5173`.
3. Mo Selenium IDE -> `Open an existing project` -> chon file `testing/customer-auth-basic.side`.
4. Run tung test hoac run suite `Customer Auth Basic Suite`.
5. Neu can bo test day du tinh nang khac, import them file `testing/customer-other-features.side` va run theo suite.

## Luu y
- Cac test nay dung xpath theo placeholder/text de giam flaky so voi css class.
- Neu route thay doi, cap nhat command `open` trong file `.side`.
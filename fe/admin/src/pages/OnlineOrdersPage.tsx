import { InvoicesPage } from './InvoicesPage';

export function OnlineOrdersPage() {
  return (
    <InvoicesPage
      initialChannel="online"
      pageTitle="Đơn hàng online"
      showChannelTabs={false}
    />
  );
}

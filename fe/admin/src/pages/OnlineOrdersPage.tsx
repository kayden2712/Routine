import { InvoicesPage } from './InvoicesPage';

export function OnlineOrdersPage() {
  return (
    <InvoicesPage
      initialChannel="online"
      pageTitle="Đơn hàng online"
      pageDescription="Theo dõi đơn online trong 7 ngày gần nhất"
      showChannelTabs={false}
      lookbackDays={7}
    />
  );
}

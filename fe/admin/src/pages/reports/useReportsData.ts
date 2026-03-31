import { useEffect, useState } from 'react';
import { fetchCustomersApi, fetchOrdersApi, fetchProductsApi } from '@/lib/backendApi';
import { toast } from '@/lib/toast';
import type { Customer, Order, Product } from '@/types';

interface ReportsDataState {
  isLoading: boolean;
  canViewCustomers: boolean;
  ordersData: Order[];
  productsData: Product[];
  customersData: Customer[];
}

export function useReportsData(): ReportsDataState {
  const [isLoading, setIsLoading] = useState(true);
  const [canViewCustomers, setCanViewCustomers] = useState(true);
  const [ordersData, setOrdersData] = useState<Order[]>([]);
  const [productsData, setProductsData] = useState<Product[]>([]);
  const [customersData, setCustomersData] = useState<Customer[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      const [ordersResult, productsResult, customersResult] = await Promise.allSettled([
        fetchOrdersApi(),
        fetchProductsApi(),
        fetchCustomersApi(),
      ]);

      if (!isMounted) {
        return;
      }

      if (ordersResult.status === 'fulfilled') {
        setOrdersData(ordersResult.value);
      } else {
        toast.error(ordersResult.reason instanceof Error ? ordersResult.reason.message : 'Không thể tải dữ liệu đơn hàng');
      }

      if (productsResult.status === 'fulfilled') {
        setProductsData(productsResult.value);
      } else {
        toast.error(productsResult.reason instanceof Error ? productsResult.reason.message : 'Không thể tải dữ liệu sản phẩm');
      }

      if (customersResult.status === 'fulfilled') {
        setCustomersData(customersResult.value);
        setCanViewCustomers(true);
      } else {
        const message = customersResult.reason instanceof Error ? customersResult.reason.message : '';
        const isPermissionError = message.toLowerCase().includes('permission');
        setCustomersData([]);
        setCanViewCustomers(!isPermissionError);
        if (!isPermissionError) {
          toast.error(message || 'Không thể tải dữ liệu khách hàng');
        }
      }

      setIsLoading(false);
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    isLoading,
    canViewCustomers,
    ordersData,
    productsData,
    customersData,
  };
}

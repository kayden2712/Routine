import { useEffect, useState } from 'react';
import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import { fetchOrdersApi } from '@/lib/backendApi';
import { resolveWebSocketUrl } from '@/lib/realtime';
import type { Order } from '@/types';

export function useInvoicesData() {
  const [isLoading, setIsLoading] = useState(true);
  const [ordersData, setOrdersData] = useState<Order[]>([]);

  useEffect(() => {
    let isMounted = true;
    let subscription: StompSubscription | null = null;

    const loadData = async (silent = false) => {
      try {
        const orders = await fetchOrdersApi();
        if (!isMounted) {
          return;
        }
        setOrdersData(orders);
      } catch {
        // Ignore background refresh errors.
      } finally {
        if (!silent && isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    const intervalId = window.setInterval(() => {
      void loadData(true);
    }, 5000);

    const wsClient = new Client({
      brokerURL: resolveWebSocketUrl(),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        subscription = wsClient.subscribe('/topic/orders/status-changed', (message: IMessage) => {
          if (message.body) {
            try {
              JSON.parse(message.body);
            } catch {
              // Ignore malformed payload and still refresh list.
            }
          }
          void loadData(true);
        });
      },
      onWebSocketError: (event) => {
        console.error('WebSocket error:', event);
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers.message, frame.body);
      },
    });

    wsClient.activate();

    const handleWindowFocus = () => {
      void loadData(true);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void loadData(true);
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      subscription?.unsubscribe();
      wsClient.deactivate();
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return {
    isLoading,
    ordersData,
    setOrdersData,
  };
}

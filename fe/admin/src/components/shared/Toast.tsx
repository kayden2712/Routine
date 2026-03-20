import { create } from 'zustand';
import { cn } from '@/lib/utils';

type ToastKind = 'success' | 'error';

interface ToastMessage {
  id: string;
  kind: ToastKind;
  title: string;
  description?: string;
}

interface ToastState {
  messages: ToastMessage[];
  push: (kind: ToastKind, title: string, description?: string) => void;
  dismiss: (id: string) => void;
}

const useToastStore = create<ToastState>((set) => ({
  messages: [],
  push: (kind, title, description) => {
    const id = `${Date.now()}-${Math.random()}`;
    set((state) => ({
      messages: [...state.messages, { id, kind, title, description }],
    }));

    setTimeout(() => {
      set((state) => ({
        messages: state.messages.filter((message) => message.id !== id),
      }));
    }, 3000);
  },
  dismiss: (id) => {
    set((state) => ({
      messages: state.messages.filter((message) => message.id !== id),
    }));
  },
}));

export const toast = {
  success: (title: string, description?: string) => {
    useToastStore.getState().push('success', title, description);
  },
  error: (title: string, description?: string) => {
    useToastStore.getState().push('error', title, description);
  },
};

export function useAppToast() {
  return toast;
}

export function AppToaster() {
  const messages = useToastStore((state) => state.messages);
  const dismiss = useToastStore((state) => state.dismiss);

  return (
    <div className="fixed right-4 top-4 z-50 space-y-2">
      {messages.map((message) => (
        <button
          key={message.id}
          type="button"
          onClick={() => dismiss(message.id)}
          className={cn(
            'w-72 rounded-md border p-3 text-left shadow-sm',
            message.kind === 'success'
              ? 'border-[var(--color-success)] bg-[var(--color-success-bg)]'
              : 'border-[var(--color-error)] bg-[var(--color-error-bg)]',
          )}
        >
          <p className="text-sm font-semibold">{message.title}</p>
          {message.description ? (
            <p className="text-xs text-muted-foreground">{message.description}</p>
          ) : null}
        </button>
      ))}
    </div>
  );
}

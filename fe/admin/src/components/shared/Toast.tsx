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
    const fingerprint = `${kind}::${title}::${description ?? ''}`;
    const duplicateExists = useToastStore
      .getState()
      .messages.some((message) => `${message.kind}::${message.title}::${message.description ?? ''}` === fingerprint);

    if (duplicateExists) {
      return;
    }

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
    <div className="pointer-events-none fixed right-4 top-4 z-[2147483647] space-y-2">
      {messages.map((message) => (
        <button
          key={message.id}
          type="button"
          onClick={() => dismiss(message.id)}
          className={cn(
            'pointer-events-auto w-80 rounded-lg border p-3 text-left shadow-xl ring-1 backdrop-blur-none transition-all',
            message.kind === 'success'
              ? 'border-emerald-700/80 bg-emerald-50 text-emerald-950 ring-emerald-700/20'
              : 'border-red-700/80 bg-red-50 text-red-950 ring-red-700/20',
          )}
        >
          <p className="text-sm font-semibold leading-5">{message.title}</p>
          {message.description ? (
            <p
              className={cn(
                'mt-1 text-xs leading-4',
                message.kind === 'success' ? 'text-emerald-900/90' : 'text-red-900/90',
              )}
            >
              {message.description}
            </p>
          ) : null}
        </button>
      ))}
    </div>
  );
}

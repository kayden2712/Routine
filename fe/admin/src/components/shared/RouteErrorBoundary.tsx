import { AlertTriangle, RefreshCw } from 'lucide-react';
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  let title = 'Da xay ra loi';
  let message = 'He thong gap su co khong mong muon. Vui long thu lai.';

  if (isRouteErrorResponse(error)) {
    title = `${error.status} - ${error.statusText || 'Route error'}`;
    message =
      typeof error.data === 'string'
        ? error.data
        : 'Khong the tai du lieu cho trang nay. Vui long thu lai sau.';
  } else if (error instanceof Error && error.message) {
    message = error.message;
  }

  return (
    <div className="grid min-h-[60vh] place-items-center rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-error-bg)] text-[var(--color-error)]">
          <AlertTriangle size={22} />
        </div>
        <h2 className="mb-2 font-[var(--font-display)] text-xl font-semibold text-[var(--color-text-primary)]">
          {title}
        </h2>
        <p className="mb-5 text-sm text-[var(--color-text-secondary)]">{message}</p>
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Quay lai
          </Button>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw size={16} className="mr-2" />
            Tai lai
          </Button>
        </div>
      </div>
    </div>
  );
}

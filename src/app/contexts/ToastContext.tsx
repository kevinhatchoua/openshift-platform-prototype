import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  Alert,
  AlertActionCloseButton,
  AlertGroup,
  type AlertProps,
} from "@patternfly/react-core";

export type ToastVariant = NonNullable<AlertProps["variant"]>;

export type ToastMessage = {
  key: number;
  variant: ToastVariant;
  title: string;
  timeout?: number;
};

export type ToastInput = {
  variant: ToastVariant;
  title: string;
  timeout?: number;
};

type ToastContextValue = {
  toasts: ToastMessage[];
  activeCount: number;
  pushToast: (toast: ToastInput) => number;
  dismissToast: (key: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_TIMEOUT_MS = 8000;
const MAX_VISIBLE_TOASTS = 4;

function variantLabel(variant: ToastVariant) {
  switch (variant) {
    case "success":
      return "Success alert";
    case "danger":
      return "Danger alert";
    case "warning":
      return "Warning alert";
    default:
      return "Info alert";
  }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((key: number) => {
    setToasts((prev) => prev.filter((toast) => toast.key !== key));
  }, []);

  const pushToast = useCallback((toast: ToastInput) => {
    const key = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [{ key, timeout: DEFAULT_TIMEOUT_MS, ...toast }, ...prev].slice(0, MAX_VISIBLE_TOASTS));
    return key;
  }, []);

  const value = useMemo(
    () => ({
      toasts,
      activeCount: toasts.length,
      pushToast,
      dismissToast,
    }),
    [toasts, pushToast, dismissToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <AlertGroup
        className="ocs-console-toast-group"
        isToast
        isLiveRegion
        hasAnimations
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <Alert
            key={toast.key}
            variant={toast.variant}
            title={toast.title}
            isExpandable={false}
            timeout={toast.timeout ?? DEFAULT_TIMEOUT_MS}
            onTimeout={() => dismissToast(toast.key)}
            actionClose={
              <AlertActionCloseButton
                title={toast.title}
                variantLabel={variantLabel(toast.variant)}
                onClose={() => dismissToast(toast.key)}
              />
            }
          />
        ))}
      </AlertGroup>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

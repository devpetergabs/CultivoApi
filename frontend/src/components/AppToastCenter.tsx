import { useEffect, useRef, useState } from 'react';

type ToastTone = 'success' | 'warning' | 'error';

type ToastItem = {
  id: string;
  message: string;
  tone: ToastTone;
};

function toneClasses(tone: ToastTone) {
  if (tone === 'success') {
    return 'border-emerald-400/25 bg-emerald-500/10 text-emerald-100 shadow-[0_0_22px_rgba(16,185,129,0.18)]';
  }
  if (tone === 'warning') {
    return 'border-amber-300/25 bg-amber-400/10 text-amber-100 shadow-[0_0_22px_rgba(251,191,36,0.16)]';
  }
  return 'border-rose-400/25 bg-rose-500/10 text-rose-100 shadow-[0_0_22px_rgba(244,63,94,0.16)]';
}

export function AppToastCenter() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const onToast = (event: Event) => {
      const custom = event as CustomEvent<{ message?: string; tone?: ToastTone }>;
      const message = custom?.detail?.message;
      if (!message) return;

      const tone: ToastTone = custom.detail?.tone ?? 'warning';
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

      setToasts((cur) => [{ id, message, tone }, ...cur].slice(0, 4));

      // auto-dismiss
      timersRef.current[id] = window.setTimeout(() => {
        setToasts((cur) => cur.filter((t) => t.id !== id));
        window.clearTimeout(timersRef.current[id]);
        delete timersRef.current[id];
      }, 2200);
    };

    window.addEventListener('app:toast', onToast as EventListener);
    return () => {
      window.removeEventListener('app:toast', onToast as EventListener);
      Object.values(timersRef.current).forEach((t) => window.clearTimeout(t));
      timersRef.current = {};
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`max-w-[320px] rounded-2xl border px-4 py-3 text-sm font-semibold backdrop-blur-md ${toneClasses(
            t.tone
          )}`}
          role="status"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

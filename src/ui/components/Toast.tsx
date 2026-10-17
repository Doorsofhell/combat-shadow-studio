import { useEffect } from 'react';
import { create } from 'zustand';
import { IconCheck } from '../icons';

interface ToastState {
  items: { id: number; text: string }[];
  push: (text: string) => void;
  drop: (id: number) => void;
}

const useToasts = create<ToastState>()((set) => ({
  items: [],
  push: (text) => set((s) => ({ items: [...s.items.slice(-2), { id: Date.now() + Math.random(), text }] })),
  drop: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
}));

/** discreet confirmation message, read by screen readers (polite live region) */
export const toast = (text: string) => useToasts.getState().push(text);

function ToastItem({ id, text }: { id: number; text: string }) {
  const drop = useToasts((s) => s.drop);
  useEffect(() => {
    const t = setTimeout(() => drop(id), 3200);
    return () => clearTimeout(t);
  }, [id, drop]);
  return (
    <div className="toast" onClick={() => drop(id)}>
      <IconCheck width={18} height={18} />
      {text}
    </div>
  );
}

export function Toaster() {
  const items = useToasts((s) => s.items);
  return (
    <div className="toasts" role="status" aria-live="polite">
      {items.map((t) => (
        <ToastItem key={t.id} {...t} />
      ))}
    </div>
  );
}

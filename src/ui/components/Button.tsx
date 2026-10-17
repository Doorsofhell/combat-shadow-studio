import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'default';

function cls(variant: Variant, block?: boolean, size?: 'lg', extra?: string) {
  return ['btn', variant !== 'default' && variant, block && 'block', size, extra].filter(Boolean).join(' ');
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  block?: boolean;
  size?: 'lg';
  icon?: ReactNode;
}

/** Primary (red, uppercase Rajdhani) for the one main action of a screen; secondary / ghost otherwise. */
export function Button({ variant = 'default', block, size, icon, className, children, type = 'button', ...rest }: ButtonProps) {
  return (
    <button type={type} className={cls(variant, block, size, className)} {...rest}>
      {icon}
      {children}
    </button>
  );
}

export function LinkButton({ to, variant = 'default', block, size, icon, children, className, ...rest }: { to: string; variant?: Variant; block?: boolean; size?: 'lg'; icon?: ReactNode; children: ReactNode; className?: string; 'data-testid'?: string; 'aria-label'?: string }) {
  return (
    <Link to={to} className={cls(variant, block, size, className)} {...rest}>
      {icon}
      {children}
    </Link>
  );
}

/** Square 48px icon-only button; the label is mandatory for screen readers. */
export function IconButton({ label, children, className, type = 'button', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button type={type} className={`btn icon ghost ${className ?? ''}`} aria-label={label} title={label} {...rest}>
      {children}
    </button>
  );
}

import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'terminal' | 'ghost' | 'emerald';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface BaseButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  mono?: boolean;
  className?: string;
  children: React.ReactNode;
}

export type ButtonProps = BaseButtonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: never;
  };

export type AnchorButtonProps = BaseButtonProps &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-emerald-500 text-emerald-950 font-bold border border-emerald-400/40 hover:bg-emerald-400 active:bg-emerald-600 shadow-sm transition-colors',
  secondary:
    'bg-slate-900 text-slate-100 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 active:bg-slate-950',
  terminal:
    'bg-slate-900 text-slate-100 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 active:bg-slate-950 font-mono',
  ghost:
    'bg-transparent text-slate-300 hover:text-white hover:bg-slate-800/60 active:bg-slate-800/80 border border-transparent',
  emerald:
    'bg-emerald-600 text-white font-semibold border border-emerald-500/80 hover:bg-emerald-500 active:bg-emerald-700',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2 text-xs sm:text-sm rounded-lg gap-2',
  lg: 'px-5 py-3 text-sm sm:text-base rounded-xl gap-2.5',
};

export function Button({
  variant = 'primary',
  size = 'md',
  mono = false,
  className = '',
  children,
  ...props
}: ButtonProps | AnchorButtonProps) {
  const combinedClasses = `inline-flex items-center justify-center font-semibold transition-colors duration-150 ease-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:opacity-50 disabled:pointer-events-none ${
    variantClasses[variant]
  } ${sizeClasses[size]} ${mono ? 'font-mono' : ''} ${className}`;

  if ('href' in props && props.href) {
    const { href, ...anchorProps } = props as AnchorButtonProps;
    return (
      <a href={href} className={combinedClasses} {...anchorProps}>
        {children}
      </a>
    );
  }

  const buttonProps = props as ButtonProps;
  return (
    <button className={combinedClasses} {...buttonProps}>
      {children}
    </button>
  );
}

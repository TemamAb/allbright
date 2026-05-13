import * as React from "react";
import { X } from "lucide-react";

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
};

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;
  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={() => onOpenChange(false)}
      />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg px-4">
        {children}
      </div>
    </>
  );
}

type DialogContentProps = {
  className?: string;
  children: React.ReactNode;
};

export function DialogContent({ className = "", children }: DialogContentProps) {
  return (
    <div className={`bg-ash-black border border-ash-border rounded-2xl shadow-2xl ${className}`}>
      {children}
    </div>
  );
}

type DialogHeaderProps = {
  children: React.ReactNode;
};

export function DialogHeader({ children }: DialogHeaderProps) {
  return <div className="p-6">{children}</div>;
}

type DialogTitleProps = {
  className?: string;
  children: React.ReactNode;
};

export function DialogTitle({ className = "", children }: DialogTitleProps) {
  return (
    <h2 className={`text-xl font-black text-white uppercase italic tracking-tighter ${className}`}>
      {children}
    </h2>
  );
}

type DialogDescriptionProps = {
  className?: string;
  children: React.ReactNode;
};

export function DialogDescription({ className = "", children }: DialogDescriptionProps) {
  return (
    <p className={`text-sm text-zinc-400 mt-2 ${className}`}>
      {children}
    </p>
  );
}

type DialogCloseProps = {
  className?: string;
  onClick?: () => void;
  children?: React.ReactNode;
};

export function DialogClose({ className = "", onClick, children }: DialogCloseProps) {
  return (
    <button 
      onClick={onClick}
      className={`absolute right-4 top-4 text-zinc-400 hover:text-white transition-colors ${className}`}
    >
      {children || <X size={18} />}
    </button>
  );
}

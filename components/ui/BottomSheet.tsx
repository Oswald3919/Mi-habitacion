'use client';

export function BottomSheet({
  open,
  title,
  onClose,
  className,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="app-overlay" onMouseDown={onClose}>
      <section
        className={`app-sheet${className ? ` ${className}` : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-sheet-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="app-sheet__grabber" />
        <header className="app-sheet__header">
          <h2 id="app-sheet-title">{title}</h2>
          <button type="button" className="app-sheet__close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </header>
        <div className="app-sheet__body">{children}</div>
      </section>
    </div>
  );
}

'use client';

export function BottomSheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="app-overlay" onMouseDown={onClose}>
      <section
        className="app-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-sheet-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="app-sheet__grabber" />
        <header className="app-sheet__header">
          <h2 id="app-sheet-title">{title}</h2>
          <button className="app-sheet__close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </header>
        <div className="app-sheet__body">{children}</div>
      </section>
    </div>
  );
}

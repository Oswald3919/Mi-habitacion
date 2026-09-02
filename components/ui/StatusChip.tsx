export function StatusChip({
  status,
  children,
}: {
  status: 'ok' | 'review' | 'attention';
  children: React.ReactNode;
}) {
  return (
    <span className={`status-chip status-chip--${status}`}>
      <span className="status-chip__dot" aria-hidden="true" />
      {children}
    </span>
  );
}

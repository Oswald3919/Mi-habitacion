export function ControlButton({
  children,
  onClick,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button className="sheet-option" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

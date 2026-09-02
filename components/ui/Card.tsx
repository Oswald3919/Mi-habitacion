export function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={`foundation-card ${className}`}>{children}</section>;
}

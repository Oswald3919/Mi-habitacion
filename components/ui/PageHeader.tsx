export function PageHeader({
  eyebrow = 'Mi espacio',
  title,
  intro,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
}) {
  return (
    <header className="foundation-page__header">
      <div>
        <p className="foundation-page__eyebrow">{eyebrow}</p>
        <h1 className="foundation-page__title">{title}</h1>
        {intro && <p className="foundation-page__intro">{intro}</p>}
      </div>
    </header>
  );
}

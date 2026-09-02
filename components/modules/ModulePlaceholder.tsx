import { Card } from '../ui/Card';
import { PageHeader } from '../ui/PageHeader';

export function ModulePlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <main className="foundation-page module-placeholder">
      <PageHeader title={title} />
      <Card className="module-placeholder__card">
        <span className="module-placeholder__mark" aria-hidden="true">✦</span>
        <h2>Este espacio se está preparando</h2>
        <p>{description}</p>
      </Card>
    </main>
  );
}

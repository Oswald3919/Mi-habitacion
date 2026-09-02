'use client';

import { useState } from 'react';
import { BottomNav } from './BottomNav';
import { ContextualCreateSheet } from './ContextualCreateSheet';
import { MoreMenu } from './MoreMenu';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="app-shell">
      <div className="app-content">{children}</div>
      <BottomNav
        moreOpen={moreOpen}
        onMore={() => setMoreOpen((open) => !open)}
        onCreate={() => setCreateOpen(true)}
      />
      <MoreMenu open={moreOpen} onClose={() => setMoreOpen(false)} />
      <ContextualCreateSheet open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

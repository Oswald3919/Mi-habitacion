'use client';

import Link from 'next/link';
import { BottomSheet } from '../ui/BottomSheet';
import { MORE_LINKS } from './navigation';

export function MoreMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <BottomSheet open={open} title="Más espacios" onClose={onClose}>
      <div className="more-menu__list">
        {MORE_LINKS.map(([label, href]) => (
          <Link key={href} href={href} className="more-menu__link" onClick={onClose}>
            {label}<span aria-hidden="true" style={{ marginLeft: 'auto' }}>›</span>
          </Link>
        ))}
      </div>
    </BottomSheet>
  );
}

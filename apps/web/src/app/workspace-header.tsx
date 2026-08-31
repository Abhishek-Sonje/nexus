import { Radar } from 'lucide-react';

import { LogoutButton } from './logout-button';

export function WorkspaceHeader({ current }: { current: 'runs' | 'method' }) {
  return (
    <header className="workspace-header">
      <a className="workspace-brand" href="/">
        <Radar aria-hidden="true" />
        <span>Nexus</span>
      </a>
      <nav aria-label="Investigation workspace">
        <a href="/">Observatory</a>
        <a href="/runs" aria-current={current === 'runs' ? 'page' : undefined}>
          Runs
        </a>
        <a
          href="/methodology"
          aria-current={current === 'method' ? 'page' : undefined}
        >
          Methodology
        </a>
      </nav>
      <LogoutButton />
    </header>
  );
}

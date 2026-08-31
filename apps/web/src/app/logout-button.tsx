'use client';

import { LogOut } from 'lucide-react';

export function LogoutButton() {
  return (
    <button
      className="rail-logout"
      type="button"
      onClick={() => {
        void fetch('/api/session', { method: 'DELETE' }).then(() => {
          window.location.assign('/login');
        });
      }}
    >
      <LogOut />
      <span>Lock</span>
    </button>
  );
}

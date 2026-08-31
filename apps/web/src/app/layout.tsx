import '@fontsource-variable/instrument-sans';
import '@fontsource-variable/jetbrains-mono';
import './globals.css';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nexus — Signal Observatory',
  description: 'Synthetic payment-network risk analysis for investigators.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div
          id="signal-observatory-contract"
          data-direction="signal-observatory"
          data-seed="171a808a"
          hidden
        />
        {children}
      </body>
    </html>
  );
}

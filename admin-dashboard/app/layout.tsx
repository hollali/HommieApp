
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { ClerkProvider } from '@clerk/nextjs';

export const metadata: Metadata = {
  title: 'Hommie Admin Dashboard',
  description: 'Admin dashboard for Hommie rental platform',
  icons: {
    icon: '/HOMMIE_LOGO TYPE I [BLUE].png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body suppressHydrationWarning>
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}

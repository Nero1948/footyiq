import './globals.css';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export const metadata = {
  metadataBase: new URL('https://www.setforsix.com'),
  title: 'Set For Six — Daily NRL Guessing Game',
  description: 'Six clues. One mystery NRL player. How fast can you crack it?',
  openGraph: {
    siteName: 'Set For Six',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
  verification: {
    google: 'eJEEAwNxUrjtdBcOg-D3aICGrhjOVGLtyNpu7-zQeME',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}<Analytics /><SpeedInsights /></body>
    </html>
  );
}

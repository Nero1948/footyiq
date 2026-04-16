import './globals.css';

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
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

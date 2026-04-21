import './globals.css';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export const metadata = {
  metadataBase: new URL('https://www.setforsix.com'),
  title: 'Set For Six — Daily NRL Guessing Game',
  description: 'Six clues. One mystery NRL player. How fast can you crack it?',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    siteName: 'Set For Six',
    type: 'website',
    locale: 'en_AU',
  },
  twitter: {
    card: 'summary_large_image',
  },
  verification: {
    google: 'eJEEAwNxUrjtdBcOg-D3aICGrhjOVGLtyNpu7-zQeME',
  },
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Set For Six',
  url: 'https://www.setforsix.com',
  logo: 'https://www.setforsix.com/icon.svg',
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Set For Six',
  alternateName: 'Set For Six NRL',
  url: 'https://www.setforsix.com',
  description: 'Daily NRL guessing game. Six clues, one mystery rugby league player, new every day.',
  inLanguage: 'en-AU',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-AU">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </body>
    </html>
  );
}

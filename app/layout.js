import './globals.css';

export const metadata = {
  title: 'FootyIQ — Daily NRL Guessing Game',
  description: '6 clues. 1 mystery NRL player. How fast can you crack it?',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

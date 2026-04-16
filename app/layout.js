import './globals.css';

export const metadata = {
  title: 'Set For Six — Daily NRL Guessing Game',
  description: 'Six clues. One mystery NRL player. How fast can you crack it?',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

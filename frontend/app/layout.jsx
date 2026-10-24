import './globals.css';

export const metadata = {
  title: 'KOTL • Kindergarten Growth Hub & Report Card',
  description: 'AI Child Companion & Pediatric Growth Dashboard for Parth',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Fredoka:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[#FFFDF9] antialiased">
        {children}
      </body>
    </html>
  );
}

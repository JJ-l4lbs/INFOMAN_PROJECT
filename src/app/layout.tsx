import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Civil Service Exam Registration & Tracking Portal',
  description: 'Apply for the Civil Service Professional Exam and track your application status online.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <header style={{
            borderBottom: '1px solid var(--color-border)',
            backgroundColor: 'var(--bg-secondary)',
            padding: '1rem 0',
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}>
            <div className="container" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <a href="/" style={{
                fontFamily: 'var(--font-accent)',
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--color-primary)'
              }}>
                CSC PORTAL
              </a>
              <nav style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
                <a href="/apply" style={{ color: 'var(--text-secondary)' }}>Apply</a>
                <a href="/track" style={{ color: 'var(--text-secondary)' }}>Track Status</a>
                <a href="/admin" style={{ color: 'var(--text-secondary)' }}>Admin Panel</a>
              </nav>
            </div>
          </header>
          
          <div style={{ flex: 1 }}>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}

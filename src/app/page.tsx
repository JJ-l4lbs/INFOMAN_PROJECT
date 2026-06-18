import Link from 'next/link';
import { FileText, Search, Database } from 'lucide-react';

export default function Home() {
  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '85vh',
      padding: '2rem 1.5rem',
      gap: '3rem',
      maxWidth: '1000px',
      margin: '0 auto',
      animation: 'fadeIn 0.5s ease-out'
    }}>
      <header style={{ textAlign: 'center', maxWidth: '600px' }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 800,
          letterSpacing: '-0.05em',
          marginBottom: '1rem',
          background: 'linear-gradient(135deg, var(--color-primary), #3b82f6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontFamily: 'var(--font-accent)'
        }}>
          CSC Exam Portal
        </h1>
        <p style={{
          fontSize: '1.125rem',
          color: 'var(--text-secondary)',
          lineHeight: '1.6'
        }}>
          Gateway to the Civil Service Professional Examination systems. Submit your application, track validation status in real-time, or manage databases.
        </p>
      </header>

      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '2rem',
        width: '100%'
      }}>
        {/* Card 1: Apply */}
        <Link href="/apply" style={{ display: 'contents' }}>
          <div className="card animate-fade-in" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            cursor: 'pointer',
            padding: '2.25rem 2rem',
            borderWidth: '1px',
            borderRadius: 'var(--radius-xl)'
          }}>
            <div style={{
              width: '3.25rem',
              height: '3.25rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileText size={28} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', marginBottom: '0.5rem', fontFamily: 'var(--font-accent)' }}>
                Application Form
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: '1.5' }}>
                Register for the Civil Service Professional Exam. Fill in personal data, educational backgrounds, and upload eligibility proofs.
              </p>
            </div>
          </div>
        </Link>

        {/* Card 2: Track */}
        <Link href="/track" style={{ display: 'contents' }}>
          <div className="card animate-fade-in" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            cursor: 'pointer',
            padding: '2.25rem 2rem',
            borderWidth: '1px',
            borderRadius: 'var(--radius-xl)'
          }}>
            <div style={{
              width: '3.25rem',
              height: '3.25rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              color: 'var(--color-pending)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Search size={28} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', marginBottom: '0.5rem', fontFamily: 'var(--font-accent)' }}>
                Track Status
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: '1.5' }}>
                Check the review and validation status of your submitted exam registration using your application reference details.
              </p>
            </div>
          </div>
        </Link>

        {/* Card 3: Admin */}
        <Link href="/admin" style={{ display: 'contents' }}>
          <div className="card animate-fade-in" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            cursor: 'pointer',
            padding: '2.25rem 2rem',
            borderWidth: '1px',
            borderRadius: 'var(--radius-xl)'
          }}>
            <div style={{
              width: '3.25rem',
              height: '3.25rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: 'var(--color-approved)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Database size={28} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', marginBottom: '0.5rem', fontFamily: 'var(--font-accent)' }}>
                Database Admin
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: '1.5' }}>
                Access the Database Manager Portal. View registrations list, update validation status, or conduct standard CRUD tasks.
              </p>
            </div>
          </div>
        </Link>
      </section>

      <footer style={{ marginTop: '2rem', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
        CSC Exam Registration Portal &bull; Academic Project Submission
      </footer>
    </main>
  );
}

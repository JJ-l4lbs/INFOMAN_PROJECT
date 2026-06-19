"use client";

import React from 'react';
import { CheckCircle } from 'lucide-react';

interface SuccessDisplayProps {
  successDetails: {
    applicantId: string;
    applicationNo: string;
  };
}

export default function SuccessDisplay({ successDetails }: SuccessDisplayProps) {
  return (
    <main style={{ maxWidth: '600px', margin: '3rem auto', padding: '0 1.5rem', animation: 'fadeIn 0.4s ease-out' }}>
      <div className="card" style={{
        textAlign: 'center',
        padding: '3rem 2rem',
        borderRadius: 'var(--radius-xl)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem'
      }}>
        <div style={{ color: 'var(--color-approved)', marginBottom: '0.5rem' }}>
          <CheckCircle size={64} />
        </div>
        <h2 style={{ fontFamily: 'var(--font-accent)', fontSize: '2rem' }}>
          Submission Successful!
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Your application for the Civil Service Professional Exam has been registered successfully.
        </p>

        <div style={{
          width: '100%',
          backgroundColor: 'var(--bg-primary)',
          padding: '1.5rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          textAlign: 'left',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>UNIQUE APPLICANT ID</span>
            <p style={{ fontFamily: 'monospace', fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-primary)' }}>{successDetails.applicantId}</p>
          </div>
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>APPLICATION REF NUMBER</span>
            <p style={{ fontFamily: 'monospace', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{successDetails.applicationNo}</p>
          </div>
        </div>

        <div style={{ fontSize: '0.875rem', color: 'var(--color-pending)', backgroundColor: 'var(--color-pending-bg)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-pending-border)' }}>
          ⚠️ Write down or copy these identifiers! You will need them to check your application status later.
        </div>

        <div style={{ display: 'flex', gap: '1rem', width: '100%', marginTop: '1rem' }}>
          <a href="/" className="btn btn-secondary" style={{ flex: 1 }}>Back to Home</a>
          <a href={`/track?ref=${successDetails.applicationNo}`} className="btn btn-primary" style={{ flex: 1 }}>Track Application</a>
        </div>
      </div>
    </main>
  );
}

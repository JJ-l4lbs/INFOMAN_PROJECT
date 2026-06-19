"use client";

import React from 'react';

interface ReviewStepProps {
  personal: {
    name: string;
    email: string;
    mobile_number: string;
    permanent_address: string;
    civil_status: string;
    employment_status: string;
  };
  education: {
    highest_education: string;
    program_title: string;
    major: string;
    inclusive_years: string;
    school_code: string;
  };
  employment: {
    job_title: string;
    years_in_agency: number;
    appointment_status: string;
    agency_code: string;
  };
  disabilities: {
    visual: boolean;
    hearing: boolean;
    orthopedic: boolean;
  };
  eligibilityProofs: Array<{
    title: string;
  }>;
}

export default function ReviewStep({
  personal,
  education,
  employment,
  disabilities,
  eligibilityProofs
}: ReviewStepProps) {
  return (
    <section className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h3 style={{ fontSize: '1.15rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
        Review Application
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* Personal Summary */}
        <div className="card" style={{ padding: '1.25rem', backgroundColor: 'var(--bg-primary)' }}>
          <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: 'var(--color-primary)' }}>Personal Data</h4>
          <p style={{ fontSize: '0.9rem', margin: '0.25rem 0' }}><strong>Name:</strong> {personal.name}</p>
          <p style={{ fontSize: '0.9rem', margin: '0.25rem 0' }}><strong>Email:</strong> {personal.email}</p>
          <p style={{ fontSize: '0.9rem', margin: '0.25rem 0' }}><strong>Mobile:</strong> {personal.mobile_number}</p>
          <p style={{ fontSize: '0.9rem', margin: '0.25rem 0' }}><strong>Address:</strong> {personal.permanent_address}</p>
          <p style={{ fontSize: '0.9rem', margin: '0.25rem 0' }}><strong>Civil Status:</strong> {personal.civil_status}</p>
        </div>

        {/* Education Summary */}
        <div className="card" style={{ padding: '1.25rem', backgroundColor: 'var(--bg-primary)' }}>
          <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: 'var(--color-primary)' }}>Education History</h4>
          <p style={{ fontSize: '0.9rem', margin: '0.25rem 0' }}><strong>Highest Degree:</strong> {education.highest_education}</p>
          <p style={{ fontSize: '0.9rem', margin: '0.25rem 0' }}><strong>Program:</strong> {education.program_title} ({education.major})</p>
          <p style={{ fontSize: '0.9rem', margin: '0.25rem 0' }}><strong>Inclusive Years:</strong> {education.inclusive_years}</p>
          <p style={{ fontSize: '0.9rem', margin: '0.25rem 0' }}><strong>School Code:</strong> {education.school_code}</p>
        </div>

        {/* Employment Summary */}
        {personal.employment_status === 'Employed' && (
          <div className="card" style={{ padding: '1.25rem', backgroundColor: 'var(--bg-primary)' }}>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: 'var(--color-primary)' }}>Employment Record</h4>
            <p style={{ fontSize: '0.9rem', margin: '0.25rem 0' }}><strong>Title:</strong> {employment.job_title}</p>
            <p style={{ fontSize: '0.9rem', margin: '0.25rem 0' }}><strong>Years in Agency:</strong> {employment.years_in_agency}</p>
            <p style={{ fontSize: '0.9rem', margin: '0.25rem 0' }}><strong>Appointment:</strong> {employment.appointment_status}</p>
            <p style={{ fontSize: '0.9rem', margin: '0.25rem 0' }}><strong>Agency Code:</strong> {employment.agency_code}</p>
          </div>
        )}

        {/* Extra Summary */}
        <div className="card" style={{ padding: '1.25rem', backgroundColor: 'var(--bg-primary)' }}>
          <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: 'var(--color-primary)' }}>Disabilities & Proofs</h4>
          <p style={{ fontSize: '0.9rem', margin: '0.25rem 0' }}><strong>Disabilities:</strong> {
            [
              disabilities.visual && 'Visual',
              disabilities.hearing && 'Hearing',
              disabilities.orthopedic && 'Orthopedic'
            ].filter(Boolean).join(', ') || 'None declared'
          }</p>
          <p style={{ fontSize: '0.9rem', margin: '0.25rem 0' }}><strong>Eligibility Proofs:</strong> {eligibilityProofs.length} record(s) added</p>
        </div>
      </div>

      <div style={{
        fontSize: '0.85rem',
        color: 'var(--text-secondary)',
        borderTop: '1px solid var(--color-border)',
        paddingTop: '1rem',
        marginTop: '0.5rem'
      }}>
        By clicking Submit Application, you declare under penalty of perjury that the data submitted corresponds truthfully to your personal records.
      </div>
    </section>
  );
}

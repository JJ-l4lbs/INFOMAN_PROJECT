"use client";

import React from 'react';
import { Agency } from '@/types';

interface EmploymentFormProps {
  employment: {
    job_title: string;
    years_in_agency: number;
    appointment_status: string;
    agency_code: string;
    customAgencyName?: string;
    customAgencyAddress?: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  agencies: Agency[];
}

export default function EmploymentForm({ employment, onChange, agencies }: EmploymentFormProps) {
  return (
    <section className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3 style={{ fontSize: '1.15rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
        Employment Details
      </h3>

      <div className="form-group">
        <label className="form-label">Employer / Agency *</label>
        <select name="agency_code" value={employment.agency_code} onChange={onChange} className="form-select">
          {agencies.filter(a => (a as any).is_registered !== false).map(a => (
            <option key={a.agency_code} value={a.agency_code}>
              {a.agency_name} ({a.agency_address})
            </option>
          ))}
          <option value="OTHER">Other (Write-in)...</option>
        </select>
      </div>

      {employment.agency_code === 'OTHER' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
          <div className="form-group">
            <label className="form-label">Custom Agency Name *</label>
            <input type="text" name="customAgencyName" value={employment.customAgencyName || ''} onChange={onChange} className="form-input" placeholder="e.g. Department of Health" required />
          </div>
          <div className="form-group">
            <label className="form-label">Custom Agency Address *</label>
            <input type="text" name="customAgencyAddress" value={employment.customAgencyAddress || ''} onChange={onChange} className="form-input" placeholder="e.g. NCR, Manila" required />
          </div>
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Job Title / Designation *</label>
        <input type="text" name="job_title" value={employment.job_title} onChange={onChange} className="form-input" placeholder="e.g. Administrative Officer I" required />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Years in Agency *</label>
          <input type="number" name="years_in_agency" min="0" value={employment.years_in_agency} onChange={onChange} className="form-input" required />
        </div>
        <div className="form-group">
          <label className="form-label">Appointment Status *</label>
          <select name="appointment_status" value={employment.appointment_status} onChange={onChange} className="form-select">
            <option>Permanent</option>
            <option>Contractual</option>
            <option>Casual</option>
            <option>Co-terminus</option>
          </select>
        </div>
      </div>
    </section>
  );
}

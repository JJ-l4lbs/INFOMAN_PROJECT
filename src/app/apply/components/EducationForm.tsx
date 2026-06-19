"use client";

import React from 'react';
import { School } from '@/types';

interface EducationFormProps {
  education: {
    highest_education: string;
    completion: string;
    highest_level: string;
    graduation_date: string;
    honors_received: string;
    program_title: string;
    major: string;
    inclusive_years: string;
    school_code: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  schools: School[];
}

export default function EducationForm({ education, onChange, schools }: EducationFormProps) {
  return (
    <section className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3 style={{ fontSize: '1.15rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
        Educational Background
      </h3>

      <div className="form-group">
        <label className="form-label">School / Institution *</label>
        <select name="school_code" value={education.school_code} onChange={onChange} className="form-select">
          {schools.map(s => (
            <option key={s.school_code} value={s.school_code}>
              {s.school_name} ({s.school_address})
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Highest Education Attained *</label>
          <select name="highest_education" value={education.highest_education} onChange={onChange} className="form-select">
            <option>High School</option>
            <option>Senior High School</option>
            <option>Bachelor's</option>
            <option>Master's</option>
            <option>Doctorate</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Completion Status *</label>
          <select name="completion" value={education.completion} onChange={onChange} className="form-select">
            <option>Completed</option>
            <option>Undergraduate</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Level Category *</label>
          <select name="highest_level" value={education.highest_level} onChange={onChange} className="form-select">
            <option>Secondary</option>
            <option>College</option>
            <option>Post-Graduate</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Graduation Date (if completed)</label>
          <input type="date" name="graduation_date" value={education.graduation_date} onChange={onChange} className="form-input" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Program / Course Title *</label>
          <input type="text" name="program_title" value={education.program_title} onChange={onChange} className="form-input" placeholder="e.g. BS Information Technology or STEM" required />
        </div>
        <div className="form-group">
          <label className="form-label">Major *</label>
          <input type="text" name="major" value={education.major} onChange={onChange} className="form-input" placeholder="e.g. IT, Accounting, or N/A" required />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Inclusive Years (e.g. 2018-2022) *</label>
          <input type="text" name="inclusive_years" value={education.inclusive_years} onChange={onChange} className="form-input" placeholder="YYYY-YYYY" required />
        </div>
        <div className="form-group">
          <label className="form-label">Honors Received (if any)</label>
          <input type="text" name="honors_received" value={education.honors_received} onChange={onChange} className="form-input" placeholder="e.g. Cum Laude, Valedictorian" />
        </div>
      </div>
    </section>
  );
}

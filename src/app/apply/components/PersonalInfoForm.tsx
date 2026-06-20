"use client";

import React from 'react';

interface PersonalInfoFormProps {
  personal: {
    name: string;
    birthdate: string;
    sex: string;
    birthplace: string;
    citizenship: string;
    mother_maiden_name: string;
    permanent_address: string;
    zip_code: string;
    mobile_number: string;
    telephone_number: string;
    email: string;
    civil_status: string;
    priority_group: string;
    employment_status: string;
    is_retaker?: boolean;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export default function PersonalInfoForm({ personal, onChange }: PersonalInfoFormProps) {
  return (
    <section className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3 style={{ fontSize: '1.15rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
        Personal Information
      </h3>
      
      <div className="form-group">
        <label className="form-label">Full Name *</label>
        <input type="text" name="name" value={personal.name} onChange={onChange} className="form-input" placeholder="Juan A. Dela Cruz" required />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Birthdate *</label>
          <input type="date" name="birthdate" value={personal.birthdate} onChange={onChange} className="form-input" required />
        </div>
        <div className="form-group">
          <label className="form-label">Sex *</label>
          <select name="sex" value={personal.sex} onChange={onChange} className="form-select">
            <option>Male</option>
            <option>Female</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Birthplace *</label>
          <input type="text" name="birthplace" value={personal.birthplace} onChange={onChange} className="form-input" placeholder="City / Province" required />
        </div>
        <div className="form-group">
          <label className="form-label">Citizenship *</label>
          <input type="text" name="citizenship" value={personal.citizenship} onChange={onChange} className="form-input" required />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Mother's Maiden Name *</label>
        <input type="text" name="mother_maiden_name" value={personal.mother_maiden_name} onChange={onChange} className="form-input" placeholder="Mother's First Name & Mother's Maiden Surname" required />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Permanent Address *</label>
          <input type="text" name="permanent_address" value={personal.permanent_address} onChange={onChange} className="form-input" placeholder="House No, Street, Brgy, City, Province" required />
        </div>
        <div className="form-group">
          <label className="form-label">Zip Code *</label>
          <input type="text" name="zip_code" value={personal.zip_code} onChange={onChange} className="form-input" placeholder="e.g. 1008" maxLength={4} pattern="\d{4}" inputMode="numeric" onKeyDown={(e) => { if (!/[\d\b]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) e.preventDefault(); }} required />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Mobile Number *</label>
          <input type="tel" name="mobile_number" value={personal.mobile_number} onChange={onChange} className="form-input" placeholder="+639XXXXXXXXX" maxLength={13} inputMode="numeric" onKeyDown={(e) => { if (!/[\d\b+]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) e.preventDefault(); }} required />
        </div>
        <div className="form-group">
          <label className="form-label">Telephone Number</label>
          <input type="tel" name="telephone_number" value={personal.telephone_number} onChange={onChange} className="form-input" placeholder="02-XXXX-XXXX" maxLength={12} inputMode="numeric" onKeyDown={(e) => { if (!/[\d\b-]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) e.preventDefault(); }} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Email Address *</label>
        <input type="email" name="email" value={personal.email} onChange={onChange} className="form-input" placeholder="juan.delacruz@example.com" required />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Civil Status *</label>
          <select name="civil_status" value={personal.civil_status} onChange={onChange} className="form-select">
            <option>Single</option>
            <option>Married</option>
            <option>Widowed</option>
            <option>Separated</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Priority Group (if applicable)</label>
          <select name="priority_group" value={personal.priority_group} onChange={onChange} className="form-select">
            <option>None</option>
            <option>PWD</option>
            <option>Indigenous People</option>
            <option>Senior Citizen</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Employment Status *</label>
        <select name="employment_status" value={personal.employment_status} onChange={onChange} className="form-select">
          <option>Unemployed</option>
          <option>Employed</option>
        </select>
      </div>

      <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
        <input 
          type="checkbox" 
          name="is_retaker" 
          checked={personal.is_retaker || false} 
          onChange={onChange} 
          id="is_retaker" 
          style={{ width: '1.1rem', height: '1.1rem', cursor: 'pointer' }}
        />
        <label htmlFor="is_retaker" style={{ fontSize: '0.95rem', cursor: 'pointer', fontWeight: 500 }}>
          I am a retaker (I have previously applied for / taken this exam)
        </label>
      </div>
    </section>
  );
}

"use client";

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface DisabilitiesFormProps {
  disabilities: string[];
  setDisabilities: React.Dispatch<React.SetStateAction<string[]>>;
  customDisability: string;
  setCustomDisability: (val: string) => void;
  showCustomDisability: boolean;
  setShowCustomDisability: (val: boolean) => void;
  disabilityLookups: Array<{ disability_code: string; disability_name: string; is_registered: boolean }>;
  eligibilityLookups: Array<{ eligibility_code: string; eligibility_name: string; is_registered: boolean }>;
  eligibilityProofs: Array<{
    title: string;
    rating: string;
    dateGranted: string;
    placeTaken: string;
  }>;
  newProof: {
    title: string;
    customTitle: string;
    rating: string;
    dateGranted: string;
    placeTaken: string;
  };
  setNewProof: React.Dispatch<React.SetStateAction<{
    title: string;
    customTitle: string;
    rating: string;
    dateGranted: string;
    placeTaken: string;
  }>>;
  addEligibilityProof: () => void;
  removeEligibilityProof: (index: number) => void;
}

export default function DisabilitiesForm({
  disabilities,
  setDisabilities,
  customDisability,
  setCustomDisability,
  showCustomDisability,
  setShowCustomDisability,
  disabilityLookups,
  eligibilityLookups,
  eligibilityProofs,
  newProof,
  setNewProof,
  addEligibilityProof,
  removeEligibilityProof
}: DisabilitiesFormProps) {
  return (
    <section className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h3 style={{ fontSize: '1.15rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
          Type of Disability (Optional)
        </h3>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {disabilityLookups.filter(d => d.is_registered !== false).map(d => {
            const isChecked = disabilities.includes(d.disability_name);
            return (
              <label key={d.disability_code} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={isChecked} 
                  onChange={(e) => {
                    if (e.target.checked) {
                      setDisabilities(prev => [...prev, d.disability_name]);
                    } else {
                      setDisabilities(prev => prev.filter(item => item !== d.disability_name));
                    }
                  }} 
                  style={{ width: '1.1rem', height: '1.1rem' }} 
                />
                {d.disability_name}
              </label>
            );
          })}
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={showCustomDisability} 
              onChange={(e) => setShowCustomDisability(e.target.checked)} 
              style={{ width: '1.1rem', height: '1.1rem' }} 
            />
            Other (Write-in)
          </label>
        </div>

        {showCustomDisability && (
          <div style={{ marginTop: '0.75rem', animation: 'fadeIn 0.2s ease-out' }}>
            <input 
              type="text" 
              placeholder="Specify other disability..." 
              value={customDisability} 
              onChange={e => setCustomDisability(e.target.value)} 
              className="form-input" 
              style={{ maxWidth: '320px', fontSize: '0.85rem' }} 
              required
            />
          </div>
        )}
      </div>

      <div>
        <h3 style={{ fontSize: '1.15rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
          Eligibility Proofs (Optional)
        </h3>

        {eligibilityProofs.length > 0 && (
          <div className="table-container" style={{ marginBottom: '1.5rem' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Eligibility Title</th>
                  <th>Rating Obtained</th>
                  <th>Date Granted</th>
                  <th>Place Taken</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {eligibilityProofs.map((p, idx) => (
                  <tr key={idx}>
                    <td>{p.title}</td>
                    <td>{p.rating}%</td>
                    <td>{p.dateGranted}</td>
                    <td>{p.placeTaken}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button type="button" onClick={() => removeEligibilityProof(idx)} style={{ background: 'none', border: 'none', color: 'var(--color-rejected)', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{
          backgroundColor: 'var(--bg-tertiary)',
          padding: '1.25rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Add Eligibility Record</h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', alignItems: 'end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 0 }}>Eligibility Title *</label>
              <select 
                value={newProof.title} 
                onChange={e => setNewProof(prev => ({ ...prev, title: e.target.value }))} 
                className="form-select" 
                style={{ fontSize: '0.85rem', padding: '0.5rem' }}
              >
                <option value="">-- Select Eligibility --</option>
                {eligibilityLookups.filter(e => e.is_registered !== false).map(e => (
                  <option key={e.eligibility_code} value={e.eligibility_name}>{e.eligibility_name}</option>
                ))}
                <option value="OTHER">Other (Write-in)...</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 0 }}>Rating Obtained (%) *</label>
              <input type="text" placeholder="Rating (e.g. 85.50)" value={newProof.rating} onChange={e => setNewProof(prev => ({ ...prev, rating: e.target.value }))} className="form-input" style={{ fontSize: '0.85rem' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 0 }}>Date Granted *</label>
              <input type="date" value={newProof.dateGranted} onChange={e => setNewProof(prev => ({ ...prev, dateGranted: e.target.value }))} className="form-input" style={{ fontSize: '0.85rem' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 0 }}>Place Taken *</label>
              <input type="text" placeholder="Place Taken" value={newProof.placeTaken} onChange={e => setNewProof(prev => ({ ...prev, placeTaken: e.target.value }))} className="form-input" style={{ fontSize: '0.85rem' }} />
            </div>
          </div>

          {newProof.title === 'OTHER' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', animation: 'fadeIn 0.2s ease-out' }}>
              <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 0 }}>Custom Eligibility Title *</label>
              <input 
                type="text" 
                placeholder="Type custom eligibility name (e.g. Specialist Certificate)" 
                value={newProof.customTitle || ''} 
                onChange={e => setNewProof(prev => ({ ...prev, customTitle: e.target.value }))} 
                className="form-input" 
                style={{ fontSize: '0.85rem' }} 
                required
              />
            </div>
          )}

          <button type="button" onClick={addEligibilityProof} className="btn btn-secondary" style={{ alignSelf: 'flex-end', fontSize: '0.8rem', padding: '0.5rem 1rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
            <Plus size={14} /> Add Proof
          </button>
        </div>
      </div>
    </section>
  );
}

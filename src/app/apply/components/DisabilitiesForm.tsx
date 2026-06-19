"use client";

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface DisabilitiesFormProps {
  disabilities: {
    visual: boolean;
    hearing: boolean;
    orthopedic: boolean;
  };
  setDisabilities: React.Dispatch<React.SetStateAction<{
    visual: boolean;
    hearing: boolean;
    orthopedic: boolean;
  }>>;
  eligibilityProofs: Array<{
    title: string;
    rating: string;
    dateGranted: string;
    placeTaken: string;
  }>;
  newProof: {
    title: string;
    rating: string;
    dateGranted: string;
    placeTaken: string;
  };
  setNewProof: React.Dispatch<React.SetStateAction<{
    title: string;
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
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={disabilities.visual} onChange={(e) => setDisabilities(prev => ({ ...prev, visual: e.target.checked }))} style={{ width: '1.1rem', height: '1.1rem' }} />
            Visual Impairment
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={disabilities.hearing} onChange={(e) => setDisabilities(prev => ({ ...prev, hearing: e.target.checked }))} style={{ width: '1.1rem', height: '1.1rem' }} />
            Hearing Impairment
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={disabilities.orthopedic} onChange={(e) => setDisabilities(prev => ({ ...prev, orthopedic: e.target.checked }))} style={{ width: '1.1rem', height: '1.1rem' }} />
            Orthopedic
          </label>
        </div>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
            <input type="text" placeholder="PRC License, Bar Exam..." value={newProof.title} onChange={e => setNewProof(prev => ({ ...prev, title: e.target.value }))} className="form-input" style={{ fontSize: '0.85rem' }} />
            <input type="text" placeholder="Rating (e.g. 85.50)" value={newProof.rating} onChange={e => setNewProof(prev => ({ ...prev, rating: e.target.value }))} className="form-input" style={{ fontSize: '0.85rem' }} />
            <input type="date" value={newProof.dateGranted} onChange={e => setNewProof(prev => ({ ...prev, dateGranted: e.target.value }))} className="form-input" style={{ fontSize: '0.85rem' }} />
            <input type="text" placeholder="Place Taken" value={newProof.placeTaken} onChange={e => setNewProof(prev => ({ ...prev, placeTaken: e.target.value }))} className="form-input" style={{ fontSize: '0.85rem' }} />
          </div>
          <button type="button" onClick={addEligibilityProof} className="btn btn-secondary" style={{ alignSelf: 'flex-end', fontSize: '0.8rem', padding: '0.5rem 1rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
            <Plus size={14} /> Add Proof
          </button>
        </div>
      </div>
    </section>
  );
}

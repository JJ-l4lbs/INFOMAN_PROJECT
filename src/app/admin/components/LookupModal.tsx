"use client";

import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

interface LookupModalProps {
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  saving: boolean;
  config: {
    mode: 'create' | 'edit';
    type: 'schools' | 'agencies' | 'disabilities' | 'eligibilities';
    code?: string;
    initialData?: any;
  } | null;
}

export default function LookupModal({
  onClose,
  onSubmit,
  saving,
  config
}: LookupModalProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (config?.initialData) {
      const data = config.initialData;
      setName(data.school_name || data.agency_name || data.disability_name || data.eligibility_name || '');
      setAddress(data.school_address || data.agency_address || '');
    } else {
      setName('');
      setAddress('');
    }
    setError(null);
  }, [config]);

  if (!config) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name field is required.');
      return;
    }
    
    const payload: any = {};
    if (config.type === 'schools') {
      if (!address.trim()) {
        setError('Address field is required for schools.');
        return;
      }
      payload.school_name = name.trim();
      payload.school_address = address.trim();
    } else if (config.type === 'agencies') {
      if (!address.trim()) {
        setError('Address field is required for agencies.');
        return;
      }
      payload.agency_name = name.trim();
      payload.agency_address = address.trim();
    } else if (config.type === 'disabilities') {
      payload.disability_name = name.trim();
    } else if (config.type === 'eligibilities') {
      payload.eligibility_name = name.trim();
    }

    try {
      await onSubmit(payload);
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving.');
    }
  };

  const getTitle = () => {
    const isEdit = config.mode === 'edit';
    const typeLabel = 
      config.type === 'schools' ? 'School' :
      config.type === 'agencies' ? 'Agency' :
      config.type === 'disabilities' ? 'Disability' : 'Eligibility Type';
    
    return `${isEdit ? 'Edit' : 'Add New'} ${typeLabel}`;
  };

  const getNameLabel = () => {
    if (config.type === 'schools') return 'School / Institution Name';
    if (config.type === 'agencies') return 'Employer / Agency Name';
    if (config.type === 'disabilities') return 'Disability Name / Description';
    return 'Eligibility Title';
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '1.5rem'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-lg)',
        width: '100%',
        maxWidth: '450px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{getTitle()}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && (
            <div style={{
              backgroundColor: 'var(--color-rejected-bg)',
              color: 'var(--color-rejected)',
              border: '1px solid var(--color-rejected-border)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem'
            }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">{getNameLabel()} *</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="form-input" 
              placeholder={`e.g. ${config.type === 'schools' ? 'Saint Mary University' : config.type === 'agencies' ? 'Department of Health' : 'Visual Impairment'}`}
              required
            />
          </div>

          {(config.type === 'schools' || config.type === 'agencies') && (
            <div className="form-group">
              <label className="form-label">Address *</label>
              <input 
                type="text" 
                value={address} 
                onChange={e => setAddress(e.target.value)} 
                className="form-input" 
                placeholder="e.g. Bayombong, Nueva Vizcaya"
                required
              />
            </div>
          )}

          <footer style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            borderTop: '1px solid var(--color-border)',
            paddingTop: '1rem',
            marginTop: '0.5rem'
          }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{ fontSize: '0.85rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
              {saving ? (
                <>
                  <Loader2 className="spinner" size={14} /> Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from 'react';
import { PlusCircle, Loader2, CheckCircle2, Trash2, Edit2 } from 'lucide-react';

interface LookupItem {
  school_code?: string;
  agency_code?: string;
  disability_code?: string;
  eligibility_code?: string;
  
  school_name?: string;
  agency_name?: string;
  disability_name?: string;
  eligibility_name?: string;
  
  school_address?: string;
  agency_address?: string;
  
  is_registered?: boolean;
}

interface LookupsTableProps {
  type: 'schools' | 'agencies' | 'disabilities' | 'eligibilities';
  data: LookupItem[];
  loading: boolean;
  onApprove: (code: string) => void;
  onEdit: (code: string, item: LookupItem) => void;
  onDelete: (code: string) => void;
  onAdd: () => void;
}

export default function LookupsTable({
  type,
  data,
  loading,
  onApprove,
  onEdit,
  onDelete,
  onAdd
}: LookupsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const getCode = (item: LookupItem) => {
    return item.school_code || item.agency_code || item.disability_code || item.eligibility_code || '';
  };

  const getName = (item: LookupItem) => {
    return item.school_name || item.agency_name || item.disability_name || item.eligibility_name || '';
  };

  const getAddress = (item: LookupItem) => {
    return item.school_address || item.agency_address || '';
  };

  const getTitleLabel = () => {
    if (type === 'schools') return 'Accredited Schools';
    if (type === 'agencies') return 'Government Agencies';
    if (type === 'disabilities') return 'Recognized Disabilities';
    return 'Exam Eligibility Types';
  };

  const getCodeHeader = () => {
    if (type === 'schools') return 'School Code';
    if (type === 'agencies') return 'Agency Code';
    if (type === 'disabilities') return 'Disability Code';
    return 'Eligibility Code';
  };

  const filteredData = data.filter(item => {
    const name = getName(item).toLowerCase();
    const code = getCode(item).toLowerCase();
    const address = getAddress(item).toLowerCase();
    const term = searchTerm.toLowerCase();
    return name.includes(term) || code.includes(term) || address.includes(term);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <input 
            type="text" 
            placeholder={`Search by code, name...`} 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ fontSize: '0.875rem' }}
          />
        </div>
        <button 
          onClick={onAdd} 
          className="btn btn-primary" 
          style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}
        >
          <PlusCircle size={16} /> Add Record
        </button>
      </div>

      {/* Table grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
          <Loader2 className="spinner" style={{ color: 'var(--color-primary)', width: '2.5rem', height: '2.5rem' }} />
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>{getCodeHeader()}</th>
                <th>Name / Description</th>
                {(type === 'schools' || type === 'agencies') && <th>Address</th>}
                <th>Registration Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={(type === 'schools' || type === 'agencies') ? 5 : 4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
                    No lookup records found.
                  </td>
                </tr>
              ) : (
                filteredData.map(item => {
                  const code = getCode(item);
                  const isRegistered = item.is_registered !== false;
                  return (
                    <tr key={code}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{code}</td>
                      <td style={{ fontWeight: 500 }}>{getName(item)}</td>
                      {(type === 'schools' || type === 'agencies') && <td>{getAddress(item)}</td>}
                      <td>
                        <span 
                          className={`badge badge-${isRegistered ? 'approved' : 'pending'}`} 
                          style={{ fontSize: '0.7rem' }}
                        >
                          {isRegistered ? 'Registered / Approved' : 'Unregistered (Applicant Input)'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          {!isRegistered && (
                            <button 
                              onClick={() => onApprove(code)} 
                              className="btn btn-secondary" 
                              style={{ padding: '0.25rem 0.5rem', minWidth: 0, color: 'var(--color-approved)' }}
                              title="Approve / Register"
                            >
                              <CheckCircle2 size={14} />
                            </button>
                          )}
                          <button 
                            onClick={() => onEdit(code, item)} 
                            className="btn btn-secondary" 
                            style={{ padding: '0.25rem 0.5rem', minWidth: 0 }}
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={() => onDelete(code)} 
                            className="btn btn-secondary" 
                            style={{ padding: '0.25rem 0.5rem', minWidth: 0, color: 'var(--color-rejected)' }}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

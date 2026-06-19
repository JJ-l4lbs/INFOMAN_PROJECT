"use client";

import React from 'react';
import { Search, Filter, PlusCircle, Loader2, ShieldAlert, Eye, Trash2 } from 'lucide-react';
import { Application, Applicant, EducationRecord, EmploymentRecord, School, Agency } from '@/types';

interface JoinResult extends Application {
  applicants: Applicant & {
    education_records?: EducationRecord & { schools: School };
    employment_records?: EmploymentRecord & { agencies: Agency };
  };
}

interface ApplicationsTableProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  handleOpenCreateModal: () => void;
  loading: boolean;
  error: string | null;
  fetchApplications: () => void;
  filteredApps: JoinResult[];
  selectedApp: JoinResult | null;
  handleViewDetails: (app: JoinResult) => void;
  handleDeleteApplicant: (app: JoinResult) => void;
}

export default function ApplicationsTable({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  handleOpenCreateModal,
  loading,
  error,
  fetchApplications,
  filteredApps,
  selectedApp,
  handleViewDetails,
  handleDeleteApplicant
}: ApplicationsTableProps) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: 0 }}>
      {/* Controls Bar */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap'
      }}>
        {/* Search Input */}
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} style={{
            position: 'absolute',
            left: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)'
          }} />
          <input
            type="text"
            placeholder="Search name, email, or application number..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '2.25rem', fontSize: '0.875rem' }}
          />
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} style={{ color: 'var(--text-secondary)' }} />
          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)} 
            className="form-select"
            style={{ width: '130px', fontSize: '0.85rem', padding: '0.5rem' }}
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
        
        <button 
          onClick={handleOpenCreateModal} 
          className="btn btn-primary" 
          style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}
        >
          <PlusCircle size={16} /> Add Applicant
        </button>
      </div>

      {/* Table Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
          <Loader2 className="spinner" style={{ color: 'var(--color-primary)', width: '2.5rem', height: '2.5rem' }} />
        </div>
      ) : error ? (
        <div className="card" style={{ color: 'var(--color-rejected)', padding: '2rem', textAlign: 'center' }}>
          <ShieldAlert size={32} style={{ margin: '0 auto 0.5rem' }} />
          <p>{error}</p>
          <button onClick={fetchApplications} className="btn btn-secondary" style={{ marginTop: '1rem', fontSize: '0.8rem' }}>Retry Load</button>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ref No.</th>
                <th>Name</th>
                <th>Email</th>
                <th>Exam Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
                    No applicant records match current search filters.
                  </td>
                </tr>
              ) : (
                filteredApps.map(app => {
                  const status = app.status || 'Pending';
                  return (
                    <tr 
                      key={app.application_no} 
                      onClick={() => handleViewDetails(app)}
                      style={{
                        cursor: 'pointer',
                        backgroundColor: selectedApp?.application_no === app.application_no ? 'var(--color-primary-light)' : undefined
                      }}
                    >
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{app.application_no}</td>
                      <td style={{ fontWeight: 500 }}>{app.applicants?.name}</td>
                      <td>{app.applicants?.email}</td>
                      <td>{app.exam_date || 'N/A'}</td>
                      <td>
                        <span className={`badge badge-${status.toLowerCase()}`} style={{ fontSize: '0.7rem' }}>
                          {status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button 
                            onClick={() => handleViewDetails(app)} 
                            className="btn btn-secondary" 
                            style={{ padding: '0.25rem 0.5rem', minWidth: 0 }}
                            title="View details"
                          >
                            <Eye size={14} />
                          </button>
                          <button 
                            onClick={() => handleDeleteApplicant(app)} 
                            className="btn btn-secondary" 
                            style={{ padding: '0.25rem 0.5rem', minWidth: 0, color: 'var(--color-rejected)' }}
                            title="Delete record"
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
    </section>
  );
}

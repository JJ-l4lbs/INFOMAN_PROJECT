"use client";

import React from 'react';
import { X, Edit2, Loader2, User, BookOpen, Briefcase, Calendar } from 'lucide-react';
import { Application, Applicant, EducationRecord, EmploymentRecord, Disability, EligibilityProof, School, Agency } from '@/types';

interface JoinResult extends Application {
  applicants: Applicant & {
    education_records?: EducationRecord & { schools: School };
    employment_records?: EmploymentRecord & { agencies: Agency };
  };
}

interface DetailSidebarProps {
  selectedApp: JoinResult;
  setSelectedApp: (app: JoinResult | null) => void;
  handleOpenEditModal: () => void;
  loadingDetail: boolean;
  detailedData: {
    education: (EducationRecord & { schools: School }) | null;
    employment: (EmploymentRecord & { agencies: Agency }) | null;
    disabilities: Disability[];
    eligibilityProofs: EligibilityProof[];
  } | null;
  editStatus: string;
  setEditStatus: (val: string) => void;
  editRegionalOffice: string;
  setEditRegionalOffice: (val: string) => void;
  editExamDate: string;
  setEditExamDate: (val: string) => void;
  editExamPlace: string;
  setEditExamPlace: (val: string) => void;
  handleUpdateApplication: () => void;
  savingEdit: boolean;
}

export default function DetailSidebar({
  selectedApp,
  setSelectedApp,
  handleOpenEditModal,
  loadingDetail,
  detailedData,
  editStatus,
  setEditStatus,
  editRegionalOffice,
  setEditRegionalOffice,
  editExamDate,
  setEditExamDate,
  editExamPlace,
  setEditExamPlace,
  handleUpdateApplication,
  savingEdit
}: DetailSidebarProps) {
  return (
    <aside className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="card" style={{ padding: '1.75rem', borderRadius: 'var(--radius-xl)', position: 'relative', border: '1px solid var(--color-border-hover)' }}>
        
        <button 
          onClick={() => setSelectedApp(null)} 
          style={{
            position: 'absolute',
            right: '1rem',
            top: '1rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-accent)', margin: 0 }}>
            Applicant Profile
          </h2>
          <button 
            onClick={handleOpenEditModal}
            className="btn btn-secondary" 
            style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
          >
            <Edit2 size={12} /> Edit Full Profile
          </button>
        </div>

        {loadingDetail ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
            <Loader2 className="spinner" style={{ color: 'var(--color-primary)' }} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Personal info summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontWeight: 600, color: 'var(--color-primary)', fontSize: '0.9rem' }}>
                <User size={16} /> Personal Data
              </div>
              <div style={{ paddingLeft: '1.35rem', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <p><strong>Name:</strong> {selectedApp.applicants?.name}</p>
                <p><strong>Applicant ID:</strong> {selectedApp.applicant_id}</p>
                <p><strong>Birthdate:</strong> {selectedApp.applicants?.birthdate}</p>
                <p><strong>Sex:</strong> {selectedApp.applicants?.sex}</p>
                <p><strong>Email:</strong> {selectedApp.applicants?.email}</p>
                <p><strong>Mobile:</strong> {selectedApp.applicants?.mobile_number}</p>
                <p><strong>Address:</strong> {selectedApp.applicants?.permanent_address} (Zip: {selectedApp.applicants?.zip_code})</p>
              </div>
            </div>

            {/* Education info summary */}
            {detailedData?.education && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontWeight: 600, color: 'var(--color-primary)', fontSize: '0.9rem' }}>
                  <BookOpen size={16} /> Education Record
                </div>
                <div style={{ paddingLeft: '1.35rem', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <p><strong>Level:</strong> {detailedData.education.highest_education} ({detailedData.education.completion})</p>
                  <p><strong>Program/Major:</strong> {detailedData.education.program_title} &bull; {detailedData.education.major}</p>
                  <p><strong>School:</strong> {detailedData.education.schools?.school_name || detailedData.education.school_code}</p>
                  <p><strong>School Address:</strong> {detailedData.education.schools?.school_address || 'N/A'}</p>
                  <p><strong>Inclusive Years:</strong> {detailedData.education.inclusive_years}</p>
                </div>
              </div>
            )}

            {/* Employment info summary */}
            {selectedApp.applicants?.employment_status === 'Employed' && detailedData?.employment && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontWeight: 600, color: 'var(--color-primary)', fontSize: '0.9rem' }}>
                  <Briefcase size={16} /> Employment Record
                </div>
                <div style={{ paddingLeft: '1.35rem', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <p><strong>Job Title:</strong> {detailedData.employment.job_title}</p>
                  <p><strong>Agency:</strong> {detailedData.employment.agencies?.agency_name || detailedData.employment.agency_code}</p>
                  <p><strong>Years in Agency:</strong> {detailedData.employment.years_in_agency} year(s)</p>
                  <p><strong>Status:</strong> {detailedData.employment.appointment_status}</p>
                </div>
              </div>
            )}

            {/* Disabilities & Credentials */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontWeight: 600, color: 'var(--color-primary)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                  Disabilities
                </div>
                <div style={{ fontSize: '0.85rem' }}>
                  {detailedData && detailedData.disabilities.length > 0 ? (
                    detailedData.disabilities.map(d => <p key={d.disability_id}>&bull; {d.disability}</p>)
                  ) : (
                    <p style={{ color: 'var(--text-muted)' }}>None declared</p>
                  )}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontWeight: 600, color: 'var(--color-primary)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                  Eligibility Proofs
                </div>
                <div style={{ fontSize: '0.85rem' }}>
                  {detailedData && detailedData.eligibilityProofs.length > 0 ? (
                    detailedData.eligibilityProofs.map(e => <p key={e.eligibility_proof_id}>&bull; {e.eligibility_proof_title} ({e.rating_obtained}%)</p>)
                  ) : (
                    <p style={{ color: 'var(--text-muted)' }}>None provided</p>
                  )}
                </div>
              </div>
            </div>

            {/* SCHEDULER & STATUS FORM */}
            <div style={{
              borderTop: '2px solid var(--color-border)',
              paddingTop: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              backgroundColor: 'var(--bg-tertiary)',
              padding: '1.25rem',
              borderRadius: 'var(--radius-lg)',
              margin: '0 -0.5rem -0.5rem'
            }}>
              <h3 style={{ fontSize: '1rem', fontFamily: 'var(--font-accent)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Calendar size={18} style={{ color: 'var(--color-primary)' }} />
                Record Decision & Schedule
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Review Status</label>
                  <select 
                    value={editStatus} 
                    onChange={e => setEditStatus(e.target.value)} 
                    className="form-select"
                    style={{ fontSize: '0.85rem', padding: '0.5rem' }}
                  >
                    <option>Pending</option>
                    <option>Approved</option>
                    <option>Rejected</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Regional Office</label>
                  <input 
                    type="text" 
                    value={editRegionalOffice} 
                    onChange={e => setEditRegionalOffice(e.target.value)} 
                    className="form-input" 
                    style={{ fontSize: '0.85rem', padding: '0.5rem' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Examination Date</label>
                <input 
                  type="text" 
                  placeholder="YYYY-MM-DD"
                  value={editExamDate} 
                  onChange={e => setEditExamDate(e.target.value)} 
                  className="form-input" 
                  style={{ fontSize: '0.85rem', padding: '0.5rem' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Examination Venue</label>
                <input 
                  type="text" 
                  placeholder="Room / Venue address"
                  value={editExamPlace} 
                  onChange={e => setEditExamPlace(e.target.value)} 
                  className="form-input" 
                  style={{ fontSize: '0.85rem', padding: '0.5rem' }}
                />
              </div>

              <button 
                onClick={handleUpdateApplication} 
                disabled={savingEdit} 
                className="btn btn-primary" 
                style={{ alignSelf: 'flex-end', fontSize: '0.85rem', padding: '0.5rem 1.25rem', marginTop: '0.5rem' }}
              >
                {savingEdit ? <Loader2 className="spinner" /> : 'Save Changes'}
              </button>
            </div>

          </div>
        )}

      </div>
    </aside>
  );
}

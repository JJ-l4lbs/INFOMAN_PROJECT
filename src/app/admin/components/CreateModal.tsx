"use client";
import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { School, Agency } from '@/types';

interface CreateModalProps {
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  actionError: string | null;
  formValues: {
    application: {
      status: string;
      exam_date: string;
      exam_place: string;
      csr_regional_office: string;
      exam_applied_for: string;
    };
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
    };
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
      customSchoolName?: string;
      customSchoolAddress?: string;
    };
    employment: {
      job_title: string;
      years_in_agency: number;
      appointment_status: string;
      agency_code: string;
      customAgencyName?: string;
      customAgencyAddress?: string;
    };
    disabilities: string[];
  };
  handleFormChange: (section: 'application' | 'personal' | 'education' | 'employment', field: string, value: any) => void;
  handleDisabilityChange: (name: string, checked: boolean) => void;
  newProof: { title: string; customTitle: string; rating: string; dateGranted: string; placeTaken: string };
  setNewProof: React.Dispatch<React.SetStateAction<{ title: string; customTitle: string; rating: string; dateGranted: string; placeTaken: string }>>;
  addProof: () => void;
  proofs: Array<{ title: string; rating: string; dateGranted: string; placeTaken: string; isCustom?: boolean }>;
  removeProof: (idx: number) => void;
  savingModal: boolean;
  schools: School[];
  agencies: Agency[];
  disabilityLookups: any[];
  eligibilityLookups: any[];
  customDisability: string;
  setCustomDisability: (val: string) => void;
  showCustomDisability: boolean;
  setShowCustomDisability: (val: boolean) => void;
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.6)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '1.5rem'
};

const modalStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-secondary)',
  borderRadius: 'var(--radius-xl)',
  border: '1px solid var(--color-border-hover)',
  boxShadow: 'var(--shadow-xl)',
  width: '100%',
  maxWidth: '850px',
  maxHeight: '90vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden'
};

const modalHeaderStyle: React.CSSProperties = {
  padding: '1.25rem 1.5rem',
  borderBottom: '1px solid var(--color-border)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: 'var(--bg-tertiary)'
};

const modalBodyStyle: React.CSSProperties = {
  padding: '1.5rem',
  overflowY: 'auto',
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem'
};

const modalFooterStyle: React.CSSProperties = {
  padding: '1rem 1.5rem',
  borderTop: '1px solid var(--color-border)',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '0.75rem',
  backgroundColor: 'var(--bg-tertiary)'
};

export default function CreateModal({
  onClose,
  onSubmit,
  actionError,
  formValues,
  handleFormChange,
  handleDisabilityChange,
  newProof,
  setNewProof,
  addProof,
  proofs,
  removeProof,
  savingModal,
  schools,
  agencies,
  disabilityLookups,
  eligibilityLookups,
  customDisability,
  setCustomDisability,
  showCustomDisability,
  setShowCustomDisability
}: CreateModalProps) {
  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={modalHeaderStyle}>
          <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Manual Application Creation</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={modalBodyStyle}>
            {actionError && (
              <div className="card" style={{ padding: '1rem', color: 'var(--color-rejected)', border: '1px solid var(--color-rejected-border)', backgroundColor: 'var(--color-rejected-bg)' }}>
                {actionError}
              </div>
            )}

            {/* Section A: Application Status & Exam Setup */}
            <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.25rem' }}>A. Examination Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Exam Applied For</label>
                <select value={formValues.application.exam_applied_for} onChange={e => handleFormChange('application', 'exam_applied_for', e.target.value)} className="form-select">
                  <option>Career Service-Professional</option>
                  <option>Career Service-SubProfessional</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Regional Office</label>
                <input type="text" value={formValues.application.csr_regional_office} onChange={e => handleFormChange('application', 'csr_regional_office', e.target.value)} className="form-input" required />
              </div>
              <div className="form-group">
                <label className="form-label">Application Status</label>
                <select value={formValues.application.status} onChange={e => handleFormChange('application', 'status', e.target.value)} className="form-select">
                  <option>Pending</option>
                  <option>Approved</option>
                  <option>Rejected</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Exam Date</label>
                <input type="text" placeholder="YYYY-MM-DD" value={formValues.application.exam_date} onChange={e => handleFormChange('application', 'exam_date', e.target.value)} className="form-input" required />
              </div>
              <div className="form-group">
                <label className="form-label">Exam Venue</label>
                <input type="text" value={formValues.application.exam_place} onChange={e => handleFormChange('application', 'exam_place', e.target.value)} className="form-input" required />
              </div>
            </div>

            {/* Section B: Personal Data */}
            <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.25rem', marginTop: '0.5rem' }}>B. Personal Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" value={formValues.personal.name} onChange={e => handleFormChange('personal', 'name', e.target.value)} className="form-input" required />
              </div>
              <div className="form-group">
                <label className="form-label">Birthdate</label>
                <input type="date" value={formValues.personal.birthdate} onChange={e => handleFormChange('personal', 'birthdate', e.target.value)} className="form-input" required />
              </div>
              <div className="form-group">
                <label className="form-label">Sex</label>
                <select value={formValues.personal.sex} onChange={e => handleFormChange('personal', 'sex', e.target.value)} className="form-select">
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" value={formValues.personal.email} onChange={e => handleFormChange('personal', 'email', e.target.value)} className="form-input" required />
              </div>
              <div className="form-group">
                <label className="form-label">Mobile Number</label>
                <input type="text" value={formValues.personal.mobile_number} onChange={e => handleFormChange('personal', 'mobile_number', e.target.value)} className="form-input" required />
              </div>
              <div className="form-group">
                <label className="form-label">Telephone (Optional)</label>
                <input type="text" value={formValues.personal.telephone_number} onChange={e => handleFormChange('personal', 'telephone_number', e.target.value)} className="form-input" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Birthplace</label>
                <input type="text" value={formValues.personal.birthplace} onChange={e => handleFormChange('personal', 'birthplace', e.target.value)} className="form-input" required />
              </div>
              <div className="form-group">
                <label className="form-label">Citizenship</label>
                <input type="text" value={formValues.personal.citizenship} onChange={e => handleFormChange('personal', 'citizenship', e.target.value)} className="form-input" required />
              </div>
              <div className="form-group">
                <label className="form-label">Civil Status</label>
                <select value={formValues.personal.civil_status} onChange={e => handleFormChange('personal', 'civil_status', e.target.value)} className="form-select">
                  <option>Single</option>
                  <option>Married</option>
                  <option>Widowed</option>
                  <option>Separated</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Permanent Address</label>
                <input type="text" value={formValues.personal.permanent_address} onChange={e => handleFormChange('personal', 'permanent_address', e.target.value)} className="form-input" required />
              </div>
              <div className="form-group">
                <label className="form-label">Zip Code</label>
                <input type="text" value={formValues.personal.zip_code} onChange={e => handleFormChange('personal', 'zip_code', e.target.value)} className="form-input" required />
              </div>
              <div className="form-group">
                <label className="form-label">Mother's Maiden Name</label>
                <input type="text" value={formValues.personal.mother_maiden_name} onChange={e => handleFormChange('personal', 'mother_maiden_name', e.target.value)} className="form-input" required />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Priority Group</label>
                <select value={formValues.personal.priority_group || 'None'} onChange={e => handleFormChange('personal', 'priority_group', e.target.value)} className="form-select">
                  <option>None</option>
                  <option>PWD</option>
                  <option>Senior Citizen</option>
                  <option>Indigenous</option>
                  <option>Solo Parent</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Employment Status</label>
                <select value={formValues.personal.employment_status} onChange={e => handleFormChange('personal', 'employment_status', e.target.value)} className="form-select">
                  <option>Unemployed</option>
                  <option>Employed</option>
                  <option>Student</option>
                  <option>Retired</option>
                </select>
              </div>
            </div>

            {/* Section C: Education */}
            <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.25rem', marginTop: '0.5rem' }}>C. Educational History</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Highest Education Level</label>
                <select value={formValues.education.highest_education} onChange={e => handleFormChange('education', 'highest_education', e.target.value)} className="form-select">
                  <option>High School</option>
                  <option>Senior High School</option>
                  <option>Bachelor's</option>
                  <option>Master's</option>
                  <option>Doctorate</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Completion Status</label>
                <select value={formValues.education.completion} onChange={e => handleFormChange('education', 'completion', e.target.value)} className="form-select">
                  <option>Graduate</option>
                  <option>Undergraduate</option>
                  <option>Ongoing</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Inclusive Years (e.g. 2018-2022)</label>
                <input type="text" value={formValues.education.inclusive_years} onChange={e => handleFormChange('education', 'inclusive_years', e.target.value)} className="form-input" required />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Program/Course Title</label>
                <input type="text" value={formValues.education.program_title} onChange={e => handleFormChange('education', 'program_title', e.target.value)} className="form-input" required />
              </div>
              <div className="form-group">
                <label className="form-label">Major/Specialization</label>
                <input type="text" value={formValues.education.major} onChange={e => handleFormChange('education', 'major', e.target.value)} className="form-input" required />
              </div>
              <div className="form-group">
                <label className="form-label">School Affiliation</label>
                <select value={formValues.education.school_code} onChange={e => handleFormChange('education', 'school_code', e.target.value)} className="form-select">
                  {schools.filter(s => (s as any).is_registered !== false).map(s => <option key={s.school_code} value={s.school_code}>{s.school_name}</option>)}
                  <option value="OTHER">Other (Write-in)...</option>
                </select>
              </div>
            </div>

            {formValues.education.school_code === 'OTHER' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', backgroundColor: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <div className="form-group">
                  <label className="form-label">Custom School Name *</label>
                  <input type="text" value={formValues.education.customSchoolName || ''} onChange={e => handleFormChange('education', 'customSchoolName', e.target.value)} className="form-input" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Custom School Address *</label>
                  <input type="text" value={formValues.education.customSchoolAddress || ''} onChange={e => handleFormChange('education', 'customSchoolAddress', e.target.value)} className="form-input" required />
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Graduation Date (Optional)</label>
                <input type="date" value={formValues.education.graduation_date || ''} onChange={e => handleFormChange('education', 'graduation_date', e.target.value)} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Highest Units (Optional)</label>
                <input type="text" value={formValues.education.highest_level || ''} onChange={e => handleFormChange('education', 'highest_level', e.target.value)} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Honors Received (Optional)</label>
                <input type="text" value={formValues.education.honors_received || ''} onChange={e => handleFormChange('education', 'honors_received', e.target.value)} className="form-input" />
              </div>
            </div>

            {/* Section D: Employment (Conditional) */}
            {formValues.personal.employment_status === 'Employed' && (
              <>
                <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.25rem', marginTop: '0.5rem' }}>D. Employment Record</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Job Title</label>
                    <input type="text" value={formValues.employment.job_title} onChange={e => handleFormChange('employment', 'job_title', e.target.value)} className="form-input" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Years in Service</label>
                    <input type="number" value={formValues.employment.years_in_agency} onChange={e => handleFormChange('employment', 'years_in_agency', parseInt(e.target.value) || 0)} className="form-input" required />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Appointment Status</label>
                    <select value={formValues.employment.appointment_status} onChange={e => handleFormChange('employment', 'appointment_status', e.target.value)} className="form-select">
                      <option>Permanent</option>
                      <option>Temporary</option>
                      <option>Contractual</option>
                      <option>Casual</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Employer/Agency Name</label>
                    <select value={formValues.employment.agency_code} onChange={e => handleFormChange('employment', 'agency_code', e.target.value)} className="form-select">
                      {agencies.filter(a => (a as any).is_registered !== false).map(a => <option key={a.agency_code} value={a.agency_code}>{a.agency_name}</option>)}
                      <option value="OTHER">Other (Write-in)...</option>
                    </select>
                  </div>
                </div>

                {formValues.employment.agency_code === 'OTHER' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', backgroundColor: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                    <div className="form-group">
                      <label className="form-label">Custom Agency Name *</label>
                      <input type="text" value={formValues.employment.customAgencyName || ''} onChange={e => handleFormChange('employment', 'customAgencyName', e.target.value)} className="form-input" required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Custom Agency Address *</label>
                      <input type="text" value={formValues.employment.customAgencyAddress || ''} onChange={e => handleFormChange('employment', 'customAgencyAddress', e.target.value)} className="form-input" required />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Section E: Disabilities & Eligibility */}
            <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.25rem', marginTop: '0.5rem' }}>E. Disabilities & Eligibility</h3>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.5rem' }}>
              {disabilityLookups.filter(d => d.is_registered !== false).map(d => {
                const isChecked = formValues.disabilities.includes(d.disability_name);
                return (
                  <label key={d.disability_code} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={isChecked} 
                      onChange={(e) => handleDisabilityChange(d.disability_name, e.target.checked)} 
                    />
                    {d.disability_name}
                  </label>
                );
              })}
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={showCustomDisability} 
                  onChange={(e) => setShowCustomDisability(e.target.checked)} 
                />
                Other (Write-in)
              </label>
            </div>

            {showCustomDisability && (
              <div style={{ marginBottom: '0.75rem' }}>
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

            <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Add Government/Civil Eligibility Proofs</span>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr auto', gap: '0.5rem', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Exam/Title</span>
                  <select 
                    value={newProof.title} 
                    onChange={e => setNewProof(p => ({ ...p, title: e.target.value }))} 
                    className="form-select" 
                    style={{ padding: '0.4rem', fontSize: '0.8rem', height: '34px' }}
                  >
                    <option value="">-- Select --</option>
                    {eligibilityLookups.filter(e => e.is_registered !== false).map(e => (
                      <option key={e.eligibility_code} value={e.eligibility_name}>{e.eligibility_name}</option>
                    ))}
                    <option value="OTHER">Other (Write-in)...</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Rating</span>
                  <input type="text" placeholder="e.g. 85.50" value={newProof.rating} onChange={e => setNewProof(p => ({ ...p, rating: e.target.value }))} className="form-input" style={{ padding: '0.4rem', fontSize: '0.8rem' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Date</span>
                  <input type="text" placeholder="YYYY-MM-DD" value={newProof.dateGranted} onChange={e => setNewProof(p => ({ ...p, dateGranted: e.target.value }))} className="form-input" style={{ padding: '0.4rem', fontSize: '0.8rem' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Place</span>
                  <input type="text" placeholder="City" value={newProof.placeTaken} onChange={e => setNewProof(p => ({ ...p, placeTaken: e.target.value }))} className="form-input" style={{ padding: '0.4rem', fontSize: '0.8rem' }} />
                </div>
                <button type="button" onClick={addProof} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Add</button>
              </div>

              {newProof.title === 'OTHER' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Custom Eligibility Title *</span>
                  <input 
                    type="text" 
                    placeholder="Type custom eligibility name" 
                    value={newProof.customTitle || ''} 
                    onChange={e => setNewProof(p => ({ ...p, customTitle: e.target.value }))} 
                    className="form-input" 
                    style={{ padding: '0.4rem', fontSize: '0.8rem' }} 
                    required
                  />
                </div>
              )}

              {proofs.length > 0 && (
                <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {proofs.map((p, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', backgroundColor: 'var(--bg-secondary)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)' }}>
                      <span>&bull; <strong>{p.title}</strong> - {p.rating}% ({p.dateGranted} at {p.placeTaken})</span>
                      <button type="button" onClick={() => removeProof(idx)} style={{ border: 'none', background: 'none', color: 'var(--color-rejected)', cursor: 'pointer', fontSize: '0.75rem' }}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div style={modalFooterStyle}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>Cancel</button>
            <button type="submit" disabled={savingModal} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
              {savingModal ? <Loader2 className="spinner" /> : 'Save Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

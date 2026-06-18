"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Application, Applicant, EducationRecord, EmploymentRecord, Disability, EligibilityProof, School, Agency } from '@/types';
import { 
  Lock, Loader2, Database, Search, Filter, Eye, Trash2, Check, X,
  Calendar, MapPin, Landmark, User, BookOpen, Briefcase, Award, ShieldAlert, LogOut
} from 'lucide-react';

interface JoinResult extends Application {
  applicants: Applicant & {
    education_records?: EducationRecord & { schools: School };
    employment_records?: EmploymentRecord & { agencies: Agency };
  };
}

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  
  const [applications, setApplications] = useState<JoinResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters and Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal / Detailed View
  const [selectedApp, setSelectedApp] = useState<JoinResult | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailedData, setDetailedData] = useState<{
    education: (EducationRecord & { schools: School }) | null;
    employment: (EmploymentRecord & { agencies: Agency }) | null;
    disabilities: Disability[];
    eligibilityProofs: EligibilityProof[];
  } | null>(null);

  // Edit State
  const [editStatus, setEditStatus] = useState<string>('Pending');
  const [editExamDate, setEditExamDate] = useState<string>('');
  const [editExamPlace, setEditExamPlace] = useState<string>('');
  const [editRegionalOffice, setEditRegionalOffice] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState(false);

  // --- PASSWORD GATE CHECK ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    // Check against build/env parameter or standard fallback for university requirements
    const envPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
    if (password === envPassword) {
      setIsAuthenticated(true);
      localStorage.setItem('csc_admin_auth', 'true');
    } else {
      setAuthError('Incorrect administrator password. Access denied.');
    }
  };

  useEffect(() => {
    const isAuth = localStorage.getItem('csc_admin_auth');
    if (isAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('csc_admin_auth');
    setPassword('');
  };

  // --- FETCH APPLICATIONS ---
  const fetchApplications = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('applications')
        .select(`
          *,
          applicants (
            *,
            education_records:educational_record_id (
              *,
              schools:school_code (*)
            ),
            employment_records:employment_record_id (
              *,
              agencies:agency_code (*)
            )
          )
        `);

      if (fetchErr) throw new Error(fetchErr.message);
      if (data) {
        setApplications(data as unknown as JoinResult[]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch database records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [isAuthenticated]);

  // --- VIEW DETAILS (LOAD NESTED DATA) ---
  const handleViewDetails = async (app: JoinResult) => {
    setSelectedApp(app);
    setLoadingDetail(true);
    setDetailedData(null);

    // Set editing fields initially matching values
    setEditStatus(app.status);
    setEditExamDate(app.exam_date);
    setEditExamPlace(app.exam_place);
    setEditRegionalOffice(app.csr_regional_office);

    try {
      const applicantId = app.applicant_id;

      // Query disabilities
      const { data: disData } = await supabase
        .from('disabilities')
        .select('*')
        .eq('applicant_id', applicantId);

      // Query eligibility proofs
      const { data: eligData } = await supabase
        .from('eligibility_proofs')
        .select('*')
        .eq('applicant_id', applicantId);

      // Set references already joined in main list
      const education = app.applicants?.education_records || null;
      const employment = app.applicants?.employment_records || null;

      setDetailedData({
        education: education as any,
        employment: employment as any,
        disabilities: (disData || []) as Disability[],
        eligibilityProofs: (eligData || []) as EligibilityProof[]
      });
    } catch (err) {
      console.error('Error fetching detail items', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // --- UPDATE APPLICATION (UPDATE RECORD) ---
  const handleUpdateApplication = async () => {
    if (!selectedApp) return;
    setSavingEdit(true);
    try {
      const { error: updateErr } = await supabase
        .from('applications')
        .update({
          status: editStatus,
          exam_date: editExamDate,
          exam_place: editExamPlace,
          csr_regional_office: editRegionalOffice
        })
        .eq('application_no', selectedApp.application_no);

      if (updateErr) throw new Error(updateErr.message);

      // Refresh data
      await fetchApplications();
      
      // Update local state in view modal
      setSelectedApp(prev => prev ? {
        ...prev,
        status: editStatus as any,
        exam_date: editExamDate,
        exam_place: editExamPlace,
        csr_regional_office: editRegionalOffice
      } : null);

      alert('Application record updated successfully!');
    } catch (err: any) {
      alert('Failed to update record: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  // --- DELETE RECIPIENT & ALL CHILDREN (DELETE RECORD) ---
  const handleDeleteApplicant = async (app: JoinResult) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete applicant "${app.applicants?.name}"?\nThis will remove their application (Ref: ${app.application_no}), education records, and all other associated data.`
    );
    if (!confirmDelete) return;

    try {
      const applicantId = app.applicant_id;
      const eduId = app.applicants?.educational_record_id;
      const empId = app.applicants?.employment_record_id;

      // 1. Delete applicant record.
      // Thanks to PostgreSQL foreign key rules defined in Schema.md:
      // Deleting applicants will CASCADE delete applications, disabilities, and eligibility_proofs!
      const { error: deleteApplicantErr } = await supabase
        .from('applicants')
        .delete()
        .eq('applicant_id', applicantId);

      if (deleteApplicantErr) throw new Error('Applicant delete failed: ' + deleteApplicantErr.message);

      // 2. Delete parent Education Record
      if (eduId) {
        const { error: deleteEduErr } = await supabase
          .from('education_records')
          .delete()
          .eq('educational_record_id', eduId);
        if (deleteEduErr) console.warn('Failed to clean up educational record row:', deleteEduErr.message);
      }

      // 3. Delete parent Employment Record (if any)
      if (empId) {
        const { error: deleteEmpErr } = await supabase
          .from('employment_records')
          .delete()
          .eq('employment_record_id', empId);
        if (deleteEmpErr) console.warn('Failed to clean up employment record row:', deleteEmpErr.message);
      }

      alert('Applicant record and all associated logs deleted successfully.');
      
      if (selectedApp?.application_no === app.application_no) {
        setSelectedApp(null);
      }

      // Refresh applications table
      await fetchApplications();
    } catch (err: any) {
      console.error(err);
      alert('Error during delete transaction: ' + err.message);
    }
  };

  // --- FILTERED RESULTS ---
  const filteredApps = applications.filter(app => {
    const matchesSearch = 
      app.applicants?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicants?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.application_no?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'All' || 
      app.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // --- RENDER LOGIN GATES ---
  if (!isAuthenticated) {
    return (
      <main style={{ maxWidth: '400px', margin: '6rem auto', padding: '0 1.5rem', animation: 'fadeIn 0.3s ease-out' }}>
        <div className="card" style={{ padding: '2.5rem', borderRadius: 'var(--radius-xl)', textAlign: 'center' }}>
          <div style={{
            width: '3.5rem',
            height: '3.5rem',
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary-light)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <Lock size={24} />
          </div>
          
          <h1 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-accent)', marginBottom: '0.5rem' }}>
            Admin Console Gate
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Please authenticate using your administrative credentials to manage exam records.
          </p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group" style={{ textAlign: 'left' }}>
              <label className="form-label">Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="form-input" 
                placeholder="Enter password..." 
                required 
              />
            </div>
            
            {authError && (
              <p style={{ color: 'var(--color-rejected)', fontSize: '0.8rem', fontWeight: 500 }}>
                ❌ {authError}
              </p>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              Login Credentials
            </button>
          </form>
          
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '1.5rem' }}>
            Tip: Default password is <strong>admin123</strong>
          </p>
        </div>
      </main>
    );
  }

  // --- RENDER ADMIN CONTENT ---
  return (
    <main style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1.5rem', animation: 'fadeIn 0.2s ease-out' }}>
      
      {/* Title Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-accent)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={28} style={{ color: 'var(--color-primary)' }} />
            Database Control Panel
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Inspect, schedule, validate, or delete exam applicant registrations.
          </p>
        </div>
        <button onClick={handleLogout} className="btn btn-secondary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem' }}>
          <LogOut size={16} /> Log Out
        </button>
      </header>

      {/* Main Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedApp ? '3fr 2fr' : '1fr', gap: '2rem', transition: 'all 0.3s ease' }}>
        
        {/* Left Side: Table & Search */}
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
            
            <a href="/apply" className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
              + Add Applicant
            </a>
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

        {/* Right Side: Details View & Scheduler Panel */}
        {selectedApp && (
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

              <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-accent)', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                Applicant Profile Details
              </h2>

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
                        value={editExamDate} 
                        onChange={e => setEditExamDate(e.target.value)} 
                        className="form-input" 
                        placeholder="YYYY-MM-DD"
                        style={{ fontSize: '0.85rem', padding: '0.5rem' }}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Examination Venue</label>
                      <input 
                        type="text" 
                        value={editExamPlace} 
                        onChange={e => setEditExamPlace(e.target.value)} 
                        className="form-input" 
                        placeholder="Room / Venue address"
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
        )}

      </div>
    </main>
  );
}

"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Application, Applicant, EducationRecord, EmploymentRecord, Disability, EligibilityProof, School, Agency } from '@/types';
import { 
  Lock, Loader2, Database, Search, Filter, Eye, Trash2, Check, X,
  Calendar, MapPin, Landmark, User, BookOpen, Briefcase, Award, ShieldAlert, LogOut, Edit2, PlusCircle
} from 'lucide-react';
import { 
  adminFetchApplications, 
  adminFetchApplicationDetail, 
  adminUpdateApplication, 
  adminDeleteApplicant, 
  adminAddApplication 
} from './actions';

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

  // Lookup data for dropdowns
  const [schools, setSchools] = useState<School[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(false);

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

  // Quick Edit State (on the right sidebar)
  const [editStatus, setEditStatus] = useState<string>('Pending');
  const [editExamDate, setEditExamDate] = useState<string>('');
  const [editExamPlace, setEditExamPlace] = useState<string>('');
  const [editRegionalOffice, setEditRegionalOffice] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Modal control states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'exam' | 'personal' | 'education' | 'employment' | 'disabilities'>('exam');

  // --- FORM STATES FOR MANUAL CREATE & FULL EDIT ---
  const initialFormState = {
    application: {
      status: 'Pending',
      exam_date: '2026-10-15',
      exam_place: 'NCR School Center',
      csr_regional_office: 'NCR',
      exam_applied_for: 'Career Service-Professional'
    },
    personal: {
      name: '',
      birthdate: '',
      sex: 'Male',
      birthplace: '',
      citizenship: 'Filipino',
      mother_maiden_name: '',
      permanent_address: '',
      zip_code: '',
      mobile_number: '',
      telephone_number: '',
      email: '',
      civil_status: 'Single',
      priority_group: 'None',
      employment_status: 'Unemployed'
    },
    education: {
      highest_education: "Bachelor's",
      completion: 'Graduate',
      highest_level: '',
      graduation_date: '',
      honors_received: '',
      program_title: '',
      major: '',
      inclusive_years: '',
      school_code: ''
    },
    employment: {
      job_title: '',
      years_in_agency: 0,
      appointment_status: 'Permanent',
      agency_code: ''
    },
    disabilities: {
      visual: false,
      hearing: false,
      orthopedic: false
    }
  };

  const [formValues, setFormValues] = useState(initialFormState);
  const [proofs, setProofs] = useState<Array<{ title: string; rating: string; dateGranted: string; placeTaken: string }>>([]);
  const [newProof, setNewProof] = useState({ title: '', rating: '', dateGranted: '', placeTaken: '' });
  const [actionError, setActionError] = useState<string | null>(null);
  const [savingModal, setSavingModal] = useState(false);

  // --- PASSWORD GATE CHECK ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    const envPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
    if (password === envPassword) {
      setIsAuthenticated(true);
      localStorage.setItem('csc_admin_auth', 'true');
      sessionStorage.setItem('csc_admin_password', password);
    } else {
      setAuthError('Incorrect administrator password. Access denied.');
    }
  };

  useEffect(() => {
    const isAuth = localStorage.getItem('csc_admin_auth');
    const savedPass = sessionStorage.getItem('csc_admin_password');
    if (isAuth === 'true' && savedPass) {
      setIsAuthenticated(true);
      setPassword(savedPass);
    }
  }, []);

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('csc_admin_auth');
    sessionStorage.removeItem('csc_admin_password');
    setPassword('');
    setSelectedApp(null);
  };

  // --- FETCH APPLICATIONS ---
  const fetchApplications = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetchApplications(password);
      setApplications(data as unknown as JoinResult[]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch database records.');
    } finally {
      setLoading(false);
    }
  };

  // --- FETCH LOOKUPS ---
  const fetchLookups = async () => {
    try {
      setLoadingLookups(true);
      const { data: schoolsData } = await supabase.from('schools').select('*');
      const { data: agenciesData } = await supabase.from('agencies').select('*');
      
      if (schoolsData && schoolsData.length > 0) {
        setSchools(schoolsData as School[]);
      }
      if (agenciesData && agenciesData.length > 0) {
        setAgencies(agenciesData as Agency[]);
      }
    } catch (err) {
      console.error('Failed to query lookup tables', err);
    } finally {
      setLoadingLookups(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchApplications();
      fetchLookups();
    }
  }, [isAuthenticated]);

  // --- VIEW DETAILS (LOAD NESTED DATA) ---
  const handleViewDetails = async (app: JoinResult) => {
    setSelectedApp(app);
    setLoadingDetail(true);
    setDetailedData(null);

    // Set editing fields initially matching values for the quick scheduler
    setEditStatus(app.status || 'Pending');
    setEditExamDate(app.exam_date || '');
    setEditExamPlace(app.exam_place || '');
    setEditRegionalOffice(app.csr_regional_office || '');

    try {
      const res = await adminFetchApplicationDetail(password, app.applicant_id);
      setDetailedData({
        education: res.education as any,
        employment: res.employment as any,
        disabilities: res.disabilities as Disability[],
        eligibilityProofs: res.eligibilityProofs as EligibilityProof[]
      });
    } catch (err) {
      console.error('Error fetching detail items', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // --- QUICK UPDATE APPLICATION ---
  const handleUpdateApplication = async () => {
    if (!selectedApp || !detailedData) return;
    setSavingEdit(true);
    try {
      await adminUpdateApplication(password, {
        application_no: selectedApp.application_no,
        applicant_id: selectedApp.applicant_id,
        educational_record_id: detailedData.education?.educational_record_id || selectedApp.applicants?.educational_record_id,
        employment_record_id: detailedData.employment?.employment_record_id || selectedApp.applicants?.employment_record_id || null,
        application: {
          status: editStatus,
          exam_date: editExamDate,
          exam_place: editExamPlace,
          csr_regional_office: editRegionalOffice,
          exam_applied_for: selectedApp.exam_applied_for
        },
        personal: {
          name: selectedApp.applicants?.name,
          birthdate: selectedApp.applicants?.birthdate,
          sex: selectedApp.applicants?.sex,
          birthplace: selectedApp.applicants?.birthplace,
          citizenship: selectedApp.applicants?.citizenship,
          mother_maiden_name: selectedApp.applicants?.mother_maiden_name,
          permanent_address: selectedApp.applicants?.permanent_address,
          zip_code: selectedApp.applicants?.zip_code,
          mobile_number: selectedApp.applicants?.mobile_number,
          telephone_number: selectedApp.applicants?.telephone_number,
          email: selectedApp.applicants?.email,
          civil_status: selectedApp.applicants?.civil_status,
          priority_group: selectedApp.applicants?.priority_group || null,
          employment_status: selectedApp.applicants?.employment_status
        },
        education: {
          highest_education: detailedData.education?.highest_education || "Bachelor's",
          completion: detailedData.education?.completion || 'Graduate',
          highest_level: detailedData.education?.highest_level || null,
          graduation_date: detailedData.education?.graduation_date || null,
          honors_received: detailedData.education?.honors_received || null,
          program_title: detailedData.education?.program_title || '',
          major: detailedData.education?.major || '',
          inclusive_years: detailedData.education?.inclusive_years || '',
          school_code: detailedData.education?.school_code || ''
        },
        employment: detailedData.employment ? {
          job_title: detailedData.employment.job_title,
          years_in_agency: detailedData.employment.years_in_agency,
          appointment_status: detailedData.employment.appointment_status,
          agency_code: detailedData.employment.agency_code
        } : null,
        disabilities: {
          visual: detailedData.disabilities.some(d => d.disability === 'Visual Impairment'),
          hearing: detailedData.disabilities.some(d => d.disability === 'Hearing Impairment'),
          orthopedic: detailedData.disabilities.some(d => d.disability === 'Orthopedic')
        },
        eligibilityProofs: detailedData.eligibilityProofs.map(p => ({
          title: p.eligibility_proof_title,
          rating: p.rating_obtained,
          dateGranted: p.date_granted,
          placeTaken: p.eligibility_place_taken
        }))
      });

      // Refresh data
      await fetchApplications();
      
      // Update local state in view panel
      setSelectedApp(prev => prev ? {
        ...prev,
        status: editStatus as any,
        exam_date: editExamDate,
        exam_place: editExamPlace,
        csr_regional_office: editRegionalOffice
      } : null);

      alert('Application status & scheduling updated successfully!');
    } catch (err: any) {
      alert('Failed to update record: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  // --- DELETE APPLICANT ---
  const handleDeleteApplicant = async (app: JoinResult) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete applicant "${app.applicants?.name}"?\nThis will remove their application (Ref: ${app.application_no}), education records, and all other associated data.`
    );
    if (!confirmDelete) return;

    try {
      await adminDeleteApplicant(
        password,
        app.applicant_id,
        app.applicants?.educational_record_id,
        app.applicants?.employment_record_id || null
      );

      alert('Applicant record and all associated logs deleted successfully.');
      
      if (selectedApp?.application_no === app.application_no) {
        setSelectedApp(null);
      }

      await fetchApplications();
    } catch (err: any) {
      console.error(err);
      alert('Error during delete transaction: ' + err.message);
    }
  };

  // --- OPEN FULL EDIT MODAL ---
  const handleOpenEditModal = () => {
    if (!selectedApp || !detailedData) return;
    setActionError(null);
    setActiveTab('exam');
    
    setFormValues({
      application: {
        status: selectedApp.status || 'Pending',
        exam_date: selectedApp.exam_date || '',
        exam_place: selectedApp.exam_place || '',
        csr_regional_office: selectedApp.csr_regional_office || '',
        exam_applied_for: selectedApp.exam_applied_for || 'Career Service-Professional'
      },
      personal: {
        name: selectedApp.applicants?.name || '',
        birthdate: selectedApp.applicants?.birthdate || '',
        sex: selectedApp.applicants?.sex || 'Male',
        birthplace: selectedApp.applicants?.birthplace || '',
        citizenship: selectedApp.applicants?.citizenship || 'Filipino',
        mother_maiden_name: selectedApp.applicants?.mother_maiden_name || '',
        permanent_address: selectedApp.applicants?.permanent_address || '',
        zip_code: selectedApp.applicants?.zip_code || '',
        mobile_number: selectedApp.applicants?.mobile_number || '',
        telephone_number: selectedApp.applicants?.telephone_number || '',
        email: selectedApp.applicants?.email || '',
        civil_status: selectedApp.applicants?.civil_status || 'Single',
        priority_group: selectedApp.applicants?.priority_group || 'None',
        employment_status: selectedApp.applicants?.employment_status || 'Unemployed'
      },
      education: {
        highest_education: detailedData.education?.highest_education || "Bachelor's",
        completion: detailedData.education?.completion || 'Graduate',
        highest_level: detailedData.education?.highest_level || '',
        graduation_date: detailedData.education?.graduation_date || '',
        honors_received: detailedData.education?.honors_received || '',
        program_title: detailedData.education?.program_title || '',
        major: detailedData.education?.major || '',
        inclusive_years: detailedData.education?.inclusive_years || '',
        school_code: detailedData.education?.school_code || (schools[0]?.school_code || '')
      },
      employment: {
        job_title: detailedData.employment?.job_title || '',
        years_in_agency: detailedData.employment?.years_in_agency || 0,
        appointment_status: detailedData.employment?.appointment_status || 'Permanent',
        agency_code: detailedData.employment?.agency_code || (agencies[0]?.agency_code || '')
      },
      disabilities: {
        visual: detailedData.disabilities.some(d => d.disability === 'Visual Impairment'),
        hearing: detailedData.disabilities.some(d => d.disability === 'Hearing Impairment'),
        orthopedic: detailedData.disabilities.some(d => d.disability === 'Orthopedic')
      }
    });

    setProofs(detailedData.eligibilityProofs.map(p => ({
      title: p.eligibility_proof_title,
      rating: p.rating_obtained,
      dateGranted: p.date_granted,
      placeTaken: p.eligibility_place_taken
    })));

    setShowEditModal(true);
  };

  // --- OPEN CREATE MODAL ---
  const handleOpenCreateModal = () => {
    setActionError(null);
    setFormValues({
      ...initialFormState,
      education: {
        ...initialFormState.education,
        school_code: schools[0]?.school_code || ''
      },
      employment: {
        ...initialFormState.employment,
        agency_code: agencies[0]?.agency_code || ''
      }
    });
    setProofs([]);
    setShowCreateModal(true);
  };

  // --- FORM INPUT HANDLERS ---
  const handleFormChange = (section: 'application' | 'personal' | 'education' | 'employment', field: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleDisabilityChange = (field: 'visual' | 'hearing' | 'orthopedic', checked: boolean) => {
    setFormValues(prev => ({
      ...prev,
      disabilities: {
        ...prev.disabilities,
        [field]: checked
      }
    }));
  };

  // Proofs editors
  const addProof = () => {
    if (!newProof.title || !newProof.rating || !newProof.dateGranted || !newProof.placeTaken) {
      alert('Please fill in all eligibility proof fields.');
      return;
    }
    setProofs(prev => [...prev, newProof]);
    setNewProof({ title: '', rating: '', dateGranted: '', placeTaken: '' });
  };

  const removeProof = (idx: number) => {
    setProofs(prev => prev.filter((_, i) => i !== idx));
  };

  // --- SAVE FULL EDIT SUBMIT ---
  const handleSaveFullEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    setSavingModal(true);
    setActionError(null);

    try {
      await adminUpdateApplication(password, {
        application_no: selectedApp.application_no,
        applicant_id: selectedApp.applicant_id,
        educational_record_id: detailedData?.education?.educational_record_id || selectedApp.applicants?.educational_record_id,
        employment_record_id: detailedData?.employment?.employment_record_id || selectedApp.applicants?.employment_record_id || null,
        application: formValues.application,
        personal: formValues.personal,
        education: formValues.education,
        employment: formValues.personal.employment_status === 'Employed' ? formValues.employment : null,
        disabilities: formValues.disabilities,
        eligibilityProofs: proofs
      });

      alert('Profile and registration records updated successfully!');
      setShowEditModal(false);
      setSelectedApp(null);
      await fetchApplications();
    } catch (err: any) {
      setActionError(err.message || 'Failed to modify record.');
    } finally {
      setSavingModal(false);
    }
  };

  // --- MANUAL CREATE SUBMIT ---
  const handleSaveManualCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingModal(true);
    setActionError(null);

    try {
      const res = await adminAddApplication(password, {
        application: formValues.application,
        personal: formValues.personal,
        education: formValues.education,
        employment: formValues.personal.employment_status === 'Employed' ? formValues.employment : null,
        disabilities: formValues.disabilities,
        eligibilityProofs: proofs
      });

      alert(`Application added successfully!\nApplicant ID: ${res.applicantId}\nApplication No: ${res.applicationNo}`);
      setShowCreateModal(false);
      await fetchApplications();
    } catch (err: any) {
      setActionError(err.message || 'Failed to create manual entry.');
    } finally {
      setSavingModal(false);
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

  // Styles
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
            Inspect, schedule, validate, or delete exam applicant registrations under strict Row Level Security.
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

      {/* --- CREATE APPLICATION FLOATING MODAL PANE --- */}
      {showCreateModal && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={modalHeaderStyle}>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Manual Application Creation</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveManualCreate} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
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
                      {schools.map(s => <option key={s.school_code} value={s.school_code}>{s.school_name}</option>)}
                    </select>
                  </div>
                </div>
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
                          {agencies.map(a => <option key={a.agency_code} value={a.agency_code}>{a.agency_name}</option>)}
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {/* Section E: Disabilities & Eligibility */}
                <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.25rem', marginTop: '0.5rem' }}>E. Disabilities & Eligibility</h3>
                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formValues.disabilities.visual} onChange={e => handleDisabilityChange('visual', e.target.checked)} />
                    Visual Impairment
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formValues.disabilities.hearing} onChange={e => handleDisabilityChange('hearing', e.target.checked)} />
                    Hearing Impairment
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formValues.disabilities.orthopedic} onChange={e => handleDisabilityChange('orthopedic', e.target.checked)} />
                    Orthopedic
                  </label>
                </div>

                <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Add Government/Civil Eligibility Proofs</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr btn', gap: '0.5rem', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Exam/Title</span>
                      <input type="text" placeholder="e.g. Let Board Exam" value={newProof.title} onChange={e => setNewProof(p => ({ ...p, title: e.target.value }))} className="form-input" style={{ padding: '0.4rem', fontSize: '0.8rem' }} />
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
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>Cancel</button>
                <button type="submit" disabled={savingModal} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                  {savingModal ? <Loader2 className="spinner" /> : 'Save Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- FULL EDIT APPLICATION FLOATING MODAL PANE --- */}
      {showEditModal && selectedApp && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={modalHeaderStyle}>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Edit Application Profile ({selectedApp.application_no})</h2>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveFullEdit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              
              {/* Tab Selector */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--bg-tertiary)' }}>
                {(['exam', 'personal', 'education', 'employment', 'disabilities'] as const).map(tab => {
                  const isActive = activeTab === tab;
                  // Skip employment tab if applicant is not employed
                  if (tab === 'employment' && formValues.personal.employment_status !== 'Employed') return null;
                  
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      style={{
                        padding: '0.75rem 1.25rem',
                        background: isActive ? 'var(--bg-secondary)' : 'none',
                        border: 'none',
                        borderBottom: isActive ? '2px solid var(--color-primary)' : 'none',
                        color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)',
                        fontWeight: isActive ? 600 : 400,
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        textTransform: 'capitalize'
                      }}
                    >
                      {tab === 'exam' ? 'Exam Details' : tab === 'personal' ? 'Personal Data' : tab === 'education' ? 'Education' : tab === 'employment' ? 'Employment' : 'Disabilities & Proofs'}
                    </button>
                  );
                })}
              </div>

              <div style={modalBodyStyle}>
                {actionError && (
                  <div className="card" style={{ padding: '1rem', color: 'var(--color-rejected)', border: '1px solid var(--color-rejected-border)', backgroundColor: 'var(--color-rejected-bg)' }}>
                    {actionError}
                  </div>
                )}

                {/* TAB CONTENT: Exam Details */}
                {activeTab === 'exam' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                  </div>
                )}

                {/* TAB CONTENT: Personal Data */}
                {activeTab === 'personal' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                        <input type="text" value={formValues.personal.telephone_number || ''} onChange={e => handleFormChange('personal', 'telephone_number', e.target.value)} className="form-input" />
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
                  </div>
                )}

                {/* TAB CONTENT: Education */}
                {activeTab === 'education' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                          {schools.map(s => <option key={s.school_code} value={s.school_code}>{s.school_name}</option>)}
                        </select>
                      </div>
                    </div>
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
                  </div>
                )}

                {/* TAB CONTENT: Employment */}
                {activeTab === 'employment' && formValues.personal.employment_status === 'Employed' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                          {agencies.map(a => <option key={a.agency_code} value={a.agency_code}>{a.agency_name}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: Disabilities & Credentials */}
                {activeTab === 'disabilities' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Declared Disabilities</span>
                    <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.5rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={formValues.disabilities.visual} onChange={e => handleDisabilityChange('visual', e.target.checked)} />
                        Visual Impairment
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={formValues.disabilities.hearing} onChange={e => handleDisabilityChange('hearing', e.target.checked)} />
                        Hearing Impairment
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={formValues.disabilities.orthopedic} onChange={e => handleDisabilityChange('orthopedic', e.target.checked)} />
                        Orthopedic
                      </label>
                    </div>

                    <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Government/Civil Eligibility Proofs</span>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr btn', gap: '0.5rem', alignItems: 'flex-end' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Exam/Title</span>
                          <input type="text" placeholder="Let Exam" value={newProof.title} onChange={e => setNewProof(p => ({ ...p, title: e.target.value }))} className="form-input" style={{ padding: '0.4rem', fontSize: '0.8rem' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Rating</span>
                          <input type="text" placeholder="85.00" value={newProof.rating} onChange={e => setNewProof(p => ({ ...p, rating: e.target.value }))} className="form-input" style={{ padding: '0.4rem', fontSize: '0.8rem' }} />
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
                )}
              </div>
              
              <div style={modalFooterStyle}>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>Cancel</button>
                <button type="submit" disabled={savingModal} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                  {savingModal ? <Loader2 className="spinner" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}

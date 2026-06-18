"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { School, Agency } from '@/types';
import { 
  User, BookOpen, Briefcase, Award, CheckCircle, 
  ArrowRight, ArrowLeft, Loader2, AlertCircle, Plus, Trash2
} from 'lucide-react';

const FALLBACK_SCHOOLS: School[] = [
  { school_code: '100001', school_name: 'University of the Philippines', school_address: 'Diliman, Quezon City' },
  { school_code: '100002', school_name: 'Ateneo de Manila University', school_address: 'Loyola Heights, Quezon City' },
  { school_code: '100003', school_name: 'De La Salle University', school_address: 'Taft Ave, Manila' },
  { school_code: '100004', school_name: 'University of Santo Tomas', school_address: 'España, Manila' }
];

const FALLBACK_AGENCIES: Agency[] = [
  { agency_code: '200001', agency_name: 'DepEd (Department of Education)', agency_address: 'Pasig City' },
  { agency_code: '200002', agency_name: 'DOH (Department of Health)', agency_address: 'Manila' },
  { agency_code: '200003', agency_name: 'DPWH (Public Works & Highways)', agency_address: 'Manila' },
  { agency_code: '200004', agency_name: 'BIR (Bureau of Internal Revenue)', agency_address: 'Quezon City' }
];

export default function Apply() {
  const [step, setStep] = useState(1);
  const [schools, setSchools] = useState<School[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Application details output after success
  const [successDetails, setSuccessDetails] = useState<{
    applicantId: string;
    applicationNo: string;
  } | null>(null);

  // --- FORM STATE ---
  // Personal Info
  const [personal, setPersonal] = useState({
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
  });

  // Education Record
  const [education, setEducation] = useState({
    highest_education: "Bachelor's",
    completion: 'Completed',
    highest_level: 'College',
    graduation_date: '',
    honors_received: '',
    program_title: '',
    major: '',
    inclusive_years: '',
    school_code: ''
  });

  // Employment Record
  const [employment, setEmployment] = useState({
    job_title: '',
    years_in_agency: 0,
    appointment_status: 'Permanent',
    agency_code: ''
  });

  // Disabilities (Checkboxes)
  const [disabilities, setDisabilities] = useState({
    visual: false,
    hearing: false,
    orthopedic: false
  });

  // Eligibility Proofs
  const [eligibilityProofs, setEligibilityProofs] = useState<Array<{
    title: string;
    rating: string;
    dateGranted: string;
    placeTaken: string;
  }>>([]);

  const [newProof, setNewProof] = useState({
    title: '',
    rating: '',
    dateGranted: '',
    placeTaken: ''
  });

  // --- FETCH SCHOOLS & AGENCIES ON MOUNT ---
  useEffect(() => {
    async function fetchLookups() {
      try {
        setLoadingLookups(true);
        const { data: schoolsData, error: schoolsErr } = await supabase
          .from('schools')
          .select('*');
        const { data: agenciesData, error: agenciesErr } = await supabase
          .from('agencies')
          .select('*');

        if (!schoolsErr && schoolsData && schoolsData.length > 0) {
          setSchools(schoolsData as School[]);
          setEducation(prev => ({ ...prev, school_code: schoolsData[0].school_code }));
        } else {
          setSchools(FALLBACK_SCHOOLS);
          setEducation(prev => ({ ...prev, school_code: FALLBACK_SCHOOLS[0].school_code }));
        }

        if (!agenciesErr && agenciesData && agenciesData.length > 0) {
          setAgencies(agenciesData as Agency[]);
          setEmployment(prev => ({ ...prev, agency_code: agenciesData[0].agency_code }));
        } else {
          setAgencies(FALLBACK_AGENCIES);
          setEmployment(prev => ({ ...prev, agency_code: FALLBACK_AGENCIES[0].agency_code }));
        }
      } catch (err) {
        console.error('Failed to query lookup tables, applying fallback data', err);
        setSchools(FALLBACK_SCHOOLS);
        setAgencies(FALLBACK_AGENCIES);
      } finally {
        setLoadingLookups(false);
      }
    }
    fetchLookups();
  }, []);

  // --- HELPER ID GENERATORS ---
  const generateNumericId = (length: number) => {
    let result = '';
    const digits = '0123456789';
    for (let i = 0; i < length; i++) {
      result += digits.charAt(Math.floor(Math.random() * 10));
    }
    return result;
  };

  const generateAlphaNumericId = (length: number) => {
    let result = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // --- DYNAMIC FORM HANDLERS ---
  const handlePersonalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPersonal(prev => ({ ...prev, [name]: value }));
  };

  const handleEducationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEducation(prev => ({ ...prev, [name]: value }));
  };

  const handleEmploymentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEmployment(prev => ({ ...prev, [name]: name === 'years_in_agency' ? parseInt(value) || 0 : value }));
  };

  const addEligibilityProof = () => {
    if (!newProof.title || !newProof.rating || !newProof.dateGranted || !newProof.placeTaken) {
      alert('Please fill out all fields for eligibility proof.');
      return;
    }
    setEligibilityProofs(prev => [...prev, newProof]);
    setNewProof({ title: '', rating: '', dateGranted: '', placeTaken: '' });
  };

  const removeEligibilityProof = (index: number) => {
    setEligibilityProofs(prev => prev.filter((_, i) => i !== index));
  };

  // --- STEP VALIDATION ---
  const validateStep = () => {
    if (step === 1) {
      return (
        personal.name &&
        personal.birthdate &&
        personal.birthplace &&
        personal.citizenship &&
        personal.mother_maiden_name &&
        personal.permanent_address &&
        personal.zip_code &&
        personal.mobile_number &&
        personal.email
      );
    }
    if (step === 2) {
      return (
        education.program_title &&
        education.major &&
        education.inclusive_years &&
        education.school_code
      );
    }
    if (step === 3 && personal.employment_status === 'Employed') {
      return (
        employment.job_title &&
        employment.years_in_agency >= 0 &&
        employment.agency_code
      );
    }
    return true;
  };

  // --- SUBMIT TRANSACTION TO SUPABASE ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    const formsDate = new Date().toISOString().split('T')[0];
    const targetExamDate = '2026-10-15'; // Default exam batch date
    const targetExamPlace = 'NCR School Center';
    const targetRegionalOffice = 'NCR';

    try {
      // 1. BUSINESS RULE CHECK: Applicant may apply more than once so long as it is not on the same date and not during an exam.
      // We first query the applicants with the same email
      const { data: existingApplicants, error: applicantQueryErr } = await supabase
        .from('applicants')
        .select('applicant_id')
        .eq('email', personal.email);

      if (applicantQueryErr) throw new Error('Database check failed: ' + applicantQueryErr.message);

      if (existingApplicants && existingApplicants.length > 0) {
        const applicantIds = existingApplicants.map(app => app.applicant_id);

        // Fetch their applications
        const { data: existingApplications, error: appQueryErr } = await supabase
          .from('applications')
          .select('forms_date, exam_date')
          .in('applicant_id', applicantIds);

        if (appQueryErr) throw new Error('Database applications query failed: ' + appQueryErr.message);

        if (existingApplications && existingApplications.length > 0) {
          // Check for duplicate forms_date (same day)
          const hasSameDayApply = existingApplications.some(app => app.forms_date === formsDate);
          if (hasSameDayApply) {
            throw new Error(`An application has already been filed today (${formsDate}) under this email. Please try again on a different date.`);
          }

          // Check if there's a scheduled exam in the future (during an active exam cycle)
          const todayMs = new Date().getTime();
          const hasActiveExamRegistration = existingApplications.some(app => {
            const examTime = new Date(app.exam_date).getTime();
            return examTime > todayMs; // Registered for a future exam that hasn't happened yet
          });

          if (hasActiveExamRegistration) {
            throw new Error('You are already registered for an upcoming exam. You cannot apply again until the current exam cycle is completed.');
          }
        }
      }

      // 2. GENERATE AND INSERT TRANSACTION ENTITIES
      // Generate ids mirroring populate_db schema structure
      const eduRecordId = generateNumericId(12);
      const empRecordId = personal.employment_status === 'Employed' ? `EMP-${generateNumericId(5)}` : null;
      const applicantId = `APP-${generateAlphaNumericId(8)}`;
      const applicationNo = `APPNO-${generateNumericId(5)}`;

      // Step A: Insert Education Record
      const { error: eduErr } = await supabase
        .from('education_records')
        .insert({
          educational_record_id: eduRecordId,
          highest_education: education.highest_education,
          completion: education.completion,
          highest_level: education.highest_level,
          graduation_date: education.graduation_date || null,
          honors_received: education.honors_received || null,
          program_title: education.program_title,
          major: education.major,
          inclusive_years: education.inclusive_years,
          school_code: education.school_code
        });
      if (eduErr) throw new Error('Failed to create Education Record: ' + eduErr.message);

      // Step B: Insert Employment Record (if applicable)
      if (personal.employment_status === 'Employed' && empRecordId) {
        const { error: empErr } = await supabase
          .from('employment_records')
          .insert({
            employment_record_id: empRecordId,
            job_title: employment.job_title,
            years_in_agency: employment.years_in_agency,
            appointment_status: employment.appointment_status,
            agency_code: employment.agency_code
          });
        if (empErr) throw new Error('Failed to create Employment Record: ' + empErr.message);
      }

      // Step C: Insert Applicant
      const { error: applicantErr } = await supabase
        .from('applicants')
        .insert({
          applicant_id: applicantId,
          name: personal.name,
          birthdate: personal.birthdate,
          sex: personal.sex,
          birthplace: personal.birthplace,
          citizenship: personal.citizenship,
          mother_maiden_name: personal.mother_maiden_name,
          permanent_address: personal.permanent_address,
          zip_code: personal.zip_code,
          mobile_number: personal.mobile_number,
          telephone_number: personal.telephone_number || null,
          email: personal.email,
          civil_status: personal.civil_status,
          priority_group: personal.priority_group !== 'None' ? personal.priority_group : null,
          employment_status: personal.employment_status,
          educational_record_id: eduRecordId,
          employment_record_id: empRecordId
        });
      if (applicantErr) throw new Error('Failed to save Applicant profile: ' + applicantErr.message);

      // Step D: Insert Application
      const { error: appErr } = await supabase
        .from('applications')
        .insert({
          application_no: applicationNo,
          forms_date: formsDate,
          exam_applied_for: 'Career Service-Professional',
          last_exam_date: null,
          csr_regional_office: targetRegionalOffice,
          exam_date: targetExamDate,
          exam_place: targetExamPlace,
          applicant_id: applicantId,
          status: 'Pending'
        });
      if (appErr) throw new Error('Failed to submit Application details: ' + appErr.message);

      // Step E: Insert Disabilities
      const disabilityRecords = [];
      if (disabilities.visual) disabilityRecords.push({ disability_id: `DIS-${generateNumericId(5)}`, disability: 'Visual Impairment', applicant_id: applicantId });
      if (disabilities.hearing) disabilityRecords.push({ disability_id: `DIS-${generateNumericId(5)}`, disability: 'Hearing Impairment', applicant_id: applicantId });
      if (disabilities.orthopedic) disabilityRecords.push({ disability_id: `DIS-${generateNumericId(5)}`, disability: 'Orthopedic', applicant_id: applicantId });

      if (disabilityRecords.length > 0) {
        const { error: disErr } = await supabase
          .from('disabilities')
          .insert(disabilityRecords);
        if (disErr) throw new Error('Failed to record disabilities: ' + disErr.message);
      }

      // Step F: Insert Eligibility Proofs
      if (eligibilityProofs.length > 0) {
        const proofRecords = eligibilityProofs.map(proof => ({
          eligibility_proof_id: `ELIG-${generateNumericId(5)}`,
          eligibility_proof_title: proof.title,
          rating_obtained: proof.rating,
          date_granted: proof.dateGranted,
          eligibility_place_taken: proof.placeTaken,
          applicant_id: applicantId
        }));

        const { error: eligErr } = await supabase
          .from('eligibility_proofs')
          .insert(proofRecords);
        if (eligErr) throw new Error('Failed to save Eligibility Proofs: ' + eligErr.message);
      }

      // Success!
      setSuccessDetails({ applicantId, applicationNo });
      setStep(6);
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || 'An unexpected error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () => {
    if (step === 2 && personal.employment_status === 'Unemployed') {
      setStep(4); // Skip employment record if unemployed
    } else {
      setStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (step === 4 && personal.employment_status === 'Unemployed') {
      setStep(2);
    } else {
      setStep(prev => prev - 1);
    }
  };

  // --- RENDER SUCCESS ---
  if (successDetails) {
    return (
      <main style={{ maxWidth: '600px', margin: '3rem auto', padding: '0 1.5rem', animation: 'fadeIn 0.4s ease-out' }}>
        <div className="card" style={{
          textAlign: 'center',
          padding: '3rem 2rem',
          borderRadius: 'var(--radius-xl)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem'
        }}>
          <div style={{ color: 'var(--color-approved)', marginBottom: '0.5rem' }}>
            <CheckCircle size={64} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-accent)', fontSize: '2rem' }}>
            Submission Successful!
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Your application for the Civil Service Professional Exam has been registered successfully.
          </p>

          <div style={{
            width: '100%',
            backgroundColor: 'var(--bg-primary)',
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>UNIQUE APPLICANT ID</span>
              <p style={{ fontFamily: 'monospace', fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-primary)' }}>{successDetails.applicantId}</p>
            </div>
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>APPLICATION REF NUMBER</span>
              <p style={{ fontFamily: 'monospace', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{successDetails.applicationNo}</p>
            </div>
          </div>

          <div style={{ fontSize: '0.875rem', color: 'var(--color-pending)', backgroundColor: 'var(--color-pending-bg)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-pending-border)' }}>
            ⚠️ Write down or copy these identifiers! You will need them to check your application status later.
          </div>

          <div style={{ display: 'flex', gap: '1rem', width: '100%', marginTop: '1rem' }}>
            <a href="/" className="btn btn-secondary" style={{ flex: 1 }}>Back to Home</a>
            <a href={`/track?ref=${successDetails.applicationNo}`} className="btn btn-primary" style={{ flex: 1 }}>Track Application</a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1.5rem', animation: 'fadeIn 0.3s ease-out' }}>
      <div className="card" style={{ padding: '2.5rem', borderRadius: 'var(--radius-xl)' }}>
        
        {/* Step Indicator Header */}
        <header style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-accent)', marginBottom: '1.25rem' }}>
            Exam Application Form
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative' }}>
            {[
              { num: 1, label: 'Personal', icon: <User size={16} /> },
              { num: 2, label: 'Education', icon: <BookOpen size={16} /> },
              { num: 3, label: 'Employment', icon: <Briefcase size={16} />, hide: personal.employment_status !== 'Employed' },
              { num: 4, label: 'Credentials', icon: <Award size={16} /> },
              { num: 5, label: 'Review', icon: <CheckCircle size={16} /> }
            ].filter(s => !s.hide).map((s, idx, arr) => (
              <React.Fragment key={s.num}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: step === s.num ? 'var(--color-primary)' : step > s.num ? 'var(--color-approved)' : 'var(--text-muted)',
                  fontWeight: step === s.num ? '600' : '500',
                  fontSize: '0.85rem'
                }}>
                  <div style={{
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '50%',
                    backgroundColor: step === s.num ? 'var(--color-primary-light)' : step > s.num ? 'var(--color-approved-bg)' : 'var(--bg-tertiary)',
                    border: `1px solid ${step === s.num ? 'var(--color-primary)' : step > s.num ? 'var(--color-approved-border)' : 'var(--color-border)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {s.icon}
                  </div>
                  <span className="font-accent" style={{ display: 'none', sm: 'inline' } as any}>{s.label}</span>
                </div>
                {idx < arr.length - 1 && (
                  <div style={{
                    flex: 1,
                    height: '2px',
                    backgroundColor: step > s.num ? 'var(--color-approved-border)' : 'var(--color-border)',
                    minWidth: '1rem'
                  }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </header>

        {loadingLookups ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '3rem 0' }}>
            <Loader2 className="spinner" style={{ color: 'var(--color-primary)' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Retrieving lookup lists from database...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            
            {submitError && (
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                backgroundColor: 'var(--color-rejected-bg)',
                border: '1px solid var(--color-rejected-border)',
                color: 'var(--color-rejected)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.5rem',
                fontSize: '0.875rem'
              }}>
                <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                <span>{submitError}</span>
              </div>
            )}

            {/* --- STEP 1: PERSONAL INFO --- */}
            {step === 1 && (
              <section className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.15rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                  Personal Information
                </h3>
                
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input type="text" name="name" value={personal.name} onChange={handlePersonalChange} className="form-input" placeholder="Juan A. Dela Cruz" required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Birthdate *</label>
                    <input type="date" name="birthdate" value={personal.birthdate} onChange={handlePersonalChange} className="form-input" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sex *</label>
                    <select name="sex" value={personal.sex} onChange={handlePersonalChange} className="form-select">
                      <option>Male</option>
                      <option>Female</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Birthplace *</label>
                    <input type="text" name="birthplace" value={personal.birthplace} onChange={handlePersonalChange} className="form-input" placeholder="City / Province" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Citizenship *</label>
                    <input type="text" name="citizenship" value={personal.citizenship} onChange={handlePersonalChange} className="form-input" required />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Mother's Maiden Name *</label>
                  <input type="text" name="mother_maiden_name" value={personal.mother_maiden_name} onChange={handlePersonalChange} className="form-input" placeholder="Mother's First Name & Mother's Maiden Surname" required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Permanent Address *</label>
                    <input type="text" name="permanent_address" value={personal.permanent_address} onChange={handlePersonalChange} className="form-input" placeholder="House No, Street, Brgy, City, Province" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Zip Code *</label>
                    <input type="text" name="zip_code" value={personal.zip_code} onChange={handlePersonalChange} className="form-input" placeholder="e.g. 1008" required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Mobile Number *</label>
                    <input type="tel" name="mobile_number" value={personal.mobile_number} onChange={handlePersonalChange} className="form-input" placeholder="+639XXXXXXXXX" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Telephone Number</label>
                    <input type="tel" name="telephone_number" value={personal.telephone_number} onChange={handlePersonalChange} className="form-input" placeholder="02-XXXX-XXXX" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input type="email" name="email" value={personal.email} onChange={handlePersonalChange} className="form-input" placeholder="juan.delacruz@example.com" required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Civil Status *</label>
                    <select name="civil_status" value={personal.civil_status} onChange={handlePersonalChange} className="form-select">
                      <option>Single</option>
                      <option>Married</option>
                      <option>Widowed</option>
                      <option>Separated</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Priority Group (if applicable)</label>
                    <select name="priority_group" value={personal.priority_group} onChange={handlePersonalChange} className="form-select">
                      <option>None</option>
                      <option>PWD</option>
                      <option>Indigenous People</option>
                      <option>Senior Citizen</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Employment Status *</label>
                  <select name="employment_status" value={personal.employment_status} onChange={handlePersonalChange} className="form-select">
                    <option>Unemployed</option>
                    <option>Employed</option>
                  </select>
                </div>
              </section>
            )}

            {/* --- STEP 2: EDUCATION RECORD --- */}
            {step === 2 && (
              <section className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.15rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                  Educational Background
                </h3>

                <div className="form-group">
                  <label className="form-label">School / Institution *</label>
                  <select name="school_code" value={education.school_code} onChange={handleEducationChange} className="form-select">
                    {schools.map(s => (
                      <option key={s.school_code} value={s.school_code}>
                        {s.school_name} ({s.school_address})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Highest Education Attained *</label>
                    <select name="highest_education" value={education.highest_education} onChange={handleEducationChange} className="form-select">
                      <option>High School</option>
                      <option>Senior High School</option>
                      <option>Bachelor's</option>
                      <option>Master's</option>
                      <option>Doctorate</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Completion Status *</label>
                    <select name="completion" value={education.completion} onChange={handleEducationChange} className="form-select">
                      <option>Completed</option>
                      <option>Undergraduate</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Level Category *</label>
                    <select name="highest_level" value={education.highest_level} onChange={handleEducationChange} className="form-select">
                      <option>Secondary</option>
                      <option>College</option>
                      <option>Post-Graduate</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Graduation Date (if completed)</label>
                    <input type="date" name="graduation_date" value={education.graduation_date} onChange={handleEducationChange} className="form-input" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Program / Course Title *</label>
                    <input type="text" name="program_title" value={education.program_title} onChange={handleEducationChange} className="form-input" placeholder="e.g. BS Information Technology or STEM" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Major *</label>
                    <input type="text" name="major" value={education.major} onChange={handleEducationChange} className="form-input" placeholder="e.g. IT, Accounting, or N/A" required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Inclusive Years (e.g. 2018-2022) *</label>
                    <input type="text" name="inclusive_years" value={education.inclusive_years} onChange={handleEducationChange} className="form-input" placeholder="YYYY-YYYY" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Honors Received (if any)</label>
                    <input type="text" name="honors_received" value={education.honors_received} onChange={handleEducationChange} className="form-input" placeholder="e.g. Cum Laude, Valedictorian" />
                  </div>
                </div>
              </section>
            )}

            {/* --- STEP 3: EMPLOYMENT RECORD (Conditional) --- */}
            {step === 3 && personal.employment_status === 'Employed' && (
              <section className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.15rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                  Employment Details
                </h3>

                <div className="form-group">
                  <label className="form-label">Employer / Agency *</label>
                  <select name="agency_code" value={employment.agency_code} onChange={handleEmploymentChange} className="form-select">
                    {agencies.map(a => (
                      <option key={a.agency_code} value={a.agency_code}>
                        {a.agency_name} ({a.agency_address})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Job Title / Designation *</label>
                  <input type="text" name="job_title" value={employment.job_title} onChange={handleEmploymentChange} className="form-input" placeholder="e.g. Administrative Officer I" required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Years in Agency *</label>
                    <input type="number" name="years_in_agency" min="0" value={employment.years_in_agency} onChange={handleEmploymentChange} className="form-input" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Appointment Status *</label>
                    <select name="appointment_status" value={employment.appointment_status} onChange={handleEmploymentChange} className="form-select">
                      <option>Permanent</option>
                      <option>Contractual</option>
                      <option>Casual</option>
                      <option>Co-terminus</option>
                    </select>
                  </div>
                </div>
              </section>
            )}

            {/* --- STEP 4: DISABILITIES & ELIGIBILITIES --- */}
            {step === 4 && (
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
            )}

            {/* --- STEP 5: REVIEW & SUBMIT --- */}
            {step === 5 && (
              <section className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                  Review Application
                </h3>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '1.5rem'
                }}>
                  {/* Personal Summary */}
                  <div className="card" style={{ padding: '1.25rem', backgroundColor: 'var(--bg-primary)' }}>
                    <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: 'var(--color-primary)' }}>Personal Data</h4>
                    <p style={{ fontSize: '0.9rem', margin: '0.25rem 0' }}><strong>Name:</strong> {personal.name}</p>
                    <p style={{ fontSize: '0.9rem', margin: '0.25rem 0' }}><strong>Email:</strong> {personal.email}</p>
                    <p style={{ fontSize: '0.9rem', margin: '0.25rem 0' }}><strong>Mobile:</strong> {personal.mobile_number}</p>
                    <p style={{ fontSize: '0.9rem', margin: '0.25rem 0' }}><strong>Address:</strong> {personal.permanent_address}</p>
                    <p style={{ fontSize: '0.9rem', margin: '0.25rem 0' }}><strong>Civil Status:</strong> {personal.civil_status}</p>
                  </div>

                  {/* Education Summary */}
                  <div className="card" style={{ padding: '1.25rem', backgroundColor: 'var(--bg-primary)' }}>
                    <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: 'var(--color-primary)' }}>Education History</h4>
                    <p style={{ fontSize: '0.9rem', margin: '0.25rem 0' }}><strong>Highest Degree:</strong> {education.highest_education}</p>
                    <p style={{ fontSize: '0.9rem', margin: '0.25rem 0' }}><strong>Program:</strong> {education.program_title} ({education.major})</p>
                    <p style={{ fontSize: '0.9rem', margin: '0.25rem 0' }}><strong>Inclusive Years:</strong> {education.inclusive_years}</p>
                    <p style={{ fontSize: '0.9rem', margin: '0.25rem 0' }}><strong>School Code:</strong> {education.school_code}</p>
                  </div>

                  {/* Employment Summary */}
                  {personal.employment_status === 'Employed' && (
                    <div className="card" style={{ padding: '1.25rem', backgroundColor: 'var(--bg-primary)' }}>
                      <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: 'var(--color-primary)' }}>Employment Record</h4>
                      <p style={{ fontSize: '0.9rem', margin: '0.25rem 0' }}><strong>Title:</strong> {employment.job_title}</p>
                      <p style={{ fontSize: '0.9rem', margin: '0.25rem 0' }}><strong>Years in Agency:</strong> {employment.years_in_agency}</p>
                      <p style={{ fontSize: '0.9rem', margin: '0.25rem 0' }}><strong>Appointment:</strong> {employment.appointment_status}</p>
                      <p style={{ fontSize: '0.9rem', margin: '0.25rem 0' }}><strong>Agency Code:</strong> {employment.agency_code}</p>
                    </div>
                  )}

                  {/* Extra Summary */}
                  <div className="card" style={{ padding: '1.25rem', backgroundColor: 'var(--bg-primary)' }}>
                    <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: 'var(--color-primary)' }}>Disabilities & Proofs</h4>
                    <p style={{ fontSize: '0.9rem', margin: '0.25rem 0' }}><strong>Disabilities:</strong> {
                      [
                        disabilities.visual && 'Visual',
                        disabilities.hearing && 'Hearing',
                        disabilities.orthopedic && 'Orthopedic'
                      ].filter(Boolean).join(', ') || 'None declared'
                    }</p>
                    <p style={{ fontSize: '0.9rem', margin: '0.25rem 0' }}><strong>Eligibility Proofs:</strong> {eligibilityProofs.length} record(s) added</p>
                  </div>
                </div>

                <div style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  borderTop: '1px solid var(--color-border)',
                  paddingTop: '1rem',
                  marginTop: '0.5rem'
                }}>
                  By clicking Submit Application, you declare under penalty of perjury that the data submitted corresponds truthfully to your personal records.
                </div>
              </section>
            )}

            {/* Navigation Buttons Footer */}
            <footer style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '2.5rem',
              borderTop: '1px solid var(--color-border)',
              paddingTop: '1.5rem'
            }}>
              {step > 1 ? (
                <button type="button" onClick={prevStep} className="btn btn-secondary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <ArrowLeft size={16} /> Back
                </button>
              ) : (
                <div />
              )}

              {step < 5 ? (
                <button type="button" onClick={nextStep} disabled={!validateStep()} className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  Next <ArrowRight size={16} />
                </button>
              ) : (
                <button type="submit" disabled={submitting} className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', backgroundColor: 'var(--color-approved)' }}>
                  {submitting ? (
                    <>
                      <Loader2 className="spinner" /> Submitting...
                    </>
                  ) : (
                    <>
                      Submit Application <CheckCircle size={16} />
                    </>
                  )}
                </button>
              )}
            </footer>
          </form>
        )}
      </div>
    </main>
  );
}

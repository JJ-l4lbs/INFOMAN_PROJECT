"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { School, Agency } from '@/types';

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

export function useApplyForm() {
  const [step, setStep] = useState(1);
  const [schools, setSchools] = useState<School[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [disabilityLookups, setDisabilityLookups] = useState<any[]>([]);
  const [eligibilityLookups, setEligibilityLookups] = useState<any[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Toast indicator state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  };
  
  // Application details output after success
  const [successDetails, setSuccessDetails] = useState<{
    applicantId: string;
    applicationNo: string;
  } | null>(null);

  // --- FORM STATE ---
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

  const [education, setEducation] = useState({
    highest_education: "Bachelor's",
    completion: 'Completed',
    highest_level: 'College',
    graduation_date: '',
    honors_received: '',
    program_title: '',
    major: '',
    inclusive_years: '',
    school_code: '',
    customSchoolName: '',
    customSchoolAddress: ''
  });

  const [employment, setEmployment] = useState({
    job_title: '',
    years_in_agency: 0,
    appointment_status: 'Permanent',
    agency_code: '',
    customAgencyName: '',
    customAgencyAddress: ''
  });

  const [disabilities, setDisabilities] = useState<string[]>([]);
  const [customDisability, setCustomDisability] = useState('');
  const [showCustomDisability, setShowCustomDisability] = useState(false);

  const [eligibilityProofs, setEligibilityProofs] = useState<Array<{
    title: string;
    rating: string;
    dateGranted: string;
    placeTaken: string;
    isCustom?: boolean;
  }>>([]);

  const [newProof, setNewProof] = useState({
    title: '',
    customTitle: '',
    rating: '',
    dateGranted: '',
    placeTaken: ''
  });

  // --- FETCH LOOKUPS ON MOUNT ---
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
        const { data: disData, error: disErr } = await supabase
          .from('disability_lookups')
          .select('*');
        const { data: elgData, error: elgErr } = await supabase
          .from('eligibility_lookups')
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

        if (!disErr && disData) {
          setDisabilityLookups(disData);
        }
        if (!elgErr && elgData) {
          setEligibilityLookups(elgData);
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

  const getInitials = (name: string, fallback: string = 'GEN'): string => {
    const clean = name.replace(/[^A-Za-z0-9 ]/g, '').trim();
    if (!clean) return fallback;
    const uppercaseLetters = clean.replace(/[^A-Z0-9]/g, '');
    if (uppercaseLetters.length >= 2 && uppercaseLetters.length <= 6) {
      return uppercaseLetters;
    }
    const words = clean.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return words.map(w => w[0]).join('').toUpperCase();
    } else if (words.length === 1) {
      return words[0].substring(0, 3).toUpperCase();
    }
    return fallback;
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
    const actualTitle = newProof.title === 'OTHER' ? newProof.customTitle : newProof.title;
    if (!actualTitle || !newProof.rating || !newProof.dateGranted || !newProof.placeTaken) {
      showToast('Please fill out all fields for eligibility proof.', 'error');
      return;
    }
    setEligibilityProofs(prev => [...prev, {
      title: actualTitle,
      rating: newProof.rating,
      dateGranted: newProof.dateGranted,
      placeTaken: newProof.placeTaken,
      isCustom: newProof.title === 'OTHER'
    }]);
    setNewProof({ title: '', customTitle: '', rating: '', dateGranted: '', placeTaken: '' });
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
      const isSchoolFilled = education.school_code === 'OTHER'
        ? (education.customSchoolName && education.customSchoolAddress)
        : education.school_code;
      return (
        education.program_title &&
        education.major &&
        education.inclusive_years &&
        isSchoolFilled
      );
    }
    if (step === 3 && personal.employment_status === 'Employed') {
      const isAgencyFilled = employment.agency_code === 'OTHER'
        ? (employment.customAgencyName && employment.customAgencyAddress)
        : employment.agency_code;
      return (
        employment.job_title &&
        employment.years_in_agency >= 0 &&
        isAgencyFilled
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

      // 2. FETCH NEXT SEQUENTIAL KEYS FROM THE DATABASE
      // A. Educational Record ID (EDU-0001 format)
      const { data: maxEdu } = await supabase
        .from('education_records')
        .select('educational_record_id')
        .like('educational_record_id', 'EDU-%')
        .order('educational_record_id', { ascending: false });
      let eduNum = 1;
      if (maxEdu && maxEdu.length > 0) {
        const validEdu = maxEdu.find(e => {
          const num = parseInt(e.educational_record_id.replace('EDU-', ''));
          return !isNaN(num) && num < 10000;
        });
        if (validEdu) {
          eduNum = parseInt(validEdu.educational_record_id.replace('EDU-', '')) + 1;
        }
      }
      const eduRecordId = `EDU-${String(eduNum).padStart(4, '0')}`;

      // B. Employment Record ID (EMP-0001 format)
      let empRecordId = null;
      if (personal.employment_status === 'Employed') {
        const { data: maxEmp } = await supabase
          .from('employment_records')
          .select('employment_record_id')
          .like('employment_record_id', 'EMP-%')
          .order('employment_record_id', { ascending: false });
        let empNum = 1;
        if (maxEmp && maxEmp.length > 0) {
          const validEmp = maxEmp.find(e => {
            const num = parseInt(e.employment_record_id.replace('EMP-', ''));
            return !isNaN(num) && num < 10000;
          });
          if (validEmp) {
            empNum = parseInt(validEmp.employment_record_id.replace('EMP-', '')) + 1;
          }
        }
        empRecordId = `EMP-${String(empNum).padStart(4, '0')}`;
      }

      // C. Applicant ID (First 4 letters of name + random 4 characters, e.g. JOHN-A1B2)
      const cleanNameForId = personal.name.replace(/[^A-Za-z]/g, '').toUpperCase();
      const namePrefix = cleanNameForId.padEnd(4, 'X').substring(0, 4);
      const nameSuffix = generateAlphaNumericId(4);
      const applicantId = `${namePrefix}-${nameSuffix}`;

      // D. Application No (APPNO-0001 format)
      const { data: maxApp } = await supabase
        .from('applications')
        .select('application_no')
        .like('application_no', 'APPNO-%')
        .order('application_no', { ascending: false });
      let applicationNo = 'APPNO-0001';
      if (maxApp && maxApp.length > 0) {
        const validApp = maxApp.find(a => {
          const num = parseInt(a.application_no.replace('APPNO-', ''));
          return !isNaN(num) && num < 10000;
        });
        if (validApp) {
          const num = parseInt(validApp.application_no.replace('APPNO-', ''));
          applicationNo = `APPNO-${String(num + 1).padStart(4, '0')}`;
        }
      }

      // Step A: Insert Education Record (Handle custom school write-in)
      let targetSchoolCode = education.school_code;
      if (education.school_code === 'OTHER') {
        const schoolInitials = getInitials(education.customSchoolName || '', 'SCH');
        const schoolRand = generateNumericId(5);
        targetSchoolCode = `${schoolInitials}-${schoolRand}`;

        const { error: newSchoolErr } = await supabase
          .from('schools')
          .insert({
            school_code: targetSchoolCode,
            school_name: education.customSchoolName,
            school_address: education.customSchoolAddress,
            is_registered: false
          });
        if (newSchoolErr) throw new Error('Failed to register custom school: ' + newSchoolErr.message);
      }

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
          school_code: targetSchoolCode
        });
      if (eduErr) throw new Error('Failed to create Education Record: ' + eduErr.message);

      // Step B: Insert Employment Record (Handle custom agency write-in)
      if (personal.employment_status === 'Employed' && empRecordId) {
        let targetAgencyCode = employment.agency_code;
        if (employment.agency_code === 'OTHER') {
          const agencyInitials = getInitials(employment.customAgencyName || '', 'AGE');
          const agencyRand = generateNumericId(5);
          targetAgencyCode = `${agencyInitials}-${agencyRand}`;

          const { error: newAgencyErr } = await supabase
            .from('agencies')
            .insert({
              agency_code: targetAgencyCode,
              agency_name: employment.customAgencyName,
              agency_address: employment.customAgencyAddress,
              is_registered: false
            });
          if (newAgencyErr) throw new Error('Failed to register custom employment agency: ' + newAgencyErr.message);
        }

        const { error: empErr } = await supabase
          .from('employment_records')
          .insert({
            employment_record_id: empRecordId,
            job_title: employment.job_title,
            years_in_agency: employment.years_in_agency,
            appointment_status: employment.appointment_status,
            agency_code: targetAgencyCode
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

      // Step E: Insert Disabilities (Handle custom disability write-ins)
      const disabilityRecords = [];
      const finalSelectedDis = [...disabilities];
      if (showCustomDisability && customDisability && customDisability.trim() !== '') {
        const trimmedCustom = customDisability.trim();
        finalSelectedDis.push(trimmedCustom);

        // Check and insert into disability_lookups if not existing
        const { data: existingDis } = await supabase
          .from('disability_lookups')
          .select('disability_code')
          .eq('disability_name', trimmedCustom);

        if (!existingDis || existingDis.length === 0) {
          const { data: maxDisLookup } = await supabase
            .from('disability_lookups')
            .select('disability_code')
            .like('disability_code', 'DIS-9%')
            .order('disability_code', { ascending: false })
            .limit(1);
          let nextDisCode = 'DIS-90001';
          if (maxDisLookup && maxDisLookup.length > 0) {
            const num = parseInt(maxDisLookup[0].disability_code.replace('DIS-', ''));
            if (!isNaN(num)) {
              nextDisCode = `DIS-${num + 1}`;
            }
          }
          await supabase.from('disability_lookups').insert({
            disability_code: nextDisCode,
            disability_name: trimmedCustom,
            is_registered: false
          });
        }
      }

      // Query the highest disability_id matching DIS-% to make it sequential
      const { data: maxDis } = await supabase
        .from('disabilities')
        .select('disability_id')
        .like('disability_id', 'DIS-%')
        .order('disability_id', { ascending: false });

      let disNum = 1;
      if (maxDis && maxDis.length > 0) {
        const validDis = maxDis.find(d => {
          const num = parseInt(d.disability_id.replace('DIS-', ''));
          return !isNaN(num) && num < 10000;
        });
        if (validDis) {
          disNum = parseInt(validDis.disability_id.replace('DIS-', '')) + 1;
        }
      }

      for (const disName of finalSelectedDis) {
        disabilityRecords.push({
          disability_id: `DIS-${String(disNum++).padStart(4, '0')}`,
          disability: disName,
          applicant_id: applicantId
        });
      }

      if (disabilityRecords.length > 0) {
        const { error: disErr } = await supabase
          .from('disabilities')
          .insert(disabilityRecords);
        if (disErr) throw new Error('Failed to record disabilities: ' + disErr.message);
      }

      // Step F: Insert Eligibility Proofs (Handle custom eligibility write-ins)
      if (eligibilityProofs.length > 0) {
        for (const proof of eligibilityProofs) {
          if (proof.isCustom) {
            const { data: existingElg } = await supabase
              .from('eligibility_lookups')
              .select('eligibility_code')
              .eq('eligibility_name', proof.title);

            if (!existingElg || existingElg.length === 0) {
              const { data: maxEligLookup } = await supabase
                .from('eligibility_lookups')
                .select('eligibility_code')
                .like('eligibility_code', 'ELG-9%')
                .order('eligibility_code', { ascending: false })
                .limit(1);
              let nextEligCode = 'ELG-90001';
              if (maxEligLookup && maxEligLookup.length > 0) {
                const num = parseInt(maxEligLookup[0].eligibility_code.replace('ELG-', ''));
                if (!isNaN(num)) {
                  nextEligCode = `ELG-${num + 1}`;
                }
              }
              await supabase.from('eligibility_lookups').insert({
                eligibility_code: nextEligCode,
                eligibility_name: proof.title,
                is_registered: false
              });
            }
          }
        }

        const { data: maxElig } = await supabase
          .from('eligibility_proofs')
          .select('eligibility_proof_id')
          .like('eligibility_proof_id', 'EP-%')
          .order('eligibility_proof_id', { ascending: false });

        let eligNum = 1;
        if (maxElig && maxElig.length > 0) {
          const validElig = maxElig.find(e => {
            const num = parseInt(e.eligibility_proof_id.replace('EP-', ''));
            return !isNaN(num) && num < 10000;
          });
          if (validElig) {
            eligNum = parseInt(validElig.eligibility_proof_id.replace('EP-', '')) + 1;
          }
        }

        const proofRecords = eligibilityProofs.map(proof => ({
          eligibility_proof_id: `EP-${String(eligNum++).padStart(4, '0')}`,
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
      setStep(4);
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

  return {
    step,
    schools,
    agencies,
    loadingLookups,
    submitting,
    submitError,
    successDetails,
    personal,
    education,
    employment,
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
    handlePersonalChange,
    handleEducationChange,
    handleEmploymentChange,
    addEligibilityProof,
    removeEligibilityProof,
    validateStep,
    handleSubmit,
    nextStep,
    prevStep,
    toast,
    setToast,
    showToast
  };
}

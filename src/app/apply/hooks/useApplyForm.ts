"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { School, Agency } from '@/types';
import { publicSubmitApplication } from '../actions';

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
    employment_status: 'Unemployed',
    is_retaker: false
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



  // --- DYNAMIC FORM HANDLERS ---
  const handlePersonalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, type } = e.target;
    const value = type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
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
  // --- SUBMIT TRANSACTION TO SUPABASE (Via Server Action) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    try {
      const result = await publicSubmitApplication({
        personal,
        education,
        employment: personal.employment_status === 'Employed' ? employment : null,
        disabilities,
        customDisability: showCustomDisability ? customDisability : '',
        eligibilityProofs
      });

      setSuccessDetails({
        applicantId: result.applicantId,
        applicationNo: result.applicationNo
      });
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

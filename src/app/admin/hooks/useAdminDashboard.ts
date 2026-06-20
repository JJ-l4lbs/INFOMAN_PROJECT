"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { School, Agency, Application, Applicant, EducationRecord, EmploymentRecord, Disability, EligibilityProof } from '@/types';
import { 
  adminFetchApplications, 
  adminFetchApplicationDetail, 
  adminUpdateApplication, 
  adminDeleteApplicant, 
  adminAddApplication,
  adminFetchLookups,
  adminApproveLookup,
  adminUpdateLookup,
  adminDeleteLookup,
  adminAddLookup
} from '../actions';

interface JoinResult extends Application {
  applicants: Applicant & {
    education_records?: EducationRecord & { schools: School };
    employment_records?: EmploymentRecord & { agencies: Agency };
  };
}

export function useAdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  
  const [applications, setApplications] = useState<JoinResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Toast indicator state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  };

  // Lookup data for dropdowns
  const [schools, setSchools] = useState<School[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [disabilityLookups, setDisabilityLookups] = useState<any[]>([]);
  const [eligibilityLookups, setEligibilityLookups] = useState<any[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(false);

  // Lookup management views
  const [activeView, setActiveView] = useState<'applications' | 'schools' | 'agencies' | 'disabilities' | 'eligibilities'>('applications');
  const [adminSchools, setAdminSchools] = useState<any[]>([]);
  const [adminAgencies, setAdminAgencies] = useState<any[]>([]);
  const [adminDisabilities, setAdminDisabilities] = useState<any[]>([]);
  const [adminEligibilities, setAdminEligibilities] = useState<any[]>([]);
  const [loadingLookupsData, setLoadingLookupsData] = useState(false);

  // Filters and Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Sorting
  const [sortField, setSortField] = useState<'application_no' | 'name' | 'email' | 'exam_date' | 'status'>('application_no');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: 'application_no' | 'name' | 'email' | 'exam_date' | 'status') => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

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
      employment_status: 'Unemployed',
      is_retaker: false
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
      school_code: '',
      customSchoolName: '',
      customSchoolAddress: ''
    },
    employment: {
      job_title: '',
      years_in_agency: 0,
      appointment_status: 'Permanent',
      agency_code: '',
      customAgencyName: '',
      customAgencyAddress: ''
    },
    disabilities: [] as string[]
  };

  const [formValues, setFormValues] = useState(initialFormState);
  const [customDisability, setCustomDisability] = useState('');
  const [showCustomDisability, setShowCustomDisability] = useState(false);
  const [proofs, setProofs] = useState<Array<{ title: string; rating: string; dateGranted: string; placeTaken: string; isCustom?: boolean }>>([]);
  const [newProof, setNewProof] = useState({ title: '', customTitle: '', rating: '', dateGranted: '', placeTaken: '' });
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
      const { data: disData } = await supabase.from('disability_lookups').select('*');
      const { data: elgData } = await supabase.from('eligibility_lookups').select('*');
      
      if (schoolsData && schoolsData.length > 0) {
        setSchools(schoolsData as School[]);
      }
      if (agenciesData && agenciesData.length > 0) {
        setAgencies(agenciesData as Agency[]);
      }
      if (disData) {
        setDisabilityLookups(disData);
      }
      if (elgData) {
        setEligibilityLookups(elgData);
      }
    } catch (err) {
      console.error('Failed to query lookup tables', err);
    } finally {
      setLoadingLookups(false);
    }
  };

  // --- FETCH ALL ADMIN LOOKUPS ---
  const fetchAllAdminLookups = async () => {
    try {
      setLoadingLookupsData(true);
      const sch = await adminFetchLookups(password, 'schools');
      const age = await adminFetchLookups(password, 'agencies');
      const dis = await adminFetchLookups(password, 'disabilities');
      const elg = await adminFetchLookups(password, 'eligibilities');
      
      setAdminSchools(sch);
      setAdminAgencies(age);
      setAdminDisabilities(dis);
      setAdminEligibilities(elg);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to load lookup data.', 'error');
    } finally {
      setLoadingLookupsData(false);
    }
  };

  const handleRefresh = async () => {
    try {
      await Promise.all([
        fetchApplications(),
        fetchLookups(),
        fetchAllAdminLookups()
      ]);
      showToast('All database records and lookup data refreshed.', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Failed to refresh data: ' + (err.message || err), 'error');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchApplications();
      fetchLookups();
      fetchAllAdminLookups();
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
        disabilities: detailedData.disabilities.map(d => d.disability),
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

      showToast('Application status & scheduling updated successfully!', 'success');
    } catch (err: any) {
      showToast('Failed to update record: ' + err.message, 'error');
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

      showToast('Applicant record and all associated logs deleted successfully.', 'success');
      
      if (selectedApp?.application_no === app.application_no) {
        setSelectedApp(null);
      }

      await fetchApplications();
    } catch (err: any) {
      console.error(err);
      showToast('Error during delete transaction: ' + err.message, 'error');
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
        employment_status: selectedApp.applicants?.employment_status || 'Unemployed',
        is_retaker: false
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
        school_code: detailedData.education?.school_code || (schools[0]?.school_code || ''),
        customSchoolName: '',
        customSchoolAddress: ''
      },
      employment: {
        job_title: detailedData.employment?.job_title || '',
        years_in_agency: detailedData.employment?.years_in_agency || 0,
        appointment_status: detailedData.employment?.appointment_status || 'Permanent',
        agency_code: detailedData.employment?.agency_code || (agencies[0]?.agency_code || ''),
        customAgencyName: '',
        customAgencyAddress: ''
      },
      disabilities: detailedData.disabilities.map(d => d.disability)
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

  const handleDisabilityChange = (name: string, checked: boolean) => {
    setFormValues(prev => {
      const current = prev.disabilities || [];
      const next = checked
        ? [...current.filter(item => item !== name), name]
        : current.filter(item => item !== name);
      return {
        ...prev,
        disabilities: next as any
      };
    });
  };

  // Proofs editors
  const addProof = () => {
    const actualTitle = newProof.title === 'OTHER' ? newProof.customTitle : newProof.title;
    if (!actualTitle || !newProof.rating || !newProof.dateGranted || !newProof.placeTaken) {
      showToast('Please fill in all eligibility proof fields.', 'error');
      return;
    }
    setProofs(prev => [...prev, {
      title: actualTitle,
      rating: newProof.rating,
      dateGranted: newProof.dateGranted,
      placeTaken: newProof.placeTaken,
      isCustom: newProof.title === 'OTHER'
    }]);
    setNewProof({ title: '', customTitle: '', rating: '', dateGranted: '', placeTaken: '' });
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

      showToast('Profile and registration records updated successfully!', 'success');
      setShowEditModal(false);
      setSelectedApp(null);
      await fetchApplications();
    } catch (err: any) {
      setActionError(err.message || 'Failed to modify record.');
      showToast(err.message || 'Failed to modify record.', 'error');
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
      const finalDisabilities = [...formValues.disabilities];
      if (showCustomDisability && customDisability.trim() !== '') {
        finalDisabilities.push(customDisability.trim());
      }

      const res = await adminAddApplication(password, {
        application: formValues.application,
        personal: formValues.personal,
        education: formValues.education,
        employment: formValues.personal.employment_status === 'Employed' ? formValues.employment : null,
        disabilities: finalDisabilities,
        eligibilityProofs: proofs
      });

      showToast(`Application added successfully!\nApplicant ID: ${res.applicantId}\nApplication No: ${res.applicationNo}`, 'success');
      setShowCreateModal(false);
      setCustomDisability('');
      setShowCustomDisability(false);
      await fetchApplications();
      await fetchLookups();
      await fetchAllAdminLookups();
    } catch (err: any) {
      setActionError(err.message || 'Failed to create manual entry.');
      showToast(err.message || 'Failed to create manual entry.', 'error');
    } finally {
      setSavingModal(false);
    }
  };

  // --- LOOKUP MANAGEMENT ACTIONS ---
  const handleApproveLookup = async (type: 'schools' | 'agencies' | 'disabilities' | 'eligibilities', code: string) => {
    try {
      await adminApproveLookup(password, type, code);
      showToast('Lookup approved successfully!', 'success');
      await fetchAllAdminLookups();
      await fetchLookups();
    } catch (err: any) {
      showToast(err.message || 'Failed to approve lookup.', 'error');
    }
  };

  const handleDeleteLookup = async (type: 'schools' | 'agencies' | 'disabilities' | 'eligibilities', code: string) => {
    if (!confirm('Are you sure you want to delete this lookup record? This cannot be undone.')) return;
    try {
      await adminDeleteLookup(password, type, code);
      showToast('Lookup deleted successfully!', 'success');
      await fetchAllAdminLookups();
      await fetchLookups();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete lookup.', 'error');
    }
  };

  const [showLookupModal, setShowLookupModal] = useState(false);
  const [lookupModalConfig, setLookupModalConfig] = useState<{
    mode: 'create' | 'edit';
    type: 'schools' | 'agencies' | 'disabilities' | 'eligibilities';
    code?: string;
    initialData?: any;
  } | null>(null);

  const handleOpenLookupCreate = (type: 'schools' | 'agencies' | 'disabilities' | 'eligibilities') => {
    setLookupModalConfig({ mode: 'create', type });
    setShowLookupModal(true);
  };

  const handleOpenLookupEdit = (type: 'schools' | 'agencies' | 'disabilities' | 'eligibilities', code: string, currentData: any) => {
    setLookupModalConfig({ mode: 'edit', type, code, initialData: currentData });
    setShowLookupModal(true);
  };

  const handleSaveLookup = async (payload: any) => {
    if (!lookupModalConfig) return;
    setSavingModal(true);
    try {
      const { mode, type, code } = lookupModalConfig;
      if (mode === 'create') {
        await adminAddLookup(password, type, payload);
        showToast('Lookup record added!', 'success');
      } else if (mode === 'edit' && code) {
        await adminUpdateLookup(password, type, code, payload);
        showToast('Lookup record updated!', 'success');
      }
      setShowLookupModal(false);
      await fetchAllAdminLookups();
      await fetchLookups();
    } catch (err: any) {
      showToast(err.message || 'Failed to save lookup record.', 'error');
      throw err;
    } finally {
      setSavingModal(false);
    }
  };

  // --- FILTERED & SORTED RESULTS ---
  const filteredApps = applications
    .filter(app => {
      const matchesSearch = 
        app.applicants?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.applicants?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.application_no?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'All' || 
        app.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aVal: any = '';
      let bVal: any = '';

      if (sortField === 'application_no') {
        aVal = a.application_no || '';
        bVal = b.application_no || '';
      } else if (sortField === 'name') {
        aVal = a.applicants?.name || '';
        bVal = b.applicants?.name || '';
      } else if (sortField === 'email') {
        aVal = a.applicants?.email || '';
        bVal = b.applicants?.email || '';
      } else if (sortField === 'exam_date') {
        aVal = a.exam_date || '';
        bVal = b.exam_date || '';
      } else if (sortField === 'status') {
        aVal = a.status || '';
        bVal = b.status || '';
      }

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      // Alphanumeric natural sort (e.g. APP-9 before APP-10)
      if (sortField === 'application_no') {
        return sortOrder === 'asc'
          ? aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: 'base' })
          : bVal.localeCompare(aVal, undefined, { numeric: true, sensitivity: 'base' });
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  return {
    isAuthenticated,
    password,
    setPassword,
    authError,
    handleLogin,
    handleLogout,
    applications,
    loading,
    error,
    schools,
    agencies,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    selectedApp,
    setSelectedApp,
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
    savingEdit,
    handleUpdateApplication,
    handleDeleteApplicant,
    handleViewDetails,
    showCreateModal,
    setShowCreateModal,
    showEditModal,
    setShowEditModal,
    activeTab,
    setActiveTab,
    formValues,
    handleFormChange,
    handleDisabilityChange,
    newProof,
    setNewProof,
    addProof,
    removeProof,
    proofs,
    savingModal,
    actionError,
    handleSaveFullEdit,
    handleSaveManualCreate,
    filteredApps,
    handleOpenCreateModal,
    handleOpenEditModal,
    fetchApplications,
    toast,
    setToast,
    showToast,
    sortField,
    sortOrder,
    handleSort,
    activeView,
    setActiveView,
    adminSchools,
    adminAgencies,
    adminDisabilities,
    adminEligibilities,
    loadingLookupsData,
    fetchAllAdminLookups,
    handleApproveLookup,
    handleDeleteLookup,
    showLookupModal,
    setShowLookupModal,
    lookupModalConfig,
    handleOpenLookupCreate,
    handleOpenLookupEdit,
    handleSaveLookup,
    customDisability,
    setCustomDisability,
    showCustomDisability,
    setShowCustomDisability,
    disabilityLookups,
    eligibilityLookups,
    handleRefresh
  };
}

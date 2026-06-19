'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';

// Initialize server-side Supabase client using service role key to bypass RLS, with anon key fallback for local verification
const getServiceClient = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const keyToUse = serviceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!keyToUse) {
    throw new Error('Neither SUPABASE_SERVICE_ROLE_KEY nor NEXT_PUBLIC_SUPABASE_ANON_KEY is available.');
  }
  return createClient(supabaseUrl, keyToUse, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
};


// Authentication check helper
const checkAuth = (password: string) => {
  const envPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
  if (password !== envPassword) {
    throw new Error('Unauthorized: Incorrect administrator password.');
  }
};

// ID Generators
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

/**
 * Fetch all applications (joined with applicants, education, employment)
 */
export async function adminFetchApplications(password: string) {
  checkAuth(password);
  const supabase = getServiceClient();

  const { data, error } = await supabase
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

  if (error) {
    console.error('Server Action Error: Fetching applications failed', error);
    throw new Error(error.message);
  }

  return data;
}

/**
 * Fetch complete application details (disabilities & eligibility proofs)
 */
export async function adminFetchApplicationDetail(password: string, applicantId: string) {
  checkAuth(password);
  const supabase = getServiceClient();

  const { data: educationData, error: eduErr } = await supabase
    .from('applicants')
    .select(`
      educational_record_id,
      education_records:educational_record_id (
        *,
        schools:school_code (*)
      )
    `)
    .eq('applicant_id', applicantId)
    .single();

  const { data: employmentData, error: empErr } = await supabase
    .from('applicants')
    .select(`
      employment_record_id,
      employment_records:employment_record_id (
        *,
        agencies:agency_code (*)
      )
    `)
    .eq('applicant_id', applicantId)
    .single();

  const { data: disabilities, error: disErr } = await supabase
    .from('disabilities')
    .select('*')
    .eq('applicant_id', applicantId);

  const { data: eligibilityProofs, error: eligErr } = await supabase
    .from('eligibility_proofs')
    .select('*')
    .eq('applicant_id', applicantId);

  if (eduErr) throw new Error('Failed to fetch education details: ' + eduErr.message);
  if (empErr) throw new Error('Failed to fetch employment details: ' + empErr.message);
  if (disErr) throw new Error('Failed to fetch disabilities: ' + disErr.message);
  if (eligErr) throw new Error('Failed to fetch eligibility proofs: ' + eligErr.message);

  return {
    education: (educationData as any)?.education_records || null,
    employment: (employmentData as any)?.employment_records || null,
    disabilities: disabilities || [],
    eligibilityProofs: eligibilityProofs || []
  };
}

/**
 * Update an existing application and all associated records (full edit)
 */
export async function adminUpdateApplication(password: string, payload: {
  application_no: string;
  applicant_id: string;
  educational_record_id: string;
  employment_record_id: string | null;
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
    telephone_number: string | null;
    email: string;
    civil_status: string;
    priority_group: string | null;
    employment_status: string;
  };
  education: {
    highest_education: string;
    completion: string;
    highest_level: string | null;
    graduation_date: string | null;
    honors_received: string | null;
    program_title: string;
    major: string;
    inclusive_years: string;
    school_code: string;
  };
  employment: {
    job_title: string;
    years_in_agency: number;
    appointment_status: string;
    agency_code: string;
  } | null;
  disabilities: {
    visual: boolean;
    hearing: boolean;
    orthopedic: boolean;
  };
  eligibilityProofs: Array<{
    title: string;
    rating: string;
    dateGranted: string;
    placeTaken: string;
  }>;
}) {
  checkAuth(password);
  const supabase = getServiceClient();

  const {
    application_no,
    applicant_id,
    educational_record_id,
    employment_record_id,
    application,
    personal,
    education,
    employment,
    disabilities,
    eligibilityProofs
  } = payload;

  // 1. Update Application table
  const { data: appData, error: appErr } = await supabase
    .from('applications')
    .update({
      status: application.status,
      exam_date: application.exam_date,
      exam_place: application.exam_place,
      csr_regional_office: application.csr_regional_office,
      exam_applied_for: application.exam_applied_for
    })
    .eq('application_no', application_no)
    .select();
  if (appErr) throw new Error('Failed to update application details: ' + appErr.message);
  if (!appData || appData.length === 0) {
    throw new Error('Failed to update application details: No rows updated. This may be due to Row Level Security (RLS) restrictions (missing service role key) or an invalid reference number.');
  }

  // 2. Update Education Record
  const { data: eduData, error: eduErr } = await supabase
    .from('education_records')
    .update({
      highest_education: education.highest_education,
      completion: education.completion,
      highest_level: (education.highest_level && education.highest_level.trim() !== '') ? education.highest_level : null,
      graduation_date: (education.graduation_date && education.graduation_date.trim() !== '') ? education.graduation_date : null,
      honors_received: (education.honors_received && education.honors_received.trim() !== '') ? education.honors_received : null,
      program_title: education.program_title,
      major: education.major,
      inclusive_years: education.inclusive_years,
      school_code: education.school_code
    })
    .eq('educational_record_id', educational_record_id)
    .select();
  if (eduErr) throw new Error('Failed to update education details: ' + eduErr.message);
  if (!eduData || eduData.length === 0) {
    throw new Error('Failed to update education details: No rows updated. This may be due to Row Level Security (RLS) restrictions or an invalid record ID.');
  }

  // 3. Handle Employment Record updates
  let finalEmpRecordId = employment_record_id;

  if (personal.employment_status === 'Employed' && employment) {
    if (employment_record_id) {
      // Update existing
      const { data: empData, error: empErr } = await supabase
        .from('employment_records')
        .update({
          job_title: employment.job_title,
          years_in_agency: employment.years_in_agency,
          appointment_status: employment.appointment_status,
          agency_code: employment.agency_code
        })
        .eq('employment_record_id', employment_record_id)
        .select();
      if (empErr) throw new Error('Failed to update employment details: ' + empErr.message);
      if (!empData || empData.length === 0) {
        throw new Error('Failed to update employment details: No rows updated. This may be due to Row Level Security (RLS) restrictions or an invalid record ID.');
      }
    } else {
      // Create new employment record
      const newEmpId = `EMP-${generateNumericId(5)}`;
      const { error: empErr } = await supabase
        .from('employment_records')
        .insert({
          employment_record_id: newEmpId,
          job_title: employment.job_title,
          years_in_agency: employment.years_in_agency,
          appointment_status: employment.appointment_status,
          agency_code: employment.agency_code
        });
      if (empErr) throw new Error('Failed to create employment details: ' + empErr.message);
      finalEmpRecordId = newEmpId;
    }
  } else {
    // If not employed, delete old employment record if existed
    if (employment_record_id) {
      // Need to set FK to null on applicant first, so we do it in step 4 then clean up
      finalEmpRecordId = null;
    }
  }

  // 4. Update Applicant details
  const { data: applicantData, error: applicantErr } = await supabase
    .from('applicants')
    .update({
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
      employment_record_id: finalEmpRecordId
    })
    .eq('applicant_id', applicant_id)
    .select();
  if (applicantErr) throw new Error('Failed to update applicant details: ' + applicantErr.message);
  if (!applicantData || applicantData.length === 0) {
    throw new Error('Failed to update applicant details: No rows updated. This may be due to Row Level Security (RLS) restrictions or an invalid applicant ID.');
  }


  // Clean up orphan employment record if status changed from Employed to Unemployed
  if (personal.employment_status !== 'Employed' && employment_record_id) {
    const { error: cleanEmpErr } = await supabase
      .from('employment_records')
      .delete()
      .eq('employment_record_id', employment_record_id);
    if (cleanEmpErr) console.warn('Orphan employment record cleanup warning:', cleanEmpErr.message);
  }

  // 5. Update Disabilities (Delete all and re-insert)
  const { error: delDisErr } = await supabase
    .from('disabilities')
    .delete()
    .eq('applicant_id', applicant_id);
  if (delDisErr) throw new Error('Failed to clean up old disabilities: ' + delDisErr.message);

  const disabilityRecords = [];
  if (disabilities.visual) disabilityRecords.push({ disability_id: `DIS-${generateNumericId(5)}`, disability: 'Visual Impairment', applicant_id: applicant_id });
  if (disabilities.hearing) disabilityRecords.push({ disability_id: `DIS-${generateNumericId(5)}`, disability: 'Hearing Impairment', applicant_id: applicant_id });
  if (disabilities.orthopedic) disabilityRecords.push({ disability_id: `DIS-${generateNumericId(5)}`, disability: 'Orthopedic', applicant_id: applicant_id });

  if (disabilityRecords.length > 0) {
    const { error: insDisErr } = await supabase
      .from('disabilities')
      .insert(disabilityRecords);
    if (insDisErr) throw new Error('Failed to save updated disabilities: ' + insDisErr.message);
  }

  // 6. Update Eligibility Proofs (Delete all and re-insert)
  const { error: delEligErr } = await supabase
    .from('eligibility_proofs')
    .delete()
    .eq('applicant_id', applicant_id);
  if (delEligErr) throw new Error('Failed to clean up old eligibility proofs: ' + delEligErr.message);

  if (eligibilityProofs.length > 0) {
    const proofRecords = eligibilityProofs.map(proof => ({
      eligibility_proof_id: `ELIG-${generateNumericId(5)}`,
      eligibility_proof_title: proof.title,
      rating_obtained: proof.rating,
      date_granted: proof.dateGranted,
      eligibility_place_taken: proof.placeTaken,
      applicant_id: applicant_id
    }));

    const { error: insEligErr } = await supabase
      .from('eligibility_proofs')
      .insert(proofRecords);
    if (insEligErr) throw new Error('Failed to save updated eligibility proofs: ' + insEligErr.message);
  }

  return { success: true };
}

/**
 * Delete an applicant and cascade delete related application/education/employment files
 */
export async function adminDeleteApplicant(
  password: string,
  applicantId: string,
  educationalRecordId: string,
  employmentRecordId: string | null
) {
  checkAuth(password);
  const supabase = getServiceClient();

  // Due to RESTRICT constraints on foreign keys:
  // 1. Delete associated applicants dependent tables (applications, disabilities, eligibility proofs)
  const { error: delDisErr } = await supabase.from('disabilities').delete().eq('applicant_id', applicantId);
  if (delDisErr) throw new Error('Failed to delete disabilities: ' + delDisErr.message);

  const { error: delEligErr } = await supabase.from('eligibility_proofs').delete().eq('applicant_id', applicantId);
  if (delEligErr) throw new Error('Failed to delete eligibility proofs: ' + delEligErr.message);

  const { error: delAppErr } = await supabase.from('applications').delete().eq('applicant_id', applicantId);
  if (delAppErr) throw new Error('Failed to delete applications: ' + delAppErr.message);

  // 2. Delete applicant (breaks the RESTRICT foreign key block on education/employment records)
  const { error: delApplicantErr } = await supabase.from('applicants').delete().eq('applicant_id', applicantId);
  if (delApplicantErr) throw new Error('Failed to delete applicant profile: ' + delApplicantErr.message);

  // 3. Delete education record
  const { error: delEduErr } = await supabase.from('education_records').delete().eq('educational_record_id', educationalRecordId);
  if (delEduErr) throw new Error('Failed to delete education record: ' + delEduErr.message);

  // 4. Delete employment record if applicable
  if (employmentRecordId) {
    const { error: delEmpErr } = await supabase.from('employment_records').delete().eq('employment_record_id', employmentRecordId);
    if (delEmpErr) throw new Error('Failed to delete employment record: ' + delEmpErr.message);
  }

  return { success: true };
}

/**
 * Manually add a new application directly from the Admin console (by-passing public form)
 */
export async function adminAddApplication(password: string, payload: {
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
    telephone_number: string | null;
    email: string;
    civil_status: string;
    priority_group: string | null;
    employment_status: string;
  };
  education: {
    highest_education: string;
    completion: string;
    highest_level: string | null;
    graduation_date: string | null;
    honors_received: string | null;
    program_title: string;
    major: string;
    inclusive_years: string;
    school_code: string;
  };
  employment: {
    job_title: string;
    years_in_agency: number;
    appointment_status: string;
    agency_code: string;
  } | null;
  disabilities: {
    visual: boolean;
    hearing: boolean;
    orthopedic: boolean;
  };
  eligibilityProofs: Array<{
    title: string;
    rating: string;
    dateGranted: string;
    placeTaken: string;
  }>;
}) {
  checkAuth(password);
  const supabase = getServiceClient();

  const {
    application,
    personal,
    education,
    employment,
    disabilities,
    eligibilityProofs
  } = payload;

  const formsDate = new Date().toISOString().split('T')[0];

  // 1. DUPLICATE CHECK: Same date same email check
  const { data: existingApplicants, error: queryErr } = await supabase
    .from('applicants')
    .select('applicant_id')
    .eq('email', personal.email);

  if (queryErr) throw new Error('Database lookup error: ' + queryErr.message);

  if (existingApplicants && existingApplicants.length > 0) {
    const applicantIds = existingApplicants.map(a => a.applicant_id);

    const { data: existingApps, error: appQueryErr } = await supabase
      .from('applications')
      .select('forms_date, exam_date')
      .in('applicant_id', applicantIds);

    if (appQueryErr) throw new Error('Database application validation check failed: ' + appQueryErr.message);

    if (existingApps && existingApps.length > 0) {
      const hasSameDayApply = existingApps.some(app => app.forms_date === formsDate);
      if (hasSameDayApply) {
        throw new Error(`Duplicate Blocked: An application has already been filed today under this email (${personal.email}).`);
      }
    }
  }

  // 2. Generate and Insert entities
  const eduRecordId = generateNumericId(12);
  const empRecordId = personal.employment_status === 'Employed' ? `EMP-${generateNumericId(5)}` : null;
  const applicantId = `APP-${generateAlphaNumericId(8)}`;
  const applicationNo = `APPNO-${generateNumericId(5)}`;

  // Step A: Insert Education
  const { error: eduErr } = await supabase
    .from('education_records')
    .insert({
      educational_record_id: eduRecordId,
      highest_education: education.highest_education,
      completion: education.completion,
      highest_level: (education.highest_level && education.highest_level.trim() !== '') ? education.highest_level : null,
      graduation_date: (education.graduation_date && education.graduation_date.trim() !== '') ? education.graduation_date : null,
      honors_received: (education.honors_received && education.honors_received.trim() !== '') ? education.honors_received : null,
      program_title: education.program_title,
      major: education.major,
      inclusive_years: education.inclusive_years,
      school_code: education.school_code
    });
  if (eduErr) throw new Error('Failed to create education record: ' + eduErr.message);

  // Step B: Insert Employment
  if (personal.employment_status === 'Employed' && empRecordId && employment) {
    const { error: empErr } = await supabase
      .from('employment_records')
      .insert({
        employment_record_id: empRecordId,
        job_title: employment.job_title,
        years_in_agency: employment.years_in_agency,
        appointment_status: employment.appointment_status,
        agency_code: employment.agency_code
      });
    if (empErr) throw new Error('Failed to create employment record: ' + empErr.message);
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
  if (applicantErr) throw new Error('Failed to create applicant record: ' + applicantErr.message);

  // Step D: Insert Application
  const { error: appErr } = await supabase
    .from('applications')
    .insert({
      application_no: applicationNo,
      forms_date: formsDate,
      exam_applied_for: application.exam_applied_for || 'Career Service-Professional',
      last_exam_date: null,
      csr_regional_office: application.csr_regional_office,
      exam_date: application.exam_date,
      exam_place: application.exam_place,
      applicant_id: applicantId,
      status: application.status
    });
  if (appErr) throw new Error('Failed to create application entry: ' + appErr.message);

  // Step E: Insert Disabilities
  const disabilityRecords = [];
  if (disabilities.visual) disabilityRecords.push({ disability_id: `DIS-${generateNumericId(5)}`, disability: 'Visual Impairment', applicant_id: applicantId });
  if (disabilities.hearing) disabilityRecords.push({ disability_id: `DIS-${generateNumericId(5)}`, disability: 'Hearing Impairment', applicant_id: applicantId });
  if (disabilities.orthopedic) disabilityRecords.push({ disability_id: `DIS-${generateNumericId(5)}`, disability: 'Orthopedic', applicant_id: applicantId });

  if (disabilityRecords.length > 0) {
    const { error: disErr } = await supabase.from('disabilities').insert(disabilityRecords);
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

    const { error: eligErr } = await supabase.from('eligibility_proofs').insert(proofRecords);
    if (eligErr) throw new Error('Failed to record eligibility proofs: ' + eligErr.message);
  }

  return { success: true, applicantId, applicationNo };
}

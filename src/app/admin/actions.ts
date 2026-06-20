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
  } | null;
  disabilities: string[];
  eligibilityProofs: Array<{
    title: string;
    rating: string;
    dateGranted: string;
    placeTaken: string;
    isCustom?: boolean;
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

  // 2. Handle Custom School Insert if school_code === 'OTHER'
  let targetSchoolCode = education.school_code;
  if (education.school_code === 'OTHER') {
    targetSchoolCode = `SCH-${generateAlphaNumericId(5)}`;
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

  // Update Education Record
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
      school_code: targetSchoolCode
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
    let targetAgencyCode = employment.agency_code;
    if (employment.agency_code === 'OTHER') {
      targetAgencyCode = `AGE-${generateAlphaNumericId(5)}`;
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

    if (employment_record_id) {
      // Update existing
      const { data: empData, error: empErr } = await supabase
        .from('employment_records')
        .update({
          job_title: employment.job_title,
          years_in_agency: employment.years_in_agency,
          appointment_status: employment.appointment_status,
          agency_code: targetAgencyCode
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
          agency_code: targetAgencyCode
        });
      if (empErr) throw new Error('Failed to create employment details: ' + empErr.message);
      finalEmpRecordId = newEmpId;
    }
  } else {
    // If not employed, delete old employment record if existed
    if (employment_record_id) {
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
  for (const disName of disabilities) {
    const { data: existingDis } = await supabase
      .from('disability_lookups')
      .select('disability_code')
      .eq('disability_name', disName);

    if (!existingDis || existingDis.length === 0) {
      const customCode = `DIS-${generateAlphaNumericId(5)}`;
      await supabase.from('disability_lookups').insert({
        disability_code: customCode,
        disability_name: disName,
        is_registered: false
      });
    }

    disabilityRecords.push({ 
      disability_id: `DIS-${generateNumericId(5)}`, 
      disability: disName, 
      applicant_id: applicant_id 
    });
  }

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
    for (const proof of eligibilityProofs) {
      if (proof.isCustom) {
        const { data: existingElg } = await supabase
          .from('eligibility_lookups')
          .select('eligibility_code')
          .eq('eligibility_name', proof.title);

        if (!existingElg || existingElg.length === 0) {
          const customCode = `ELG-${generateAlphaNumericId(5)}`;
          await supabase.from('eligibility_lookups').insert({
            eligibility_code: customCode,
            eligibility_name: proof.title,
            is_registered: false
          });
        }
      }
    }

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
  } | null;
  disabilities: string[];
  eligibilityProofs: Array<{
    title: string;
    rating: string;
    dateGranted: string;
    placeTaken: string;
    isCustom?: boolean;
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

  // Step A: Insert Education (Handle custom school write-in)
  let targetSchoolCode = education.school_code;
  if (education.school_code === 'OTHER') {
    targetSchoolCode = `SCH-${generateAlphaNumericId(5)}`;
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
      highest_level: (education.highest_level && education.highest_level.trim() !== '') ? education.highest_level : null,
      graduation_date: (education.graduation_date && education.graduation_date.trim() !== '') ? education.graduation_date : null,
      honors_received: (education.honors_received && education.honors_received.trim() !== '') ? education.honors_received : null,
      program_title: education.program_title,
      major: education.major,
      inclusive_years: education.inclusive_years,
      school_code: targetSchoolCode
    });
  if (eduErr) throw new Error('Failed to create education record: ' + eduErr.message);

  // Step B: Insert Employment (Handle custom agency write-in)
  if (personal.employment_status === 'Employed' && empRecordId && employment) {
    let targetAgencyCode = employment.agency_code;
    if (employment.agency_code === 'OTHER') {
      targetAgencyCode = `AGE-${generateAlphaNumericId(5)}`;
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

  // Step E: Insert Disabilities (Handle custom disability write-ins)
  const disabilityRecords = [];
  for (const disName of disabilities) {
    const { data: existingDis } = await supabase
      .from('disability_lookups')
      .select('disability_code')
      .eq('disability_name', disName);

    if (!existingDis || existingDis.length === 0) {
      const customCode = `DIS-${generateAlphaNumericId(5)}`;
      await supabase.from('disability_lookups').insert({
        disability_code: customCode,
        disability_name: disName,
        is_registered: false
      });
    }

    disabilityRecords.push({ 
      disability_id: `DIS-${generateNumericId(5)}`, 
      disability: disName, 
      applicant_id: applicantId 
    });
  }

  if (disabilityRecords.length > 0) {
    const { error: disErr } = await supabase.from('disabilities').insert(disabilityRecords);
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
          const customCode = `ELG-${generateAlphaNumericId(5)}`;
          await supabase.from('eligibility_lookups').insert({
            eligibility_code: customCode,
            eligibility_name: proof.title,
            is_registered: false
          });
        }
      }
    }

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

/**
 * Fetch lookup table records (schools, agencies, disability_lookups, eligibility_lookups)
 */
export async function adminFetchLookups(password: string, type: 'schools' | 'agencies' | 'disabilities' | 'eligibilities') {
  checkAuth(password);
  const supabase = getServiceClient();

  let table = '';
  if (type === 'schools') table = 'schools';
  else if (type === 'agencies') table = 'agencies';
  else if (type === 'disabilities') table = 'disability_lookups';
  else if (type === 'eligibilities') table = 'eligibility_lookups';

  const { data, error } = await supabase
    .from(table)
    .select('*');

  if (error) {
    console.error(`Failed to fetch lookups from ${table}:`, error);
    throw new Error(error.message);
  }

  return data;
}

/**
 * Approve an unregistered lookup entry (set is_registered to true)
 */
export async function adminApproveLookup(
  password: string, 
  type: 'schools' | 'agencies' | 'disabilities' | 'eligibilities', 
  code: string
) {
  checkAuth(password);
  const supabase = getServiceClient();

  let table = '';
  let idCol = '';
  if (type === 'schools') {
    table = 'schools';
    idCol = 'school_code';
  } else if (type === 'agencies') {
    table = 'agencies';
    idCol = 'agency_code';
  } else if (type === 'disabilities') {
    table = 'disability_lookups';
    idCol = 'disability_code';
  } else if (type === 'eligibilities') {
    table = 'eligibility_lookups';
    idCol = 'eligibility_code';
  }

  const { data, error } = await supabase
    .from(table)
    .update({ is_registered: true })
    .eq(idCol, code)
    .select();

  if (error) {
    console.error(`Failed to approve lookup in ${table}:`, error);
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error(`Record with code ${code} not found or RLS mismatch.`);
  }

  return { success: true };
}

/**
 * Update a lookup record
 */
export async function adminUpdateLookup(
  password: string, 
  type: 'schools' | 'agencies' | 'disabilities' | 'eligibilities', 
  code: string, 
  payload: any
) {
  checkAuth(password);
  const supabase = getServiceClient();

  let table = '';
  let idCol = '';
  const updateData: any = {};

  if (type === 'schools') {
    table = 'schools';
    idCol = 'school_code';
    updateData.school_name = payload.school_name;
    updateData.school_address = payload.school_address;
    if (payload.is_registered !== undefined) updateData.is_registered = payload.is_registered;
  } else if (type === 'agencies') {
    table = 'agencies';
    idCol = 'agency_code';
    updateData.agency_name = payload.agency_name;
    updateData.agency_address = payload.agency_address;
    if (payload.is_registered !== undefined) updateData.is_registered = payload.is_registered;
  } else if (type === 'disabilities') {
    table = 'disability_lookups';
    idCol = 'disability_code';
    updateData.disability_name = payload.disability_name;
    if (payload.is_registered !== undefined) updateData.is_registered = payload.is_registered;
  } else if (type === 'eligibilities') {
    table = 'eligibility_lookups';
    idCol = 'eligibility_code';
    updateData.eligibility_name = payload.eligibility_name;
    if (payload.is_registered !== undefined) updateData.is_registered = payload.is_registered;
  }

  const { data, error } = await supabase
    .from(table)
    .update(updateData)
    .eq(idCol, code)
    .select();

  if (error) {
    console.error(`Failed to update lookup in ${table}:`, error);
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error(`Record with code ${code} not found or RLS mismatch.`);
  }

  return { success: true };
}

/**
 * Delete a lookup record
 */
export async function adminDeleteLookup(
  password: string, 
  type: 'schools' | 'agencies' | 'disabilities' | 'eligibilities', 
  code: string
) {
  checkAuth(password);
  const supabase = getServiceClient();

  let table = '';
  let idCol = '';
  if (type === 'schools') {
    table = 'schools';
    idCol = 'school_code';
  } else if (type === 'agencies') {
    table = 'agencies';
    idCol = 'agency_code';
  } else if (type === 'disabilities') {
    table = 'disability_lookups';
    idCol = 'disability_code';
  } else if (type === 'eligibilities') {
    table = 'eligibility_lookups';
    idCol = 'eligibility_code';
  }

  // Reference checks before deletion
  if (type === 'schools') {
    const { count, error: countErr } = await supabase
      .from('education_records')
      .select('*', { count: 'exact', head: true })
      .eq('school_code', code);
    if (countErr) throw new Error(countErr.message);
    if (count && count > 0) {
      throw new Error(`Cannot delete this school: It is currently referenced by ${count} education records. Please re-assign those records first.`);
    }
  } else if (type === 'agencies') {
    const { count, error: countErr } = await supabase
      .from('employment_records')
      .select('*', { count: 'exact', head: true })
      .eq('agency_code', code);
    if (countErr) throw new Error(countErr.message);
    if (count && count > 0) {
      throw new Error(`Cannot delete this agency: It is currently referenced by ${count} employment records. Please re-assign those records first.`);
    }
  }

  const { data, error } = await supabase
    .from(table)
    .delete()
    .eq(idCol, code)
    .select();

  if (error) {
    console.error(`Failed to delete lookup from ${table}:`, error);
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error(`Record with code ${code} not found or RLS mismatch.`);
  }

  return { success: true };
}

/**
 * Add a new lookup record (admin creates a standard one)
 */
export async function adminAddLookup(
  password: string, 
  type: 'schools' | 'agencies' | 'disabilities' | 'eligibilities', 
  payload: any
) {
  checkAuth(password);
  const supabase = getServiceClient();

  let table = '';
  const insertData: any = {};

  if (type === 'schools') {
    table = 'schools';
    insertData.school_code = `SCH-${generateAlphaNumericId(5)}`;
    insertData.school_name = payload.school_name;
    insertData.school_address = payload.school_address;
    insertData.is_registered = true;
  } else if (type === 'agencies') {
    table = 'agencies';
    insertData.agency_code = `AGE-${generateAlphaNumericId(5)}`;
    insertData.agency_name = payload.agency_name;
    insertData.agency_address = payload.agency_address;
    insertData.is_registered = true;
  } else if (type === 'disabilities') {
    table = 'disability_lookups';
    insertData.disability_code = `DIS-${generateAlphaNumericId(5)}`;
    insertData.disability_name = payload.disability_name;
    insertData.is_registered = true;
  } else if (type === 'eligibilities') {
    table = 'eligibility_lookups';
    insertData.eligibility_code = `ELG-${generateAlphaNumericId(5)}`;
    insertData.eligibility_name = payload.eligibility_name;
    insertData.is_registered = true;
  }

  const { data, error } = await supabase
    .from(table)
    .insert(insertData)
    .select();

  if (error) {
    console.error(`Failed to add lookup to ${table}:`, error);
    throw new Error(error.message);
  }

  const generatedCode = data[0].school_code || data[0].agency_code || data[0].disability_code || data[0].eligibility_code;
  return { success: true, code: generatedCode };
}

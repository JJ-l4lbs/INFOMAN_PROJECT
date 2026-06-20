'use server';

import { 
  getServiceClient, 
  checkAuth, 
  resolveSchoolCode,
  resolveAgencyCode,
  ensureEligibilityLookup,
  getNextEducationalRecordId,
  getNextEmploymentRecordId,
  generateApplicantId,
  getNextApplicationNo,
  getNextDisabilityIdStart,
  getNextEligibilityProofIdStart
} from './utils';

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
    last_exam_date?: string;
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
    throw new Error('Failed to update application details: No rows updated. This may be due to Row Level Security (RLS) restrictions or an invalid reference number.');
  }

  // 2. Handle Custom School Insert
  const targetSchoolCode = await resolveSchoolCode(
    supabase,
    education.school_code,
    education.customSchoolName,
    education.customSchoolAddress
  );

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
    throw new Error('Failed to update education details: No rows updated.');
  }

  // 3. Handle Employment Record updates
  let finalEmpRecordId = employment_record_id;

  if (personal.employment_status === 'Employed' && employment) {
    const targetAgencyCode = await resolveAgencyCode(
      supabase,
      employment.agency_code,
      employment.customAgencyName,
      employment.customAgencyAddress
    );

    if (employment_record_id) {
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
        throw new Error('Failed to update employment details: No rows updated.');
      }
    } else {
      // Create new employment record
      finalEmpRecordId = await getNextEmploymentRecordId(supabase);
      const { error: newEmpErr } = await supabase
        .from('employment_records')
        .insert({
          employment_record_id: finalEmpRecordId,
          job_title: employment.job_title,
          years_in_agency: employment.years_in_agency,
          appointment_status: employment.appointment_status,
          agency_code: targetAgencyCode
        });
      if (newEmpErr) throw new Error('Failed to create new employment record: ' + newEmpErr.message);
    }
  } else if (personal.employment_status === 'Unemployed' && employment_record_id) {
    finalEmpRecordId = null;
  }

  // 4. Update Applicant Profile details
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
      telephone_number: (personal.telephone_number && personal.telephone_number.trim() !== '') ? personal.telephone_number : null,
      email: personal.email,
      civil_status: personal.civil_status,
      priority_group: (personal.priority_group && personal.priority_group.trim() !== '') ? personal.priority_group : null,
      employment_status: personal.employment_status,
      employment_record_id: finalEmpRecordId
    })
    .eq('applicant_id', applicant_id)
    .select();
  if (applicantErr) throw new Error('Failed to update applicant details: ' + applicantErr.message);
  if (!applicantData || applicantData.length === 0) {
    throw new Error('Failed to update applicant details: No rows updated.');
  }

  // 5. Clean up old employment records if they were unlinked
  if (personal.employment_status === 'Unemployed' && employment_record_id) {
    const { error: delEmpErr } = await supabase
      .from('employment_records')
      .delete()
      .eq('employment_record_id', employment_record_id);
    if (delEmpErr) throw new Error('Failed to clean up unlinked employment record: ' + delEmpErr.message);
  }

  // 6. Update Disabilities (deleting old associations and inserting new ones)
  const { error: delDisErr } = await supabase
    .from('disabilities')
    .delete()
    .eq('applicant_id', applicant_id);
  if (delDisErr) throw new Error('Failed to clear previous disabilities: ' + delDisErr.message);

  if (disabilities && disabilities.length > 0) {
    let disNum = await getNextDisabilityIdStart(supabase);
    const disRecords = disabilities.map(disName => ({
      disability_id: `DIS-${String(disNum++).padStart(4, '0')}`,
      disability: disName,
      applicant_id: applicant_id
    }));

    const { error: insDisErr } = await supabase
      .from('disabilities')
      .insert(disRecords);
    if (insDisErr) throw new Error('Failed to save updated disabilities: ' + insDisErr.message);
  }

  // 7. Update Eligibility Proofs
  const { data: currentProofs, error: fetchEligErr } = await supabase
    .from('eligibility_proofs')
    .select('eligibility_proof_id, eligibility_proof_title')
    .eq('applicant_id', applicant_id);
  if (fetchEligErr) throw new Error('Failed to query current eligibility proofs: ' + fetchEligErr.message);

  const payloadTitles = eligibilityProofs.map(p => p.title);
  const proofsToDelete = currentProofs?.filter(p => !payloadTitles.includes(p.eligibility_proof_title)) || [];

  if (proofsToDelete.length > 0) {
    const idsToDelete = proofsToDelete.map(p => p.eligibility_proof_id);
    const { error: delEligErr } = await supabase
      .from('eligibility_proofs')
      .delete()
      .in('eligibility_proof_id', idsToDelete);
    if (delEligErr) throw new Error('Failed to delete obsolete eligibility proofs: ' + delEligErr.message);
  }

  const newProofs = eligibilityProofs.filter(p => {
    return !(currentProofs?.some(curr => curr.eligibility_proof_title === p.title));
  });

  if (newProofs.length > 0) {
    for (const proof of newProofs) {
      if (proof.isCustom) {
        await ensureEligibilityLookup(supabase, proof.title);
      }
    }

    let eligNum = await getNextEligibilityProofIdStart(supabase);
    const proofRecords = newProofs.map(proof => ({
      eligibility_proof_id: `EP-${String(eligNum++).padStart(4, '0')}`,
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

  const { error: delDisErr } = await supabase.from('disabilities').delete().eq('applicant_id', applicantId);
  if (delDisErr) throw new Error('Failed to delete disabilities: ' + delDisErr.message);

  const { error: delEligErr } = await supabase.from('eligibility_proofs').delete().eq('applicant_id', applicantId);
  if (delEligErr) throw new Error('Failed to delete eligibility proofs: ' + delEligErr.message);

  const { error: delAppErr } = await supabase.from('applications').delete().eq('applicant_id', applicantId);
  if (delAppErr) throw new Error('Failed to delete applications: ' + delAppErr.message);

  const { error: delApplicantErr } = await supabase.from('applicants').delete().eq('applicant_id', applicantId);
  if (delApplicantErr) throw new Error('Failed to delete applicant profile: ' + delApplicantErr.message);

  const { error: delEduErr } = await supabase.from('education_records').delete().eq('educational_record_id', educationalRecordId);
  if (delEduErr) throw new Error('Failed to delete education record: ' + delEduErr.message);

  if (employmentRecordId) {
    const { error: delEmpErr } = await supabase.from('employment_records').delete().eq('employment_record_id', employmentRecordId);
    if (delEmpErr) throw new Error('Failed to delete employment record: ' + delEmpErr.message);
  }

  return { success: true };
}

/**
 * Manually add a new application directly from the Admin console
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
    last_exam_date?: string;
    is_retaker?: boolean;
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

  // 1. DUPLICATE CHECK & RETAKER RE-LINKING
  let applicantId = '';
  let eduRecordId = '';
  let empRecordId: string | null = null;
  let isNewApplicant = true;
  let oldEmpRecordId: string | null = null;

  if (personal.is_retaker) {
    const matchedApplicant = await findMatchingApplicant(supabase, personal.name, personal.birthdate, personal.email);
    if (matchedApplicant) {
      applicantId = matchedApplicant.applicant_id;
      eduRecordId = matchedApplicant.educational_record_id;
      empRecordId = matchedApplicant.employment_record_id;
      isNewApplicant = false;

      // Duplicate check for the matched applicant
      const { data: existingApps, error: appQueryErr } = await supabase
        .from('applications')
        .select('forms_date')
        .eq('applicant_id', applicantId);

      if (appQueryErr) throw new Error('Database application validation check failed: ' + appQueryErr.message);

      if (existingApps && existingApps.some(app => app.forms_date === formsDate)) {
        throw new Error(`Duplicate Blocked: An application has already been filed today under this email (${personal.email}).`);
      }
    }
  }

  // Double submission check for new applicants / safety check by email
  if (isNewApplicant) {
    const { data: emailMatches, error: emailMatchErr } = await supabase
      .from('applicants')
      .select('applicant_id')
      .eq('email', personal.email);

    if (emailMatchErr) throw new Error('Database lookup error: ' + emailMatchErr.message);

    if (emailMatches && emailMatches.length > 0) {
      const emailIds = emailMatches.map(a => a.applicant_id);
      const { data: existingApps, error: appQueryErr } = await supabase
        .from('applications')
        .select('forms_date')
        .in('applicant_id', emailIds);

      if (appQueryErr) throw new Error('Database application validation check failed: ' + appQueryErr.message);

      if (existingApps && existingApps.some(app => app.forms_date === formsDate)) {
        throw new Error(`Duplicate Blocked: An application has already been filed today under this email (${personal.email}).`);
      }
    }
  }

  if (isNewApplicant) {
    // 2. Fetch and generate keys
    eduRecordId = await getNextEducationalRecordId(supabase);
    if (personal.employment_status === 'Employed') {
      empRecordId = await getNextEmploymentRecordId(supabase);
    }
    applicantId = generateApplicantId(personal.name);
  }

  const applicationNo = await getNextApplicationNo(supabase);

  // Step A: Insert or Update Education
  const targetSchoolCode = await resolveSchoolCode(
    supabase,
    education.school_code,
    education.customSchoolName,
    education.customSchoolAddress
  );

  const eduPayload = {
    highest_education: education.highest_education,
    completion: education.completion,
    highest_level: (education.highest_level && education.highest_level.trim() !== '') ? education.highest_level : null,
    graduation_date: (education.graduation_date && education.graduation_date.trim() !== '') ? education.graduation_date : null,
    honors_received: (education.honors_received && education.honors_received.trim() !== '') ? education.honors_received : null,
    program_title: education.program_title,
    major: education.major,
    inclusive_years: education.inclusive_years,
    school_code: targetSchoolCode
  };

  if (isNewApplicant) {
    const { error: eduErr } = await supabase
      .from('education_records')
      .insert({
        educational_record_id: eduRecordId,
        ...eduPayload
      });
    if (eduErr) throw new Error('Failed to create education record: ' + eduErr.message);
  } else {
    const { error: eduErr } = await supabase
      .from('education_records')
      .update(eduPayload)
      .eq('educational_record_id', eduRecordId);
    if (eduErr) throw new Error('Failed to update education record: ' + eduErr.message);
  }

  // Step B: Insert or Update Employment
  if (personal.employment_status === 'Employed' && employment) {
    const targetAgencyCode = await resolveAgencyCode(
      supabase,
      employment.agency_code,
      employment.customAgencyName,
      employment.customAgencyAddress
    );

    if (empRecordId) {
      const { error: empErr } = await supabase
        .from('employment_records')
        .update({
          job_title: employment.job_title,
          years_in_agency: employment.years_in_agency,
          appointment_status: employment.appointment_status,
          agency_code: targetAgencyCode
        })
        .eq('employment_record_id', empRecordId);
      if (empErr) throw new Error('Failed to update employment record: ' + empErr.message);
    } else {
      empRecordId = await getNextEmploymentRecordId(supabase);
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
  } else if (personal.employment_status === 'Unemployed' && empRecordId) {
    oldEmpRecordId = empRecordId;
    empRecordId = null;
  }

  // Step C: Insert or Update Applicant record
  const applicantPayload = {
    name: personal.name,
    birthdate: personal.birthdate,
    sex: personal.sex,
    birthplace: personal.birthplace,
    citizenship: personal.citizenship,
    mother_maiden_name: personal.mother_maiden_name,
    permanent_address: personal.permanent_address,
    zip_code: personal.zip_code,
    mobile_number: personal.mobile_number,
    telephone_number: (personal.telephone_number && personal.telephone_number.trim() !== '') ? personal.telephone_number : null,
    email: personal.email,
    civil_status: personal.civil_status,
    priority_group: (personal.priority_group && personal.priority_group.trim() !== '') ? personal.priority_group : null,
    employment_status: personal.employment_status,
    educational_record_id: eduRecordId,
    employment_record_id: empRecordId
  };

  if (isNewApplicant) {
    const { error: applicantErr } = await supabase
      .from('applicants')
      .insert({
        applicant_id: applicantId,
        ...applicantPayload
      });
    if (applicantErr) throw new Error('Failed to create applicant profile: ' + applicantErr.message);
  } else {
    const { error: applicantErr } = await supabase
      .from('applicants')
      .update(applicantPayload)
      .eq('applicant_id', applicantId);
    if (applicantErr) throw new Error('Failed to update applicant profile: ' + applicantErr.message);
  }

  // Clean up unlinked employment records
  if (oldEmpRecordId) {
    const { error: delEmpErr } = await supabase
      .from('employment_records')
      .delete()
      .eq('employment_record_id', oldEmpRecordId);
    if (delEmpErr) throw new Error('Failed to clean up unlinked employment record: ' + delEmpErr.message);
  }

  // Step D: Insert Application record
  const { error: appErr } = await supabase
    .from('applications')
    .insert({
      application_no: applicationNo,
      forms_date: formsDate,
      exam_applied_for: application.exam_applied_for,
      last_exam_date: (personal.last_exam_date && personal.last_exam_date.trim() !== '') ? personal.last_exam_date : null,
      csr_regional_office: application.csr_regional_office,
      exam_date: application.exam_date,
      exam_place: application.exam_place,
      applicant_id: applicantId,
      status: application.status
    });
  if (appErr) throw new Error('Failed to create application details: ' + appErr.message);

  // Step E: Insert Disabilities
  if (!isNewApplicant) {
    const { error: delDisErr } = await supabase
      .from('disabilities')
      .delete()
      .eq('applicant_id', applicantId);
    if (delDisErr) throw new Error('Failed to clear old disabilities: ' + delDisErr.message);
  }

  if (disabilities && disabilities.length > 0) {
    let disNum = await getNextDisabilityIdStart(supabase);
    const disabilityRecords = disabilities.map(disName => ({
      disability_id: `DIS-${String(disNum++).padStart(4, '0')}`,
      disability: disName,
      applicant_id: applicantId
    }));

    const { error: disErr } = await supabase
      .from('disabilities')
      .insert(disabilityRecords);
    if (disErr) throw new Error('Failed to record disabilities: ' + disErr.message);
  }

  // Step F: Insert Eligibility Proofs
  if (!isNewApplicant) {
    const { error: delEligErr } = await supabase
      .from('eligibility_proofs')
      .delete()
      .eq('applicant_id', applicantId);
    if (delEligErr) throw new Error('Failed to clear old eligibility proofs: ' + delEligErr.message);
  }

  if (eligibilityProofs && eligibilityProofs.length > 0) {
    for (const proof of eligibilityProofs) {
      if (proof.isCustom) {
        await ensureEligibilityLookup(supabase, proof.title);
      }
    }

    let eligNum = await getNextEligibilityProofIdStart(supabase);
    const proofRecords = eligibilityProofs.map(proof => ({
      eligibility_proof_id: `EP-${String(eligNum++).padStart(4, '0')}`,
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
 * Find an existing applicant using 2-out-of-3 matching logic:
 * - Email, Birthdate, Name
 * - If at least two fields match exactly, it is considered a match.
 */
async function findMatchingApplicant(
  supabase: any,
  subName: string,
  subBirthdate: string,
  subEmail: string
) {
  const cleanSubName = subName.trim();
  const cleanSubEmail = subEmail.trim();

  const { data: candidates, error } = await supabase
    .from('applicants')
    .select('applicant_id, educational_record_id, employment_record_id, name, birthdate, email')
    .or(`email.eq."${cleanSubEmail}",birthdate.eq."${subBirthdate}",name.eq."${cleanSubName}"`);

  if (error || !candidates || candidates.length === 0) {
    return null;
  }

  const lowerSubName = cleanSubName.toLowerCase();
  const lowerSubEmail = cleanSubEmail.toLowerCase();

  let bestMatch: any = null;
  let bestScore = 0;

  for (const c of candidates) {
    const nameMatch = c.name?.trim().toLowerCase() === lowerSubName;
    const birthdateMatch = c.birthdate === subBirthdate;
    const emailMatch = c.email?.trim().toLowerCase() === lowerSubEmail;

    let score = 0;
    if (nameMatch) score++;
    if (birthdateMatch) score++;
    if (emailMatch) score++;

    if (score >= 2 && score > bestScore) {
      bestScore = score;
      bestMatch = c;
    }
  }

  return bestMatch;
}

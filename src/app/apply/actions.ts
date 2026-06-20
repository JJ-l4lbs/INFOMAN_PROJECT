'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';

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

export async function publicSubmitApplication(payload: {
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
  } | null;
  disabilities: string[];
  customDisability: string;
  eligibilityProofs: Array<{
    title: string;
    rating: string;
    dateGranted: string;
    placeTaken: string;
    isCustom?: boolean;
  }>;
}) {
  const supabase = getServiceClient();
  const { personal, education, employment, disabilities, customDisability, eligibilityProofs } = payload;

  const formsDate = new Date().toISOString().split('T')[0];
  const targetExamDate = '2026-10-15';
  const targetExamPlace = 'NCR School Center';
  const targetRegionalOffice = 'NCR';

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
        school_name: education.customSchoolName || '',
        school_address: education.customSchoolAddress || '',
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
  if (personal.employment_status === 'Employed' && empRecordId && employment) {
    let targetAgencyCode = employment.agency_code;
    if (employment.agency_code === 'OTHER') {
      const agencyInitials = getInitials(employment.customAgencyName || '', 'AGE');
      const agencyRand = generateNumericId(5);
      targetAgencyCode = `${agencyInitials}-${agencyRand}`;

      const { error: newAgencyErr } = await supabase
        .from('agencies')
        .insert({
          agency_code: targetAgencyCode,
          agency_name: employment.customAgencyName || '',
          agency_address: employment.customAgencyAddress || '',
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
      priority_group: personal.priority_group || null,
      employment_status: personal.employment_status,
      educational_record_id: eduRecordId,
      employment_record_id: empRecordId
    });
  if (applicantErr) throw new Error('Failed to create Applicant record: ' + applicantErr.message);

  // Step D: Insert Application
  const { error: appErr } = await supabase
    .from('applications')
    .insert({
      application_no: applicationNo,
      forms_date: formsDate,
      exam_applied_for: 'Career Service-Professional',
      last_exam_date: (personal.last_exam_date && personal.last_exam_date.trim() !== '') ? personal.last_exam_date : null,
      csr_regional_office: targetRegionalOffice,
      exam_date: targetExamDate,
      exam_place: targetExamPlace,
      applicant_id: applicantId,
      status: 'Pending'
    });
  if (appErr) throw new Error('Failed to file Application: ' + appErr.message);

  // Step E: Insert Disabilities (Handle custom disability write-in)
  const disabilityRecords = [];
  const finalSelectedDis = [...disabilities];
  if (customDisability && customDisability.trim() !== '') {
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

  return { applicantId, applicationNo };
}

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';

export const getServiceClient = () => {
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

export const checkAuth = (password: string) => {
  const envPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
  if (password !== envPassword) {
    throw new Error('Unauthorized: Incorrect administrator password.');
  }
};

export const generateNumericId = (length: number) => {
  let result = '';
  const digits = '0123456789';
  for (let i = 0; i < length; i++) {
    result += digits.charAt(Math.floor(Math.random() * 10));
  }
  return result;
};

export const generateAlphaNumericId = (length: number) => {
  let result = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const getInitials = (name: string, fallback: string = 'GEN'): string => {
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

/**
 * Resolve target school code, inserting a custom school if schoolCode is 'OTHER'
 */
export async function resolveSchoolCode(
  supabase: any,
  schoolCode: string,
  customSchoolName?: string,
  customSchoolAddress?: string
): Promise<string> {
  if (schoolCode === 'OTHER') {
    const schoolInitials = getInitials(customSchoolName || '', 'SCH');
    const schoolRand = generateNumericId(5);
    const targetSchoolCode = `${schoolInitials}-${schoolRand}`;
    const { error: newSchoolErr } = await supabase
      .from('schools')
      .insert({
        school_code: targetSchoolCode,
        school_name: customSchoolName || '',
        school_address: customSchoolAddress || '',
        is_registered: false
      });
    if (newSchoolErr) throw new Error('Failed to register custom school: ' + newSchoolErr.message);
    return targetSchoolCode;
  }
  return schoolCode;
}

/**
 * Resolve target agency code, inserting a custom agency if agencyCode is 'OTHER'
 */
export async function resolveAgencyCode(
  supabase: any,
  agencyCode: string,
  customAgencyName?: string,
  customAgencyAddress?: string
): Promise<string> {
  if (agencyCode === 'OTHER') {
    const agencyInitials = getInitials(customAgencyName || '', 'AGE');
    const agencyRand = generateNumericId(5);
    const targetAgencyCode = `${agencyInitials}-${agencyRand}`;
    const { error: newAgencyErr } = await supabase
      .from('agencies')
      .insert({
        agency_code: targetAgencyCode,
        agency_name: customAgencyName || '',
        agency_address: customAgencyAddress || '',
        is_registered: false
      });
    if (newAgencyErr) throw new Error('Failed to register custom employment agency: ' + newAgencyErr.message);
    return targetAgencyCode;
  }
  return agencyCode;
}

/**
 * Check and ensure a custom eligibility exists in lookups
 */
export async function ensureEligibilityLookup(supabase: any, title: string): Promise<void> {
  const { data: existingElg } = await supabase
    .from('eligibility_lookups')
    .select('eligibility_code')
    .eq('eligibility_name', title);

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
    const { error } = await supabase.from('eligibility_lookups').insert({
      eligibility_code: nextEligCode,
      eligibility_name: title,
      is_registered: false
    });
    if (error) throw new Error('Failed to auto-register custom eligibility: ' + error.message);
  }
}

/**
 * Check and ensure a custom disability exists in lookups
 */
export async function ensureDisabilityLookup(supabase: any, name: string): Promise<void> {
  const trimmedCustom = name.trim();
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
    const { error } = await supabase.from('disability_lookups').insert({
      disability_code: nextDisCode,
      disability_name: trimmedCustom,
      is_registered: false
    });
    if (error) throw new Error('Failed to auto-register custom disability: ' + error.message);
  }
}

/**
 * Query and generate next sequential Educational Record ID
 */
export async function getNextEducationalRecordId(supabase: any): Promise<string> {
  const { data: maxEdu } = await supabase
    .from('education_records')
    .select('educational_record_id')
    .like('educational_record_id', 'EDU-%')
    .order('educational_record_id', { ascending: false });
  let eduNum = 1;
  if (maxEdu && maxEdu.length > 0) {
    const validEdu = maxEdu.find((e: any) => {
      const num = parseInt(e.educational_record_id.replace('EDU-', ''));
      return !isNaN(num) && num < 10000;
    });
    if (validEdu) {
      eduNum = parseInt(validEdu.educational_record_id.replace('EDU-', '')) + 1;
    }
  }
  return `EDU-${String(eduNum).padStart(4, '0')}`;
}

/**
 * Query and generate next sequential Employment Record ID
 */
export async function getNextEmploymentRecordId(supabase: any): Promise<string> {
  const { data: maxEmp } = await supabase
    .from('employment_records')
    .select('employment_record_id')
    .like('employment_record_id', 'EMP-%')
    .order('employment_record_id', { ascending: false });
  let empNum = 1;
  if (maxEmp && maxEmp.length > 0) {
    const validEmp = maxEmp.find((e: any) => {
      const num = parseInt(e.employment_record_id.replace('EMP-', ''));
      return !isNaN(num) && num < 10000;
    });
    if (validEmp) {
      empNum = parseInt(validEmp.employment_record_id.replace('EMP-', '')) + 1;
    }
  }
  return `EMP-${String(empNum).padStart(4, '0')}`;
}

/**
 * Generate Applicant ID based on name and random characters
 */
export function generateApplicantId(name: string): string {
  const cleanNameForId = name.replace(/[^A-Za-z]/g, '').toUpperCase();
  const namePrefix = cleanNameForId.padEnd(4, 'X').substring(0, 4);
  const nameSuffix = generateAlphaNumericId(4);
  return `${namePrefix}-${nameSuffix}`;
}

/**
 * Query and generate next sequential Application number
 */
export async function getNextApplicationNo(supabase: any): Promise<string> {
  const { data: maxApp } = await supabase
    .from('applications')
    .select('application_no')
    .like('application_no', 'APPNO-%')
    .order('application_no', { ascending: false });
  let applicationNo = 'APPNO-0001';
  if (maxApp && maxApp.length > 0) {
    const validApp = maxApp.find((a: any) => {
      const num = parseInt(a.application_no.replace('APPNO-', ''));
      return !isNaN(num) && num < 10000;
    });
    if (validApp) {
      const num = parseInt(validApp.application_no.replace('APPNO-', ''));
      applicationNo = `APPNO-${String(num + 1).padStart(4, '0')}`;
    }
  }
  return applicationNo;
}

/**
 * Query the starting sequential ID for disability insertions
 */
export async function getNextDisabilityIdStart(supabase: any): Promise<number> {
  const { data: maxDis } = await supabase
    .from('disabilities')
    .select('disability_id')
    .like('disability_id', 'DIS-%')
    .order('disability_id', { ascending: false });

  let disNum = 1;
  if (maxDis && maxDis.length > 0) {
    const validDis = maxDis.find((d: any) => {
      const num = parseInt(d.disability_id.replace('DIS-', ''));
      return !isNaN(num) && num < 10000;
    });
    if (validDis) {
      disNum = parseInt(validDis.disability_id.replace('DIS-', '')) + 1;
    }
  }
  return disNum;
}

/**
 * Query the starting sequential ID for eligibility proof insertions
 */
export async function getNextEligibilityProofIdStart(supabase: any): Promise<number> {
  const { data: maxElig } = await supabase
    .from('eligibility_proofs')
    .select('eligibility_proof_id')
    .like('eligibility_proof_id', 'EP-%')
    .order('eligibility_proof_id', { ascending: false });

  let eligNum = 1;
  if (maxElig && maxElig.length > 0) {
    const validElig = maxElig.find((e: any) => {
      const num = parseInt(e.eligibility_proof_id.replace('EP-', ''));
      return !isNaN(num) && num < 10000;
    });
    if (validElig) {
      eligNum = parseInt(validElig.eligibility_proof_id.replace('EP-', '')) + 1;
    }
  }
  return eligNum;
}

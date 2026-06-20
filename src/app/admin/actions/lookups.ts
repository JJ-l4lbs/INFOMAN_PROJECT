'use server';

import { 
  getServiceClient, 
  checkAuth, 
  generateNumericId, 
  getInitials 
} from './utils';

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
    const schoolInitials = getInitials(payload.school_name || '', 'SCH');
    const schoolRand = generateNumericId(5);
    insertData.school_code = `${schoolInitials}-${schoolRand}`;
    insertData.school_name = payload.school_name || '';
    insertData.school_address = payload.school_address || '';
    insertData.is_registered = true;
  } else if (type === 'agencies') {
    table = 'agencies';
    const agencyInitials = getInitials(payload.agency_name || '', 'AGE');
    const agencyRand = generateNumericId(5);
    insertData.agency_code = `${agencyInitials}-${agencyRand}`;
    insertData.agency_name = payload.agency_name || '';
    insertData.agency_address = payload.agency_address || '';
    insertData.is_registered = true;
  } else if (type === 'disabilities') {
    table = 'disability_lookups';
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
    insertData.disability_code = nextDisCode;
    insertData.disability_name = payload.disability_name;
    insertData.is_registered = true;
  } else if (type === 'eligibilities') {
    table = 'eligibility_lookups';
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
    insertData.eligibility_code = nextEligCode;
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

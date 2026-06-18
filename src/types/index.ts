export interface School {
  school_code: string;
  school_name: string;
  school_address: string;
}

export interface Agency {
  agency_code: string;
  agency_name: string;
  agency_address: string;
}

export interface EducationRecord {
  educational_record_id: string;
  highest_education: string;
  completion: string;
  highest_level: string | null;
  graduation_date: string | null; // YYYY-MM-DD
  honors_received: string | null;
  program_title: string;
  major: string;
  inclusive_years: string;
  school_code: string;
}

export interface EmploymentRecord {
  employment_record_id: string;
  job_title: string;
  years_in_agency: number;
  appointment_status: string;
  agency_code: string;
}

export interface Applicant {
  applicant_id: string;
  name: string;
  birthdate: string; // YYYY-MM-DD
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
  educational_record_id: string;
  employment_record_id: string | null;
}

export interface Application {
  application_no: string;
  forms_date: string; // YYYY-MM-DD or formatted string
  exam_applied_for: string;
  last_exam_date: string | null; // YYYY-MM-DD
  csr_regional_office: string;
  exam_date: string; // YYYY-MM-DD
  exam_place: string;
  applicant_id: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface Disability {
  disability_id: string;
  disability: string;
  applicant_id: string;
}

export interface EligibilityProof {
  eligibility_proof_id: string;
  eligibility_proof_title: string;
  rating_obtained: string;
  date_granted: string;
  eligibility_place_taken: string;
  applicant_id: string;
}

// Full application details type (joined view) for admin dashboard
export interface FullApplicationDetails {
  application: Application;
  applicant: Applicant;
  education: EducationRecord & { school: School };
  employment: (EmploymentRecord & { agency: Agency }) | null;
  disabilities: Disability[];
  eligibilityProofs: EligibilityProof[];
}

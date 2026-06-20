import os
import random
import datetime
import json
import urllib.request
import urllib.error
import socket
import re
from faker import Faker

# Set default socket timeout to 10 seconds to prevent hanging
socket.setdefaulttimeout(10.0)

# Initialize Faker with the Philippine locale for realistic local data
fake = Faker('en_PH')

def get_initials(name, fallback="GEN"):
    clean = re.sub(r'[^A-Za-z0-9 ]', '', name).strip()
    if not clean:
        return fallback
    uppercase_letters = re.sub(r'[^A-Z0-9]', '', clean)
    if 2 <= len(uppercase_letters) <= 6:
        return uppercase_letters
    words = [w for w in clean.split() if w]
    if len(words) >= 2:
        return ''.join(w[0] for w in words).upper()
    elif len(words) == 1:
        return words[0][:3].upper()
    return fallback

# Configuration
NUM_LOOKUPS = 30 # Number of Schools/Agencies to generate
NUM_RECORDS = 50 # Number of applicants to generate

# Load environment variables from .env.local
env_vars = {}
env_path = ".env.local"
if os.path.exists(env_path):
    try:
        with open(env_path, "r") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" in line:
                    key, val = line.split("=", 1)
                    env_vars[key.strip()] = val.strip().strip('"').strip("'")
    except Exception as e:
        print(f"Warning: Could not parse {env_path}: {e}")

supabase_url = env_vars.get("NEXT_PUBLIC_SUPABASE_URL")
service_role_key = env_vars.get("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not service_role_key:
    print("Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env.local")
    print("Please make sure these variables are configured correctly in your .env.local file.")
    exit(1)

print("Connecting to Supabase API...")

# --- LISTS TO HOLD GENERATED IDs (For Foreign Keys) ---
agency_codes = []
school_codes = []
edu_record_ids = []
emp_record_ids = []
applicant_ids = []

# Pools for real Philippine geographical data
common_barangays = ["Poblacion", "San Isidro", "San Jose", "San Antonio", "San Juan", "Santo Niño", "Mabini", "San Roque", "San Vicente", "Rosario"]
common_cities = ["Manila", "Quezon City", "Caloocan", "Las Piñas", "Makati", "Malabon", "Mandaluyong", "Marikina", "Muntinlupa", "Navotas", "Parañaque", "Pasay", "Pasig", "San Juan", "Taguig", "Valenzuela", "Cebu City", "Davao City", "Antipolo", "Imus"]

def insert_bulk(table_name, data, max_retries=5, retry_delay=2):
    import time
    url = f"{supabase_url}/rest/v1/{table_name}"
    req_body = json.dumps(data).encode("utf-8")
    
    for attempt in range(1, max_retries + 1):
        req = urllib.request.Request(
            url,
            data=req_body,
            headers={
                "apikey": service_role_key,
                "Authorization": f"Bearer {service_role_key}",
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates,return=minimal"  # Merge duplicates (upsert behavior) if they conflict
            },
            method="POST"
        )
        
        try:
            with urllib.request.urlopen(req) as response:
                status = response.status
                response.read()
                print(f"Successfully inserted/updated {len(data)} records in table '{table_name}' (Status {status}).", flush=True)
                return
        except Exception as e:
            print(f"Attempt {attempt}/{max_retries} failed for table '{table_name}': {e}", flush=True)
            if attempt == max_retries:
                raise e
            time.sleep(retry_delay * attempt)

# =====================================================================
# 1. POPULATE LOOKUP TABLES (Agencies & Schools)
# =====================================================================
agencies_data = []
schools_data = []

for i in range(NUM_LOOKUPS):
    is_gov = random.choice([True, False])
    agency_city = random.choice(common_cities)
    agency_address = f"{fake.building_number()}, {fake.street_name()}, Brgy. {random.choice(common_barangays)}, {agency_city}"
    
    if is_gov:
        agency_name = random.choice(["DepEd", "DOH", "BIR", "DPWH", "DSWD", "DILG"]) + f" - {agency_city}"
    else:
        agency_name = fake.company()
        
    # Calculate initials + random digits
    agency_initials = get_initials(agency_name, "AGE")
    agency_rand = ''.join(random.choices('0123456789', k=5))
    a_code = f"{agency_initials}-{agency_rand}"
    agency_codes.append(a_code)
        
    agencies_data.append({
        "agency_code": a_code,
        "agency_name": agency_name[:45],
        "agency_address": agency_address[:100]
    })

    # Schools (Initials + random digits)
    school_name = (fake.last_name() + " University")
    school_initials = get_initials(school_name, "SCH")
    school_rand = ''.join(random.choices('0123456789', k=5))
    s_code = f"{school_initials}-{school_rand}"
    school_codes.append(s_code)
    
    school_address = f"{fake.building_number()}, {fake.street_name()}, Brgy. {random.choice(common_barangays)}, {random.choice(common_cities)}"
    
    schools_data.append({
        "school_code": s_code,
        "school_name": school_name[:45],
        "school_address": school_address[:100]
    })

print("Generating and seeding Schools and Agencies...")
insert_bulk("schools", schools_data)
insert_bulk("agencies", agencies_data)

# =====================================================================
# 2. POPULATE FIRST-LEVEL RECORDS (Education & Employment)
# =====================================================================
edu_data = []
emp_data = []

for i in range(NUM_RECORDS):
    # Education Records (Incremental EDU-0001 format)
    edu_id = f"EDU-{i+1:04d}"
    edu_record_ids.append(edu_id)
    
    ed_level = random.choice(["High School", "Senior High School", "Bachelor's", "Master's", "Doctorate"])
    
    # Pre-generate the graduation date so we can calculate realistic inclusive years
    grad_date = fake.date_between(start_date='-10y', end_date='today')
    grad_year = grad_date.year
    
    if ed_level == "High School":
        safe_program = "N/A"
        safe_major = "N/A"
        level_category = "Secondary"
        start_year = grad_year - 4 # 4 years for Junior High School
    elif ed_level == "Senior High School":
        safe_program = random.choice(["STEM", "HUMSS", "ABM", "GAS", "TVL"])
        safe_major = "N/A"
        level_category = "Secondary"
        start_year = grad_year - 2 # 2 years for SHS
    elif ed_level == "Bachelor's":
        safe_program = random.choice(["BS Information Technology", "BS Nursing", "BS Accountancy", "BA Communication"])
        safe_major = random.choice(["IT", "Nursing", "Accounting", "Media"])
        level_category = "College"
        start_year = grad_year - random.choice([4, 5]) # 4 or 5 years for College
    elif ed_level == "Master's":
        safe_program = random.choice(["Master of Business Admin", "Master of Arts in Ed", "MS Computer Science"])
        safe_major = random.choice(["Business", "Education", "Computer Science"])
        level_category = "Post-Graduate"
        start_year = grad_year - 2 # 2 years for a Master's
    else: # Doctorate
        safe_program = random.choice(["Doctor of Philosophy", "Doctor of Education", "Doctor of Medicine"])
        safe_major = random.choice(["Research", "Educational Leadership", "Medicine"])
        level_category = "Post-Graduate"
        start_year = grad_year - random.randint(3, 5) # 3 to 5 years for a Doctorate
        
    calculated_inclusive_years = f"{start_year}-{grad_year}"

    edu_data.append({
        "educational_record_id": edu_id,
        "highest_education": ed_level,
        "completion": "Completed",
        "highest_level": level_category,
        "graduation_date": str(grad_date),
        "honors_received": random.choice(["Cum Laude", "None", "None", "None", "Magna Cum Laude"]),
        "program_title": safe_program[:45],
        "major": safe_major[:45],
        "inclusive_years": calculated_inclusive_years,
        "school_code": random.choice(school_codes)
    })

    # Employment Records (Incrementing Surrogate: EMP-0001)
    emp_id = f"EMP-{i+1:04d}"
    emp_record_ids.append(emp_id)
    
    emp_data.append({
        "employment_record_id": emp_id,
        "job_title": fake.job()[:45],
        "years_in_agency": random.randint(1, 10),
        "appointment_status": random.choice(["Permanent", "Contractual", "Casual"]),
        "agency_code": random.choice(agency_codes)
    })

print("Generating and seeding Education and Employment records...")
insert_bulk("education_records", edu_data)
insert_bulk("employment_records", emp_data)

# =====================================================================
# 3. POPULATE THE CORE TABLE (Applicants)
# =====================================================================
applicants_data = []

for i in range(NUM_RECORDS):
    # Applicants (First 4 letters of name + random 4 characters)
    app_name = fake.name()[:45]
    clean_app_name = re.sub(r'[^A-Za-z]', '', app_name).upper()
    prefix = (clean_app_name + 'XXXX')[:4]
    suffix = ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=4))
    app_id = f"{prefix}-{suffix}"
    applicant_ids.append(app_id)
    
    chosen_city = random.choice(common_cities)
    ph_address = f"{fake.building_number()}, {fake.street_name()}, Brgy. {random.choice(common_barangays)}, {chosen_city}"
    
    applicants_data.append({
        "applicant_id": app_id,
        "name": app_name,
        "birthdate": str(fake.date_of_birth(minimum_age=18, maximum_age=60)),
        "sex": random.choice(["Male", "Female"]),
        "birthplace": random.choice(common_cities)[:50],
        "citizenship": "Filipino",
        "mother_maiden_name": fake.name_female()[:45],
        "permanent_address": ph_address[:100],
        "zip_code": fake.postcode(),
        "mobile_number": fake.numerify(text='+639#########'),
        "telephone_number": fake.numerify(text='02-####-####'),
        "email": fake.email()[:45],
        "civil_status": random.choice(["Single", "Married"]),
        "priority_group": "None",
        "employment_status": "Employed",
        "educational_record_id": edu_record_ids[i],
        "employment_record_id": emp_record_ids[i]
    })

print("Generating and seeding Applicants...")
insert_bulk("applicants", applicants_data)

# =====================================================================
# 4. POPULATE APPLICANT-DEPENDENT TABLES
# =====================================================================
applications_data = []
disabilities_data = []
eligibility_proofs_data = []

appno_counter = 1
dis_counter = 1
elig_counter = 1

for index, app_id in enumerate(applicant_ids):
    # --- BATCH LOGIC SEPARATION ---
    if index < (NUM_RECORDS / 2):
        # BATCH 1: First half of applicants
        assigned_exam_date = "2026-05-15"
        assigned_forms_date = fake.date_between_dates(date_start=datetime.date(2026, 1, 1), date_end=datetime.date(2026, 4, 30))
    else:
        # BATCH 2: Second half of applicants
        assigned_exam_date = "2026-10-15"
        # Forms date is strictly AFTER Batch 1's exam date
        assigned_forms_date = fake.date_between_dates(date_start=datetime.date(2026, 6, 1), date_end=datetime.date(2026, 9, 30))

    # Retaker logic
    is_retaker = random.choice([True, False]) 
    exam_date_logic = fake.date_between_dates(date_start=datetime.date(2020, 1, 1), date_end=datetime.date(2025, 12, 31)) if is_retaker else None 
    
    applications_data.append({
        "application_no": f"APPNO-{appno_counter:04d}",
        "forms_date": str(assigned_forms_date),
        "exam_applied_for": "Career Service-Professional",
        "last_exam_date": str(exam_date_logic) if exam_date_logic else None,
        "csr_regional_office": "NCR",
        "exam_date": assigned_exam_date,
        "exam_place": "Manila",
        "applicant_id": app_id,
        "status": "Pending"
    })
    appno_counter += 1

    # --- UNIQUE DISABILITIES LOGIC ---
    num_disabilities = random.randint(0, 2)
    disability_options = ["Visual Impairment", "Hearing Impairment", "Orthopedic"]
    
    # random.sample guarantees unique selections
    chosen_disabilities = random.sample(disability_options, num_disabilities)
    
    for disability in chosen_disabilities:
        disabilities_data.append({
            "disability_id": f"DIS-{dis_counter:04d}",
            "disability": disability,
            "applicant_id": app_id
        })
        dis_counter += 1

    # --- UNIQUE ELIGIBILITY PROOFS LOGIC ---
    num_eligibilities = random.randint(0, 3)
    eligibility_options = ["PRC License", "Bar Exam", "CPA Board Exam", "Civil Service Sub-Professional", "Civil Engineer Licensure Exam"]
    
    # random.sample guarantees unique selections
    chosen_eligibilities = random.sample(eligibility_options, num_eligibilities)
    
    for eligibility in chosen_eligibilities:
        eligibility_proofs_data.append({
            "eligibility_proof_id": f"EP-{elig_counter:04d}",
            "eligibility_proof_title": eligibility,
            "rating_obtained": str(round(random.uniform(75.0, 95.0), 2)),
            "date_granted": str(fake.date_between(start_date='-10y', end_date='-1y')),
            "eligibility_place_taken": random.choice(common_cities)[:45],
            "applicant_id": app_id
        })
        elig_counter += 1

print("Generating and seeding Applications...")
insert_bulk("applications", applications_data)

if disabilities_data:
    print("Generating and seeding Disabilities...")
    insert_bulk("disabilities", disabilities_data)

if eligibility_proofs_data:
    print("Generating and seeding Eligibility Proofs...")
    insert_bulk("eligibility_proofs", eligibility_proofs_data)

print(f"\nSuccess! Seeded {NUM_RECORDS} complete applicant profiles with customized Natural Keys and dynamic inclusive years in Supabase.")

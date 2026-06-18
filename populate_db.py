import mysql.connector
from faker import Faker
import random
import datetime 

# Initialize Faker with the Philippine locale for realistic local data
fake = Faker('en_PH')

# Connect to your MySQL Database
db = mysql.connector.connect(
    host="localhost",
    user="root",          # <--- CHANGE THIS
    password="tr@l#_%3l0",  # <--- CHANGE THIS
    database="csc_exam_system"
)
cursor = db.cursor()

# Configuration
NUM_LOOKUPS = 30 # Number of Schools/Agencies to generate
NUM_RECORDS = 50 # Number of applicants to generate

# --- LISTS TO HOLD GENERATED IDs (For Foreign Keys) ---
agency_codes = []
school_codes = []
edu_record_ids = []
emp_record_ids = []
applicant_ids = []

print("Starting data generation...")

# Pools for real Philippine geographical data
common_barangays = ["Poblacion", "San Isidro", "San Jose", "San Antonio", "San Juan", "Santo Niño", "Mabini", "San Roque", "San Vicente", "Rosario"]
common_cities = ["Manila", "Quezon City", "Caloocan", "Las Piñas", "Makati", "Malabon", "Mandaluyong", "Marikina", "Muntinlupa", "Navotas", "Parañaque", "Pasay", "Pasig", "San Juan", "Taguig", "Valenzuela", "Cebu City", "Davao City", "Antipolo", "Imus"]

# =====================================================================
# 1. POPULATE LOOKUP TABLES (Agencies & Schools)
# =====================================================================
for i in range(NUM_LOOKUPS):
    # Agencies (Natural Key: 8-digit Employer/GSIS Registration Number)
    a_code = fake.unique.numerify(text='########')
    agency_codes.append(a_code)
    
    is_gov = random.choice([True, False])
    agency_city = random.choice(common_cities)
    agency_address = f"{fake.building_number()}, {fake.street_name()}, Brgy. {random.choice(common_barangays)}, {agency_city}"
    
    if is_gov:
        agency_name = random.choice(["DepEd", "DOH", "BIR", "DPWH", "DSWD", "DILG"]) + f" - {agency_city}"
    else:
        agency_name = fake.company()

    cursor.execute("INSERT INTO agencies (agency_code, agency_name, agency_address) VALUES (%s, %s, %s)", 
                   (a_code, agency_name[:45], agency_address[:100]))

    # Schools (Natural Key: 6-digit DepEd/CHED Institution ID)
    s_code = fake.unique.numerify(text='######')
    school_codes.append(s_code)
    
    school_address = f"{fake.building_number()}, {fake.street_name()}, Brgy. {random.choice(common_barangays)}, {random.choice(common_cities)}"
    
    cursor.execute("INSERT INTO schools (school_code, school_name, school_address) VALUES (%s, %s, %s)", 
                   (s_code, (fake.last_name() + " University")[:45], school_address[:100]))

# =====================================================================
# 2. POPULATE FIRST-LEVEL RECORDS (Education & Employment)
# =====================================================================
for i in range(NUM_RECORDS):
    # Education Records (Natural Key: 12-digit Learner Reference Number / Student ID)
    edu_id = fake.unique.numerify(text='############')
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

    cursor.execute("""
        INSERT INTO education_records 
        (educational_record_id, highest_education, completion, highest_level, graduation_date, honors_received, program_title, major, inclusive_years, school_code)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (edu_id, ed_level, "Completed", level_category, grad_date,
          random.choice(["Cum Laude", "None", "None", "None", "Magna Cum Laude"]), 
          safe_program[:45], safe_major[:45], calculated_inclusive_years, random.choice(school_codes)))

    # Employment Records (Incrementing Surrogate: EMP-00001)
    emp_id = f"EMP-{i+1:05d}"
    emp_record_ids.append(emp_id)
    
    cursor.execute("""
        INSERT INTO employment_records 
        (employment_record_id, job_title, years_in_agency, appointment_status, agency_code)
        VALUES (%s, %s, %s, %s, %s)
    """, (emp_id, fake.job()[:45], random.randint(1, 10), random.choice(["Permanent", "Contractual", "Casual"]), random.choice(agency_codes)))

# =====================================================================
# 3. POPULATE THE CORE TABLE (Applicants)
# =====================================================================
for i in range(NUM_RECORDS):
    # Applicants (Modified Requirement: Unique Hash String ID instead of sequential/TIN number)
    app_id = fake.unique.bothify(text='APP-########').upper()
    applicant_ids.append(app_id)
    
    chosen_city = random.choice(common_cities)
    ph_address = f"{fake.building_number()}, {fake.street_name()}, Brgy. {random.choice(common_barangays)}, {chosen_city}"
    
    cursor.execute("""
        INSERT INTO applicants 
        (applicant_id, name, birthdate, sex, birthplace, citizenship, mother_maiden_name, permanent_address, zip_code, mobile_number, telephone_number, email, civil_status, priority_group, employment_status, educational_record_id, employment_record_id)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (app_id, fake.name()[:45], fake.date_of_birth(minimum_age=18, maximum_age=60), random.choice(["Male", "Female"]),
          random.choice(common_cities)[:50], "Filipino", fake.name_female()[:45], 
          ph_address[:100], 
          fake.postcode(), fake.numerify(text='+639#########'), fake.numerify(text='02-####-####'), 
          fake.email()[:45], random.choice(["Single", "Married"]), "None", "Employed", edu_record_ids[i], emp_record_ids[i]))

# =====================================================================
# 4. POPULATE APPLICANT-DEPENDENT TABLES
# =====================================================================
# Initialize counters for the surrogate keys
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
    
    # Applications
    cursor.execute("""
        INSERT INTO applications 
        (application_no, forms_date, exam_applied_for, last_exam_date, csr_regional_office, exam_date, exam_place, applicant_id)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        f"APPNO-{appno_counter:05d}", 
        str(assigned_forms_date), 
        "Career Service-Professional", 
        exam_date_logic,          
        "NCR", 
        assigned_exam_date, 
        "Manila", 
        app_id
    ))
    appno_counter += 1

    # --- UNIQUE DISABILITIES LOGIC ---
    num_disabilities = random.randint(0, 2)
    disability_options = ["Visual Impairment", "Hearing Impairment", "Orthopedic"]
    
    # random.sample guarantees unique selections
    chosen_disabilities = random.sample(disability_options, num_disabilities)
    
    for disability in chosen_disabilities:
        cursor.execute("INSERT INTO disabilities (disability_id, disability, applicant_id) VALUES (%s, %s, %s)",
                       (f"DIS-{dis_counter:05d}", disability, app_id))
        dis_counter += 1

    # --- UNIQUE ELIGIBILITY PROOFS LOGIC ---
    num_eligibilities = random.randint(0, 3)
    eligibility_options = ["PRC License", "Bar Exam", "CPA Board Exam", "Civil Service Sub-Professional", "Civil Engineer Licensure Exam"]
    
    # random.sample guarantees unique selections
    chosen_eligibilities = random.sample(eligibility_options, num_eligibilities)
    
    for eligibility in chosen_eligibilities:
        cursor.execute("""
            INSERT INTO eligibility_proofs 
            (eligibility_proof_id, eligibility_proof_title, rating_obtained, date_granted, eligibility_place_taken, applicant_id) 
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            f"ELIG-{elig_counter:05d}", 
            eligibility, 
            str(round(random.uniform(75.0, 95.0), 2)), 
            str(fake.date_between(start_date='-10y', end_date='-1y')), # <--- Forces a date 1 to 10 years in the past
            random.choice(common_cities)[:45], 
            app_id
        ))
        elig_counter += 1

# Commit the changes and close the connection
db.commit()
cursor.close()
db.close()

print(f"Success! Inserted {NUM_RECORDS} complete applicant profiles with customized Natural Keys and dynamic inclusive years.")
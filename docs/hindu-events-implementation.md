# Hindu/Sanatan Dharam Events Implementation
## Age & Gender Based Filtering (No Religion Filter)

---

## 📋 COMPLETE EVENTS LIST TO ADD

### 🕉️ CATEGORY 1: HINDU SANSKARS (16 Total)

```typescript
const SANSKAR_EVENTS = {
  id: 'sanskars',
  icon: '🕉️',
  label: 'Hindu Sanskars (16)',
  description: 'Traditional Hindu life cycle ceremonies',
  
  events: [
    // Pre-birth (2)
    { id: 'garbhadhan', label: 'Garbhadhan (Conception ceremony)', importance: 'high', ageRange: 'parent' },
    { id: 'pumsavana', label: 'Pumsavana (Baby wish ritual)', importance: 'high', ageRange: 'parent' },
    
    // Birth & Infancy (4)
    { id: 'simantonnayana', label: 'Simantonnayana (Baby shower)', importance: 'high', ageRange: 'parent' },
    { id: 'jatakarma', label: 'Jatakarma (Birth ceremony)', importance: 'critical', ageRange: '0' },
    { id: 'namkaran', label: 'Namkaran (Naming - 11th day)', importance: 'critical', ageRange: '0' },
    { id: 'nishkramana', label: 'Nishkramana (First outdoor)', importance: 'medium', ageRange: '0-1' },
    
    // Childhood (3)
    { id: 'annaprashan', label: 'Annaprashan (First solid food)', importance: 'critical', ageRange: '0.5-1' },
    { id: 'chudakarana', label: 'Chudakarana/Mundan (First haircut)', importance: 'critical', ageRange: '1-3' },
    { id: 'karnavedha', label: 'Karnavedha (Ear piercing)', importance: 'high', ageRange: '1-5' },
    
    // Education (2)
    { id: 'upanayana', label: 'Upanayana (Sacred thread)', importance: 'critical', ageRange: '7-12' },
    { id: 'vedarambha', label: 'Vedarambha (Study start)', importance: 'high', ageRange: '7-12' },
    { id: 'samavartana', label: 'Samavartana (Graduation)', importance: 'critical', ageRange: '16-25' },
    
    // Marriage & Householder (2)
    { id: 'vivaha', label: 'Vivaha (Marriage)', importance: 'critical', ageRange: '20+' },
    { id: 'grihasthashrama', label: 'Grihasthashrama (Householder)', importance: 'high', ageRange: '20+' },
    
    // Spiritual Advancement (2)
    { id: 'vanaprastha', label: 'Vanaprastha (Forest dweller)', importance: 'high', ageRange: '50+' },
    { id: 'sanyasa', label: 'Sanyasa (Renunciation)', importance: 'critical', ageRange: '50+' },
  ]
};
```

---

### 👶 CATEGORY 2: CHILDHOOD MILESTONES (Ages 0-12)

```typescript
const CHILDHOOD_EVENTS = {
  id: 'childhood',
  icon: '👶',
  label: 'Childhood Milestones',
  
  events: [
    { id: 'first_steps', label: 'First Steps', importance: 'medium', ageRange: '0-2' },
    { id: 'first_words', label: 'First Words', importance: 'medium', ageRange: '0-2' },
    { id: 'first_day_school', label: 'First Day of School', importance: 'high', ageRange: '3-6' },
    { id: 'thread_ceremony', label: 'Janeu/Upanayana Ceremony', importance: 'critical', ageRange: '7-12', gender: 'male' },
    { id: 'first_fasting', label: 'First Fasting (Navratri/etc)', importance: 'medium', ageRange: '5-12' },
    { id: 'first_puja', label: 'First Puja Performance', importance: 'medium', ageRange: '5-12' },
    { id: 'childhood_illness', label: 'Major Childhood Illness', importance: 'high', ageRange: '0-12' },
    { id: 'childhood_accident', label: 'Childhood Accident/Injury', importance: 'high', ageRange: '0-12' },
    { id: 'sibling_birth', label: 'Sibling Born', importance: 'medium', ageRange: '0-12' },
    { id: 'school_change', label: 'School Changed', importance: 'medium', ageRange: '0-12' },
    { id: 'first_prize', label: 'First Prize/Achievement', importance: 'medium', ageRange: '0-12' },
    { id: 'first_competition', label: 'First Competition Win', importance: 'medium', ageRange: '0-12' },
  ]
};
```

---

### 🧑 CATEGORY 3: ADOLESCENT EVENTS (Ages 13-19)

```typescript
const ADOLESCENT_EVENTS = {
  id: 'adolescent',
  icon: '🧑',
  label: 'Teen Years (13-19)',
  
  events: [
    // Education
    { id: 'board_10th', label: '10th Board Exam Results', importance: 'critical', ageRange: '15-16' },
    { id: 'board_12th', label: '12th Board Exam Results', importance: 'critical', ageRange: '17-18' },
    { id: 'college_admission', label: 'College Admission', importance: 'critical', ageRange: '17-19' },
    
    // Female Specific
    { id: 'menarche', label: 'First Period (Menarche)', importance: 'critical', ageRange: '12-15', gender: 'female' },
    
    // Relationships
    { id: 'first_love', label: 'First Love/Relationship', importance: 'high', ageRange: '15-19' },
    { id: 'first_kiss', label: 'First Kiss', importance: 'medium', ageRange: '15-19' },
    { id: 'first_heartbreak', label: 'First Heartbreak', importance: 'medium', ageRange: '15-19' },
    
    // Development
    { id: 'first_shave', label: 'First Shave (Facial Hair)', importance: 'medium', ageRange: '15-18', gender: 'male' },
    { id: 'voice_change', label: 'Voice Change Complete', importance: 'low', ageRange: '14-16', gender: 'male' },
    
    // Other
    { id: 'driving_license', label: 'Driving License First Obtained', importance: 'high', ageRange: '18-19' },
    { id: 'first_income', label: 'First Income/Earning', importance: 'high', ageRange: '16-19' },
    { id: 'first_phone', label: 'First Mobile Phone', importance: 'low', ageRange: '15-19' },
    { id: 'boarding_school', label: 'Boarding School Joined', importance: 'high', ageRange: '13-17' },
    { id: 'competitive_exam', label: 'Competitive Exam (JEE/NEET/UPSC)', importance: 'critical', ageRange: '17-19' },
  ]
};
```

---

### 👔 CATEGORY 4: ADULT LIFE (Ages 20-50)

```typescript
const ADULT_EVENTS = {
  id: 'adult',
  icon: '👔',
  label: 'Adult Life (20-50)',
  
  events: [
    // Career
    { id: 'first_job', label: 'First Job / Started Working', importance: 'critical', ageRange: '20-25' },
    { id: 'government_job', label: 'Got Government Job', importance: 'critical', ageRange: '20-35' },
    { id: 'job_promotion', label: 'Job Promotion', importance: 'high', ageRange: '25-50' },
    { id: 'job_change', label: 'Changed Job / Company', importance: 'high', ageRange: '25-45' },
    { id: 'business_started', label: 'Started Own Business', importance: 'critical', ageRange: '25-50' },
    { id: 'business_partnership', label: 'Business Partnership', importance: 'high', ageRange: '25-50' },
    { id: 'business_loss', label: 'Major Business Loss', importance: 'critical', ageRange: '25-50' },
    { id: 'job_loss', label: 'Lost Job / Resignation', importance: 'high', ageRange: '25-50' },
    { id: 'retirement', label: 'Retirement', importance: 'high', ageRange: '50-60' },
    
    // Education
    { id: 'graduation_complete', label: 'Graduation Completed', importance: 'critical', ageRange: '20-25' },
    { id: 'post_graduation', label: 'Post-Graduation / Masters', importance: 'high', ageRange: '22-28' },
    { id: 'phd_doctorate', label: 'PhD / Doctorate', importance: 'high', ageRange: '25-35' },
    { id: 'study_abroad', label: 'Started Studying Abroad', importance: 'high', ageRange: '20-30' },
    { id: 'professional_degree', label: 'Professional Degree (CA/CS/Doctor)', importance: 'critical', ageRange: '22-30' },
    
    // Marriage & Relationships
    { id: 'marriage', label: 'Marriage Ceremony', importance: 'critical', ageRange: '20-35' },
    { id: 'engagement', label: 'Engagement Ceremony', importance: 'critical', ageRange: '20-35' },
    { id: 'first_meeting_spouse', label: 'First Meeting with Spouse', importance: 'high', ageRange: '20-35' },
    { id: 'marriage_registration', label: 'Marriage Registration', importance: 'high', ageRange: '20-35' },
    { id: 'suhaag_raat', label: 'Suhaag Raat (Wedding Night)', importance: 'high', ageRange: '20-35' },
    { id: 'divorce', label: 'Divorce Finalized', importance: 'critical', ageRange: '25-50' },
    { id: 'separation', label: 'Separation from Spouse', importance: 'high', ageRange: '25-50' },
    { id: 'second_marriage', label: 'Second Marriage', importance: 'critical', ageRange: '30-50' },
    { id: 'extra_marital', label: 'Extra-marital Relationship Started', importance: 'high', ageRange: '25-50' },
    { id: 'affair_discovered', label: 'Spouse Affair Discovered', importance: 'critical', ageRange: '25-50' },
    
    // Children & Family
    { id: 'first_child_birth', label: 'First Child Born', importance: 'critical', ageRange: '22-40' },
    { id: 'second_child_birth', label: 'Second Child Born', importance: 'critical', ageRange: '24-42' },
    { id: 'third_child_birth', label: 'Third Child Born', importance: 'critical', ageRange: '26-45' },
    { id: 'pregnancy', label: 'Pregnancy Confirmed', importance: 'high', ageRange: '22-40', gender: 'female' },
    { id: 'conception_date', label: 'Conception Date (if known)', importance: 'high', ageRange: '22-40', gender: 'female' },
    { id: 'miscarriage', label: 'Miscarriage / Pregnancy Loss', importance: 'critical', ageRange: '22-40', gender: 'female' },
    { id: 'abortion', label: 'Abortion', importance: 'critical', ageRange: '20-40', gender: 'female' },
    { id: 'adoption', label: 'Adopted a Child', importance: 'critical', ageRange: '25-50' },
    { id: 'child_marriage', label: 'Child Marriage', importance: 'high', ageRange: '35-50' },
    
    // Property & Financial
    { id: 'property_bought', label: 'Bought Property/House', importance: 'critical', ageRange: '25-50' },
    { id: 'property_sold', label: 'Sold Property/House', importance: 'high', ageRange: '25-50' },
    { id: 'griha_pravesh', label: 'Griha Pravesh (House Warming)', importance: 'high', ageRange: '25-50' },
    { id: 'bhoomi_pujan', label: 'Bhoomi Pujan (Land Breaking)', importance: 'high', ageRange: '25-50' },
    { id: 'major_loan', label: 'Took Major Loan', importance: 'high', ageRange: '25-50' },
    { id: 'loan_repaid', label: 'Major Loan Repaid', importance: 'high', ageRange: '30-55' },
    { id: 'first_car', label: 'First Car/Vehicle', importance: 'medium', ageRange: '25-40' },
    { id: 'major_investment', label: 'Major Investment Made', importance: 'high', ageRange: '25-50' },
    { id: 'financial_loss', label: 'Major Financial Loss', importance: 'critical', ageRange: '25-50' },
    { id: 'bankruptcy', label: 'Bankruptcy / Financial Crisis', importance: 'critical', ageRange: '25-50' },
    { id: 'inheritance_received', label: 'Received Inheritance', importance: 'high', ageRange: '25-50' },
    
    // Travel & Relocation
    { id: 'first_abroad', label: 'First Trip Abroad', importance: 'high', ageRange: '20-45' },
    { id: 'moved_new_city', label: 'Moved to New City', importance: 'high', ageRange: '20-45' },
    { id: 'moved_new_country', label: 'Moved to New Country', importance: 'critical', ageRange: '20-45' },
    { id: 'work_abroad', label: 'Started Working Abroad', importance: 'high', ageRange: '22-45' },
    { id: 'visa_approved', label: 'Visa Approved', importance: 'high', ageRange: '20-45' },
    
    // Health
    { id: 'major_surgery', label: 'Major Surgery', importance: 'critical', ageRange: '20-50' },
    { id: 'hospitalization', label: 'Hospitalization (Serious)', importance: 'high', ageRange: '20-50' },
    { id: 'major_accident', label: 'Major Accident', importance: 'critical', ageRange: '20-50' },
    { id: 'chronic_diagnosis', label: 'Chronic Disease Diagnosed', importance: 'high', ageRange: '25-50' },
    { id: 'mental_health_crisis', label: 'Mental Health Crisis', importance: 'high', ageRange: '20-50' },
    { id: 'full_recovery', label: 'Full Recovery from Illness', importance: 'high', ageRange: '20-50' },
    
    // Female Health
    { id: 'hysterectomy', label: 'Hysterectomy Surgery', importance: 'critical', ageRange: '35-50', gender: 'female' },
    { id: 'mastectomy', label: 'Mastectomy (Breast Removal)', importance: 'critical', ageRange: '30-50', gender: 'female' },
    { id: 'pcos_diagnosis', label: 'PCOS/Endometriosis Diagnosed', importance: 'high', ageRange: '20-35', gender: 'female' },
    { id: 'fertility_treatment', label: 'IVF/Fertility Treatment', importance: 'high', ageRange: '25-45', gender: 'female' },
  ]
};
```

---

### 👴 CATEGORY 5: SENIOR YEARS (Ages 50+)

```typescript
const SENIOR_EVENTS = {
  id: 'senior',
  icon: '👴',
  label: 'Senior Years (50+)',
  
  events: [
    { id: 'widowhood', label: 'Became Widow/Widower', importance: 'critical', ageRange: '50+' },
    { id: 'retirement', label: 'Retired from Work', importance: 'high', ageRange: '55-65' },
    { id: 'grandchild_birth', label: 'First Grandchild Born', importance: 'high', ageRange: '50+' },
    { id: 'chronic_illness', label: 'Chronic Illness Onset', importance: 'high', ageRange: '50+' },
    { id: 'diabetes_diagnosis', label: 'Diabetes Diagnosed', importance: 'high', ageRange: '45+' },
    { id: 'bp_heart_issues', label: 'BP/Heart Issues Started', importance: 'high', ageRange: '45+' },
    { id: 'hip_fracture', label: 'Hip/Fracture in Old Age', importance: 'critical', ageRange: '60+' },
    { id: 'memory_loss', label: 'Memory Loss/Dementia Start', importance: 'high', ageRange: '65+' },
    { id: 'old_age_home', label: 'Moved to Old Age Home', importance: 'high', ageRange: '70+' },
    { id: 'elder_care_start', label: 'Started Elder Care', importance: 'medium', ageRange: '50+' },
    { id: 'menopause', label: 'Menopause Complete', importance: 'high', ageRange: '45-55', gender: 'female' },
    { id: 'andropause', label: 'Male Menopause (Andropause)', importance: 'medium', ageRange: '50-60', gender: 'male' },
    { id: 'writing_will', label: 'Wrote/Made Will', importance: 'high', ageRange: '60+' },
    { id: 'property_distribution', label: 'Property Distribution to Children', importance: 'high', ageRange: '65+' },
    { id: 'late_sanyas', label: 'Sanyas in Late Life', importance: 'critical', ageRange: '60+' },
    { id: 'vanaprastha', label: 'Vanaprastha Ashram', importance: 'high', ageRange: '55+' },
    { id: 'shraadh_first', label: 'First Shraadh after Parent Death', importance: 'high', ageRange: '50+' },
  ]
};
```

---

### 🕉️ CATEGORY 6: SPIRITUAL & RELIGIOUS (All Ages)

```typescript
const SPIRITUAL_EVENTS = {
  id: 'spiritual',
  icon: '🕉️',
  label: 'Spiritual & Religious',
  
  events: [
    // Guru & Diksha
    { id: 'guru_diksha', label: 'Received Guru Diksha', importance: 'critical', ageRange: 'all' },
    { id: 'spiritual_awakening', label: 'Spiritual Awakening', importance: 'high', ageRange: 'all' },
    { id: 'kundalini_awakening', label: 'Kundalini Awakening', importance: 'critical', ageRange: 'all' },
    { id: 'third_eye_opening', label: 'Third Eye Experience', importance: 'high', ageRange: 'all' },
    
    // Practices
    { id: 'meditation_start', label: 'Started Serious Meditation', importance: 'medium', ageRange: 'all' },
    { id: 'yoga_start', label: 'Started Yoga Practice', importance: 'low', ageRange: 'all' },
    { id: 'mantra_siddhi', label: 'Mantra Siddhi Achieved', importance: 'high', ageRange: 'all' },
    { id: 'first_sadhana', label: 'First 40-Day Sadhana', importance: 'medium', ageRange: 'all' },
    
    // Pilgrimages
    { id: 'kumbh_mela', label: 'Kumbh Mela Attended', importance: 'high', ageRange: 'all' },
    { id: 'char_dham', label: 'Char Dham Yatra', importance: 'high', ageRange: 'all' },
    { id: 'varanasi_visit', label: 'First Varanasi Visit', importance: 'high', ageRange: 'all' },
    { id: 'tirupati_darshan', label: 'Tirupati Balaji Darshan', importance: 'high', ageRange: 'all' },
    { id: 'vaishno_devi', label: 'Vaishno Devi Yatra', importance: 'high', ageRange: 'all' },
    { id: 'amarnath_yatra', label: 'Amarnath Yatra', importance: 'high', ageRange: 'all' },
    { id: 'kedarnath_badrinath', label: 'Kedarnath-Badrinath', importance: 'high', ageRange: 'all' },
    { id: 'puri_jagannath', label: 'Puri Jagannath', importance: 'high', ageRange: 'all' },
    { id: 'rameshwaram', label: 'Rameshwaram', importance: 'high', ageRange: 'all' },
    { id: 'dwarka', label: 'Dwarka', importance: 'high', ageRange: 'all' },
    
    // Ceremonies
    { id: 'satyanarayan_katha', label: 'Satyanarayan Katha', importance: 'medium', ageRange: 'all' },
    { id: 'navratri_fast', label: 'First Navratri Fast Complete', importance: 'medium', ageRange: 'all' },
    { id: 'karva_chauth', label: 'First Karva Chauth', importance: 'medium', ageRange: '20+', gender: 'female' },
    { id: 'sundal_kand', label: 'Sundar Kand Path', importance: 'medium', ageRange: 'all' },
    { id: 'mahamrityunjay', label: 'Mahamrityunjay Anushthan', importance: 'high', ageRange: 'all' },
    { id: 'baglamukhi_puja', label: 'Baglamukhi Puja', importance: 'medium', ageRange: 'all' },
    { id: 'kaal_sarpa_shanti', label: 'Kaal Sarpa Shanti', importance: 'high', ageRange: 'all' },
    { id: 'mangal_dosha_shanti', label: 'Mangal Dosha Shanti', importance: 'high', ageRange: 'all' },
    { id: 'pitra_dosh_shanti', label: 'Pitra Dosh Shanti', importance: 'high', ageRange: 'all' },
    
    // Divine Experiences
    { id: 'divine_vision', label: 'Divine Vision/Darshan', importance: 'critical', ageRange: 'all' },
    { id: 'prophetic_dream', label: 'Prophetic Dream', importance: 'high', ageRange: 'all' },
    { id: 'miracle_experience', label: 'Miracle Experienced', importance: 'high', ageRange: 'all' },
    { id: 'out_of_body', label: 'Out-of-Body Experience', importance: 'high', ageRange: 'all' },
    { id: 'near_death_spiritual', label: 'Near-Death with Spiritual Experience', importance: 'critical', ageRange: 'all' },
  ]
};
```

---

### ⚡ CATEGORY 7: TRAUMA & CRITICAL EVENTS (All Ages)

```typescript
const TRAUMA_EVENTS = {
  id: 'trauma',
  icon: '⚡',
  label: 'Trauma & Critical Events',
  sensitive: true,
  
  events: [
    // Near Death
    { id: 'nde_accident', label: 'Near-Fatal Accident', importance: 'critical', ageRange: 'all' },
    { id: 'nde_coma', label: 'Coma / ICU Admission', importance: 'critical', ageRange: 'all' },
    { id: 'nde_drowning', label: 'Near Drowning', importance: 'critical', ageRange: 'all' },
    { id: 'nde_electrocution', label: 'Electrocution Survival', importance: 'critical', ageRange: 'all' },
    { id: 'nde_snake_bite', label: 'Snake Bite Survival', importance: 'critical', ageRange: 'all' },
    { id: 'nde_fall', label: 'Fall from Height Survival', importance: 'critical', ageRange: 'all' },
    { id: 'nde_fire', label: 'Fire/Burn Survival', importance: 'critical', ageRange: 'all' },
    { id: 'nde_poisoning', label: 'Poisoning Survival', importance: 'critical', ageRange: 'all' },
    
    // Physical Trauma
    { id: 'physical_assault', label: 'Physical Assault / Attack', importance: 'critical', ageRange: 'all' },
    { id: 'robbery_attack', label: 'Robbery / Burglary Attack', importance: 'high', ageRange: 'all' },
    { id: 'weapon_attack', label: 'Weapon Attack / Stabbing', importance: 'critical', ageRange: 'all' },
    { id: 'acid_attack', label: 'Acid Attack (if applicable)', importance: 'critical', ageRange: 'all' },
    
    // Sexual Trauma
    { id: 'sexual_assault', label: 'Sexual Assault / Rape', importance: 'critical', ageRange: 'all', gender: 'female' },
    { id: 'childhood_abuse', label: 'Childhood Sexual Abuse', importance: 'critical', ageRange: '0-18' },
    { id: 'molestation', label: 'Molestation / Harassment', importance: 'high', ageRange: 'all', gender: 'female' },
    
    // Kidnapping & Hostage
    { id: 'kidnapping', label: 'Kidnapping / Abduction', importance: 'critical', ageRange: 'all' },
    { id: 'hostage_situation', label: 'Hostage Situation', importance: 'critical', ageRange: 'all' },
    
    // Disasters
    { id: 'earthquake_survival', label: 'Major Earthquake Survival', importance: 'critical', ageRange: 'all' },
    { id: 'flood_survival', label: 'Major Flood Survival', importance: 'critical', ageRange: 'all' },
    { id: 'tsunami_survival', label: 'Tsunami Survival', importance: 'critical', ageRange: 'all' },
    { id: 'cyclone_survival', label: 'Cyclone/Hurricane Survival', importance: 'critical', ageRange: 'all' },
    { id: 'landslide_survival', label: 'Landslide Survival', importance: 'critical', ageRange: 'all' },
    { id: 'building_collapse', label: 'Building Collapse Survival', importance: 'critical', ageRange: 'all' },
    { id: 'major_fire', label: 'House/Building Fire', importance: 'critical', ageRange: 'all' },
    
    // War & Terror
    { id: 'war_exposure', label: 'War / Combat Exposure', importance: 'critical', ageRange: 'all' },
    { id: 'terror_attack', label: 'Terrorist Attack Survival', importance: 'critical', ageRange: 'all' },
    { id: 'bomb_blast', label: 'Bomb Blast Survival', importance: 'critical', ageRange: 'all' },
    { id: 'riot_violence', label: 'Riot / Communal Violence', importance: 'critical', ageRange: 'all' },
    
    // Psychological
    { id: 'witnessed_death', label: 'Witnessed Violent Death', importance: 'critical', ageRange: 'all' },
    { id: 'parental_abandonment', label: 'Parental Abandonment', importance: 'high', ageRange: '0-18' },
    { id: 'suicide_attempt', label: 'Suicide Attempt', importance: 'critical', ageRange: 'all' },
    { id: 'self_harm_start', label: 'Self-Harm Started', importance: 'high', ageRange: 'all' },
    { id: 'eating_disorder', label: 'Eating Disorder', importance: 'high', ageRange: 'all' },
    { id: 'major_phobia', label: 'Major Phobia Development', importance: 'medium', ageRange: 'all' },
    { id: 'severe_bullying', label: 'Severe/Chronic Bullying', importance: 'high', ageRange: 'all' },
  ]
};
```

---

### 👨‍👩‍👧 CATEGORY 8: FAMILY EVENTS (All Ages)

```typescript
const FAMILY_EVENTS = {
  id: 'family',
  icon: '👨‍👩‍👧',
  label: 'Family Events',
  
  events: [
    // Parent Death
    { id: 'father_death', label: 'Father Death', importance: 'critical', ageRange: 'all' },
    { id: 'mother_death', label: 'Mother Death', importance: 'critical', ageRange: 'all' },
    { id: 'step_father_death', label: 'Step-Father Death', importance: 'high', ageRange: 'all' },
    { id: 'step_mother_death', label: 'Step-Mother Death', importance: 'high', ageRange: 'all' },
    
    // Grandparent Death
    { id: 'grandfather_death', label: 'Grandfather Death', importance: 'high', ageRange: 'all' },
    { id: 'grandmother_death', label: 'Grandmother Death', importance: 'high', ageRange: 'all' },
    
    // Sibling Events
    { id: 'elder_sibling_death', label: 'Elder Sibling Death', importance: 'critical', ageRange: 'all' },
    { id: 'younger_sibling_death', label: 'Younger Sibling Death', importance: 'critical', ageRange: 'all' },
    { id: 'sibling_marriage', label: 'Sibling Marriage', importance: 'medium', ageRange: 'all' },
    { id: 'twin_sibling_birth', label: 'Twin Sibling Born', importance: 'medium', ageRange: 'all' },
    
    // Family Structure
    { id: 'parents_divorce', label: 'Parents Divorce', importance: 'high', ageRange: '0-25' },
    { id: 'parent_remarriage', label: 'Parent Remarriage', importance: 'high', ageRange: '0-25' },
    { id: 'step_parent_entry', label: 'Step-Parent Entered Life', importance: 'high', ageRange: '0-25' },
    { id: 'adopted_discovered', label: 'Discovered Being Adopted', importance: 'critical', ageRange: 'all' },
    { id: 'family_business_loss', label: 'Family Business Lost', importance: 'high', ageRange: 'all' },
    { id: 'family_honor_issue', label: 'Family Honor Incident', importance: 'high', ageRange: 'all' },
    { id: 'elder_moved_in', label: 'Elder Parent Moved In', importance: 'medium', ageRange: '30+' },
    { id: 'adult_child_returned', label: 'Adult Child Returned Home', importance: 'medium', ageRange: '45+' },
  ]
};
```

---

## 🎨 UI IMPLEMENTATION: CUSTOM CATEGORY & EDITING

### 1. Custom Category Creation

```tsx
// Add Custom Event Button
<button className="custom-event-btn">
  + Add Custom Event
</button>

// Opens Modal:
┌─────────────────────────────────────────┐
│  📝 Add Custom Event                    │
│                                         │
│  Event Name: [_________________]        │
│                                         │
│  Select Category:                       │
│  [▼ Choose or create new...]            │
│                                         │
│  Or Create New Category:                │
│  [_________________]                    │
│                                         │
│  Importance:                            │
│  (○) Critical  (○) High  (○) Medium    │
│                                         │
│  [Cancel]  [Save Event]                 │
└─────────────────────────────────────────┘
```

### 2. Event Editing (After Adding)

```tsx
// Timeline View with Edit Option
┌─────────────────────────────────────────┐
│  📅 Timeline                            │
│                                         │
│  2010 ────● [Marriage] ✓               │
│            │ 12th June 2010             │
│            │ [Edit] [Delete]            │
│            │                            │
│            ▼ Edit Mode:                 │
│  ┌─────────────────────────────────┐    │
│  │ Event: [Marriage Ceremony    ▼]│    │
│  │       or [Custom: _____________]│    │
│  │                                │    │
│  │ Date: [12/06/2010]            │    │
│  │ Time: [11:30 AM] (optional)   │    │
│  │                                │    │
│  │ Category:                     │    │
│  │ [▼ Adult Life → Marriage]     │    │
│  │       or [+ New Category]     │    │
│  │                                │    │
│  │ Description:                  │    │
│  │ [Traditional Hindu wedding   ]│    │
│  │                                │    │
│  │ [Cancel] [Save Changes]       │    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

### 3. Inline Editing in Form

```tsx
// When adding event, inline editing:
<FormField label="Event Type">
  <select value={selectedEvent} onChange={handleChange}>
    <optgroup label="💍 Marriage">
      <option>Wedding Ceremony</option>
      <option>Engagement</option>
      <option>Custom: [Edit Name] ✏️</option>
    </optgroup>
    <optgroup label="👶 Children">
      <option>First Child Birth</option>
      <option>Custom: [Edit Name] ✏️</option>
    </optgroup>
    
    {/* Custom Categories User Created */}
    <optgroup label="🎯 My Custom Events">
      <option>Started Gym 💪</option>
      <option>Got Tattoo 🎨</option>
    </optgroup>
    
    <option value="new">+ Create New Event</option>
  </select>
  
  {/* Quick Edit Icon */}
  <button onClick={editCurrentEvent}>✏️ Edit This Event Name</button>
</FormField>
```

### 4. Category Management

```tsx
// User can manage their custom categories:
┌─────────────────────────────────────────┐
│  📂 My Categories                       │
│                                         │
│  Default Categories:                    │
│  ✓ Childhood     ✓ Teen Years          │
│  ✓ Adult Life    ✓ Senior Years        │
│  ✓ Spiritual     ✓ Trauma              │
│                                         │
│  My Custom Categories:                  │
│  [🎨 Hobbies] [3 events] [Edit] [Del]  │
│  [🏃 Fitness] [2 events] [Edit] [Del]  │
│                                         │
│  [+ Create New Category]                │
└─────────────────────────────────────────┘
```

---

## 📊 SUMMARY: EVENTS TO ADD

| Category | Events Count | Priority |
|----------|--------------|----------|
| Hindu Sanskars | 16 | CRITICAL |
| Childhood | 12 | HIGH |
| Adolescent | 14 | HIGH |
| Adult Life | 45+ | CRITICAL |
| Senior Years | 16 | HIGH |
| Spiritual | 28 | MEDIUM |
| Trauma | 27 | CRITICAL |
| Family | 18 | HIGH |
| **TOTAL** | **~170** | - |

---

## ✅ IMPLEMENTATION CHECKLIST

- [ ] Create all event objects with age/gender filters
- [ ] Implement smart suggestions based on DOB
- [ ] Add Custom Event modal
- [ ] Add Custom Category creation
- [ ] Enable inline editing of event names
- [ ] Enable category reassignment
- [ ] User category management page
- [ ] Store custom events in user profile
- [ ] Sync custom events across devices

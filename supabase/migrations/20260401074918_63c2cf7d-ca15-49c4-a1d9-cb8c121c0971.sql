
CREATE TABLE public.company_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL DEFAULT '',
  msme BOOLEAN NOT NULL DEFAULT false,
  startup BOOLEAN NOT NULL DEFAULT false,
  pan TEXT DEFAULT '',
  tan TEXT DEFAULT '',
  gst TEXT DEFAULT '',
  cin TEXT DEFAULT '',
  dpiit_number TEXT DEFAULT '',
  udyam_number TEXT DEFAULT '',
  address TEXT DEFAULT '',
  contact_person TEXT DEFAULT '',
  contact_email TEXT DEFAULT '',
  contact_phone TEXT DEFAULT '',
  annual_turnover TEXT DEFAULT '',
  years_experience TEXT DEFAULT '',
  employees_count TEXT DEFAULT '',
  certifications TEXT[] DEFAULT '{}',
  past_projects TEXT[] DEFAULT '{}',
  bank_name TEXT DEFAULT '',
  bank_account TEXT DEFAULT '',
  ifsc_code TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Allow public read/write for now (no auth yet - device-based)
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read and write (since no auth is implemented yet)
CREATE POLICY "Allow public access to company_profiles"
  ON public.company_profiles
  FOR ALL
  USING (true)
  WITH CHECK (true);

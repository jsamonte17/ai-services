// update.lead.interface.ts
export interface UpdateLead {
  contactId?: string;
  userId?: string;
  fullName?: string;
  email?: string;
  contactNo?: string;
  senderPsid?: string;
  age?: '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65 and above';
  sex?: 'Male' | 'Female' | 'Intersex' | 'Prefer not to respond';
  city?: string;
  employmentSector?: 'Private' | 'Public' | 'Self-Employed';
  source?: 'facebook' | 'web-app' | 'intercom';
}

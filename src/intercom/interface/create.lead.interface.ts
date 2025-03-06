// create.lead.interface.ts

export interface FindOrCreateInitialLeadInterface {
  senderPsid: string;
  fullName?: string;
  source?: string;
}

export interface CreateInitialLeadInterface {
  fullName: string;
  senderPsid: string;
  source: 'facebook' | 'web-app' | 'intercom';
}

export interface CreateLead {
  contactId: string;
  userId: string;
  fullName: string;
  email: string;
  contactNo?: string;
  senderPsid?: string;
  age?:
    | '18-24'
    | '25-34'
    | '35-44'
    | '45-54'
    | '55-64'
    | '65 and above'
    | 'Did not specify';
  sex?: 'Male' | 'Female' | 'Intersex' | 'Prefer not to respond';
  city?: string;
  employmentSector?: 'Private' | 'Public' | 'Self-Employed';
  source?: 'facebook' | 'web-app' | 'intercom';
}

export interface CreateIntercomLead {
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  signedUpAt?: number; // timestamp
  lastSeenAt?: number; // timestamp
  ownerId?: string;
  isUnsubscribedFromEmails?: boolean;
  customAttributes?: {
    Age:
      | '18-24'
      | '25-34'
      | '35-44'
      | '45-54'
      | '55-64'
      | '65 and above'
      | 'Did not specify';
    Sex: 'Male' | 'Female' | 'Intersex' | 'Prefer not to respond';
    City: string;
    EmploymentSector: 'Private' | 'Public' | 'Self-Employed';
    Source: 'facebook' | 'web-app' | 'intercom';
  };
}

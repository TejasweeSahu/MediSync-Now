
export interface Patient {
  id: string;
  name: string;
  age: number;
  diagnosis: string;
  history: string;
  avatarUrl?: string;
  prescriptions?: string[]; // Added to store prescription texts
}

export interface Appointment {
  id: string;
  patientName: string;
  patientAge?: number;
  symptoms: string;
  doctorId: string;
  doctorName: string;
  appointmentDate: string; // ISO string or a specific format
  status: 'Scheduled' | 'Completed' | 'Cancelled';
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  medication: string;
  dosage: string;
  frequency: string;
  notes?: string;
  dateIssued: string; // ISO string
}

export interface SuggestedPrescription {
  prescriptionSuggestion: string;
  additionalNotes?: string;
}

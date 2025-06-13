
import { config } from 'dotenv';
config();

import '@/ai/flows/doctor-summary.ts';
import '@/ai/flows/suggest-prescription.ts';
import '@/ai/flows/parse-appointment-transcript-flow.ts';

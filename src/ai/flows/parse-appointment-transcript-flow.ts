
'use server';
/**
 * @fileOverview An AI agent to parse appointment details from a voice transcript.
 *
 * - parseAppointmentTranscript - A function that handles parsing the transcript.
 * - ParseAppointmentTranscriptInput - The input type for the parseAppointmentTranscript function.
 * - ParseAppointmentTranscriptOutput - The return type for the parseAppointmentTranscript function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ParseAppointmentTranscriptInputSchema = z.object({
  transcript: z.string().describe('The raw voice transcript of the appointment request.'),
  currentDate: z.string().describe('The current date in YYYY-MM-DD format, to help resolve relative dates like "tomorrow".'),
});
export type ParseAppointmentTranscriptInput = z.infer<typeof ParseAppointmentTranscriptInputSchema>;

const ParseAppointmentTranscriptOutputSchema = z.object({
  patientName: z.string().optional().describe('The extracted name of the patient. e.g., "John Doe"'),
  patientAge: z.number().optional().describe('The extracted age of the patient as a number. e.g., 34'),
  symptoms: z.string().optional().describe('The extracted symptoms described by the patient. e.g., "cough and fever"'),
  doctorQuery: z.string().optional().describe('The name or part of the name of the doctor mentioned. e.g., "Dr. Smith" or "Smith"'),
  appointmentDateYYYYMMDD: z.string().optional().describe('The extracted appointment date, converted to YYYY-MM-DD format. Use the currentDate input to resolve relative dates. e.g., if currentDate is 2023-10-26, "tomorrow" becomes "2023-10-27".'),
  appointmentTimeHHMM: z.string().optional().describe('The extracted appointment time, converted to HH:MM (24-hour) format. For general times like "morning", use "09:00"; "afternoon", "14:00"; "evening", "18:00".'),
});
export type ParseAppointmentTranscriptOutput = z.infer<typeof ParseAppointmentTranscriptOutputSchema>;

export async function parseAppointmentTranscript(input: ParseAppointmentTranscriptInput): Promise<ParseAppointmentTranscriptOutput> {
  return parseAppointmentTranscriptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'parseAppointmentTranscriptPrompt',
  input: {schema: ParseAppointmentTranscriptInputSchema},
  output: {schema: ParseAppointmentTranscriptOutputSchema},
  prompt: `You are an AI assistant helping a front desk operator book medical appointments.
Your task is to parse the provided voice transcript and extract the following details:
- Patient's full name (patientName)
- Patient's age as a number (patientAge)
- Patient's symptoms (symptoms)
- The name or part of the name of the doctor the patient wants to see (doctorQuery)
- The desired appointment date (appointmentDateYYYYMMDD)
- The desired appointment time (appointmentTimeHHMM)

Transcript:
"{{{transcript}}}"

Current Date (for reference): {{{currentDate}}}

Guidelines for extraction:
- If any piece of information is not clearly mentioned, omit that field or return it as undefined.
- For appointmentDateYYYYMMDD:
  - Convert relative dates like "today", "tomorrow", "next Monday" into YYYY-MM-DD format based on the provided 'currentDate'.
  - If a specific date is mentioned (e.g., "October 27th"), use that. Assume the current year if not specified.
- For appointmentTimeHHMM:
  - Convert times to HH:MM (24-hour) format.
  - For general times: "morning" use "09:00", "afternoon" use "14:00", "evening" use "18:00".
  - If a specific time is mentioned (e.g., "3 PM", "10:30 AM"), convert it.

Example 1:
Transcript: "I need to see Dr. Jones for a headache tomorrow morning."
Current Date: "2023-10-26"
Output:
  doctorQuery: "Dr. Jones" (or "Jones")
  symptoms: "headache"
  appointmentDateYYYYMMDD: "2023-10-27"
  appointmentTimeHHMM: "09:00"

Example 2:
Transcript: "Book an appointment for Sarah Connor, she is 35 years old and has a sore throat, with Dr. Peterson for next Tuesday at 2:30 PM."
Current Date: "2023-10-26" (assuming next Tuesday is 2023-10-31)
Output:
  patientName: "Sarah Connor"
  patientAge: 35
  symptoms: "sore throat"
  doctorQuery: "Dr. Peterson" (or "Peterson")
  appointmentDateYYYYMMDD: "2023-10-31"
  appointmentTimeHHMM: "14:30"

Focus on extracting the information as accurately as possible based on the transcript and current date.
`,
});

const parseAppointmentTranscriptFlow = ai.defineFlow(
  {
    name: 'parseAppointmentTranscriptFlow',
    inputSchema: ParseAppointmentTranscriptInputSchema,
    outputSchema: ParseAppointmentTranscriptOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);


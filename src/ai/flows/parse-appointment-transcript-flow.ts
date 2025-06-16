
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
  patientAge: z.number().optional().describe('The extracted age of the patient as a number. e.g., 34. If no age is mentioned, or if it is not a clear number, omit this field.'),
  symptoms: z.string().optional().describe('The extracted symptoms described by the patient. e.g., "cough and fever"'),
  doctorQuery: z.string().optional().describe('The extracted name of the doctor. Aim for just the name (e.g., "Smith", "Alisha Mehta"). Avoid titles like "Dr." unless essential. e.g., "Dr. Smith" or "Smith"'),
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
- Patient's age as a number (patientAge). Actively look for a numerical value directly associated with age (e.g., "age 42", "7 years old", "he's ten", "thirty"). The extracted age MUST be a number. If no number is clearly stated as the age, or if it is ambiguous (e.g. "in his thirties" without a specific number), omit the patientAge field.
- Patient's symptoms (symptoms)
- The name or part of the name of the doctor the patient wants to see (doctorQuery). Try to extract just the doctor's name (e.g., "Jones", "Alisha Mehta"). Avoid titles like "Dr." if possible.
- The desired appointment date (appointmentDateYYYYMMDD)
- The desired appointment time (appointmentTimeHHMM)

Transcript:
"{{{transcript}}}"

Current Date (for reference): {{{currentDate}}}

Guidelines for extraction:
- Review the ENTIRE transcript. Prioritize extracting key appointment details for all requested fields (patientName, patientAge, symptoms, doctorQuery, appointmentDateYYYYMMDD, appointmentTimeHHMM) if clearly present. Aim for both accuracy and reasonable speed.
- If a piece of information is not clearly mentioned or is ambiguous, omit that specific field or return it as undefined. Do not guess or infer information that isn't stated.
- For patientAge:
  - If the transcript explicitly mentions the word "age" followed by a number (e.g., "age 42", "age is thirty-five"), extract that number.
  - If phrases like "X years old" or "is X" (where X is a number and context implies age, like "he's ten" or "I am twenty five") are used, extract the number.
  - Convert written-out numbers (e.g., "ten", "forty-five") to digits if they clearly refer to an age.
  - The extracted age MUST be a numerical value. If a number is present near an age-related term but its role as 'age' is uncertain, prioritize clarity; if ambiguous, omit the field.
  - If no explicit number for age is found, or if the context is vague (e.g., "he's in his forties" without a specific number like "he's 45"), omit the patientAge field. Do not guess or infer age without a clear numerical mention.
- For doctorQuery: Focus on the doctor's actual name (e.g., "Peterson", "Mehta"). Avoid titles like "Dr." if possible (e.g., for "Dr. Peterson", "Peterson" is preferred).
- For appointmentDateYYYYMMDD:
  - Convert relative dates like "today", "tomorrow", "next Monday" into YYYY-MM-DD format based on the provided 'currentDate'.
  - If a specific date is mentioned (e.g., "October 27th"), use that. Assume the current year if not specified.
- For appointmentTimeHHMM:
  - Convert times to HH:MM (24-hour) format.
  - For general times: "morning" use "09:00", "afternoon" use "14:00", "evening" use "18:00".
  - If a specific time is mentioned (e.g., "3 PM", "10:30 AM"), convert it.

When the transcript is long, focus on efficiently identifying and extracting the most relevant appointment-related information. Strive for accuracy without excessive deliberation on minor or unclear details.

Example 1:
Transcript: "I need to see Dr. Jones for a headache tomorrow morning."
Current Date: "2023-10-26"
Output:
  doctorQuery: "Jones"
  symptoms: "headache"
  appointmentDateYYYYMMDD: "2023-10-27"
  appointmentTimeHHMM: "09:00"

Example 2:
Transcript: "Book an appointment for Sarah Connor, she is 35 years old and has a sore throat, with Doctor Peterson for next Tuesday at 2:30 PM."
Current Date: "2023-10-26" (assuming next Tuesday is 2023-10-31)
Output:
  patientName: "Sarah Connor"
  patientAge: 35
  symptoms: "sore throat"
  doctorQuery: "Peterson"
  appointmentDateYYYYMMDD: "2023-10-31"
  appointmentTimeHHMM: "14:30"

Example 3:
Transcript: "My son Michael needs a checkup for his allergies with Dr Alisha sometime next week in the afternoon. He's ten."
Current Date: "2024-07-22" (assuming next week starts on 2024-07-29)
Output:
  patientName: "Michael"
  patientAge: 10
  symptoms: "allergies checkup"
  doctorQuery: "Alisha"
  appointmentDateYYYYMMDD: "2024-07-29" (example, actual day depends on AI logic for "next week")
  appointmentTimeHHMM: "14:00"

Example 4:
Transcript: "Patient name Rohit Sharma, Age 34, Symptoms are cough and fever, With Doctor Alisha Mehta on June 20th, 4 PM."
Current Date: "2024-06-18"
Output:
 patientName: "Rohit Sharma"
 patientAge: 34
 symptoms: "cough and fever"
 doctorQuery: "Alisha Mehta"
 appointmentDateYYYYMMDD: "2024-06-20"
 appointmentTimeHHMM: "16:00"


Focus on extracting the information as accurately as possible based on the transcript and current date, while being efficient.
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


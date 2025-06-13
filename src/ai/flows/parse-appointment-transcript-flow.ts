
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

export const ParseAppointmentTranscriptInputSchema = z.object({
  transcript: z.string().describe('The raw voice transcript of the appointment request.'),
});
export type ParseAppointmentTranscriptInput = z.infer<typeof ParseAppointmentTranscriptInputSchema>;

export const ParseAppointmentTranscriptOutputSchema = z.object({
  patientName: z.string().optional().describe('The extracted name of the patient. e.g., "John Doe"'),
  patientAge: z.number().optional().describe('The extracted age of the patient as a number. e.g., 34'),
  symptoms: z.string().optional().describe('The extracted symptoms described by the patient. e.g., "cough and fever"'),
  doctorQuery: z.string().optional().describe('The name or part of the name of the doctor mentioned. e.g., "Dr. Smith" or "Smith"'),
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

Transcript:
"{{{transcript}}}"

If any piece of information is not clearly mentioned in the transcript, omit that field or return it as undefined.
For example, if the transcript is "I need to see Dr. Jones for a headache.", you should extract:
doctorQuery: "Dr. Jones" (or "Jones")
symptoms: "headache"
patientName: undefined
patientAge: undefined

If the transcript is "Book an appointment for Sarah Connor, she is 35 years old and has a sore throat, with Dr. Peterson.", you should extract:
patientName: "Sarah Connor"
patientAge: 35
symptoms: "sore throat"
doctorQuery: "Dr. Peterson" (or "Peterson")

Focus on extracting the information as accurately as possible.
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

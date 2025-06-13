
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Sparkles, FileText, Pill } from 'lucide-react';
import { suggestPrescription } from '@/ai/flows/suggest-prescription';
import type { SuggestPrescriptionInput, SuggestPrescriptionOutput } from '@/ai/flows/suggest-prescription';
import type { Patient } from '@/types';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  symptoms: z.string().min(10, { message: "Symptoms must be at least 10 characters." }),
  diagnosis: z.string().min(5, { message: "Diagnosis must be at least 5 characters." }),
  patientHistory: z.string().optional(),
});

type PrescriptionFormValues = z.infer<typeof formSchema>;

interface PrescriptionGeneratorProps {
  selectedPatient?: Patient | null;
}

export const PrescriptionGenerator: React.FC<PrescriptionGeneratorProps> = ({ selectedPatient }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<SuggestPrescriptionOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<PrescriptionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      symptoms: '',
      diagnosis: '',
      patientHistory: '',
    },
  });

  useEffect(() => {
    if (selectedPatient) {
      form.reset({
        symptoms: '', // Keep symptoms empty for new input
        diagnosis: selectedPatient.diagnosis || '',
        patientHistory: selectedPatient.history || '',
      });
      setSuggestion(null); // Clear previous suggestion when patient changes
    } else {
      form.reset({
        symptoms: '',
        diagnosis: '',
        patientHistory: '',
      });
      setSuggestion(null);
    }
  }, [selectedPatient, form]);

  const onSubmit: SubmitHandler<PrescriptionFormValues> = async (data) => {
    setIsLoading(true);
    setSuggestion(null);
    try {
      const aiInput: SuggestPrescriptionInput = {
        symptoms: data.symptoms,
        diagnosis: data.diagnosis,
        patientHistory: data.patientHistory || 'N/A',
      };
      const result = await suggestPrescription(aiInput);
      setSuggestion(result);
      toast({
        title: "Prescription Suggested",
        description: "AI has generated a prescription suggestion.",
      });
    } catch (error) {
      console.error('Error generating prescription:', error);
      toast({
        title: "Error",
        description: "Failed to generate prescription suggestion. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSavePrescription = () => {
    // Simulate saving prescription
    console.log("Prescription saved (simulated):", suggestion);
    toast({
      title: "Prescription Saved",
      description: "The suggested prescription has been saved (simulated).",
    });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-headline">
          <Sparkles className="text-primary" /> AI Prescription Assistant
        </CardTitle>
        <CardDescription>
          {selectedPatient ? `Generate a prescription suggestion for ${selectedPatient.name}.` : "Enter patient details to generate a prescription suggestion."}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {selectedPatient && (
              <Alert>
                <Pill className="h-4 w-4" />
                <AlertTitle className="font-medium">Patient: {selectedPatient.name}</AlertTitle>
                <AlertDescription>
                  Age: {selectedPatient.age}, Diagnosis: {selectedPatient.diagnosis}
                </AlertDescription>
              </Alert>
            )}
            <FormField
              control={form.control}
              name="symptoms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Symptoms</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Persistent cough, fever, headache for 3 days..." {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="diagnosis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diagnosis</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Acute Bronchitis" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="patientHistory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relevant Patient History (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Allergic to penicillin, history of asthma..." {...field} rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isLoading || !selectedPatient}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Generate Suggestion
            </Button>
          </CardFooter>
        </form>
      </Form>

      {suggestion && (
        <CardContent className="mt-6 border-t pt-6">
          <h3 className="text-xl font-semibold mb-3 flex items-center gap-2"><FileText className="text-accent" /> Suggested Prescription</h3>
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <strong className="block text-sm font-medium text-foreground">Suggestion:</strong>
              <p className="text-foreground whitespace-pre-wrap">{suggestion.prescriptionSuggestion}</p>
            </div>
            {suggestion.additionalNotes && (
              <div>
                <strong className="block text-sm font-medium text-foreground">Additional Notes:</strong>
                <p className="text-foreground whitespace-pre-wrap">{suggestion.additionalNotes}</p>
              </div>
            )}
             <Button onClick={handleSavePrescription} className="mt-4">
                Save Prescription (Simulated)
              </Button>
          </div>
        </CardContent>
      )}
       {!selectedPatient && !isLoading && (
        <CardContent className="mt-4 border-t pt-4">
            <p className="text-center text-muted-foreground">Please select a patient from the list to enable prescription generation.</p>
        </CardContent>
      )}
    </Card>
  );
};

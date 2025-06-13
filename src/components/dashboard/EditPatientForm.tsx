
'use client';

import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Patient } from '@/types';
import { useAppState } from '@/hooks/useAppState';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';

const patientFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  age: z.coerce.number().min(0, { message: "Age must be a positive number." }).max(120),
  diagnosis: z.string().min(3, { message: "Diagnosis must be at least 3 characters." }),
  history: z.string().min(5, { message: "History must be at least 5 characters." }),
  avatarUrl: z.string().url({ message: "Please enter a valid URL for the avatar." }).optional().or(z.literal('')),
});

type PatientFormValues = z.infer<typeof patientFormSchema>;

interface EditPatientFormProps {
  patient: Patient;
  onClose: () => void;
}

export const EditPatientForm: React.FC<EditPatientFormProps> = ({ patient, onClose }) => {
  const { updatePatient } = useAppState();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      name: patient.name,
      age: patient.age,
      diagnosis: patient.diagnosis,
      history: patient.history,
      avatarUrl: patient.avatarUrl || '',
    },
  });

  const onSubmit: SubmitHandler<PatientFormValues> = async (data) => {
    setIsSaving(true);
    try {
      const updatedPatientData: Patient = {
        ...patient, // Retain original ID
        ...data,
        avatarUrl: data.avatarUrl || undefined, // Set to undefined if empty string
      };
      updatePatient(updatedPatientData);
      toast({
        title: "Patient Updated",
        description: `${data.name}'s details have been successfully updated.`,
      });
      onClose(); // Close the dialog
    } catch (error) {
      console.error("Error updating patient:", error);
      toast({
        title: "Error",
        description: "Failed to update patient details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Patient's full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="age"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Age</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Patient's age" {...field} />
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
                <Textarea placeholder="Current diagnosis" {...field} rows={2}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="history"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Medical History</FormLabel>
              <FormControl>
                <Textarea placeholder="Relevant medical history" {...field} rows={3}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="avatarUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Avatar URL (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://placehold.co/100x100.png" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
};

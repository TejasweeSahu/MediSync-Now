
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Mic, MicOff, User, Activity, BriefcaseMedical, CalendarIcon, Loader2 } from 'lucide-react';
import { useAppState } from '@/hooks/useAppState';
import { mockDoctors } from '@/data/mockData';
import type { Doctor } from '@/types';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";


const appointmentFormSchema = z.object({
  patientName: z.string().min(2, { message: "Patient name must be at least 2 characters." }),
  patientAge: z.number().min(0).optional(),
  symptoms: z.string().min(5, { message: "Symptoms must be at least 5 characters." }),
  doctorId: z.string({ required_error: "Please select a doctor." }),
  appointmentDate: z.date({ required_error: "Please select a date and time." }),
});

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

// Extend Window interface for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const VoiceAppointmentForm: React.FC = () => {
  const { addAppointment } = useAppState();
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechApiAvailable, setSpeechApiAvailable] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      patientName: '',
      symptoms: '',
      // Let doctorId and appointmentDate be undefined initially
    },
  });

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      setSpeechApiAvailable(true);
      recognitionRef.current = new SpeechRecognitionAPI();
      const recognition = recognitionRef.current;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const currentTranscript = event.results[0][0].transcript;
        setTranscript(currentTranscript);
        parseTranscript(currentTranscript);
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        toast({ title: "Speech Recognition Error", description: event.error || "Unknown error", variant: "destructive"});
        setIsListening(false);
      };
      
      recognition.onend = () => {
        // isListening state is managed by onresult and onerror
        if (recognitionRef.current && isListening) {
            setIsListening(false); // Ensure listening state is false if recognition ends unexpectedly
        }
      };

    } else {
      setSpeechApiAvailable(false);
      console.warn('Speech Recognition API not available.');
    }
    return () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps: recognition setup once. isListening change should not re-init.

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  const capitalizeName = (name: string) => {
    return name.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  const parseTranscript = (originalText: string) => {
    let text = originalText.toLowerCase();
    let modifiedTranscript = text; // Keep a copy to remove parsed parts

    let patientNameFound = false;
    let patientAgeFound = false;
    let doctorFound = false;
    let symptomsFound = false;

    // Reset fields that will be parsed, keep others (like date)
    form.setValue('patientName', '');
    form.setValue('patientAge', undefined); 
    // Do not reset doctorId here, allow pre-selection or manual choice to persist unless voice overrides
    form.setValue('symptoms', '');

    // 1. Parse Doctor
    // "appointment with dr smith", "for doctor jones"
    const doctorPatterns = [
      /(?:with|for|to see|doctor)\s+dr\.?\s*([\w\s]+?)(?:,|\s+about|\s+regarding|\s+for symptoms|$)/i,
      /dr\.?\s*([\w\s]+?)\s+(?:for|to discuss)/i // "dr smith for cough"
    ];
    for (const pattern of doctorPatterns) {
      const doctorMatch = modifiedTranscript.match(pattern);
      if (doctorMatch && doctorMatch[1]) {
        const doctorNameQuery = doctorMatch[1].trim();
        const foundDoctor = mockDoctors.find(doc => 
          doc.name.toLowerCase().includes(doctorNameQuery) || 
          (doc.name.toLowerCase().split(' ').pop() === doctorNameQuery && doctorNameQuery.length > 2) // Match by surname if query is a single word
        );
        if (foundDoctor) {
          form.setValue('doctorId', foundDoctor.id);
          modifiedTranscript = modifiedTranscript.replace(doctorMatch[0], "").trim();
          doctorFound = true;
          break;
        }
      }
    }
    
    // 2. Parse Patient Name
    // "patient john doe", "name is jane", "appointment for peter"
    const namePatterns = [
      /(?:patient name is|patient is|patient|for|name is|name)\s+([a-zA-Z]{2,}(?:\s+[a-zA-Z]{2,})+)(?:,|\s+age(?:d)? is|\s+is about|\s+experiencing|$)/i, // Full name
      /(?:patient name is|patient is|patient|for|name is|name)\s+([a-zA-Z]{2,})(?:,|\s+age(?:d)? is|\s+is about|\s+experiencing|$)/i // Single name
    ];
    for (const pattern of namePatterns) {
      const nameMatch = modifiedTranscript.match(pattern);
      if (nameMatch && nameMatch[1]) {
        const extractedName = nameMatch[1].trim();
        form.setValue('patientName', capitalizeName(extractedName));
        modifiedTranscript = modifiedTranscript.replace(nameMatch[0], "").trim();
        patientNameFound = true;
        break;
      }
    }

    // 3. Parse Patient Age
    // "34 years old", "age 34", "is 25"
    const ageMatch = modifiedTranscript.match(/(?:age(?:d)? is|age|is)\s+(\d{1,2})(?:\s+years old)?/i);
    if (ageMatch && ageMatch[1]) {
      const ageVal = parseInt(ageMatch[1], 10);
      if (!isNaN(ageVal) && ageVal >= 0 && ageVal < 130) { // Basic validation for age
        form.setValue('patientAge', ageVal);
        modifiedTranscript = modifiedTranscript.replace(ageMatch[0], "").trim();
        patientAgeFound = true;
      }
    }
    
    // 4. Parse Symptoms (from remaining text or specific keywords)
    // "experiencing cough and fever", "symptoms of headache"
    const specificSymptomsMatch = modifiedTranscript.match(/(?:experiencing|symptoms of|symptoms are|suffering from|complaining of|regarding|about|for)\s+(.+)/i);
    if (specificSymptomsMatch && specificSymptomsMatch[1]) {
      let rawSymptoms = specificSymptomsMatch[1].trim();
       // Remove any trailing conjunctions or prepositions that might lead to doctor name again
      rawSymptoms = rawSymptoms.replace(/\s+(?:with|for|and|to see)\s+dr\.?.*$/i, '').trim();
      form.setValue('symptoms', capitalizeFirstLetter(rawSymptoms));
      symptomsFound = true;
    } else if (modifiedTranscript.length > 3) { // If substantial text remains after other parsing
      // Clean up remaining common intro/linking phrases
      let remainingSymptoms = modifiedTranscript.replace(/^(?:and|also|with|for)\s+/i, '').trim();
      if (remainingSymptoms.length > 3) {
        form.setValue('symptoms', capitalizeFirstLetter(remainingSymptoms));
        symptomsFound = true;
      }
    }

    // Final check: if no fields were populated but there was a transcript, put it in symptoms
    if (!patientNameFound && !patientAgeFound && !doctorFound && !symptomsFound && originalText.length > 0) {
      form.setValue('symptoms', capitalizeFirstLetter(originalText));
      toast({ title: "Transcript Not Parsed", description: "Could not extract details. Original transcript placed in symptoms. Please review.", variant: "default" });
    } else if (patientNameFound || patientAgeFound || doctorFound || symptomsFound) {
      toast({ title: "Transcript Processed", description: "Form fields updated based on speech. Please verify." });
    } else {
       toast({ title: "No Details Parsed", description: "Could not extract details from speech. Please fill the form manually.", variant: "default" });
    }
  };

  const toggleListening = () => {
    if (!speechApiAvailable) {
      toast({ title: "Feature Unavailable", description: "Speech recognition is not supported in your browser.", variant: "destructive"});
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      // Clear previous transcript visual cue
      setTranscript(''); 
      // Clear form fields that are typically parsed by voice before starting new recognition
      form.reset({ 
        ...form.getValues(), // keep existing values like date/time or manually entered doctor
        patientName: '', 
        patientAge: undefined, 
        symptoms: '' 
      });
      recognitionRef.current.start();
      setIsListening(true);
      toast({ title: "Listening...", description: "Please speak now."});
    }
  };

  const onSubmit: SubmitHandler<AppointmentFormValues> = (data) => {
    const selectedDoctor = mockDoctors.find(doc => doc.id === data.doctorId);
    if (!selectedDoctor) {
      toast({ title: "Error", description: "Selected doctor not found.", variant: "destructive"});
      return;
    }
    
    const appointmentData = {
      ...data,
      patientAge: data.patientAge, // Ensure age is passed correctly
      doctorName: selectedDoctor.name,
      appointmentDate: data.appointmentDate.toISOString(),
    };
    addAppointment(appointmentData);
    toast({ title: "Appointment Booked!", description: `Appointment for ${data.patientName} with ${selectedDoctor.name} has been scheduled.`});
    form.reset(); // Reset all fields after successful submission
    setTranscript('');
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-headline">
          <Mic className="text-primary" /> Voice Appointment Booking
        </CardTitle>
        <CardDescription>Use your voice or fill the form to book an appointment. Please verify auto-filled details.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <Button
                type="button"
                onClick={toggleListening}
                variant={isListening ? "destructive" : "default"}
                size="lg"
                className="w-full sm:w-auto"
                disabled={!speechApiAvailable}
              >
                {isListening ? (
                  <>
                    <MicOff className="mr-2 h-5 w-5" /> Stop Listening
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-5 w-5" /> Start Voice Input
                  </>
                )}
              </Button>
              {!speechApiAvailable && <p className="text-sm text-destructive">Speech recognition not available in this browser.</p>}
              {transcript && (
                <p className="text-sm text-muted-foreground italic">Transcript: "{transcript}"</p>
              )}
            </div>

            <FormField
              control={form.control}
              name="patientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1"><User size={16}/>Patient Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Rohan Sharma" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="patientAge"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1"><User size={16}/>Patient Age (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                        type="number" 
                        placeholder="e.g., 34" 
                        {...field} 
                        value={field.value === undefined ? '' : field.value} // Handle undefined for controlled number input
                        onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value))} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="symptoms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1"><Activity size={16}/>Symptoms</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Cough and fever" {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="doctorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1"><BriefcaseMedical size={16}/>Doctor</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""} >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a doctor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {mockDoctors.map((doc: Doctor) => (
                        <SelectItem key={doc.id} value={doc.id}>
                          {doc.name} - {doc.specialty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="appointmentDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="flex items-center gap-1"><CalendarIcon size={16}/>Appointment Date & Time</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP HH:mm")
                          ) : (
                            <span>Pick a date and time</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                            if (date) {
                                const currentHours = field.value ? field.value.getHours() : new Date().getHours();
                                const currentMinutes = field.value ? field.value.getMinutes() : new Date().getMinutes();
                                date.setHours(currentHours);
                                date.setMinutes(currentMinutes);
                                field.onChange(date);
                            }
                        }}
                        disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1)) } // Disable past dates
                        initialFocus
                      />
                       <div className="p-3 border-t border-border">
                            <Label htmlFor="time">Time</Label>
                            <Input 
                                type="time" 
                                id="time"
                                value={field.value ? format(field.value, "HH:mm") : format(new Date(), "HH:mm")}
                                onChange={(e) => {
                                    const newTime = e.target.value;
                                    const [hours, minutes] = newTime.split(':').map(Number);
                                    const newDate = field.value ? new Date(field.value) : new Date();
                                    newDate.setHours(hours);
                                    newDate.setMinutes(minutes);
                                    field.onChange(newDate);
                                }}
                            />
                        </div>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Book Appointment
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

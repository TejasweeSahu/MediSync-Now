
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
    },
  });

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechApiAvailable(true);
      recognitionRef.current = new SpeechRecognition();
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
        toast({ title: "Speech Recognition Error", description: event.error, variant: "destructive"});
        setIsListening(false);
      };
      
      recognition.onend = () => {
        if(isListening) setIsListening(false); // Ensure listening state is false if recognition ends unexpectedly
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
  }, []); // isListening removed from deps to prevent re-initialization on state change

  const parseTranscript = (text: string) => {
    // Example: "Book appointment for Rohan, 34, with cough and fever, for Dr. Mehta."
    // This is a very basic parser. A real app would use NLP.
    form.setValue('symptoms', text); // For now, put full transcript in symptoms
    
    const nameMatch = text.match(/for ([\w\s]+)(, \d+|,)/i);
    if (nameMatch && nameMatch[1]) {
      form.setValue('patientName', nameMatch[1].trim());
    }

    const ageMatch = text.match(/, (\d+),/);
    if (ageMatch && ageMatch[1]) {
      form.setValue('patientAge', parseInt(ageMatch[1], 10));
    }

    const doctorMatch = text.match(/for Dr. ([\w\s]+)/i);
    if (doctorMatch && doctorMatch[1]) {
      const doctorName = `Dr. ${doctorMatch[1].trim()}`;
      const foundDoctor = mockDoctors.find(doc => doc.name.toLowerCase() === doctorName.toLowerCase());
      if (foundDoctor) {
        form.setValue('doctorId', foundDoctor.id);
      }
    }
    toast({ title: "Transcript Processed", description: "Form fields updated based on speech." });
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
      recognitionRef.current.start();
      setIsListening(true);
      setTranscript(''); // Clear previous transcript
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
      doctorName: selectedDoctor.name,
      appointmentDate: data.appointmentDate.toISOString(),
    };
    addAppointment(appointmentData);
    toast({ title: "Appointment Booked!", description: `Appointment for ${data.patientName} with ${selectedDoctor.name} has been scheduled.`});
    form.reset();
    setTranscript('');
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-headline">
          <Mic className="text-primary" /> Voice Appointment Booking
        </CardTitle>
        <CardDescription>Use your voice or fill the form to book an appointment.</CardDescription>
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
                    <Input type="number" placeholder="e.g., 34" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                                const now = new Date();
                                date.setHours(now.getHours());
                                date.setMinutes(now.getMinutes());
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
                                defaultValue={field.value ? format(field.value, "HH:mm") : format(new Date(), "HH:mm")}
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

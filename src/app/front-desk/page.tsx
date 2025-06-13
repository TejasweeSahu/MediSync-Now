
import { AppShell } from '@/components/layout/AppShell';
import { VoiceAppointmentForm } from '@/components/front-desk/VoiceAppointmentForm';

export default function FrontDeskPage() {
  return (
    <AppShell>
      <div className="container mx-auto py-2">
        <h1 className="text-3xl font-bold mb-8 font-headline text-primary text-center">Front Desk - Appointment System</h1>
        <VoiceAppointmentForm />
      </div>
    </AppShell>
  );
}


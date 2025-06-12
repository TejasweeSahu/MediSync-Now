import { LoginForm } from '@/components/auth/LoginForm';
import { Logo } from '@/components/shared/Logo';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <div className="mb-10">
        <Logo iconSize={48} textSize="text-5xl" />
      </div>
      <LoginForm />
    </div>
  );
}

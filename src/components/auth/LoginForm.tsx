
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, KeyRound, User, Mail, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { defaultDoctor } from '@/data/mockData'; // To get a default email for placeholder

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState<string>(defaultDoctor.email); // Default to a mock doctor's email
  const [password, setPassword] = useState<string>('password'); // Default password for dev
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { login, sendPasswordReset } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      // AuthContext's onAuthStateChanged will set isLoading to false and redirect if successful.
      // Router push will happen via AppShell or HomePage due to auth state change.
      // We show a success toast here as direct feedback from login action.
      toast({
        title: "Login Successful",
        description: `Welcome back! Redirecting to dashboard...`,
      });
      // The redirection is handled by the root page or AppShell based on isAuthenticated.
      // Explicit router.push('/dashboard') here might be redundant if page.tsx handles it,
      // but can be kept if direct navigation post-login is desired immediately.
      router.push('/dashboard'); 
    } catch (error: any) {
      console.error("Firebase login error:", error);
      let errorMessage = "Login failed. Please check your credentials.";
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            errorMessage = "Invalid email or password.";
            break;
          case 'auth/invalid-email':
            errorMessage = "The email address is not valid.";
            break;
          case 'auth/too-many-requests':
            errorMessage = "Too many login attempts. Please try again later or reset your password.";
            break;
          default:
            errorMessage = error.message || "An unexpected error occurred.";
        }
      }
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address to reset your password.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      await sendPasswordReset(email);
      toast({
        title: "Password Reset Email Sent",
        description: "If an account exists for this email, a password reset link has been sent.",
      });
    } catch (error: any) {
      console.error("Firebase password reset error:", error);
      let errorMessage = "Failed to send password reset email. Please try again.";
      if (error.code === 'auth/user-not-found') {
          errorMessage = "No account found with this email address.";
      } else if (error.code === 'auth/invalid-email') {
          errorMessage = "The email address is not valid.";
      }
      toast({
        title: "Password Reset Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader>
        <CardTitle className="text-3xl font-headline">Doctor Login</CardTitle>
        <CardDescription>Access your MediSync Now dashboard.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="doctor@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10"
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
               <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pr-10 pl-10"
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </Button>
            </div>
             <div className="text-right">
                <Button type="button" variant="link" size="sm" onClick={handlePasswordReset} disabled={isLoading} className="px-0">
                    Forgot Password?
                </Button>
            </div>
          </div>
           <p className="text-xs text-muted-foreground">
              For demo, use email: <code className="font-code bg-muted px-1 py-0.5 rounded">{defaultDoctor.email}</code> and password: <code className="font-code bg-muted px-1 py-0.5 rounded">password</code> (or any of the mock doctor emails with a password you set in Firebase Auth).
            </p>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full text-base py-6" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Login
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

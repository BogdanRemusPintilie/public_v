import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { ArrowRight, Lock, Mail, AlertCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { loginSchema, sanitizeInput } from '@/utils/validation';
import { useEffect } from 'react';
const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const {
    login,
    isAuthenticated
  } = useAuth();
  const {
    toast
  } = useToast();
  const [searchParams] = useSearchParams();

  // Check for verification errors in URL parameters
  useEffect(() => {
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    if (error) {
      console.log('URL contains auth error:', error, errorDescription);
      if (error === 'access_denied' && errorDescription?.includes('Email link is invalid')) {
        toast({
          title: "Email Verification Failed",
          description: "The verification link has expired or has already been used. Please try signing up again or contact support if you continue to have issues.",
          variant: "destructive"
        });
      } else if (error === 'server_error') {
        toast({
          title: "Authentication Error",
          description: "There was a server error during authentication. Please try again or contact support.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Authentication Error",
          description: errorDescription || "An error occurred during authentication. Please try again.",
          variant: "destructive"
        });
      }
    }
  }, [searchParams, toast]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log('User is authenticated, redirecting to dashboard');
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', { email });
    setIsLoading(true);
    setErrors({});
    try {
      // Sanitize inputs
      const sanitizedEmail = sanitizeInput(email);
      const sanitizedPassword = sanitizeInput(password);
      console.log('Sanitized inputs:', {
        email: sanitizedEmail,
        passwordLength: sanitizedPassword.length
      });

      // Validate inputs
      const validationResult = loginSchema.safeParse({
        email: sanitizedEmail,
        password: sanitizedPassword
      });
      if (!validationResult.success) {
        console.log('Validation failed:', validationResult.error.errors);
        const fieldErrors: Record<string, string> = {};
        validationResult.error.errors.forEach(error => {
          if (error.path[0]) {
            fieldErrors[error.path[0] as string] = error.message;
          }
        });
        setErrors(fieldErrors);
        setIsLoading(false);
        return;
      }
      console.log('Validation passed, attempting login...');

      // Attempt login
      const { error } = await login(sanitizedEmail, sanitizedPassword);
      if (error) {
        console.error('Auth error:', error);
        if (error.message?.includes('Invalid login credentials')) {
          toast({
            title: "Authentication Failed",
            description: "Invalid email or password. Please try again.",
            variant: "destructive"
          });
        } else if (error.message?.includes('Email not confirmed')) {
          toast({
            title: "Email Not Verified",
            description: "Please check your email and click the verification link before signing in.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Login Failed",
            description: error.message || "An unexpected error occurred. Please try again.",
            variant: "destructive"
          });
        }
      } else {
        console.log('Login successful');
        toast({
          title: "Login Successful",
          description: "Welcome to RiskBlocs Platform"
        });
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Authentication Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <img src="/lovable-uploads/e976cf33-12c9-4927-8899-fd3e3963f4f7.png" alt="RiskBlocs Logo" className="h-10 w-10" />
            <span className="text-2xl font-bold text-gray-900 font-poppins">RiskBlocs</span>
          </div>
          <p className="text-gray-600">Secure access to your risk management platform</p>
        </div>

        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Sign In
            </CardTitle>
            <CardDescription className="text-gray-600">
              Sign in to your RiskBlocs account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Email alias warning */}
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Email Notice:</p>
                <p>If you're using an email alias, make sure to use the same email address consistently.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-sm font-medium text-gray-700 flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Address
                </Label>
                <Input id="login-email" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} className={`h-11 ${errors.email ? 'border-red-500' : ''}`} required disabled={isLoading} />
                {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-sm font-medium text-gray-700 flex items-center">
                  <Lock className="h-4 w-4 mr-2" />
                  Password
                </Label>
                <Input id="login-password" type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} className={`h-11 ${errors.password ? 'border-red-500' : ''}`} required disabled={isLoading} />
                {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
              </div>
              <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium" disabled={isLoading}>
                {isLoading ? <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </> : <>
                    Sign In
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <a href="/" className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
                ← Back to Home
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default Auth;
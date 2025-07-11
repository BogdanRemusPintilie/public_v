
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from 'lucide-react';

interface LoginPopupProps {
  isOpen: boolean;
  onLogin: (success: boolean) => void;
}

const LoginPopup: React.FC<LoginPopupProps> = ({ isOpen, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Check credentials
    if (username === 'RiskBlocsDemo' && password === 'RandomPivot') {
      // Store login status in localStorage
      localStorage.setItem('homepageAuthenticated', 'true');
      onLogin(true);
    } else {
      setError('Invalid username or password. Please try again.');
      onLogin(false);
    }

    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <img src="/lovable-uploads/e976cf33-12c9-4927-8899-fd3e3963f4f7.png" alt="RiskBlocs Logo" className="h-12 w-12" />
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-900">Welcome to RiskBlocs</DialogTitle>
          <DialogDescription className="text-gray-600">
            Please enter your credentials to access the platform
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
              autoComplete="username"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              autoComplete="current-password"
            />
          </div>
          
          {error && (
            <div className="flex items-center space-x-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>
        
        <div className="text-center text-sm text-gray-500 mt-4">
          Contact RiskBlocs for access credentials
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginPopup;

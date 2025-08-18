import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ShareTransactionOverview = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const investorId = searchParams.get('investorId');
  const offerName = searchParams.get('offerName') || 'Transaction';
  
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(`Dear Investor,

Please find attached the transaction overview for ${offerName}. This document contains detailed information about the structure, tranches, and risk characteristics.

Best regards,
The RiskBlocs Team`);
  const [isLoading, setIsLoading] = useState(false);

  const handleShare = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Transaction Overview Shared",
        description: `Overview has been sent to ${email}`,
      });
      setIsLoading(false);
      navigate(-1); // Go back to previous page
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Share Transaction Overview</h1>
            <p className="text-muted-foreground">Send detailed transaction information to investor</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Share Details
            </CardTitle>
            <CardDescription>
              Enter the investor's email address and customize the message
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Recipient Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="investor@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Enter your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
              />
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-medium mb-2">Transaction Overview will include:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Structure summary and tranche details</li>
                <li>• Risk characteristics and ratings</li>
                <li>• Payment waterfall information</li>
                <li>• Key terms and conditions</li>
                <li>• Portfolio composition overview</li>
              </ul>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleShare} 
                disabled={isLoading}
                className="flex-1"
              >
                <Send className="h-4 w-4 mr-2" />
                {isLoading ? 'Sending...' : 'Send Transaction Overview'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ShareTransactionOverview;
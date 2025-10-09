import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { IssueOfferForm } from '@/components/matched-market/IssueOfferForm';

const IssueOffer = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold mb-2">Issue New Offer</h1>
            <p className="text-muted-foreground">
              Create a new matched market offer by selecting a tranche structure and targeting investors
            </p>
          </div>
        </div>

        <IssueOfferForm onSuccess={() => navigate('/matched-market/manage-offers')} />
      </div>
    </div>
  );
};

export default IssueOffer;

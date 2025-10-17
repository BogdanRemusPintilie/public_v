import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, X } from 'lucide-react';

const CompletedTransactions = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/matched-market/transaction-hub')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Transaction Hub
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/dashboard')}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <div>
            <h1 className="text-3xl font-bold mb-2">Completed Transactions</h1>
            <p className="text-muted-foreground">
              Review all completed matched market transactions
            </p>
          </div>
        </div>

        <div className="bg-card rounded-lg border shadow-md p-6">
          <p className="text-muted-foreground">No completed transactions yet.</p>
        </div>
      </div>
    </div>
  );
};

export default CompletedTransactions;

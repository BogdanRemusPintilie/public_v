import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Eye, Info } from 'lucide-react';
import { ManageOffersView } from '@/components/matched-market/ManageOffersView';

const ManageOffers = () => {
  const navigate = useNavigate();
  const [showKey, setShowKey] = useState(false);

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
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Transaction Hub</h1>
              <p className="text-muted-foreground">
                Track your offers through the transaction pipeline
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button 
                variant="outline"
                onClick={() => setShowKey(!showKey)}
              >
                <Info className="mr-2 h-4 w-4" />
                Key
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => navigate('/matched-market/completed-transactions')}
              >
                <Eye className="mr-2 h-4 w-4" />
                Review Completed Transactions
              </Button>
              
              <Button onClick={() => navigate('/matched-market/issue-offer')}>
                <Plus className="mr-2 h-4 w-4" />
                Create Offer
              </Button>
            </div>
          </div>
        </div>

        {showKey && (
          <div className="mb-4 p-4 bg-muted/50 rounded-lg border">
            <h3 className="font-semibold text-sm mb-3">Transaction Stage Key</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-muted border rounded"></div>
                <span>Not reached yet</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-500 rounded"></div>
                <span>Stage opened</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-amber-500 rounded"></div>
                <span>In process</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-purple-500 rounded"></div>
                <span>Completed</span>
              </div>
            </div>
          </div>
        )}

        <ManageOffersView />
      </div>
    </div>
  );
};

export default ManageOffers;

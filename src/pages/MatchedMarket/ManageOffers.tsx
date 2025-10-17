import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Eye } from 'lucide-react';
import { ManageOffersView } from '@/components/matched-market/ManageOffersView';

const ManageOffers = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            
            <h1 className="text-3xl font-bold mb-2">Manage Offers</h1>
            <p className="text-muted-foreground">
              View and manage your matched market offers
            </p>
          </div>

          <div className="flex items-center gap-3">
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

        <ManageOffersView />
      </div>
    </div>
  );
};

export default ManageOffers;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import ManageNDAComponent from '@/components/matched-market/ManageNDA';

const ManageNDA = () => {
  const navigate = useNavigate();

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
            <h1 className="text-3xl font-bold mb-2">Manage NDAs</h1>
            <p className="text-muted-foreground">
              Review and respond to NDAs sent by issuers
            </p>
          </div>
        </div>

        <ManageNDAComponent />
      </div>
    </div>
  );
};

export default ManageNDA;

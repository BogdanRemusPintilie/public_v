
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { createDemoDataLite } from '@/utils/createDemoDataLite';
import { Database, Loader2 } from 'lucide-react';

interface CreateDemoDataButtonProps {
  onDatasetCreated?: () => void;
}

export const CreateDemoDataButton: React.FC<CreateDemoDataButtonProps> = ({ 
  onDatasetCreated 
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleCreateDemoData = async () => {
    try {
      setIsCreating(true);
      console.log('🔄 Creating Demo Data Lite...');
      
      await createDemoDataLite();
      
      toast({
        title: "Demo Data Created",
        description: "Demo Data Lite dataset has been successfully created with 50 sample loan records.",
      });
      
      if (onDatasetCreated) {
        onDatasetCreated();
      }
    } catch (error) {
      console.error('❌ Error creating demo data:', error);
      toast({
        title: "Error Creating Demo Data",
        description: "Failed to create Demo Data Lite dataset. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Button
      onClick={handleCreateDemoData}
      disabled={isCreating}
      variant="outline"
      className="flex items-center gap-2"
    >
      {isCreating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Database className="h-4 w-4" />
      )}
      {isCreating ? 'Creating Demo Data...' : 'Create Demo Data Lite'}
    </Button>
  );
};

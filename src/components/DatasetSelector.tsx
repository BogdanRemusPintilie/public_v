
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getAccessibleDatasets } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Database, Loader2 } from 'lucide-react';

interface DatasetSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDataset: (datasetName: string) => void;
  refreshTrigger?: number;
}

const DatasetSelector: React.FC<DatasetSelectorProps> = ({ 
  isOpen, 
  onClose, 
  onSelectDataset,
  refreshTrigger = 0
}) => {
  const [datasets, setDatasets] = useState<{ name: string; owner_id: string; is_shared: boolean }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const loadDatasets = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      console.log('🔄 LOADING DATASETS - Refresh trigger:', refreshTrigger);
      
      const accessibleDatasets = await getAccessibleDatasets();
      console.log('📊 DATASETS FETCHED:', accessibleDatasets);
      
      setDatasets(accessibleDatasets);
      
      console.log(`✅ LOADED ${accessibleDatasets.length} accessible datasets`);
    } catch (error) {
      console.error('❌ ERROR loading datasets:', error);
      toast({
        title: "Error Loading Datasets",
        description: "Failed to load datasets. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load datasets when modal opens or when refreshTrigger changes
  useEffect(() => {
    if (isOpen && user) {
      console.log('🔄 DATASET SELECTOR - Modal opened or refresh triggered');
      loadDatasets();
    }
  }, [isOpen, user, refreshTrigger]);

  const handleSelectDataset = (datasetName: string) => {
    console.log('📊 SELECTING DATASET:', datasetName);
    onSelectDataset(datasetName);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <Card>
          <CardHeader>
            <CardTitle>Select Dataset to Manage</CardTitle>
            <CardDescription>
              Choose a dataset to view and manage its loan portfolio data
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <span className="text-gray-600">Loading datasets...</span>
              </div>
            ) : datasets.length === 0 ? (
              <div className="text-center py-8">
                <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No datasets found</p>
                <p className="text-sm text-gray-400">Upload some data first to get started</p>
              </div>
            ) : (
              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {datasets.map((dataset) => (
                  <div
                    key={dataset.name}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Database className="h-5 w-5 text-blue-600" />
                      <div>
                        <h3 className="font-medium text-gray-900">{dataset.name}</h3>
                        <p className="text-sm text-gray-500">
                          {dataset.is_shared ? 'Shared with you' : 'Your dataset'}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleSelectDataset(dataset.name)}
                      variant="outline"
                      size="sm"
                    >
                      Select
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <div className="flex justify-end gap-4 p-6 border-t">
            <Button 
              variant="ghost" 
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              variant="outline" 
              onClick={loadDatasets}
              disabled={isLoading}
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DatasetSelector;

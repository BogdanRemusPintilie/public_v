
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getDatasetSummaries } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Search, Database, FolderOpen } from 'lucide-react';
import { Input } from "@/components/ui/input";

interface DatasetSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDataset: (datasetName: string) => void;
}

interface DatasetSummary {
  dataset_name: string;
  record_count: number;
  total_value: number;
  avg_interest_rate: number;
  created_at: string;
}

const DatasetSelector: React.FC<DatasetSelectorProps> = ({ 
  isOpen, 
  onClose, 
  onSelectDataset 
}) => {
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && user) {
      loadDatasets();
    }
  }, [isOpen, user]);

  const loadDatasets = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      console.log('Loading dataset summaries...');
      
      const datasetSummaries = await getDatasetSummaries();
      setDatasets(datasetSummaries);
      
      console.log(`Found ${datasetSummaries.length} datasets`);
    } catch (error) {
      console.error('Error loading datasets:', error);
      toast({
        title: "Error Loading Datasets",
        description: "Failed to load datasets. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDatasets = datasets.filter(dataset =>
    dataset.dataset_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Select Dataset to Manage
            </CardTitle>
            <CardDescription>
              Choose which dataset you'd like to view and manage. Each dataset contains your uploaded loan records.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search datasets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading datasets...</span>
              </div>
            ) : filteredDatasets.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No datasets found' : 'No datasets available'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm 
                    ? 'No datasets match your search criteria.' 
                    : 'You haven\'t uploaded any datasets yet. Upload your first dataset to get started.'
                  }
                </p>
                <Button onClick={onClose} variant="outline">
                  Close
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-gray-600">
                  {filteredDatasets.length} dataset(s) found
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Dataset Name</TableHead>
                        <TableHead>Records</TableHead>
                        <TableHead>Total Value</TableHead>
                        <TableHead>Avg Interest Rate</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDatasets.map((dataset) => (
                        <TableRow key={dataset.dataset_name}>
                          <TableCell className="font-medium">
                            {dataset.dataset_name}
                          </TableCell>
                          <TableCell>{dataset.record_count.toLocaleString()}</TableCell>
                          <TableCell>${(dataset.total_value / 1000000).toFixed(1)}M</TableCell>
                          <TableCell>{dataset.avg_interest_rate.toFixed(2)}%</TableCell>
                          <TableCell>
                            {new Date(dataset.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => onSelectDataset(dataset.dataset_name)}
                              className="flex items-center gap-2"
                            >
                              <FolderOpen className="h-4 w-4" />
                              Manage
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
          <div className="flex justify-end gap-4 p-6 border-t">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DatasetSelector;

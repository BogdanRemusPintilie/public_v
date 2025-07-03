
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { getDatasetSummaries, deleteLoanData } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Search } from 'lucide-react';

interface DatasetManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DatasetSummary {
  dataset_name: string;
  record_count: number;
  total_value: number;
  avg_interest_rate: number;
  created_at: string;
  high_risk_count: number;
}

const DatasetManager: React.FC<DatasetManagerProps> = ({ isOpen, onClose }) => {
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDatasets, setSelectedDatasets] = useState<Set<string>>(new Set());
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
      
      toast({
        title: "Datasets Loaded",
        description: `Found ${datasetSummaries.length} datasets`,
      });
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

  const handleSelectDataset = (datasetName: string, checked: boolean) => {
    const newSelected = new Set(selectedDatasets);
    if (checked) {
      newSelected.add(datasetName);
    } else {
      newSelected.delete(datasetName);
    }
    setSelectedDatasets(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const filteredDatasets = datasets.filter(dataset =>
        dataset.dataset_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSelectedDatasets(new Set(filteredDatasets.map(d => d.dataset_name)));
    } else {
      setSelectedDatasets(new Set());
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedDatasets.size === 0) {
      toast({
        title: "No Datasets Selected",
        description: "Please select datasets to delete",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Delete datasets by name instead of record IDs for efficiency
      for (const datasetName of selectedDatasets) {
        console.log(`Deleting dataset: ${datasetName}`);
        // We'll need to add a function to delete by dataset name
        await deleteLoanDataByDataset(datasetName);
      }
      
      // Remove deleted datasets from local state
      const remainingDatasets = datasets.filter(dataset => !selectedDatasets.has(dataset.dataset_name));
      setDatasets(remainingDatasets);
      setSelectedDatasets(new Set());
      
      toast({
        title: "Datasets Deleted",
        description: `Successfully deleted ${selectedDatasets.size} datasets`,
      });
    } catch (error) {
      console.error('Error deleting datasets:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete datasets. Please try again.",
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
      <div className="relative top-20 mx-auto p-5 border w-full max-w-5xl shadow-lg rounded-md bg-white">
        <Card>
          <CardHeader>
            <CardTitle>Dataset Manager</CardTitle>
            <CardDescription>
              Manage and delete your uploaded datasets. This will permanently remove all records associated with the selected datasets.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search Bar */}
            <div className="mb-6">
              <Label htmlFor="search" className="text-base font-medium">
                Search Datasets
              </Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Search by dataset name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading datasets...</span>
              </div>
            ) : filteredDatasets.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {searchTerm ? 'No datasets found matching your search.' : 'No datasets found.'}
                </p>
              </div>
            ) : (
              <>
                {/* Action Bar */}
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm text-gray-600">
                    {selectedDatasets.size > 0 ? (
                      `${selectedDatasets.size} dataset(s) selected`
                    ) : (
                      `${filteredDatasets.length} dataset(s) found`
                    )}
                  </div>
                  {selectedDatasets.size > 0 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={isLoading}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Selected ({selectedDatasets.size})
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete {selectedDatasets.size} dataset(s) and all associated loan records from your account.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteSelected}>
                            Delete Datasets
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>

                {/* Datasets Table */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedDatasets.size === filteredDatasets.length && filteredDatasets.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Dataset Name</TableHead>
                        <TableHead>Records</TableHead>
                        <TableHead>Total Value</TableHead>
                        <TableHead>Avg Interest Rate</TableHead>
                        <TableHead>High Risk Loans</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDatasets.map((dataset) => (
                        <TableRow key={dataset.dataset_name}>
                          <TableCell>
                            <Checkbox
                              checked={selectedDatasets.has(dataset.dataset_name)}
                              onCheckedChange={(checked) => 
                                handleSelectDataset(dataset.dataset_name, checked as boolean)
                              }
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {dataset.dataset_name}
                          </TableCell>
                          <TableCell>{dataset.record_count.toLocaleString()}</TableCell>
                          <TableCell>${(dataset.total_value / 1000000).toFixed(1)}M</TableCell>
                          <TableCell>{dataset.avg_interest_rate.toFixed(2)}%</TableCell>
                          <TableCell>{dataset.high_risk_count.toLocaleString()}</TableCell>
                          <TableCell>
                            {new Date(dataset.created_at).toLocaleDateString()}
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
            <Button variant="ghost" onClick={onClose}>Close</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DatasetManager;

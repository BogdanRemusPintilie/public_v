
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
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { 
  shareDataset, 
  getDatasetShares, 
  removeDatasetShare, 
  getUserDatasets,
  DatasetShare 
} from '@/utils/supabase';
import { Share2, Trash2, Users } from 'lucide-react';

interface DatasetSharingManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const DatasetSharingManager: React.FC<DatasetSharingManagerProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const [datasets, setDatasets] = useState<{ name: string; owner_id: string }[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [userIdToShare, setUserIdToShare] = useState<string>('');
  const [datasetShares, setDatasetShares] = useState<DatasetShare[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && user) {
      loadUserDatasets();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (selectedDataset) {
      loadDatasetShares();
    }
  }, [selectedDataset]);

  const loadUserDatasets = async () => {
    try {
      setIsLoading(true);
      const userDatasets = await getUserDatasets();
      // Filter to show only datasets owned by current user
      const ownedDatasets = userDatasets.filter(dataset => dataset.owner_id === user?.id);
      setDatasets(ownedDatasets);
    } catch (error) {
      console.error('Error loading datasets:', error);
      toast({
        title: "Error Loading Datasets",
        description: "Failed to load your datasets. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadDatasetShares = async () => {
    if (!selectedDataset) return;
    
    try {
      const shares = await getDatasetShares(selectedDataset);
      setDatasetShares(shares);
    } catch (error) {
      console.error('Error loading dataset shares:', error);
      toast({
        title: "Error Loading Shares",
        description: "Failed to load dataset shares. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShareDataset = async () => {
    if (!selectedDataset || !userIdToShare.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a dataset and enter a user ID to share with.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      await shareDataset(selectedDataset, userIdToShare.trim());
      setUserIdToShare('');
      await loadDatasetShares();
      
      toast({
        title: "Dataset Shared",
        description: `Dataset "${selectedDataset}" has been shared successfully.`,
      });
    } catch (error) {
      console.error('Error sharing dataset:', error);
      toast({
        title: "Share Failed",
        description: "Failed to share dataset. Please check the user ID and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    try {
      setIsLoading(true);
      await removeDatasetShare(shareId);
      await loadDatasetShares();
      
      toast({
        title: "Share Removed",
        description: "Dataset share has been removed successfully.",
      });
    } catch (error) {
      console.error('Error removing share:', error);
      toast({
        title: "Remove Failed",
        description: "Failed to remove dataset share. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Dataset Sharing Manager
                </CardTitle>
                <CardDescription>
                  Manage who can access your datasets
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Dataset Selection */}
            <div className="space-y-2">
              <Label htmlFor="dataset-select">Select Dataset to Manage</Label>
              <select
                id="dataset-select"
                value={selectedDataset}
                onChange={(e) => setSelectedDataset(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                disabled={isLoading}
              >
                <option value="">Select a dataset...</option>
                {datasets.map((dataset) => (
                  <option key={dataset.name} value={dataset.name}>
                    {dataset.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedDataset && (
              <>
                {/* Share Dataset Section */}
                <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    Share Dataset
                  </h3>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <Label htmlFor="user-id">User ID to Share With</Label>
                      <Input
                        id="user-id"
                        type="text"
                        placeholder="Enter user ID (UUID format)"
                        value={userIdToShare}
                        onChange={(e) => setUserIdToShare(e.target.value)}
                        disabled={isLoading}
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Enter the UUID of the user you want to share this dataset with
                      </p>
                    </div>
                    <Button 
                      onClick={handleShareDataset}
                      disabled={isLoading || !userIdToShare.trim()}
                    >
                      Share Dataset
                    </Button>
                  </div>
                </div>

                {/* Current Shares */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Current Shares</h3>
                  {datasetShares.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      This dataset is not shared with anyone yet.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Shared With User ID</TableHead>
                          <TableHead>Shared Date</TableHead>
                          <TableHead className="w-24">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {datasetShares.map((share) => (
                          <TableRow key={share.id}>
                            <TableCell className="font-mono text-sm">
                              {share.shared_with_user_id}
                            </TableCell>
                            <TableCell>
                              {share.created_at ? new Date(share.created_at).toLocaleDateString() : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm" disabled={isLoading}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remove Share</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to remove this user's access to the dataset "{selectedDataset}"?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleRemoveShare(share.id!)}>
                                      Remove Access
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </>
            )}
          </CardContent>
          <div className="flex justify-end gap-4 p-6 pt-0">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DatasetSharingManager;

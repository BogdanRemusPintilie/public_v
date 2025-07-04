
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { deleteLoanDataByDataset } from '@/utils/supabase';
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
import { Trash2, AlertTriangle } from 'lucide-react';

interface DeleteDatasetComponentProps {
  datasetName: string;
  onDeleted: () => void;
  onClose: () => void;
}

const DeleteDatasetComponent: React.FC<DeleteDatasetComponentProps> = ({ 
  datasetName, 
  onDeleted, 
  onClose 
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      console.log(`Deleting dataset: ${datasetName}`);
      
      await deleteLoanDataByDataset(datasetName);
      
      toast({
        title: "Dataset Deleted",
        description: `Successfully deleted "${datasetName}" dataset and all associated data`,
      });
      
      onDeleted();
    } catch (error) {
      console.error('Error deleting dataset:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete the dataset. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Dataset
            </CardTitle>
            <CardDescription>
              Permanently remove the "{datasetName}" dataset from your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-800 mb-2">Warning: This action cannot be undone</h4>
                    <p className="text-sm text-red-700 mb-3">
                      Deleting this dataset will permanently remove:
                    </p>
                    <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                      <li>All loan records in the "{datasetName}" dataset</li>
                      <li>All sharing permissions for this dataset</li>
                      <li>Any analysis or reports based on this data</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-2">Dataset Information</h4>
                <p className="text-sm text-gray-600">
                  <strong>Dataset:</strong> {datasetName}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  This dataset contains loan portfolio data that may be shared with other users.
                </p>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Button 
                  variant="ghost" 
                  onClick={onClose}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      disabled={isDeleting}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      {isDeleting ? 'Deleting...' : 'Delete Dataset'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the "{datasetName}" dataset and all its data. 
                        This action cannot be undone and will remove all sharing permissions.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Yes, Delete Dataset
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DeleteDatasetComponent;

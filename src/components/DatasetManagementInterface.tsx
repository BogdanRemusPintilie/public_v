
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Trash2, ArrowLeft } from 'lucide-react';
import DeleteDatasetComponent from './DeleteDatasetComponent';

interface DatasetManagementInterfaceProps {
  datasetName: string;
  onBack: () => void;
  onDatasetDeleted: () => void;
}

const DatasetManagementInterface: React.FC<DatasetManagementInterfaceProps> = ({ 
  datasetName, 
  onBack, 
  onDatasetDeleted 
}) => {
  const [showDeleteComponent, setShowDeleteComponent] = useState(false);

  const handleDeleteClick = () => {
    setShowDeleteComponent(true);
  };

  const handleDeleteCompleted = () => {
    setShowDeleteComponent(false);
    onDatasetDeleted();
  };

  const handleDeleteCancelled = () => {
    setShowDeleteComponent(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
        <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="h-6 w-6 text-blue-600" />
                  <div>
                    <CardTitle>Managing Dataset: {datasetName}</CardTitle>
                    <CardDescription>
                      Manage and configure your dataset settings
                    </CardDescription>
                  </div>
                </div>
                <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Selection
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Dataset Information */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-800 mb-2">Dataset Information</h3>
                  <p className="text-sm text-blue-700">
                    <strong>Name:</strong> {datasetName}
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    This dataset contains loan portfolio data and may be shared with other users.
                  </p>
                </div>

                {/* Management Actions */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-800 mb-3">Dataset Actions</h3>
                  
                  {/* Delete Dataset Section */}
                  <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-red-800 mb-1">Delete Dataset</h4>
                        <p className="text-sm text-red-700 mb-3">
                          Permanently remove this dataset and all associated data. This action cannot be undone.
                        </p>
                      </div>
                      <Button 
                        variant="destructive" 
                        onClick={handleDeleteClick}
                        className="ml-4 flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Dataset
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Additional Management Options Placeholder */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">Additional Options</h4>
                  <p className="text-sm text-gray-600">
                    More dataset management features will be available here in future updates.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Dataset Component */}
      {showDeleteComponent && (
        <DeleteDatasetComponent
          datasetName={datasetName}
          onDeleted={handleDeleteCompleted}
          onClose={handleDeleteCancelled}
        />
      )}
    </>
  );
};

export default DatasetManagementInterface;

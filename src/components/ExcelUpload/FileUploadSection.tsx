
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

interface FileUploadSectionProps {
  datasetName: string;
  onDatasetNameChange: (name: string) => void;
  onFileDrop: (files: File[]) => void;
  isProcessing: boolean;
  uploadProgress: number;
  uploadStatus: string;
}

export const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  datasetName,
  onDatasetNameChange,
  onFileDrop,
  isProcessing,
  uploadProgress,
  uploadStatus
}) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFileDrop(acceptedFiles);
  }, [onFileDrop]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    }
  });

  return (
    <>
      <div className="mb-6">
        <Label htmlFor="dataset-name" className="text-base font-medium">
          Dataset Name *
        </Label>
        <Input
          id="dataset-name"
          type="text"
          placeholder="Enter a name for this dataset (e.g., 'Q4 2024 Portfolio', 'Commercial Loans')"
          value={datasetName}
          onChange={(e) => onDatasetNameChange(e.target.value)}
          className="mt-2"
          disabled={isProcessing}
        />
        <p className="text-sm text-gray-500 mt-1">
          This name will help you identify this dataset when managing your data
        </p>
      </div>

      <div {...getRootProps()} className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-md cursor-pointer bg-gray-50 dark:bg-gray-700">
        <input {...getInputProps()} />
        {
          isDragActive ?
            <p className="text-gray-500">Drop the files here ...</p> :
            <p className="text-gray-500">Drag 'n' drop some files here, or click to select files</p>
        }
        {isProcessing && (
          <div className="mt-4 flex flex-col items-center w-full max-w-md">
            <div className="flex items-center mb-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <p className="text-blue-600">{uploadStatus || 'Processing file...'}</p>
            </div>
            {uploadProgress > 0 && (
              <Progress value={uploadProgress} className="w-full" />
            )}
          </div>
        )}
      </div>
    </>
  );
};

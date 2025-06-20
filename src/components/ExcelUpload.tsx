
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Upload, FileSpreadsheet, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExcelUploadProps {
  isOpen: boolean;
  onClose: () => void;
}

const ExcelUpload: React.FC<ExcelUploadProps> = ({ isOpen, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [worksheets, setWorksheets] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.type === 'application/vnd.ms-excel' ||
          file.name.endsWith('.xlsx') || 
          file.name.endsWith('.xls')) {
        setSelectedFile(file);
        // Simulate worksheet detection
        setWorksheets(['Sheet1', 'Data', 'Summary', 'Transactions']);
        toast({
          title: "File Selected",
          description: `${file.name} ready for upload`,
        });
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please select an Excel file (.xlsx or .xls)",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsProcessing(true);
    
    // Simulate upload process
    setTimeout(() => {
      toast({
        title: "Upload Successful",
        description: `${selectedFile.name} has been uploaded with ${worksheets.length} worksheets`,
      });
      setIsProcessing(false);
      handleClose();
    }, 2000);
  };

  const handleClose = () => {
    setSelectedFile(null);
    setWorksheets([]);
    setIsProcessing(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            <span>Upload Data Tape</span>
          </DialogTitle>
          <DialogDescription>
            Select an Excel file containing your trading data. Multiple worksheets are supported.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
              id="excel-upload"
            />
            <label htmlFor="excel-upload" className="cursor-pointer">
              <div className="flex flex-col items-center space-y-2">
                <Upload className="h-8 w-8 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Click to select Excel file
                </span>
                <span className="text-xs text-gray-400">
                  Supports .xlsx and .xls formats
                </span>
              </div>
            </label>
          </div>

          {selectedFile && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">{selectedFile.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    setWorksheets([]);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="text-xs text-gray-600 mb-2">
                Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </div>
              
              {worksheets.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-1">
                    Detected Worksheets ({worksheets.length}):
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {worksheets.map((sheet, index) => (
                      <span
                        key={index}
                        className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                      >
                        {sheet}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isProcessing}
              className="flex-1"
            >
              {isProcessing ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExcelUpload;

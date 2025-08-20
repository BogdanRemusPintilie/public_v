import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileSpreadsheet, Upload } from 'lucide-react';
import { parseInvestorExcel, insertInvestors, InvestorRecord } from '@/utils/investorUtils';
import { useToast } from '@/hooks/use-toast';

interface InvestorUploadProps {
  onUploadComplete?: () => void;
}

export const InvestorUpload: React.FC<InvestorUploadProps> = ({ onUploadComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<InvestorRecord[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsProcessing(true);
    setUploadProgress(25);

    try {
      const investors = await parseInvestorExcel(file);
      setPreviewData(investors);
      setUploadProgress(50);
      
      toast({
        title: "File parsed successfully",
        description: `Found ${investors.length} investor records`,
      });
    } catch (error) {
      toast({
        title: "Error parsing file",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  const handleSave = async () => {
    if (previewData.length === 0) return;

    setIsProcessing(true);
    setUploadProgress(75);

    try {
      await insertInvestors(previewData);
      setUploadProgress(100);
      
      toast({
        title: "Success",
        description: `${previewData.length} investors saved to database`,
      });
      
      setPreviewData([]);
      onUploadComplete?.();
    } catch (error) {
      toast({
        title: "Error saving data",
        description: error instanceof Error ? error.message : "Failed to save investors",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    disabled: isProcessing
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Upload Investor Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">
              {isDragActive ? 'Drop your Excel file here' : 'Drag & drop Excel file here'}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Expected columns: Investor, Overview, Contact Name, Contact Email
            </p>
            <Button disabled={isProcessing}>
              Select Excel File
            </Button>
          </div>

          {isProcessing && (
            <div className="mt-4">
              <Progress value={uploadProgress} className="mb-2" />
              <p className="text-sm text-muted-foreground">Processing file...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {previewData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview Data ({previewData.length} records)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border p-2 text-left">Investor</th>
                    <th className="border border-border p-2 text-left">Overview</th>
                    <th className="border border-border p-2 text-left">Contact Name</th>
                    <th className="border border-border p-2 text-left">Contact Email</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.slice(0, 10).map((investor, index) => (
                    <tr key={index} className="hover:bg-muted/50">
                      <td className="border border-border p-2">{investor.investor}</td>
                      <td className="border border-border p-2 max-w-xs truncate">{investor.overview}</td>
                      <td className="border border-border p-2">{investor.contact_name}</td>
                      <td className="border border-border p-2">{investor.contact_email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewData.length > 10 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Showing first 10 of {previewData.length} records
                </p>
              )}
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button onClick={handleSave} disabled={isProcessing}>
                Save {previewData.length} Investors to Database
              </Button>
              <Button variant="outline" onClick={() => setPreviewData([])}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Alert>
        <AlertDescription>
          Upload an Excel file with columns: Investor, Overview, Contact Name, Contact Email.
          The data will be stored in your Supabase database and can be used throughout the application.
        </AlertDescription>
      </Alert>
    </div>
  );
};
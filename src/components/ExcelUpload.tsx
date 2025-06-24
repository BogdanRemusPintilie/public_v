import React, { useState, useCallback, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useDropzone } from 'react-dropzone';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { LoanRecord, insertLoanData, getLoanData } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeExcelContent } from '@/utils/validation';

interface ExcelUploadProps {
  isOpen: boolean;
  onClose: () => void;
  showExistingData?: boolean;
}

const ExcelUpload: React.FC<ExcelUploadProps> = ({ 
  isOpen, 
  onClose, 
  showExistingData = false 
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<LoanRecord[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load existing data when showExistingData is true
  useEffect(() => {
    if (showExistingData && isOpen && user) {
      loadExistingData();
    } else if (!showExistingData && isOpen) {
      setPreviewData([]);
      setSelectedFile(null);
    }
  }, [showExistingData, isOpen, user]);

  const loadExistingData = async () => {
    if (!user) return;
    
    try {
      setIsProcessing(true);
      // Use the user's actual UUID - no need for conversion since we're using real Supabase auth
      const existingData = await getLoanData(user.id);
      
      if (existingData.length > 0) {
        setPreviewData(existingData);
        toast({
          title: "Data Loaded",
          description: `Loaded ${existingData.length} existing records`,
        });
      } else {
        toast({
          title: "No Data Found",
          description: "No existing loan data found for your account",
        });
      }
    } catch (error) {
      console.error('Error loading existing data:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load existing data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const binaryStr = e.target.result;
      const workbook = XLSX.read(binaryStr, { type: 'binary' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const excelData: any[] = XLSX.utils.sheet_to_json(worksheet, { raw: true });

      // Sanitize Excel content
      const sanitizedData = excelData.map(sanitizeExcelContent);

      // Transform data to match LoanRecord type
      const transformedData: LoanRecord[] = sanitizedData.map(item => ({
        loan_amount: parseFloat(item['Loan Amount'] || 0),
        interest_rate: parseFloat(item['Interest Rate'] || 0),
        term: parseInt(item['Term'] || 0),
        loan_type: item['Loan Type'] || '',
        credit_score: parseInt(item['Credit Score'] || 0),
        ltv: parseFloat(item['LTV'] || 0),
        opening_balance: parseFloat(item['Opening Balance'] || 0),
        file_name: file.name,
        worksheet_name: firstSheetName,
      }));

      setPreviewData(transformedData);
    };
    reader.readAsBinaryString(file);

  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: '.xlsx, .xls' });

  const handleDeleteSelected = () => {
    setPreviewData([]);
    setSelectedFile(null);
  };

  const handleSaveToDatabase = async () => {
    console.log('Save to database button clicked', {
      selectedFile: !!selectedFile,
      user: !!user,
      previewDataLength: previewData.length,
      supabase: !!supabase,
      userId: user?.id
    });

    if (!selectedFile || !user || previewData.length === 0 || !supabase) {
      toast({
        title: "Upload Error",
        description: "Please select a file and ensure you're logged in",
        variant: "destructive",
      });
      return;
    }

    // Validate that we have actual UUID from Supabase auth
    if (!user.id || user.id.length < 30) {
      toast({
        title: "Authentication Error",
        description: "Invalid user session. Please log out and log back in.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      console.log('Using real Supabase user ID:', user.id);
      
      // Add user_id to all records - user.id is now a real UUID from Supabase
      const dataWithUserId = previewData.map(loan => ({
        ...loan,
        user_id: user.id // This is now a real UUID from Supabase auth
      }));
      
      console.log('Inserting data to database:', dataWithUserId.length, 'records with user_id:', user.id);
      await insertLoanData(dataWithUserId);
      
      toast({
        title: "Upload Successful",
        description: `${previewData.length} loan records saved successfully`,
      });
      
      handleClose();
    } catch (error) {
      console.error('Error uploading data:', error);
      
      // Provide more specific error messages
      let errorMessage = "Failed to save data to database. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes('permission')) {
          errorMessage = "Permission denied. Please check your account permissions.";
        } else if (error.message.includes('violates row-level security')) {
          errorMessage = "Security error. Please ensure you're properly authenticated.";
        }
      }
      
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    onClose();
    setPreviewData([]);
    setSelectedFile(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-5xl shadow-lg rounded-md bg-white">
        <Card>
          <CardHeader>
            <CardTitle>Upload Excel File</CardTitle>
            <CardDescription>Upload your loan portfolio data in .xlsx or .xls format</CardDescription>
          </CardHeader>
          <CardContent>
            <div {...getRootProps()} className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-md cursor-pointer bg-gray-50 dark:bg-gray-700">
              <input {...getInputProps()} />
              {
                isDragActive ?
                  <p className="text-gray-500">Drop the files here ...</p> :
                  <p className="text-gray-500">Drag 'n' drop some files here, or click to select files</p>
              }
              {selectedFile && (
                <div className="mt-4">
                  <p className="text-gray-700">Selected file: {selectedFile.name}</p>
                </div>
              )}
            </div>

            {previewData.length > 0 && (
              <div className="mt-6 overflow-x-auto">
                <h3 className="text-xl font-semibold mb-4">Data Preview</h3>
                <table className="min-w-full leading-normal">
                  <thead>
                    <tr>
                      <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Loan Amount</th>
                      <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Interest Rate</th>
                      <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Term</th>
                      <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Loan Type</th>
                      <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Credit Score</th>
                      <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">LTV</th>
                      <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Opening Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, index) => (
                      <tr key={index}>
                        <td className="px-5 py-5 border-b text-sm">{row.loan_amount}</td>
                        <td className="px-5 py-5 border-b text-sm">{row.interest_rate}</td>
                        <td className="px-5 py-5 border-b text-sm">{row.term}</td>
                        <td className="px-5 py-5 border-b text-sm">{row.loan_type}</td>
                        <td className="px-5 py-5 border-b text-sm">{row.credit_score}</td>
                        <td className="px-5 py-5 border-b text-sm">{row.ltv}</td>
                        <td className="px-5 py-5 border-b text-sm">{row.opening_balance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-4">
            <Button variant="ghost" onClick={handleClose}>Cancel</Button>
            {previewData.length > 0 && (
              <Button variant="destructive" onClick={handleDeleteSelected}>Delete</Button>
            )}
            <Button onClick={handleSaveToDatabase} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                "Save to Database"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ExcelUpload;

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from "@/components/ui/button";
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
import { parseExcelFile } from '@/utils/excelParser';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Progress } from "@/components/ui/progress";

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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [portfolioSummary, setPortfolioSummary] = useState<{
    totalValue: number;
    avgInterestRate: number;
    highRiskLoans: number;
    totalRecords: number;
  } | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load existing data when showExistingData is true
  useEffect(() => {
    if (showExistingData && isOpen && user) {
      loadExistingData();
    } else if (!showExistingData && isOpen) {
      setPreviewData([]);
      setSelectedFile(null);
      setPortfolioSummary(null);
      setUploadProgress(0);
      setUploadStatus('');
    }
  }, [showExistingData, isOpen, user]);

  const loadExistingData = async () => {
    if (!user) return;
    
    try {
      setIsProcessing(true);
      const existingData = await getLoanData(user.id);
      
      if (existingData.length > 0) {
        setPreviewData(existingData);
        calculatePortfolioSummary(existingData);
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

  const calculatePortfolioSummary = (data: LoanRecord[]) => {
    const totalValue = data.reduce((sum, loan) => sum + loan.opening_balance, 0);
    const avgInterestRate = data.length > 0 ? 
      data.reduce((sum, loan) => sum + (loan.interest_rate * loan.opening_balance), 0) / totalValue : 0;
    const highRiskLoans = data.filter(loan => (loan.pd || 0) > 0.05).length;
    
    setPortfolioSummary({
      totalValue,
      avgInterestRate,
      highRiskLoans,
      totalRecords: data.length
    });
  };

  const getMaturityDistribution = () => {
    if (previewData.length === 0) return [];
    
    const buckets = [
      { range: 'Up to 36 months', min: 0, max: 36 },
      { range: '37-60 months', min: 37, max: 60 },
      { range: '61-84 months', min: 61, max: 84 },
      { range: 'More than 84 months', min: 85, max: 1000 }
    ];
    
    return buckets.map(bucket => ({
      range: bucket.range,
      count: previewData.filter(loan => 
        loan.term >= bucket.min && loan.term <= bucket.max
      ).length
    }));
  };

  const getLoanSizeDistribution = () => {
    if (previewData.length === 0) return [];
    
    const buckets = [
      { range: 'Up to €10k', min: 0, max: 10000 },
      { range: '€10k-€25k', min: 10000, max: 25000 },
      { range: '€25k-€50k', min: 25000, max: 50000 },
      { range: '€50k-€100k', min: 50000, max: 100000 },
      { range: 'More than €100k', min: 100000, max: Number.MAX_VALUE }
    ];
    
    const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];
    
    return buckets.map((bucket, index) => ({
      name: bucket.range,
      value: previewData.filter(loan => 
        loan.opening_balance > bucket.min && loan.opening_balance <= bucket.max
      ).length,
      fill: colors[index]
    })).filter(item => item.value > 0);
  };

  const chartConfig = {
    count: {
      label: "Count",
      color: "#2563eb",
    },
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    setSelectedFile(file);
    setIsProcessing(true);
    setUploadProgress(0);
    setUploadStatus('Parsing Excel file...');

    try {
      console.log('Parsing Excel file:', file.name);
      const parsedData = await parseExcelFile(file);
      
      console.log('Parsed data:', {
        worksheets: parsedData.worksheets,
        recordCount: parsedData.data.length
      });

      setPreviewData(parsedData.data);
      calculatePortfolioSummary(parsedData.data);
      setUploadStatus('');
      
      toast({
        title: "File Parsed Successfully",
        description: `Found ${parsedData.data.length} loan records in ${parsedData.worksheets.join(', ')}`,
      });
    } catch (error) {
      console.error('Error parsing file:', error);
      toast({
        title: "Parse Error",
        description: error instanceof Error ? error.message : "Failed to parse Excel file",
        variant: "destructive",
      });
      setPreviewData([]);
      setPortfolioSummary(null);
      setUploadStatus('');
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    }
  });

  const handleDeleteSelected = () => {
    setPreviewData([]);
    setSelectedFile(null);
    setPortfolioSummary(null);
    setUploadProgress(0);
    setUploadStatus('');
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

    if (!user.id || user.id.length < 30) {
      toast({
        title: "Authentication Error",
        description: "Invalid user session. Please log out and log back in.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);
    setUploadStatus('Preparing data for upload...');
    
    try {
      console.log('Using real Supabase user ID:', user.id);
      
      const dataWithUserId = previewData.map(loan => ({
        ...loan,
        user_id: user.id
      }));
      
      console.log('Inserting data to database:', dataWithUserId.length, 'records with user_id:', user.id);
      
      // Use the new batch insert function with progress tracking
      await insertLoanData(dataWithUserId, (completed, total) => {
        const progress = Math.round((completed / total) * 100);
        setUploadProgress(progress);
        setUploadStatus(`Uploading: ${completed}/${total} records (${progress}%)`);
      });
      
      toast({
        title: "Upload Successful",
        description: `${previewData.length} loan records saved successfully`,
      });
      
      handleClose();
    } catch (error) {
      console.error('Error uploading data:', error);
      
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
      setUploadProgress(0);
      setUploadStatus('');
    }
  };

  const handleClose = () => {
    onClose();
    setPreviewData([]);
    setSelectedFile(null);
    setPortfolioSummary(null);
    setUploadProgress(0);
    setUploadStatus('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-md bg-white">
        <Card>
          <CardHeader>
            <CardTitle>Upload Excel File</CardTitle>
            <CardDescription>Upload your loan portfolio data in .xlsx or .xls format. Looking for 'loan_tape' worksheet.</CardDescription>
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

            {portfolioSummary && (
              <div className="mt-6 bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Portfolio Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-blue-600">{portfolioSummary.totalRecords}</div>
                    <div className="text-sm text-gray-600">Total Loans</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-green-600">
                      ${(portfolioSummary.totalValue / 1000000).toFixed(1)}M
                    </div>
                    <div className="text-sm text-gray-600">Portfolio Value</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-purple-600">
                      {portfolioSummary.avgInterestRate.toFixed(2)}%
                    </div>
                    <div className="text-sm text-gray-600">Avg Interest Rate</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-red-600">{portfolioSummary.highRiskLoans}</div>
                    <div className="text-sm text-gray-600">High Risk Loans</div>
                  </div>
                </div>
              </div>
            )}

            {previewData.length > 0 && (
              <>
                {/* Charts Section */}
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Loan Distribution by Maturity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={chartConfig} className="h-[300px]">
                        <BarChart data={getMaturityDistribution()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="range" 
                            angle={-45}
                            textAnchor="end"
                            height={100}
                            fontSize={12}
                          />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="count" fill="#2563eb" />
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Portfolio Composition by Loan Size</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={chartConfig} className="h-[300px]">
                        <PieChart>
                          <Pie
                            data={getLoanSizeDistribution()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {getLoanSizeDistribution().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Data Preview Table */}
                <div className="mt-6 overflow-x-auto">
                  <h3 className="text-xl font-semibold mb-4">Data Preview ({previewData.length} records)</h3>
                  <table className="min-w-full leading-normal">
                    <thead>
                      <tr>
                        <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Opening Balance</th>
                        <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Interest Rate</th>
                        <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Term (Months)</th>
                        <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">PD</th>
                        <th className="px-5 py-3 border-b-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Loan Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.slice(0, 10).map((row, index) => (
                        <tr key={index}>
                          <td className="px-5 py-5 border-b text-sm">${row.opening_balance.toLocaleString()}</td>
                          <td className="px-5 py-5 border-b text-sm">{row.interest_rate.toFixed(2)}%</td>
                          <td className="px-5 py-5 border-b text-sm">{row.term}</td>
                          <td className="px-5 py-5 border-b text-sm">{((row.pd || 0) * 100).toFixed(2)}%</td>
                          <td className="px-5 py-5 border-b text-sm">{row.loan_type}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {previewData.length > 10 && (
                    <p className="text-sm text-gray-500 mt-2">Showing first 10 of {previewData.length} records</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-4">
            <Button variant="ghost" onClick={handleClose}>Cancel</Button>
            {previewData.length > 0 && (
              <Button variant="destructive" onClick={handleDeleteSelected}>Clear Data</Button>
            )}
            <Button onClick={handleSaveToDatabase} disabled={isProcessing || previewData.length === 0}>
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {uploadStatus || 'Saving...'}
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

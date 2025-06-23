import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileSpreadsheet, X, BarChart3, Table as TableIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { LoanRecord, insertLoanData, getLoanData, supabase } from '@/utils/supabase';
import { parseExcelFile } from '@/utils/excelParser';

interface ExcelUploadProps {
  isOpen: boolean;
  onClose: () => void;
  showExistingData?: boolean;
}

const ExcelUpload: React.FC<ExcelUploadProps> = ({ isOpen, onClose, showExistingData = false }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [worksheets, setWorksheets] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<LoanRecord[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load existing data when showExistingData is true
  useEffect(() => {
    if (showExistingData && isOpen && user) {
      loadExistingData();
    }
  }, [showExistingData, isOpen, user]);

  const loadExistingData = async () => {
    if (!user || !supabase) {
      if (!supabase) {
        toast({
          title: "Database Not Connected",
          description: "Please check your Supabase integration configuration",
          variant: "destructive",
        });
      }
      return;
    }
    
    try {
      setIsProcessing(true);
      const existingData = await getLoanData(user.id);
      
      if (existingData.length > 0) {
        setPreviewData(existingData);
        setShowPreview(true);
        
        // Get unique worksheets from existing data
        const uniqueWorksheets = [...new Set(existingData.map(loan => loan.worksheet_name).filter(Boolean))];
        setWorksheets(uniqueWorksheets.length > 0 ? uniqueWorksheets : ['Historical_Portfolio_2024']);
        
        toast({
          title: "Existing Data Loaded",
          description: `Displaying ${existingData.length} loan records from database`,
        });
      } else {
        toast({
          title: "No Data Found",
          description: "No existing loan data found in database",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading existing data:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load existing data from database",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('File selected:', file.name, file.type, file.size);

    if (!(file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.type === 'application/vnd.ms-excel' ||
          file.name.endsWith('.xlsx') || 
          file.name.endsWith('.xls'))) {
      toast({
        title: "Invalid File Type",
        description: "Please select an Excel file (.xlsx or .xls)",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setIsProcessing(true);
    
    try {
      console.log('Starting to parse file...');
      const parsedData = await parseExcelFile(file);
      console.log('File parsed successfully:', {
        worksheets: parsedData.worksheets,
        dataLength: parsedData.data.length,
        firstRecord: parsedData.data[0]
      });
      
      setWorksheets(parsedData.worksheets);
      setPreviewData(parsedData.data);
      setShowPreview(true);
      
      toast({
        title: "File Parsed Successfully",
        description: `${file.name} parsed with ${parsedData.data.length} loan records from ${parsedData.worksheets.length} worksheets`,
      });
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      toast({
        title: "Parsing Error",
        description: "Failed to parse Excel file. Please check the file format and column headers.",
        variant: "destructive",
      });
      setSelectedFile(null);
      setWorksheets([]);
      setPreviewData([]);
      setShowPreview(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpload = async () => {
    console.log('Upload button clicked', {
      selectedFile: !!selectedFile,
      user: !!user,
      previewDataLength: previewData.length,
      supabase: !!supabase
    });

    if (!selectedFile || !user || previewData.length === 0 || !supabase) {
      if (!supabase) {
        toast({
          title: "Database Not Connected",
          description: "Please check your Supabase integration configuration",
          variant: "destructive",
        });
        return;
      }
      console.log('Upload conditions not met:', {
        selectedFile: !!selectedFile,
        user: !!user,
        previewDataLength: previewData.length,
        supabase: !!supabase
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Add user_id to all records
      const dataWithUserId = previewData.map(loan => ({
        ...loan,
        user_id: user.id
      }));
      
      console.log('Inserting data to database:', dataWithUserId.length, 'records');
      await insertLoanData(dataWithUserId);
      
      toast({
        title: "Upload Successful",
        description: `${selectedFile.name} has been processed and ${previewData.length} loan records saved to database`,
      });
      
      handleClose();
    } catch (error) {
      console.error('Error uploading data:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to save data to database. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setWorksheets([]);
    setIsProcessing(false);
    setPreviewData([]);
    setShowPreview(false);
    onClose();
  };

  // Calculate summary statistics with weighted average interest rate
  const summaryStats = {
    totalLoans: previewData.length,
    totalPortfolioValue: previewData.reduce((sum, loan) => sum + loan.opening_balance, 0),
    avgLoanAmount: previewData.reduce((sum, loan) => sum + loan.loan_amount, 0) / previewData.length || 0,
    // Weighted average interest rate by opening balance
    avgInterestRate: previewData.length > 0 ? 
      previewData.reduce((sum, loan) => sum + (loan.interest_rate * loan.opening_balance), 0) / 
      previewData.reduce((sum, loan) => sum + loan.opening_balance, 0) : 0,
    avgCreditScore: previewData.reduce((sum, loan) => sum + loan.credit_score, 0) / previewData.length || 0,
    avgLTV: previewData.reduce((sum, loan) => sum + loan.ltv, 0) / previewData.length || 0,
    highRiskLoans: previewData.filter(loan => loan.credit_score < 650 || loan.ltv > 90).length,
  };

  // Chart data
  const loanTypeData = previewData.reduce((acc, loan) => {
    acc[loan.loan_type] = (acc[loan.loan_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(loanTypeData).map(([type, count]) => ({
    loanType: type,
    count,
  }));

  const pieColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

  const chartConfig = {
    count: {
      label: "Loan Count",
      color: "#8884d8",
    },
  };

  // Debug button state
  const isButtonDisabled = !selectedFile || isProcessing || previewData.length === 0 || !user;
  console.log('Button state:', {
    isButtonDisabled,
    selectedFile: !!selectedFile,
    isProcessing,
    previewDataLength: previewData.length,
    user: !!user
  });

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`${showPreview ? 'max-w-6xl' : 'max-w-md'} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            <span>{showExistingData ? 'View Existing Loan Data' : 'Upload Loan Tape Data'}</span>
          </DialogTitle>
          <DialogDescription>
            {showExistingData 
              ? 'Viewing existing loan portfolio data from your database with analytics and charts.' 
              : 'Select an Excel file containing your loan portfolio data. Data will be parsed and saved to your secure database.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {!showExistingData && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id="excel-upload"
                disabled={isProcessing}
              />
              <label htmlFor="excel-upload" className={`cursor-pointer ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}>
                <div className="flex flex-col items-center space-y-2">
                  <Upload className="h-8 w-8 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {isProcessing ? 'Processing file...' : 'Click to select Excel file'}
                  </span>
                  <span className="text-xs text-gray-400">
                    Supports .xlsx and .xls formats
                  </span>
                </div>
              </label>
            </div>
          )}

          {selectedFile && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">{selectedFile.name}</span>
                  {showExistingData && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Existing Data</span>
                  )}
                </div>
                {!showExistingData && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      setWorksheets([]);
                      setPreviewData([]);
                      setShowPreview(false);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="text-xs text-gray-600 mb-2">
                {showExistingData ? 'Historical Data' : `Size: ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`}
              </div>
              
              {worksheets.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-1">
                    {showExistingData ? 'Available Worksheets' : 'Detected Worksheets'} ({worksheets.length}):
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

          {showPreview && previewData.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Loans</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{summaryStats.totalLoans.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Individual Loan Records</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Portfolio Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      €{(summaryStats.totalPortfolioValue / 1000000).toFixed(1)}M
                    </div>
                    <div className="text-xs text-gray-500">Total Opening Balance</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Avg Interest Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {summaryStats.avgInterestRate.toFixed(2)}%
                    </div>
                    <div className="text-xs text-gray-500">Weighted by Opening Balance</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">High Risk Loans</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {summaryStats.highRiskLoans.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">Credit Score &lt;650 or LTV &gt;90%</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Average Loan Amount</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold text-purple-600">
                      €{(summaryStats.avgLoanAmount / 1000).toFixed(0)}K
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Average Credit Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold text-indigo-600">
                      {summaryStats.avgCreditScore.toFixed(0)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="chart" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="chart" className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>Chart View</span>
                  </TabsTrigger>
                  <TabsTrigger value="table" className="flex items-center space-x-2">
                    <TableIcon className="h-4 w-4" />
                    <span>Table View</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="chart" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Loan Distribution by Type</CardTitle>
                        <CardDescription>Number of loans by loan type</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ChartContainer config={chartConfig} className="h-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                              <XAxis dataKey="loanType" tick={{ fontSize: 12 }} />
                              <YAxis />
                              <ChartTooltip content={<ChartTooltipContent />} />
                              <Bar dataKey="count" fill="#8884d8" />
                            </BarChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Portfolio Composition</CardTitle>
                        <CardDescription>Loan type distribution</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ChartContainer config={chartConfig} className="h-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                outerRadius={60}
                                fill="#8884d8"
                                dataKey="count"
                                label={({ loanType, percent }) => `${loanType} ${(percent * 100).toFixed(0)}%`}
                              >
                                {chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                                ))}
                              </Pie>
                              <ChartTooltip content={<ChartTooltipContent />} />
                            </PieChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="table">
                  <Card>
                    <CardHeader>
                      <CardTitle>Loan Data Preview</CardTitle>
                      <CardDescription>First 10 records from the {showExistingData ? 'database' : 'uploaded'} data ({summaryStats.totalLoans.toLocaleString()} total loans)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-[300px] overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Loan Amount</TableHead>
                              <TableHead>Opening Balance</TableHead>
                              <TableHead>Interest Rate</TableHead>
                              <TableHead>Term (Years)</TableHead>
                              <TableHead>Loan Type</TableHead>
                              <TableHead>Credit Score</TableHead>
                              <TableHead>LTV %</TableHead>
                              {showExistingData && <TableHead>Worksheet</TableHead>}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {previewData.slice(0, 10).map((loan, index) => (
                              <TableRow key={index}>
                                <TableCell>€{loan.loan_amount.toLocaleString()}</TableCell>
                                <TableCell>€{loan.opening_balance.toLocaleString()}</TableCell>
                                <TableCell>{loan.interest_rate}%</TableCell>
                                <TableCell>{loan.term}</TableCell>
                                <TableCell>{loan.loan_type}</TableCell>
                                <TableCell>{loan.credit_score}</TableCell>
                                <TableCell>{loan.ltv}%</TableCell>
                                {showExistingData && <TableCell>{loan.worksheet_name}</TableCell>}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}

          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isProcessing}
            >
              {showExistingData ? 'Close' : 'Cancel'}
            </Button>
            {!showExistingData && (
              <Button
                onClick={handleUpload}
                disabled={isButtonDisabled}
                className="flex-1"
              >
                {isProcessing ? 'Processing...' : `Upload & Save to Database ${previewData.length > 0 ? `(${previewData.length} records)` : ''}`}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExcelUpload;

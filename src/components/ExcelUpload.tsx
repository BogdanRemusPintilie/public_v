
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

interface ExcelUploadProps {
  isOpen: boolean;
  onClose: () => void;
  showExistingData?: boolean;
}

interface LoanData {
  loanAmount: number;
  interestRate: number;
  term: number;
  loanType: string;
  creditScore: number;
  ltv: number;
}

const ExcelUpload: React.FC<ExcelUploadProps> = ({ isOpen, onClose, showExistingData = false }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [worksheets, setWorksheets] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<LoanData[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  // Mock loan tape data generator
  const generateMockLoanData = (): LoanData[] => {
    const loanTypes = ['Conventional', 'FHA', 'VA', 'USDA', 'Jumbo'];
    return Array.from({ length: 50 }, (_, i) => ({
      loanAmount: Math.floor(Math.random() * 800000) + 100000,
      interestRate: parseFloat((Math.random() * 3 + 3).toFixed(2)),
      term: [15, 20, 25, 30][Math.floor(Math.random() * 4)],
      loanType: loanTypes[Math.floor(Math.random() * loanTypes.length)],
      creditScore: Math.floor(Math.random() * 300) + 500,
      ltv: parseFloat((Math.random() * 40 + 60).toFixed(1))
    }));
  };

  // Load existing data when showExistingData is true
  useEffect(() => {
    if (showExistingData && isOpen) {
      const mockData = generateMockLoanData();
      setPreviewData(mockData);
      setShowPreview(true);
      setWorksheets(['Historical_Portfolio_2024', 'Q4_Originations', 'Risk_Assessment', 'Performance_Metrics']);
      
      // Simulate an existing file
      const mockFile = new File([''], 'existing_loan_portfolio_2024.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      setSelectedFile(mockFile);
      
      toast({
        title: "Existing Data Loaded",
        description: `Displaying ${mockData.length} loan records from historical data`,
      });
    }
  }, [showExistingData, isOpen, toast]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.type === 'application/vnd.ms-excel' ||
          file.name.endsWith('.xlsx') || 
          file.name.endsWith('.xls')) {
        setSelectedFile(file);
        setWorksheets(['Loan_Portfolio', 'Credit_Analysis', 'Risk_Metrics', 'Origination_Data']);
        
        // Generate mock preview data
        const mockData = generateMockLoanData();
        setPreviewData(mockData);
        setShowPreview(true);
        
        toast({
          title: "File Selected",
          description: `${file.name} ready for upload with data preview available`,
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
    
    setTimeout(() => {
      toast({
        title: "Upload Successful",
        description: `${selectedFile.name} has been processed with ${previewData.length} loan records`,
      });
      setIsProcessing(false);
      handleClose();
    }, 2000);
  };

  const handleClose = () => {
    setSelectedFile(null);
    setWorksheets([]);
    setIsProcessing(false);
    setPreviewData([]);
    setShowPreview(false);
    onClose();
  };

  // Calculate real summary statistics from the loan data
  const summaryStats = {
    totalLoans: previewData.length,
    totalPortfolioValue: previewData.reduce((sum, loan) => sum + loan.loanAmount, 0),
    avgLoanAmount: previewData.reduce((sum, loan) => sum + loan.loanAmount, 0) / previewData.length || 0,
    avgInterestRate: previewData.reduce((sum, loan) => sum + loan.interestRate, 0) / previewData.length || 0,
    avgCreditScore: previewData.reduce((sum, loan) => sum + loan.creditScore, 0) / previewData.length || 0,
    avgLTV: previewData.reduce((sum, loan) => sum + loan.ltv, 0) / previewData.length || 0,
    highRiskLoans: previewData.filter(loan => loan.creditScore < 650 || loan.ltv > 90).length,
  };

  // Chart data
  const loanTypeData = previewData.reduce((acc, loan) => {
    acc[loan.loanType] = (acc[loan.loanType] || 0) + 1;
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
              ? 'Viewing existing loan portfolio data with analytics and charts.' 
              : 'Select an Excel file containing your loan portfolio data. Multiple worksheets are supported.'
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
                    <div className="text-2xl font-bold text-blue-600">{summaryStats.totalLoans}</div>
                    <div className="text-xs text-gray-500">Portfolio Size</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Portfolio Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      ${(summaryStats.totalPortfolioValue / 1000000).toFixed(1)}M
                    </div>
                    <div className="text-xs text-gray-500">Total Outstanding</div>
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
                    <div className="text-xs text-gray-500">Weighted Average</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">High Risk Loans</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {summaryStats.highRiskLoans}
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
                      ${(summaryStats.avgLoanAmount / 1000).toFixed(0)}K
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
                      <CardDescription>First 10 records from the {showExistingData ? 'existing' : 'uploaded'} data</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-[300px] overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Loan Amount</TableHead>
                              <TableHead>Interest Rate</TableHead>
                              <TableHead>Term (Years)</TableHead>
                              <TableHead>Loan Type</TableHead>
                              <TableHead>Credit Score</TableHead>
                              <TableHead>LTV %</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {previewData.slice(0, 10).map((loan, index) => (
                              <TableRow key={index}>
                                <TableCell>${loan.loanAmount.toLocaleString()}</TableCell>
                                <TableCell>{loan.interestRate}%</TableCell>
                                <TableCell>{loan.term}</TableCell>
                                <TableCell>{loan.loanType}</TableCell>
                                <TableCell>{loan.creditScore}</TableCell>
                                <TableCell>{loan.ltv}%</TableCell>
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
                disabled={!selectedFile || isProcessing}
                className="flex-1"
              >
                {isProcessing ? 'Processing...' : 'Upload & Process'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExcelUpload;

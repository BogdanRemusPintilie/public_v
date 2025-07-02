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
} from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { getLoanData } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Download, BarChart3, Database, FileText } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DataExtractorProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DatasetSummary {
  dataset_name: string;
  record_count: number;
  total_value: number;
  avg_interest_rate: number;
  created_at: string;
  records: any[];
}

const DataExtractor: React.FC<DataExtractorProps> = ({ isOpen, onClose }) => {
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [selectedDatasets, setSelectedDatasets] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [extractedData, setExtractedData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({
    minLoanAmount: '',
    maxLoanAmount: '',
    minInterestRate: '',
    maxInterestRate: '',
    loanType: 'all',
    minCreditScore: '',
    maxCreditScore: ''
  });
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && user) {
      loadDatasets();
    }
  }, [isOpen, user]);

  const loadDatasets = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const allData = await getLoanData(user.id);
      
      // Group data by dataset_name
      const datasetMap = new Map<string, any[]>();
      
      allData.forEach(record => {
        const datasetName = record.dataset_name || 'Unnamed Dataset';
        if (!datasetMap.has(datasetName)) {
          datasetMap.set(datasetName, []);
        }
        datasetMap.get(datasetName)!.push(record);
      });
      
      // Create dataset summaries
      const datasetSummaries: DatasetSummary[] = Array.from(datasetMap.entries()).map(([name, records]) => {
        const totalValue = records.reduce((sum, record) => sum + record.opening_balance, 0);
        const avgInterestRate = records.length > 0 ? 
          records.reduce((sum, record) => sum + (record.interest_rate * record.opening_balance), 0) / totalValue : 0;
        const earliestDate = records.reduce((earliest, record) => 
          new Date(record.created_at) < new Date(earliest) ? record.created_at : earliest, 
          records[0]?.created_at
        );
        
        return {
          dataset_name: name,
          record_count: records.length,
          total_value: totalValue,
          avg_interest_rate: avgInterestRate,
          created_at: earliestDate,
          records: records
        };
      });
      
      setDatasets(datasetSummaries);
      
      toast({
        title: "Datasets Loaded",
        description: `Found ${datasetSummaries.length} datasets`,
      });
    } catch (error) {
      console.error('Error loading datasets:', error);
      toast({
        title: "Error Loading Datasets",
        description: "Failed to load datasets. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDataset = (datasetName: string, checked: boolean) => {
    const newSelected = new Set(selectedDatasets);
    if (checked) {
      newSelected.add(datasetName);
    } else {
      newSelected.delete(datasetName);
    }
    setSelectedDatasets(newSelected);
  };

  const handleDownloadDataset = (dataset: DatasetSummary) => {
    // Convert dataset to CSV
    const headers = ['Dataset', 'Opening Balance', 'Interest Rate', 'Term', 'PD', 'Loan Type', 'Credit Score', 'LTV'];
    const csvContent = [
      headers.join(','),
      ...dataset.records.map(row => [
        row.dataset_name || 'Unnamed Dataset',
        row.opening_balance,
        row.interest_rate,
        row.term,
        row.pd || 0,
        row.loan_type,
        row.credit_score,
        row.ltv
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dataset.dataset_name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Download Complete",
      description: `Dataset "${dataset.dataset_name}" has been downloaded as CSV`,
    });
  };

  const handleExtractData = () => {
    if (selectedDatasets.size === 0) {
      toast({
        title: "No Datasets Selected",
        description: "Please select at least one dataset to extract data",
        variant: "destructive",
      });
      return;
    }

    // Get all records from selected datasets
    let combinedData: any[] = [];
    datasets.forEach(dataset => {
      if (selectedDatasets.has(dataset.dataset_name)) {
        combinedData.push(...dataset.records);
      }
    });

    // Apply filters
    let filteredData = combinedData.filter(record => {
      // Loan amount filter
      if (filterCriteria.minLoanAmount && record.opening_balance < parseFloat(filterCriteria.minLoanAmount)) {
        return false;
      }
      if (filterCriteria.maxLoanAmount && record.opening_balance > parseFloat(filterCriteria.maxLoanAmount)) {
        return false;
      }

      // Interest rate filter
      if (filterCriteria.minInterestRate && record.interest_rate < parseFloat(filterCriteria.minInterestRate)) {
        return false;
      }
      if (filterCriteria.maxInterestRate && record.interest_rate > parseFloat(filterCriteria.maxInterestRate)) {
        return false;
      }

      // Loan type filter
      if (filterCriteria.loanType !== 'all' && record.loan_type !== filterCriteria.loanType) {
        return false;
      }

      // Credit score filter
      if (filterCriteria.minCreditScore && record.credit_score < parseFloat(filterCriteria.minCreditScore)) {
        return false;
      }
      if (filterCriteria.maxCreditScore && record.credit_score > parseFloat(filterCriteria.maxCreditScore)) {
        return false;
      }

      return true;
    });

    setExtractedData(filteredData);
    
    toast({
      title: "Data Extracted",
      description: `Extracted ${filteredData.length} records from ${selectedDatasets.size} dataset(s)`,
    });
  };

  const handleDownloadExtract = () => {
    if (extractedData.length === 0) {
      toast({
        title: "No Data to Download",
        description: "Please extract data first",
        variant: "destructive",
      });
      return;
    }

    // Convert data to CSV
    const headers = ['Dataset', 'Opening Balance', 'Interest Rate', 'Term', 'PD', 'Loan Type', 'Credit Score', 'LTV'];
    const csvContent = [
      headers.join(','),
      ...extractedData.map(row => [
        row.dataset_name || 'Unnamed Dataset',
        row.opening_balance,
        row.interest_rate,
        row.term,
        row.pd || 0,
        row.loan_type,
        row.credit_score,
        row.ltv
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extracted_data_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Download Complete",
      description: "Extracted data has been downloaded as CSV",
    });
  };

  const getExtractSummary = () => {
    if (extractedData.length === 0) return null;

    const totalValue = extractedData.reduce((sum, record) => sum + record.opening_balance, 0);
    const avgInterestRate = extractedData.length > 0 ? 
      extractedData.reduce((sum, record) => sum + (record.interest_rate * record.opening_balance), 0) / totalValue : 0;
    const highRiskLoans = extractedData.filter(loan => (loan.pd || 0) > 0.05).length;

    return {
      totalRecords: extractedData.length,
      totalValue,
      avgInterestRate,
      highRiskLoans
    };
  };

  const filteredDatasets = datasets.filter(dataset =>
    dataset.dataset_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const chartConfig = {
    count: {
      label: "Count",
      color: "#2563eb",
    },
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-7xl shadow-lg rounded-md bg-white">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Extractor
            </CardTitle>
            <CardDescription>
              Select datasets and apply filters to extract specific data for analysis, or download complete datasets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Dataset Selection and Download */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Available Datasets</h3>
                
                {/* Search Bar */}
                <div className="mb-4">
                  <Label htmlFor="search" className="text-sm font-medium">
                    Search Datasets
                  </Label>
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      type="text"
                      placeholder="Search by dataset name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Loading datasets...</span>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {filteredDatasets.map((dataset) => (
                      <div key={dataset.dataset_name} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <Checkbox
                          checked={selectedDatasets.has(dataset.dataset_name)}
                          onCheckedChange={(checked) => 
                            handleSelectDataset(dataset.dataset_name, checked as boolean)
                          }
                        />
                        <div className="flex-1">
                          <div className="font-medium">{dataset.dataset_name}</div>
                          <div className="text-sm text-gray-500">
                            {dataset.record_count} records • ${(dataset.total_value / 1000000).toFixed(1)}M
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadDataset(dataset)}
                          className="flex items-center gap-1"
                        >
                          <FileText className="h-3 w-3" />
                          Download CSV
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Filter Criteria */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Filter Criteria (Optional)</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="minLoan">Min Loan Amount</Label>
                      <Input
                        id="minLoan"
                        type="number"
                        placeholder="0"
                        value={filterCriteria.minLoanAmount}
                        onChange={(e) => setFilterCriteria({...filterCriteria, minLoanAmount: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxLoan">Max Loan Amount</Label>
                      <Input
                        id="maxLoan"
                        type="number"
                        placeholder="1000000"
                        value={filterCriteria.maxLoanAmount}
                        onChange={(e) => setFilterCriteria({...filterCriteria, maxLoanAmount: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="minRate">Min Interest Rate (%)</Label>
                      <Input
                        id="minRate"
                        type="number"
                        step="0.01"
                        placeholder="0"
                        value={filterCriteria.minInterestRate}
                        onChange={(e) => setFilterCriteria({...filterCriteria, minInterestRate: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxRate">Max Interest Rate (%)</Label>
                      <Input
                        id="maxRate"
                        type="number"
                        step="0.01"
                        placeholder="20"
                        value={filterCriteria.maxInterestRate}
                        onChange={(e) => setFilterCriteria({...filterCriteria, maxInterestRate: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="loanType">Loan Type</Label>
                    <Select value={filterCriteria.loanType} onValueChange={(value) => setFilterCriteria({...filterCriteria, loanType: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select loan type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="Personal">Personal</SelectItem>
                        <SelectItem value="Mortgage">Mortgage</SelectItem>
                        <SelectItem value="Auto">Auto</SelectItem>
                        <SelectItem value="Business">Business</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="minCredit">Min Credit Score</Label>
                      <Input
                        id="minCredit"
                        type="number"
                        placeholder="300"
                        value={filterCriteria.minCreditScore}
                        onChange={(e) => setFilterCriteria({...filterCriteria, minCreditScore: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxCredit">Max Credit Score</Label>
                      <Input
                        id="maxCredit"
                        type="number"
                        placeholder="850"
                        value={filterCriteria.maxCreditScore}
                        onChange={(e) => setFilterCriteria({...filterCriteria, maxCreditScore: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <Button 
                    onClick={handleExtractData} 
                    className="w-full"
                    disabled={selectedDatasets.size === 0}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Extract Filtered Data ({selectedDatasets.size} dataset{selectedDatasets.size !== 1 ? 's' : ''})
                  </Button>
                  
                  {extractedData.length > 0 && (
                    <Button 
                      onClick={handleDownloadExtract} 
                      variant="outline" 
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Filtered CSV ({extractedData.length} records)
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Extracted Data Summary */}
            {getExtractSummary() && (
              <div className="mt-6 bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Extract Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-blue-600">{getExtractSummary()!.totalRecords}</div>
                    <div className="text-sm text-gray-600">Total Records</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-green-600">
                      ${(getExtractSummary()!.totalValue / 1000000).toFixed(1)}M
                    </div>
                    <div className="text-sm text-gray-600">Portfolio Value</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-purple-600">
                      {getExtractSummary()!.avgInterestRate.toFixed(2)}%
                    </div>
                    <div className="text-sm text-gray-600">Avg Interest Rate</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-red-600">{getExtractSummary()!.highRiskLoans}</div>
                    <div className="text-sm text-gray-600">High Risk Loans</div>
                  </div>
                </div>
              </div>
            )}

            {/* Extracted Data Preview */}
            {extractedData.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-4">Extracted Data Preview</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Dataset</TableHead>
                        <TableHead>Opening Balance</TableHead>
                        <TableHead>Interest Rate</TableHead>
                        <TableHead>Term</TableHead>
                        <TableHead>PD</TableHead>
                        <TableHead>Loan Type</TableHead>
                        <TableHead>Credit Score</TableHead>
                        <TableHead>LTV</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {extractedData.slice(0, 10).map((row, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {row.dataset_name || 'Unnamed Dataset'}
                          </TableCell>
                          <TableCell>${row.opening_balance.toLocaleString()}</TableCell>
                          <TableCell>{row.interest_rate.toFixed(2)}%</TableCell>
                          <TableCell>{row.term}</TableCell>
                          <TableCell>{((row.pd || 0) * 100).toFixed(2)}%</TableCell>
                          <TableCell>{row.loan_type}</TableCell>
                          <TableCell>{row.credit_score}</TableCell>
                          <TableCell>{row.ltv.toFixed(2)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {extractedData.length > 10 && (
                    <p className="text-sm text-gray-500 mt-2">Showing first 10 of {extractedData.length} records</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
          <div className="flex justify-end gap-4 p-6 border-t">
            <Button variant="ghost" onClick={onClose}>Close</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DataExtractor;

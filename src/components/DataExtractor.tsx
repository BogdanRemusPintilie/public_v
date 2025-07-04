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
import { getAccessibleDatasets, getLoanDataByDataset } from '@/utils/supabase';
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
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DataExtractorProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AccessibleDataset {
  name: string;
  owner_id: string;
  is_shared: boolean;
}

const DataExtractor: React.FC<DataExtractorProps> = ({ isOpen, onClose }) => {
  const [datasets, setDatasets] = useState<AccessibleDataset[]>([]);
  const [selectedDatasets, setSelectedDatasets] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [extractedData, setExtractedData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
      console.log('Loading accessible datasets for extraction...');
      
      // Use the same function as DatasetSelector to get all accessible datasets
      const accessibleDatasets = await getAccessibleDatasets();
      
      setDatasets(accessibleDatasets);
      
      toast({
        title: "Datasets Loaded",
        description: `Found ${accessibleDatasets.length} accessible datasets`,
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

  const handleDownloadDataset = async (dataset: AccessibleDataset) => {
    try {
      setIsLoading(true);
      
      // Get complete dataset data using the correct function
      const result = await getLoanDataByDataset(dataset.name, 0, 10000);
      let allRecords = result.data;
      
      // If there are more records, fetch them all
      let page = 1;
      while (result.hasMore) {
        const nextResult = await getLoanDataByDataset(dataset.name, page, 10000);
        allRecords = [...allRecords, ...nextResult.data];
        page++;
        if (!nextResult.hasMore) break;
      }
      
      // Convert dataset to CSV
      const headers = ['Dataset', 'Opening Balance', 'Interest Rate', 'Term', 'PD', 'Loan Type', 'Credit Score', 'LTV'];
      const csvContent = [
        headers.join(','),
        ...allRecords.map(row => [
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
      a.download = `${dataset.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download Complete",
        description: `Dataset "${dataset.name}" has been downloaded as CSV`,
      });
    } catch (error) {
      console.error('Error downloading dataset:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download dataset. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtractData = async () => {
    if (selectedDatasets.size === 0) {
      toast({
        title: "No Datasets Selected",
        description: "Please select at least one dataset to extract data",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Get all records from selected datasets
      let combinedData: any[] = [];
      
      for (const datasetName of selectedDatasets) {
        const result = await getLoanDataByDataset(datasetName, 0, 10000);
        let datasetRecords = result.data;
        
        // If there are more records, fetch them all
        let page = 1;
        while (result.hasMore) {
          const nextResult = await getLoanDataByDataset(datasetName, page, 10000);
          datasetRecords = [...datasetRecords, ...nextResult.data];
          page++;
          if (!nextResult.hasMore) break;
        }
        
        combinedData.push(...datasetRecords);
      }

      setExtractedData(combinedData);
      
      toast({
        title: "Data Extracted",
        description: `Extracted ${combinedData.length} records from ${selectedDatasets.size} dataset(s)`,
      });
    } catch (error) {
      console.error('Error extracting data:', error);
      toast({
        title: "Extraction Failed",
        description: "Failed to extract data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
    dataset.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-md bg-white">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Extractor
            </CardTitle>
            <CardDescription>
              Select datasets to extract data for analysis, or download complete datasets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
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
                ) : filteredDatasets.length === 0 ? (
                  <div className="text-center py-8">
                    <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">No datasets found</p>
                    <p className="text-sm text-gray-400">
                      {searchTerm ? 'No datasets match your search criteria' : 'Upload some data first to get started'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {filteredDatasets.map((dataset) => (
                      <div key={`${dataset.name}-${dataset.owner_id}`} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <Checkbox
                          checked={selectedDatasets.has(dataset.name)}
                          onCheckedChange={(checked) => 
                            handleSelectDataset(dataset.name, checked as boolean)
                          }
                        />
                        <div className="flex-1">
                          <div className="font-medium">{dataset.name}</div>
                          <div className="text-sm text-gray-500">
                            {dataset.is_shared ? 'Shared with you' : 'Your dataset'}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadDataset(dataset)}
                          className="flex items-center gap-1"
                          disabled={isLoading}
                        >
                          <FileText className="h-3 w-3" />
                          Download CSV
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 space-y-3">
                  <Button 
                    onClick={handleExtractData} 
                    className="w-full"
                    disabled={selectedDatasets.size === 0 || isLoading}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Extract Data ({selectedDatasets.size} dataset{selectedDatasets.size !== 1 ? 's' : ''})
                  </Button>
                  
                  {extractedData.length > 0 && (
                    <Button 
                      onClick={handleDownloadExtract} 
                      variant="outline" 
                      className="w-full"
                      disabled={isLoading}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Extracted CSV ({extractedData.length} records)
                    </Button>
                  )}
                </div>
              </div>

              {/* Extracted Data Summary */}
              {getExtractSummary() && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-4 text-gray-800">Extract Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                      <div className="text-2xl font-bold text-blue-600">{getExtractSummary()!.totalRecords.toLocaleString()}</div>
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
                      <div className="text-2xl font-bold text-red-600">{getExtractSummary()!.highRiskLoans.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">High Risk Loans</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Extracted Data Preview */}
              {extractedData.length > 0 && (
                <div>
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
                      <p className="text-sm text-gray-500 mt-2">Showing first 10 of {extractedData.length.toLocaleString()} records</p>
                    )}
                  </div>
                </div>
              )}
            </div>
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

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download, FileText, X, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

interface ExtractionToolProps {
  onClose: () => void;
}

const ExtractionTool = ({ onClose }: ExtractionToolProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [extractedData2, setExtractedData2] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['portfolioBalance', 'cumulativeLosses']);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Demo data that matches the image structure
  const demoData = {
    portfolioSize: 1100000000,
    trancheF: {
      size: 19250000,
      ftBalance: 10000000,
      attachmentDetachment: "2.75-4.5%",
      coupon: "10.00%"
    },
    trancheG: {
      size: 8250000,
      ftBalance: 30000,
      attachmentDetachment: "2-2.75%",
      coupon: "21%"
    },
    dates: {
      closing: "15.06.2023",
      purchase: "15.06.2023",
      purchasePrice: "100%",
      maturity: "",
      call: ""
    },
    reporting: {
      howToGetReports: "Citi® Investor Reporting for Structured Finance (citidirect.com)",
      password: "Spring2025."
    },
    summary: {
      origination: {
        new: "86.40%",
        used: "13.60%",
        waIR: "6.00%",
        waLTV: "95.20%",
        waFICO: 758,
        waRemainingTerm: 66.55,
        portfolioBalance: 1100000000,
        loans: 28077,
        fBalance: 19250000,
        gBalance: 8250000
      },
      monthlyData: [
        { period: "Jan 24", waIR: "5.81%", waRemainingTerm: 59.09, delinquency: "1.58%", cumulativeLosses: 2571183, cumulativeLossesPercent: "0.23%", monthlyDefaults: 705755.13, portfolioBalance: 873956666.75, poolFactor: 0.79, loans: 23998, fBalance: 19250000, gBalance: 8250000 },
        { period: "Feb 24", waIR: "5.80%", waRemainingTerm: 58.18, delinquency: "1.62%", cumulativeLosses: 3146990, cumulativeLossesPercent: "0.29%", monthlyDefaults: 1009749.52, portfolioBalance: 848901455.14, poolFactor: 0.77, loans: 23619, fBalance: 19250000, gBalance: 8250000 },
        { period: "Mar 24", waIR: "5.78%", waRemainingTerm: 57.25, delinquency: "", cumulativeLosses: 3466270, cumulativeLossesPercent: "0.32%", monthlyDefaults: 814458.58, portfolioBalance: 824229126.33, poolFactor: 0.75, loans: null, fBalance: 19250000, gBalance: 8250000 },
        { period: "Apr 24", waIR: "5.77%", waRemainingTerm: 56.29, delinquency: "1.50%", cumulativeLosses: 4442136, cumulativeLossesPercent: "0.40%", monthlyDefaults: 1750907.88, portfolioBalance: 797163097.29, poolFactor: 0.72, loans: null, fBalance: 19250000, gBalance: 8250000 },
        { period: "May 24", waIR: "5.76%", waRemainingTerm: 55.34, delinquency: "1.53%", cumulativeLosses: 5101943, cumulativeLossesPercent: "0.46%", monthlyDefaults: 1312505.90, portfolioBalance: 771869079.81, poolFactor: 0.70, loans: 22132, fBalance: 19250000, gBalance: 8250000 },
        { period: "Jun 24", waIR: "5.74%", waRemainingTerm: 54.39, delinquency: "1.53%", cumulativeLosses: 5650244, cumulativeLossesPercent: "0.51%", monthlyDefaults: 1027733.19, portfolioBalance: 747163881.18, poolFactor: 0.68, loans: 21780, fBalance: 19250000, gBalance: 8250000 },
        { period: "Jul 24", waIR: "5.74%", waRemainingTerm: 53.48, delinquency: "1.65%", cumulativeLosses: 6104366, cumulativeLossesPercent: "0.55%", monthlyDefaults: 745999.19, portfolioBalance: 723815016.95, poolFactor: 0.66, loans: 21430, fBalance: 19250000, gBalance: 8250000 },
        { period: "Aug 24", waIR: "5.72%", waRemainingTerm: 52.53, delinquency: "1.84%", cumulativeLosses: 6731725, cumulativeLossesPercent: "0.61%", monthlyDefaults: 1151573.41, portfolioBalance: 700152484.91, poolFactor: 0.64, loans: 21090, fBalance: 19250000, gBalance: 8250000 },
        { period: "Sep 24", waIR: "5.71%", waRemainingTerm: 51.59, delinquency: "1.97%", cumulativeLosses: 6785637.12, cumulativeLossesPercent: "0.62%", monthlyDefaults: 824492.90, portfolioBalance: 676896077.08, poolFactor: 0.62, loans: 20739, fBalance: 19250000, gBalance: 8250000 },
        { period: "Oct 24", waIR: "5.71%", waRemainingTerm: 50.68, delinquency: "2.15%", cumulativeLosses: 7295089.15, cumulativeLossesPercent: "0.66%", monthlyDefaults: 1023480.38, portfolioBalance: 654699741.41, poolFactor: 0.60, loans: 19739, fBalance: 19250000, gBalance: 8250000 },
        { period: "Jan 25", waIR: "5.72%", waRemainingTerm: 47.94, delinquency: "2.54%", cumulativeLosses: 8456431.92, cumulativeLossesPercent: "0.77%", monthlyDefaults: 505527.08, portfolioBalance: 589384393.42, poolFactor: 0.54, loans: 19020, fBalance: 19250000, gBalance: 8250000 },
        { period: "Mar 25", waIR: "5.71%", waRemainingTerm: 46.12, delinquency: "2.47%", cumulativeLosses: 9155332.61, cumulativeLossesPercent: "0.83%", monthlyDefaults: 1374016.05, portfolioBalance: 547303007.97, poolFactor: 0.50, loans: null, fBalance: 19250000, gBalance: 8250000 },
        { period: "May 25", waIR: "5.72%", waRemainingTerm: 44.29, delinquency: "2.47%", cumulativeLosses: 9905523.92, cumulativeLossesPercent: "0.90%", monthlyDefaults: 731231.19, portfolioBalance: 504731908.46, poolFactor: 0.46, loans: null, fBalance: 19250000, gBalance: 8250000 },
        { period: "Jun 25", waIR: "5.74%", waRemainingTerm: 42.48, delinquency: "2.77%", cumulativeLosses: 10401986.87, cumulativeLossesPercent: "0.95%", monthlyDefaults: 901887.25, portfolioBalance: 462546078.93, poolFactor: 0.42, loans: 17502, fBalance: 19250000, gBalance: 8250000 }
      ]
    },
    balances: {
      fBalance: 19250000,
      gBalance: 8250000
    }
  };

  // Second demo data based on provided information
  const demoData2 = {
    portfolioSize: 1030812926.20,
    rampedUpNotional: 1430812926.20,
    trancheSize: 103100000,
    ftBalance: 4000000,
    attachmentDetachment: "1.3-8.5%",
    coupon: "3mE + 9%",
    dates: {
      closing: "03.08.2023",
      purchase: "03.08.2023",
      purchasePrice: "100%",
      maturity: "",
      call: "WAL+REP (1.45+18m)"
    },
    rampUp: "6m",
    replenishment: "18m",
    reporting: {
      howToGetReports: "https://editor.eurodw.eu/simplelogin",
      otherName: "Boa Vista, Syntotta 4",
      edCode: "MIXSPT000093500420236"
    },
    monthlyData: [
      { period: "Dez 23", noLoans: 13019, noBorrowers: 9859, wapd: "1.03%", waLgd: "44.7%", wal: 3.4, prona: 1430812926, cumulativeDefaults: 682517, cumulativeDefaultsPercent: "0.05%", initialLossAmount: 295497, initialLossPercent: "0.02%", trancheNotional: 18305071, retainedNotional: 18305071, subordination: "1.28%" },
      { period: "Jan 24", noLoans: 12467, noBorrowers: 9478, wapd: "1.10%", waLgd: "44.60%", wal: 3.3, prona: 1430812926, cumulativeDefaults: 682517, cumulativeDefaultsPercent: "0.05%", initialLossAmount: 295497, initialLossPercent: "0.02%", trancheNotional: 103000000, retainedNotional: 18027309, subordination: "1.26%" },
      { period: "Mrz 24", noLoans: 12060, noBorrowers: 9313, wapd: "1.10%", waLgd: "46.53%", wal: 3.3, prona: 1430812926, cumulativeDefaults: 1208808, cumulativeDefaultsPercent: "0.08%", initialLossAmount: 573259, initialLossPercent: "0.04%", trancheNotional: 103000000, retainedNotional: 16636035, subordination: "1.16%" },
      { period: "Apr 24", noLoans: 11473, noBorrowers: 7617, wapd: "1.17%", waLgd: "43.88%", wal: 3.47, prona: 1430812926, cumulativeDefaults: 1208808, cumulativeDefaultsPercent: "0.08%", initialLossAmount: 573259, initialLossPercent: "0.04%", trancheNotional: 103000000, retainedNotional: 15973696, subordination: "1.16%" },
      { period: "Jun 24", noLoans: 11205, noBorrowers: 8876, wapd: "1.25%", waLgd: "43.80%", wal: 3.44, prona: 1428848394, cumulativeDefaults: 3906011, cumulativeDefaultsPercent: "0.27%", initialLossAmount: 1998519, initialLossPercent: "0.14%", trancheNotional: 103000000, retainedNotional: 14997232, subordination: "1.05%" },
      { period: "Sep 24", noLoans: 10324, noBorrowers: 7129, wapd: "1.41%", waLgd: "48.31%", wal: 3.72, prona: 1430812926, cumulativeDefaults: 5158080, cumulativeDefaultsPercent: "0.36%", initialLossAmount: 2648625, initialLossPercent: "0.19%", trancheNotional: 103000000, retainedNotional: 14349714.63, subordination: "1.08%" },
      { period: "Dez 24", noLoans: 11232, noBorrowers: 9133, wapd: "1.16%", waLgd: "45.03%", wal: 3.99, prona: 1430812926, cumulativeDefaults: 6719245, cumulativeDefaultsPercent: "0.47%", initialLossAmount: 3517367, initialLossPercent: "0.25%", trancheNotional: 103000000, retainedNotional: 95501890.22, subordination: "" },
      { period: "Mrz 25", noLoans: 9508, noBorrowers: 7789, wapd: "1.96%", waLgd: "46.53%", wal: 4.53, prona: 1328007846, cumulativeDefaults: 8337685, cumulativeDefaultsPercent: "0.58%", initialLossAmount: 4388098, initialLossPercent: "0.31%", trancheNotional: 95501890.22, retainedNotional: 14349714.63, subordination: "" }
    ],
    pdBreakdown: {
      origination: { "0-0.5": "49.7%", "0.5-1": "18.1%", "1-1.5": "17.0%", "1.5-2": "7.2%", "2-2.5": "5.2%", "3-3.5": "0.3%", "4-4.5": "0.6%", "5-5.5": "1.1%", "20-99": "0.4%", "99-100": "0.13%", "100.00": "0.17%", "total": "100.0%" },
      periods: [
        { period: "Dez 23", "0-0.5": "46.0%", "0.5-1": "16.9%", "1-1.5": "21.1%", "1.5-2": "8.3%", "2-2.5": "5.6%", "3-3.5": "0.3%", "4-4.5": "0.5%", "5-5.5": "1.0%", "20-99": "0.2%", "99-100": "0.07%", "100.00": "0.05%", "total": "100.0%" },
        { period: "Jan 24", "0-0.5": "46.0%", "0.5-1": "17.4%", "1-1.5": "21.2%", "1.5-2": "7.7%", "2-2.5": "5.5%", "3-3.5": "0.3%", "4-4.5": "0.6%", "5-5.5": "1.0%", "20-99": "0.1%", "99-100": "0.09%", "100.00": "0.06%", "total": "100.0%" }
      ]
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      toast({
        title: "File 1 Selected",
        description: `${selectedFile.name} is ready for processing`,
      });
    }
  };

  const handleFile2Upload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile2(selectedFile);
      toast({
        title: "File 2 Selected",
        description: `${selectedFile.name} is ready for processing`,
      });
    }
  };

  const handleExtraction = async () => {
    if (!file && !file2) {
      toast({
        title: "No Files Selected",
        description: "Please select at least one PDF or Excel file to extract data from",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate extraction process
    setTimeout(() => {
      if (file) {
        setExtractedData(demoData);
      }
      if (file2) {
        setExtractedData2(demoData2);
        // Navigate to PD Analysis page with the extracted data
        navigate('/pd-analysis', { state: { extractedData2: demoData2 } });
        onClose(); // Close the extraction tool modal
      }
      setIsLoading(false);
      toast({
        title: "Extraction Complete",
        description: `Financial data has been successfully extracted from ${file && file2 ? 'both files' : 'your file'}${file2 ? '. Opening PD Analysis page...' : ''}`,
      });
    }, 2000);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  // Chart configuration
  const chartMetrics = [
    { key: 'portfolioBalance', label: 'Portfolio Balance', type: 'currency' },
    { key: 'cumulativeLosses', label: 'Cumulative Losses', type: 'currency' },
    { key: 'monthlyDefaults', label: 'Monthly Defaults', type: 'currency' },
    { key: 'waRemainingTerm', label: 'WA Remaining Term', type: 'number' },
    { key: 'poolFactor', label: 'Pool Factor', type: 'decimal' },
    { key: 'loans', label: 'Loans', type: 'number' },
    { key: 'fBalance', label: 'F Balance', type: 'currency' },
    { key: 'gBalance', label: 'G Balance', type: 'currency' }
  ];

  const getLineColor = (index: number) => {
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'];
    return colors[index % colors.length];
  };

  const getMetricLabel = (key: string) => {
    return chartMetrics.find(m => m.key === key)?.label || key;
  };

  const getMetricType = (key: string) => {
    return chartMetrics.find(m => m.key === key)?.type || 'number';
  };

  const formatChartValue = (value: any, metrics: string[]) => {
    if (typeof value !== 'number') return value;
    
    // Determine format based on the first selected metric
    const firstMetricType = getMetricType(metrics[0]);
    
    if (firstMetricType === 'currency') {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (firstMetricType === 'decimal') {
      return value.toFixed(2);
    } else {
      return formatNumber(value);
    }
  };

  const formatTooltipValue = (value: any, name: string) => {
    if (typeof value !== 'number') return value;
    
    const metricType = getMetricType(name);
    
    if (metricType === 'currency') {
      return formatCurrency(value);
    } else if (metricType === 'decimal') {
      return value.toFixed(2);
    } else {
      return formatNumber(value);
    }
  };

  const toggleMetric = (metric: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metric) 
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <Card className="w-full max-w-7xl mt-4 mb-4 bg-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">Extraction Tool</CardTitle>
            <CardDescription>Upload PDF or Excel files to extract financial data</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* File Upload Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First File Upload */}
            <Card className="border-dashed border-2 border-blue-300 hover:border-blue-400 transition-colors">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <Upload className="h-8 w-8 text-blue-400 mx-auto" />
                  <div>
                    <Label htmlFor="file-upload" className="cursor-pointer">
                      <span className="text-md font-medium text-gray-900">Upload File 1</span>
                      <p className="text-sm text-gray-500 mt-1">Portfolio Data (PDF/Excel)</p>
                    </Label>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".pdf,.xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                  {file && (
                    <div className="flex items-center justify-center space-x-2 text-sm text-blue-600">
                      <FileText className="h-4 w-4" />
                      <span className="truncate">{file.name}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Second File Upload */}
            <Card className="border-dashed border-2 border-green-300 hover:border-green-400 transition-colors">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <Upload className="h-8 w-8 text-green-400 mx-auto" />
                  <div>
                    <Label htmlFor="file2-upload" className="cursor-pointer">
                      <span className="text-md font-medium text-gray-900">Upload File 2</span>
                      <p className="text-sm text-gray-500 mt-1">PD Analysis Data (PDF/Excel)</p>
                    </Label>
                    <Input
                      id="file2-upload"
                      type="file"
                      accept=".pdf,.xlsx,.xls"
                      onChange={handleFile2Upload}
                      className="hidden"
                    />
                  </div>
                  {file2 && (
                    <div className="flex items-center justify-center space-x-2 text-sm text-green-600">
                      <FileText className="h-4 w-4" />
                      <span className="truncate">{file2.name}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Extract Button */}
          <div className="text-center">
            <Button 
              onClick={handleExtraction} 
              disabled={(!file && !file2) || isLoading}
              className="w-48"
              size="lg"
            >
              {isLoading ? "Extracting..." : "Extract Data from Files"}
            </Button>
          </div>

          {/* Extracted Data Display */}
          {extractedData && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h3 className="text-lg font-semibold">Extracted Financial Data</h3>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate('/investor-report', { state: { extractedData: demoData } })}
                    >
                      SBCLN
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate('/pd-analysis', { state: { extractedData2: demoData2 } })}
                    >
                      BSTS 4
                    </Button>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Results
                </Button>
              </div>

              {/* Portfolio Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Portfolio Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-medium">Portfolio Size</span>
                        <span>{formatCurrency(extractedData.portfolioSize)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Closing Date</span>
                        <span>{extractedData.dates.closing}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Purchase Date</span>
                        <span>{extractedData.dates.purchase}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Purchase Price</span>
                        <span>{extractedData.dates.purchasePrice}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-blue-600">Tranche F</h4>
                      <div className="flex justify-between">
                        <span>Tranche Size F</span>
                        <span>{formatCurrency(extractedData.trancheF.size)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>FT Balance F</span>
                        <span>{formatCurrency(extractedData.trancheF.ftBalance)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Attachment/Detachment</span>
                        <span>{extractedData.trancheF.attachmentDetachment}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Coupon</span>
                        <span>{extractedData.trancheF.coupon}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-green-600">Tranche G</h4>
                      <div className="flex justify-between">
                        <span>Tranche Size G</span>
                        <span>{formatCurrency(extractedData.trancheG.size)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>FT Balance G</span>
                        <span>{formatCurrency(extractedData.trancheG.ftBalance)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Attachment/Detachment</span>
                        <span>{extractedData.trancheG.attachmentDetachment}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Coupon</span>
                        <span>{extractedData.trancheG.coupon}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reporting Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Reporting Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">How to get Reports</span>
                      <span className="text-blue-600 underline cursor-pointer">{extractedData.reporting.howToGetReports}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Password</span>
                      <span className="font-mono">{extractedData.reporting.password}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Summary Data */}
              <Card>
                <CardHeader>
                  <CardTitle>Portfolio Summary & Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Origination Summary */}
                  <div className="mb-6">
                    <h4 className="font-semibold mb-3">Origination Summary</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">{extractedData.summary.origination.new}</div>
                        <div className="text-sm text-blue-700">New</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-bold text-green-600">{extractedData.summary.origination.used}</div>
                        <div className="text-sm text-green-700">Used</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-lg font-bold text-purple-600">{extractedData.summary.origination.waIR}</div>
                        <div className="text-sm text-purple-700">WA IR</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-lg font-bold text-orange-600">{extractedData.summary.origination.waLTV}</div>
                        <div className="text-sm text-orange-700">WA LTV</div>
                      </div>
                      <div className="text-center p-3 bg-teal-50 rounded-lg">
                        <div className="text-lg font-bold text-teal-600">{extractedData.summary.origination.waFICO}</div>
                        <div className="text-sm text-teal-700">WA FICO</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-lg font-bold text-red-600">{extractedData.summary.origination.waRemainingTerm}</div>
                        <div className="text-sm text-red-700">WA Remaining Term</div>
                      </div>
                      <div className="text-center p-3 bg-indigo-50 rounded-lg">
                        <div className="text-lg font-bold text-indigo-600">{formatCurrency(extractedData.summary.origination.portfolioBalance)}</div>
                        <div className="text-sm text-indigo-700">Portfolio Balance</div>
                      </div>
                      <div className="text-center p-3 bg-pink-50 rounded-lg">
                        <div className="text-lg font-bold text-pink-600">{formatNumber(extractedData.summary.origination.loans)}</div>
                        <div className="text-sm text-pink-700">Loans</div>
                      </div>
                      <div className="text-center p-3 bg-cyan-50 rounded-lg">
                        <div className="text-lg font-bold text-cyan-600">{formatCurrency(extractedData.summary.origination.fBalance)}</div>
                        <div className="text-sm text-cyan-700">F Balance</div>
                      </div>
                      <div className="text-center p-3 bg-emerald-50 rounded-lg">
                        <div className="text-lg font-bold text-emerald-600">{formatCurrency(extractedData.summary.origination.gBalance)}</div>
                        <div className="text-sm text-emerald-700">G Balance</div>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Performance Data */}
                  <div className="overflow-x-auto">
                    <h4 className="font-semibold mb-3">Monthly Performance</h4>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Period</th>
                          <th className="text-right p-2">WA IR</th>
                          <th className="text-right p-2">WA Remaining Term</th>
                          <th className="text-right p-2">Delinquency %</th>
                          <th className="text-right p-2">Cumulative Losses</th>
                          <th className="text-right p-2">Losses %</th>
                          <th className="text-right p-2">Monthly Defaults</th>
                          <th className="text-right p-2">Portfolio Balance</th>
                          <th className="text-right p-2">Pool Factor</th>
                          <th className="text-right p-2">Loans</th>
                          <th className="text-right p-2">F Balance</th>
                          <th className="text-right p-2">G Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {extractedData.summary.monthlyData.map((month: any, index: number) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="p-2 font-medium">{month.period}</td>
                            <td className="p-2 text-right">{month.waIR}</td>
                            <td className="p-2 text-right">{month.waRemainingTerm}</td>
                            <td className="p-2 text-right">{month.delinquency || "-"}</td>
                            <td className="p-2 text-right">{formatCurrency(month.cumulativeLosses)}</td>
                            <td className="p-2 text-right">{month.cumulativeLossesPercent}</td>
                            <td className="p-2 text-right">{formatCurrency(month.monthlyDefaults)}</td>
                            <td className="p-2 text-right">{formatCurrency(month.portfolioBalance)}</td>
                            <td className="p-2 text-right">{month.poolFactor?.toFixed(2) || "-"}</td>
                            <td className="p-2 text-right">{month.loans ? formatNumber(month.loans) : "-"}</td>
                            <td className="p-2 text-right">{formatCurrency(month.fBalance)}</td>
                            <td className="p-2 text-right">{formatCurrency(month.gBalance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Interactive Chart Visualization */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        Performance Timeline
                      </h4>
                    </div>
                    
                    {/* Metric Selection */}
                    <div className="mb-4">
                      <Label className="text-sm font-medium mb-2 block">Select Metrics to Display:</Label>
                      <div className="flex flex-wrap gap-2">
                        {chartMetrics.map((metric) => (
                          <Button
                            key={metric.key}
                            variant={selectedMetrics.includes(metric.key) ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleMetric(metric.key)}
                            className="text-xs"
                          >
                            {metric.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Chart */}
                    <div className="h-96 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={extractedData.summary.monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="period" 
                            fontSize={12}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis 
                            fontSize={12}
                            tickFormatter={(value) => formatChartValue(value, selectedMetrics)}
                          />
                          <Tooltip 
                            formatter={(value, name) => [
                              formatTooltipValue(value, name as string), 
                              getMetricLabel(name as string)
                            ]}
                            labelStyle={{ color: '#374151' }}
                          />
                          <Legend />
                          {selectedMetrics.map((metric, index) => (
                            <Line
                              key={metric}
                              type="monotone"
                              dataKey={metric}
                              stroke={getLineColor(index)}
                              strokeWidth={2}
                              dot={{ r: 4 }}
                              activeDot={{ r: 6 }}
                              name={getMetricLabel(metric)}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
};

export default ExtractionTool;
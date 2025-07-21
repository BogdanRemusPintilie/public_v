import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft, TrendingUp } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { exportToExcel, type SBCLNData, type BSTS4Data } from '@/utils/excelExport';

const PDAnalysis = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const extractedData2 = location.state?.extractedData2;
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['noLoans', 'prona']);

  // Demo data that should always be available for BSTS 4
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
      { period: "Origination", noLoans: 11639, noBorrowers: 8959, wapd: "0.90%", waLgd: "47%", wal: 1.45, prona: 1030812926, cumulativeDefaults: 0, cumulativeDefaultsPercent: "0.00%", initialLossAmount: 0, initialLossPercent: "0.00%", trancheNotional: 103100000, subordination: "" },
      { period: "Dez 23", noLoans: 13019, noBorrowers: 9859, wapd: "1.03%", waLgd: "44.7%", wal: 3.4, prona: 1430812926, cumulativeDefaults: 682517, cumulativeDefaultsPercent: "0.05%", initialLossAmount: 295497, initialLossPercent: "0.02%", trancheNotional: 18305071, subordination: "1.28%" },
      { period: "Jan 24", noLoans: 12467, noBorrowers: 9478, wapd: "1.10%", waLgd: "44.60%", wal: 3.3, prona: 1430812926, cumulativeDefaults: 682517, cumulativeDefaultsPercent: "0.05%", initialLossAmount: 295497, initialLossPercent: "0.02%", trancheNotional: 103000000, subordination: "" },
      { period: "Mrz 24", noLoans: 12060, noBorrowers: 9313, wapd: "1.10%", waLgd: "46.53%", wal: 3.3, prona: 1430812926, cumulativeDefaults: 1208808, cumulativeDefaultsPercent: "0.08%", initialLossAmount: 573259, initialLossPercent: "0.04%", trancheNotional: 18027309, subordination: "1.26%" },
      { period: "Apr 24", noLoans: 11473, noBorrowers: 7617, wapd: "1.17%", waLgd: "43.88%", wal: 3.47, prona: 1430812926, cumulativeDefaults: 1208808, cumulativeDefaultsPercent: "0.08%", initialLossAmount: 573259, initialLossPercent: "0.04%", trancheNotional: 103000000, subordination: "" },
      { period: "Jun 24", noLoans: 11205, noBorrowers: 8876, wapd: "1.25%", waLgd: "43.80%", wal: 3.44, prona: 1428848394, cumulativeDefaults: 3906011, cumulativeDefaultsPercent: "0.27%", initialLossAmount: 1998519, initialLossPercent: "0.14%", trancheNotional: 16636035, subordination: "1.16%" },
      { period: "Sep 24", noLoans: 10324, noBorrowers: 7129, wapd: "1.41%", waLgd: "48.31%", wal: 3.72, prona: 1430812926, cumulativeDefaults: 5158080, cumulativeDefaultsPercent: "0.36%", initialLossAmount: 2648625, initialLossPercent: "0.19%", trancheNotional: 15973696, subordination: "1.16%" },
      { period: "Dez 24", noLoans: 11232, noBorrowers: 9133, wapd: "1.16%", waLgd: "45.03%", wal: 3.99, prona: 1430812926, cumulativeDefaults: 6719245, cumulativeDefaultsPercent: "0.47%", initialLossAmount: 3517367, initialLossPercent: "0.25%", trancheNotional: 14997232, subordination: "1.05%" },
      { period: "Mrz 25", noLoans: 9508, noBorrowers: 7789, wapd: "1.96%", waLgd: "46.53%", wal: 4.53, prona: 1328007846, cumulativeDefaults: 8337685, cumulativeDefaultsPercent: "0.58%", initialLossAmount: 4388098, initialLossPercent: "0.31%", trancheNotional: 14349714.63, subordination: "1.08%" }
    ]
  };

  // Use the demo data if no data is passed from navigation
  const data = extractedData2 || demoData2;

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

  // Chart metrics configuration
  const chartMetrics = [
    { key: 'noLoans', label: 'No. Loans', type: 'number' },
    { key: 'noBorrowers', label: 'No. Borrowers', type: 'number' },
    { key: 'wapd', label: 'WAPD', type: 'percentage' },
    { key: 'waLgd', label: 'WA LGD', type: 'percentage' },
    { key: 'wal', label: 'WAL', type: 'decimal' },
    { key: 'prona', label: 'PRONA', type: 'currency' },
    { key: 'cumulativeDefaults', label: 'Cumulative Defaults', type: 'currency' },
    { key: 'initialLossAmount', label: 'Initial Loss Amount', type: 'currency' },
    { key: 'trancheNotional', label: 'Tranche Notional', type: 'currency' }
  ];

  const getLineColor = (index: number) => {
    const colors = ['#10B981', '#3B82F6', '#EF4444', '#F59E0B', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16', '#EC4899'];
    return colors[index % colors.length];
  };

  const getMetricLabel = (key: string) => {
    return chartMetrics.find(m => m.key === key)?.label || key;
  };

  const getMetricType = (key: string) => {
    return chartMetrics.find(m => m.key === key)?.type || 'number';
  };

  const formatChartValue = (value: any, metrics: string[]) => {
    if (typeof value !== 'number' && typeof value !== 'string') return value;
    
    const firstMetricType = getMetricType(metrics[0]);
    
    if (firstMetricType === 'currency') {
      const numValue = typeof value === 'number' ? value : parseFloat(value);
      return `$${(numValue / 1000000).toFixed(1)}M`;
    } else if (firstMetricType === 'percentage') {
      if (typeof value === 'string' && value.includes('%')) {
        return parseFloat(value.replace('%', '')).toFixed(1);
      }
      const numValue = typeof value === 'number' ? value : parseFloat(value);
      return numValue.toFixed(1);
    } else if (firstMetricType === 'decimal') {
      const numValue = typeof value === 'number' ? value : parseFloat(value);
      return numValue.toFixed(2);
    } else {
      const numValue = typeof value === 'number' ? value : parseFloat(value);
      return formatNumber(numValue);
    }
  };

  const formatTooltipValue = (value: any, name: string) => {
    if (typeof value !== 'number' && typeof value !== 'string') return value;
    
    const metricType = getMetricType(name);
    
    if (metricType === 'currency') {
      const numValue = typeof value === 'number' ? value : parseFloat(value);
      return formatCurrency(numValue);
    } else if (metricType === 'percentage') {
      if (typeof value === 'string' && value.includes('%')) {
        return value;
      }
      const numValue = typeof value === 'number' ? value : parseFloat(value);
      return `${numValue}%`;
    } else if (metricType === 'decimal') {
      const numValue = typeof value === 'number' ? value : parseFloat(value);
      return numValue.toFixed(2);
    } else {
      const numValue = typeof value === 'number' ? value : parseFloat(value);
      return formatNumber(numValue);
    }
  };

  const toggleMetric = (metric: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metric) 
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  // Demo SBCLN data structure for export
  const demoSBCLNData: SBCLNData = {
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
    summary: {
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
    }
  };

  const handleExport = () => {
    exportToExcel(demoSBCLNData, data as BSTS4Data);
  };

  // Convert percentage strings to numbers for chart display
  const prepareChartData = (monthlyData: any[]) => {
    return monthlyData.map(month => ({
      ...month,
      wapd: typeof month.wapd === 'string' ? parseFloat(month.wapd.replace('%', '')) : month.wapd,
      waLgd: typeof month.waLgd === 'string' ? parseFloat(month.waLgd.replace('%', '')) : month.waLgd
    }));
  };


  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">PD Analysis & Subordination Data</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => navigate('/investor-report')}>
            SBCLN
          </Button>
          <Button variant="default">
            BSTS 4
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export PD Results
          </Button>
        </div>
      </div>

      {/* Deal Information */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-700">Deal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">Initial Notional</span>
                <span>{formatCurrency(data.portfolioSize)}</span>
              </div>
              <div className="flex justify-between">
                <span>Ramped Up Notional</span>
                <span>{formatCurrency(data.rampedUpNotional)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tranche Size</span>
                <span>{formatCurrency(data.trancheSize)}</span>
              </div>
              <div className="flex justify-between">
                <span>FT Balance</span>
                <span>{formatCurrency(data.ftBalance)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Attachment/Detachment</span>
                <span>{data.attachmentDetachment}</span>
              </div>
              <div className="flex justify-between">
                <span>Coupon</span>
                <span>{data.coupon}</span>
              </div>
              <div className="flex justify-between">
                <span>Closing Date</span>
                <span>{data.dates.closing}</span>
              </div>
              <div className="flex justify-between">
                <span>Purchase Date</span>
                <span>{data.dates.purchase}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Call Date</span>
                <span>{data.dates.call}</span>
              </div>
              <div className="flex justify-between">
                <span>Ramp Up</span>
                <span>{data.rampUp}</span>
              </div>
              <div className="flex justify-between">
                <span>Replenishment</span>
                <span>{data.replenishment}</span>
              </div>
              <div className="flex justify-between">
                <span>How to get Reports</span>
                <a href={data.reporting.howToGetReports} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline text-sm">
                  {data.reporting.howToGetReports}
                </a>
              </div>
              <div className="flex justify-between">
                <span>Other name</span>
                <span>{data.reporting.otherName}</span>
              </div>
              <div className="flex justify-between">
                <span>ED CODE</span>
                <span className="font-mono text-sm">{data.reporting.edCode}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PD Analysis Data Table */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-700">PD Analysis & Performance Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left font-medium">PD</th>
                  <th className="border border-gray-300 p-2 text-center font-medium">Origination</th>
                  <th className="border border-gray-300 p-2 text-center font-medium">Dez 23</th>
                  <th className="border border-gray-300 p-2 text-center font-medium">Jan 24</th>
                  <th className="border border-gray-300 p-2 text-center font-medium">Mrz 24</th>
                  <th className="border border-gray-300 p-2 text-center font-medium">Apr 24</th>
                  <th className="border border-gray-300 p-2 text-center font-medium">Jun 24</th>
                  <th className="border border-gray-300 p-2 text-center font-medium">Sep 24</th>
                  <th className="border border-gray-300 p-2 text-center font-medium">Dez 24</th>
                  <th className="border border-gray-300 p-2 text-center font-medium">Mrz 25</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="border border-gray-300 p-2 font-medium">0-0.5</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">49.7%</td><td className="border border-gray-300 p-2 text-center">46.0%</td><td className="border border-gray-300 p-2 text-center">46.0%</td><td className="border border-gray-300 p-2 text-center">49.1%</td><td className="border border-gray-300 p-2 text-center">49.7%</td><td className="border border-gray-300 p-2 text-center">48.35%</td><td className="border border-gray-300 p-2 text-center">47.72%</td><td className="border border-gray-300 p-2 text-center">38.30%</td></tr>
                <tr><td className="border border-gray-300 p-2 font-medium">0.5-1</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">18.1%</td><td className="border border-gray-300 p-2 text-center">16.9%</td><td className="border border-gray-300 p-2 text-center">17.4%</td><td className="border border-gray-300 p-2 text-center">17.6%</td><td className="border border-gray-300 p-2 text-center">18.1%</td><td className="border border-gray-300 p-2 text-center">17.71%</td><td className="border border-gray-300 p-2 text-center">16.56%</td><td className="border border-gray-300 p-2 text-center">19.38%</td></tr>
                <tr><td className="border border-gray-300 p-2 font-medium">1-1.5</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">17.0%</td><td className="border border-gray-300 p-2 text-center">21.1%</td><td className="border border-gray-300 p-2 text-center">21.2%</td><td className="border border-gray-300 p-2 text-center">18.4%</td><td className="border border-gray-300 p-2 text-center">17.0%</td><td className="border border-gray-300 p-2 text-center">17.77%</td><td className="border border-gray-300 p-2 text-center">18.36%</td><td className="border border-gray-300 p-2 text-center">15.94%</td></tr>
                <tr><td className="border border-gray-300 p-2 font-medium">1.5-2</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">7.2%</td><td className="border border-gray-300 p-2 text-center">8.3%</td><td className="border border-gray-300 p-2 text-center">7.7%</td><td className="border border-gray-300 p-2 text-center">7.2%</td><td className="border border-gray-300 p-2 text-center">7.2%</td><td className="border border-gray-300 p-2 text-center">7.95%</td><td className="border border-gray-300 p-2 text-center">7.45%</td><td className="border border-gray-300 p-2 text-center">7.64%</td></tr>
                <tr><td className="border border-gray-300 p-2 font-medium">2-2.5</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">5.2%</td><td className="border border-gray-300 p-2 text-center">5.6%</td><td className="border border-gray-300 p-2 text-center">5.5%</td><td className="border border-gray-300 p-2 text-center">5.3%</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">4.95%</td><td className="border border-gray-300 p-2 text-center">6.23%</td><td className="border border-gray-300 p-2 text-center">6.18%</td></tr>
                <tr><td className="border border-gray-300 p-2 font-medium">2.5-3</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">0.04%</td><td className="border border-gray-300 p-2 text-center">0.02%</td><td className="border border-gray-300 p-2 text-center">0.02%</td></tr>
                <tr><td className="border border-gray-300 p-2 font-medium">3-3.5</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">0.3%</td><td className="border border-gray-300 p-2 text-center">0.3%</td><td className="border border-gray-300 p-2 text-center">0.3%</td><td className="border border-gray-300 p-2 text-center">0.3%</td><td className="border border-gray-300 p-2 text-center">5.2%</td><td className="border border-gray-300 p-2 text-center">0.30%</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">0.90%</td></tr>
                <tr><td className="border border-gray-300 p-2 font-medium">3.5-4</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">0.0%</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">0.3%</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">0.89%</td><td className="border border-gray-300 p-2 text-center">0.00%</td></tr>
                <tr><td className="border border-gray-300 p-2 font-medium">4-4.5</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">0.6%</td><td className="border border-gray-300 p-2 text-center">0.5%</td><td className="border border-gray-300 p-2 text-center">0.6%</td><td className="border border-gray-300 p-2 text-center">0.5%</td><td className="border border-gray-300 p-2 text-center">0.0%</td><td className="border border-gray-300 p-2 text-center">0.48%</td><td className="border border-gray-300 p-2 text-center">0.49%</td><td className="border border-gray-300 p-2 text-center">0.42%</td></tr>
                <tr><td className="border border-gray-300 p-2 font-medium">4.5-5</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">0.0%</td><td className="border border-gray-300 p-2 text-center">0.0%</td><td className="border border-gray-300 p-2 text-center">0.0%</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">0.6%</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">0.01%</td><td className="border border-gray-300 p-2 text-center">0.00%</td></tr>
                <tr><td className="border border-gray-300 p-2 font-medium">5-5.5</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">1.1%</td><td className="border border-gray-300 p-2 text-center">1.0%</td><td className="border border-gray-300 p-2 text-center">1.0%</td><td className="border border-gray-300 p-2 text-center">1.1%</td><td className="border border-gray-300 p-2 text-center">0.0%</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td></tr>
                <tr><td className="border border-gray-300 p-2 font-medium">5.5-20</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">1.1%</td><td className="border border-gray-300 p-2 text-center">1.42%</td><td className="border border-gray-300 p-2 text-center">1.58%</td><td className="border border-gray-300 p-2 text-center">1.14%</td></tr>
                <tr><td className="border border-gray-300 p-2 font-medium">20-99</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">0.4%</td><td className="border border-gray-300 p-2 text-center">0.2%</td><td className="border border-gray-300 p-2 text-center">0.1%</td><td className="border border-gray-300 p-2 text-center">0.2%</td><td className="border border-gray-300 p-2 text-center">0.4%</td><td className="border border-gray-300 p-2 text-center">0.41%</td><td className="border border-gray-300 p-2 text-center">0.27%</td><td className="border border-gray-300 p-2 text-center">0.61%</td></tr>
                <tr><td className="border border-gray-300 p-2 font-medium">99-100</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">0.13%</td><td className="border border-gray-300 p-2 text-center">0.07%</td><td className="border border-gray-300 p-2 text-center">0.09%</td><td className="border border-gray-300 p-2 text-center">0.07%</td><td className="border border-gray-300 p-2 text-center">0.13%</td><td className="border border-gray-300 p-2 text-center">0.28%</td><td className="border border-gray-300 p-2 text-center">0.06%</td><td className="border border-gray-300 p-2 text-center">0.12%</td></tr>
                <tr><td className="border border-gray-300 p-2 font-medium">100.00</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">0.17%</td><td className="border border-gray-300 p-2 text-center">0.05%</td><td className="border border-gray-300 p-2 text-center">0.06%</td><td className="border border-gray-300 p-2 text-center">0.15%</td><td className="border border-gray-300 p-2 text-center">0.17%</td><td className="border border-gray-300 p-2 text-center">0.33%</td><td className="border border-gray-300 p-2 text-center">0.36%</td><td className="border border-gray-300 p-2 text-center">0.50%</td></tr>
                <tr className="bg-gray-50"><td className="border border-gray-300 p-2 font-bold">Total</td><td className="border border-gray-300 p-2 text-center font-bold">-</td><td className="border border-gray-300 p-2 text-center font-bold">100.0%</td><td className="border border-gray-300 p-2 text-center font-bold">100.0%</td><td className="border border-gray-300 p-2 text-center font-bold">100.0%</td><td className="border border-gray-300 p-2 text-center font-bold">100.0%</td><td className="border border-gray-300 p-2 text-center font-bold">100.0%</td><td className="border border-gray-300 p-2 text-center font-bold">100.0%</td><td className="border border-gray-300 p-2 text-center font-bold">100.0%</td><td className="border border-gray-300 p-2 text-center font-bold">91.15%</td></tr>
                <tr><td className="border border-gray-300 p-2 font-medium">Proj Finance / NA</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">8.85%</td></tr>
                
                <tr className="bg-blue-50"><td className="border border-gray-300 p-2 font-bold">NoLoans</td><td className="border border-gray-300 p-2 text-center font-bold">11639</td><td className="border border-gray-300 p-2 text-center font-bold">13019</td><td className="border border-gray-300 p-2 text-center font-bold">12467</td><td className="border border-gray-300 p-2 text-center font-bold">12060</td><td className="border border-gray-300 p-2 text-center font-bold">11473</td><td className="border border-gray-300 p-2 text-center font-bold">11205</td><td className="border border-gray-300 p-2 text-center font-bold">10324</td><td className="border border-gray-300 p-2 text-center font-bold">11232</td><td className="border border-gray-300 p-2 text-center font-bold">9508</td></tr>
                <tr className="bg-blue-50"><td className="border border-gray-300 p-2 font-bold">NoBorrowers</td><td className="border border-gray-300 p-2 text-center font-bold">8959</td><td className="border border-gray-300 p-2 text-center font-bold">9859</td><td className="border border-gray-300 p-2 text-center font-bold">9478</td><td className="border border-gray-300 p-2 text-center font-bold">9313</td><td className="border border-gray-300 p-2 text-center font-bold">7617</td><td className="border border-gray-300 p-2 text-center font-bold">8876</td><td className="border border-gray-300 p-2 text-center font-bold">7129</td><td className="border border-gray-300 p-2 text-center font-bold">9133</td><td className="border border-gray-300 p-2 text-center font-bold">7789</td></tr>
                <tr className="bg-blue-50"><td className="border border-gray-300 p-2 font-bold">WAPD</td><td className="border border-gray-300 p-2 text-center font-bold">0.90%</td><td className="border border-gray-300 p-2 text-center font-bold">1.03%</td><td className="border border-gray-300 p-2 text-center font-bold">1.10%</td><td className="border border-gray-300 p-2 text-center font-bold">1.10%</td><td className="border border-gray-300 p-2 text-center font-bold">1.17%</td><td className="border border-gray-300 p-2 text-center font-bold">1.25%</td><td className="border border-gray-300 p-2 text-center font-bold">1.41%</td><td className="border border-gray-300 p-2 text-center font-bold">1.16%</td><td className="border border-gray-300 p-2 text-center font-bold">1.96%</td></tr>
                <tr className="bg-blue-50"><td className="border border-gray-300 p-2 font-bold">WA LGD</td><td className="border border-gray-300 p-2 text-center font-bold">47%</td><td className="border border-gray-300 p-2 text-center font-bold">44.7%</td><td className="border border-gray-300 p-2 text-center font-bold">44.60%</td><td className="border border-gray-300 p-2 text-center font-bold">46.53%</td><td className="border border-gray-300 p-2 text-center font-bold">43.88%</td><td className="border border-gray-300 p-2 text-center font-bold">43.80%</td><td className="border border-gray-300 p-2 text-center font-bold">48.31%</td><td className="border border-gray-300 p-2 text-center font-bold">45.03%</td><td className="border border-gray-300 p-2 text-center font-bold">46.53%</td></tr>
                <tr className="bg-blue-50"><td className="border border-gray-300 p-2 font-bold">WAL</td><td className="border border-gray-300 p-2 text-center font-bold">1.45</td><td className="border border-gray-300 p-2 text-center font-bold">3.4</td><td className="border border-gray-300 p-2 text-center font-bold">3.3</td><td className="border border-gray-300 p-2 text-center font-bold">3.3</td><td className="border border-gray-300 p-2 text-center font-bold">3.47</td><td className="border border-gray-300 p-2 text-center font-bold">3.44</td><td className="border border-gray-300 p-2 text-center font-bold">3.72</td><td className="border border-gray-300 p-2 text-center font-bold">3.99</td><td className="border border-gray-300 p-2 text-center font-bold">4.53</td></tr>
                <tr className="bg-blue-50"><td className="border border-gray-300 p-2 font-bold">PRONA</td><td className="border border-gray-300 p-2 text-center font-bold">1,030,812,926</td><td className="border border-gray-300 p-2 text-center font-bold">1,430,812,926</td><td className="border border-gray-300 p-2 text-center font-bold">1,430,812,926</td><td className="border border-gray-300 p-2 text-center font-bold">1,430,812,926</td><td className="border border-gray-300 p-2 text-center font-bold">1,430,812,926</td><td className="border border-gray-300 p-2 text-center font-bold">1,428,848,394</td><td className="border border-gray-300 p-2 text-center font-bold">1,430,812,926</td><td className="border border-gray-300 p-2 text-center font-bold">1,430,812,926</td><td className="border border-gray-300 p-2 text-center font-bold">1,328,007,846</td></tr>
                
                <tr className="h-4"><td colSpan={10} className="border-0"></td></tr>
                
                <tr className="bg-yellow-50"><td className="border border-gray-300 p-2 font-bold">Cumulative Defaults Non WO</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">682,517</td><td className="border border-gray-300 p-2 text-center">682,517</td><td className="border border-gray-300 p-2 text-center">1,208,808</td><td className="border border-gray-300 p-2 text-center">1,208,808</td><td className="border border-gray-300 p-2 text-center">3,906,011</td><td className="border border-gray-300 p-2 text-center">5,158,080</td><td className="border border-gray-300 p-2 text-center">6,719,245</td><td className="border border-gray-300 p-2 text-center">8,337,685</td></tr>
                <tr className="bg-yellow-50"><td className="border border-gray-300 p-2 font-bold">%</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">0.05%</td><td className="border border-gray-300 p-2 text-center">0.05%</td><td className="border border-gray-300 p-2 text-center">0.08%</td><td className="border border-gray-300 p-2 text-center">0.08%</td><td className="border border-gray-300 p-2 text-center">0.27%</td><td className="border border-gray-300 p-2 text-center">0.36%</td><td className="border border-gray-300 p-2 text-center">0.47%</td><td className="border border-gray-300 p-2 text-center">0.58%</td></tr>
                <tr className="bg-yellow-50"><td className="border border-gray-300 p-2 font-bold">Initial Loss Amount</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">295,497</td><td className="border border-gray-300 p-2 text-center">295,497</td><td className="border border-gray-300 p-2 text-center">573,259</td><td className="border border-gray-300 p-2 text-center">573,259</td><td className="border border-gray-300 p-2 text-center">1,998,519</td><td className="border border-gray-300 p-2 text-center">2,648,625</td><td className="border border-gray-300 p-2 text-center">3,517,367</td><td className="border border-gray-300 p-2 text-center">4,388,098</td></tr>
                <tr className="bg-yellow-50"><td className="border border-gray-300 p-2 font-bold">%</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">0.02%</td><td className="border border-gray-300 p-2 text-center">0.02%</td><td className="border border-gray-300 p-2 text-center">0.04%</td><td className="border border-gray-300 p-2 text-center">0.04%</td><td className="border border-gray-300 p-2 text-center">0.14%</td><td className="border border-gray-300 p-2 text-center">0.19%</td><td className="border border-gray-300 p-2 text-center">0.25%</td><td className="border border-gray-300 p-2 text-center">0.31%</td></tr>
                <tr className="bg-yellow-50"><td className="border border-gray-300 p-2 font-bold">Cum Def WO</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">23,750</td></tr>
                <tr className="bg-yellow-50"><td className="border border-gray-300 p-2 font-bold">Final Loss</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">0</td></tr>
                
                <tr className="h-4"><td colSpan={10} className="border-0"></td></tr>
                
                <tr className="bg-yellow-50"><td className="border border-gray-300 p-2 font-bold">Cum Loss</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">4,388,098</td></tr>
                <tr className="bg-yellow-50"><td className="border border-gray-300 p-2 font-bold">%</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center bg-yellow-200">0.31%</td></tr>
                
                <tr className="h-4"><td colSpan={10} className="border-0"></td></tr>
                
                <tr className="bg-green-100"><td className="border border-gray-300 p-2 font-bold" colSpan={10}>Quarterly Payment Report</td></tr>
                <tr className="bg-green-50"><td className="border border-gray-300 p-2 font-bold">Cum Def (WO + Non WO)</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">682,517</td><td className="border border-gray-300 p-2 text-center">1,208,808</td><td className="border border-gray-300 p-2 text-center">1,208,808</td><td className="border border-gray-300 p-2 text-center">3,968,313</td><td className="border border-gray-300 p-2 text-center">5,327,011</td><td className="border border-gray-300 p-2 text-center">7,312,572</td><td className="border border-gray-300 p-2 text-center">9,073,048</td></tr>
                <tr className="bg-green-50"><td className="border border-gray-300 p-2 font-bold">%</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">0.00%</td><td className="border border-gray-300 p-2 text-center">0.05%</td><td className="border border-gray-300 p-2 text-center">0.08%</td><td className="border border-gray-300 p-2 text-center">0.08%</td><td className="border border-gray-300 p-2 text-center">0.28%</td><td className="border border-gray-300 p-2 text-center">0.37%</td><td className="border border-gray-300 p-2 text-center">0.51%</td><td className="border border-gray-300 p-2 text-center">0.63%</td></tr>
                <tr className="bg-green-50"><td className="border border-gray-300 p-2 font-bold">Cum Loss (WO + Non WO)</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">295,497</td><td className="border border-gray-300 p-2 text-center">573,259</td><td className="border border-gray-300 p-2 text-center">573,259</td><td className="border border-gray-300 p-2 text-center">1,964,533</td><td className="border border-gray-300 p-2 text-center">2,670,378</td><td className="border border-gray-300 p-2 text-center">3,751,471</td><td className="border border-gray-300 p-2 text-center">4,250,853</td></tr>
                <tr className="bg-green-50"><td className="border border-gray-300 p-2 font-bold">%</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">0.00%</td><td className="border border-gray-300 p-2 text-center">0.02%</td><td className="border border-gray-300 p-2 text-center">0.04%</td><td className="border border-gray-300 p-2 text-center">0.04%</td><td className="border border-gray-300 p-2 text-center">0.14%</td><td className="border border-gray-300 p-2 text-center">0.19%</td><td className="border border-gray-300 p-2 text-center">0.26%</td><td className="border border-gray-300 p-2 text-center bg-green-200">0.30%</td></tr>
                
                <tr className="h-4"><td colSpan={10} className="border-0"></td></tr>
                
                <tr className="bg-orange-50"><td className="border border-gray-300 p-2 font-bold">Quarterly Non Worked Out Def</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">682,517</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">526,291</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">2,697,202</td><td className="border border-gray-300 p-2 text-center">1,252,070</td><td className="border border-gray-300 p-2 text-center">1,781,499</td><td className="border border-gray-300 p-2 text-center">1,466,181</td></tr>
                <tr className="bg-orange-50"><td className="border border-gray-300 p-2 font-bold">%</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">0.05%</td><td className="border border-gray-300 p-2 text-center">0.00%</td><td className="border border-gray-300 p-2 text-center">0.04%</td><td className="border border-gray-300 p-2 text-center">0.00%</td><td className="border border-gray-300 p-2 text-center">0.19%</td><td className="border border-gray-300 p-2 text-center">0.09%</td><td className="border border-gray-300 p-2 text-center">0.12%</td><td className="border border-gray-300 p-2 text-center">0.10%</td></tr>
                <tr className="bg-orange-50"><td className="border border-gray-300 p-2 font-bold">Initial Loss Amount</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">295,497</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">277,762</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">1,391,274</td><td className="border border-gray-300 p-2 text-center">705,846</td><td className="border border-gray-300 p-2 text-center">1,081,092</td><td className="border border-gray-300 p-2 text-center">947,994</td></tr>
                <tr className="bg-orange-50"><td className="border border-gray-300 p-2 font-bold">%</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">0.02%</td><td className="border border-gray-300 p-2 text-center">0.00%</td><td className="border border-gray-300 p-2 text-center">0.02%</td><td className="border border-gray-300 p-2 text-center">0.00%</td><td className="border border-gray-300 p-2 text-center">0.10%</td><td className="border border-gray-300 p-2 text-center">0.05%</td><td className="border border-gray-300 p-2 text-center">0.08%</td><td className="border border-gray-300 p-2 text-center">0.07%</td></tr>
                
                <tr className="h-4"><td colSpan={10} className="border-0"></td></tr>
                
                <tr className="bg-orange-50"><td className="border border-gray-300 p-2 font-bold">Cumulative Defaults Non WO</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">682,517</td><td className="border border-gray-300 p-2 text-center">1,208,808</td><td className="border border-gray-300 p-2 text-center">1,208,808</td><td className="border border-gray-300 p-2 text-center">3,906,011</td><td className="border border-gray-300 p-2 text-center">5,158,080</td><td className="border border-gray-300 p-2 text-center">6,939,580</td><td className="border border-gray-300 p-2 text-center">8,405,760</td></tr>
                <tr className="bg-orange-50"><td className="border border-gray-300 p-2 font-bold">%</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td></tr>
                <tr className="bg-orange-50"><td className="border border-gray-300 p-2 font-bold">Cumulative Loss Non WO</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">295,497</td><td className="border border-gray-300 p-2 text-center">573,259</td><td className="border border-gray-300 p-2 text-center">573,259</td><td className="border border-gray-300 p-2 text-center">1,964,533</td><td className="border border-gray-300 p-2 text-center">2,670,378</td><td className="border border-gray-300 p-2 text-center">3,751,471</td><td className="border border-gray-300 p-2 text-center">4,699,465</td></tr>
                <tr className="bg-orange-50"><td className="border border-gray-300 p-2 font-bold">%</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td></tr>
                
                <tr className="h-4"><td colSpan={10} className="border-0"></td></tr>
                
                <tr className="bg-red-50"><td className="border border-gray-300 p-2 font-bold">Quarterly WO Def</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">62,303</td><td className="border border-gray-300 p-2 text-center">106,628</td><td className="border border-gray-300 p-2 text-center">204,061</td><td className="border border-gray-300 p-2 text-center">294,296</td></tr>
                <tr className="bg-red-50"><td className="border border-gray-300 p-2 font-bold">Initial Loss</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td></tr>
                <tr className="bg-red-50"><td className="border border-gray-300 p-2 font-bold">Final Loss Amount</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">0</td><td className="border border-gray-300 p-2 text-center">0</td><td className="border border-gray-300 p-2 text-center">0</td><td className="border border-gray-300 p-2 text-center">-</td></tr>
                <tr className="bg-red-50"><td className="border border-gray-300 p-2 font-bold">Severity</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">0.00%</td><td className="border border-gray-300 p-2 text-center">0.00%</td><td className="border border-gray-300 p-2 text-center">0.00%</td><td className="border border-gray-300 p-2 text-center">0.00%</td></tr>
                <tr className="bg-red-50"><td className="border border-gray-300 p-2 font-bold">Cum WO</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">62,303</td><td className="border border-gray-300 p-2 text-center">168,931</td><td className="border border-gray-300 p-2 text-center">372,992</td><td className="border border-gray-300 p-2 text-center">667,288</td></tr>
                <tr className="bg-red-50"><td className="border border-gray-300 p-2 font-bold">Cum WO Loss</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td></tr>
                
                <tr className="h-4"><td colSpan={10} className="border-0"></td></tr>
                
                <tr className="bg-purple-50"><td className="border border-gray-300 p-2 font-bold">Senior</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">1,213,905,387.46</td></tr>
                <tr className="bg-purple-50"><td className="border border-gray-300 p-2 font-bold">Tranche Notional</td><td className="border border-gray-300 p-2 text-center">103,100,000</td><td className="border border-gray-300 p-2 text-center">18,305,071</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">103,000,000</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">103,000,000</td><td className="border border-gray-300 p-2 text-center">103,000,000</td><td className="border border-gray-300 p-2 text-center">103,000,000</td><td className="border border-gray-300 p-2 text-center">95,501,890.22</td></tr>
                <tr className="bg-purple-50"><td className="border border-gray-300 p-2 font-bold">Retained Notional (orig w ramp)</td><td className="border border-gray-300 p-2 text-center">18,600,568</td><td className="border border-gray-300 p-2 text-center">18,305,071</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">18,027,309</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">16,636,035</td><td className="border border-gray-300 p-2 text-center">15,973,696</td><td className="border border-gray-300 p-2 text-center">14,997,232</td><td className="border border-gray-300 p-2 text-center">14,349,714.63</td></tr>
                <tr className="bg-purple-50"><td className="border border-gray-300 p-2 font-bold">Subordination</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">1.28%</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">1.26%</td><td className="border border-gray-300 p-2 text-center">-</td><td className="border border-gray-300 p-2 text-center">1.16%</td><td className="border border-gray-300 p-2 text-center">1.16%</td><td className="border border-gray-300 p-2 text-center">1.05%</td><td className="border border-gray-300 p-2 text-center">1.08%</td></tr>
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
                <LineChart data={prepareChartData(data.monthlyData)}>
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
  );
};

export default PDAnalysis;
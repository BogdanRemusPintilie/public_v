import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const PDAnalysis = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const extractedData2 = location.state?.extractedData2;

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
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export PD Results
          </Button>
        </div>
      </div>

      {/* Deal Information */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="text-green-700">Deal Information</CardTitle>
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
                <span>ED CODE</span>
                <span className="font-mono text-sm">{data.reporting.edCode}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default PDAnalysis;
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

      {/* PD Analysis Data Table */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="text-green-700">PD Analysis & Performance Data</CardTitle>
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
        </CardContent>
      </Card>

    </div>
  );
};

export default PDAnalysis;
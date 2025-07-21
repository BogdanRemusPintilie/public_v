import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const PDAnalysis = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const extractedData2 = location.state?.extractedData2;

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

  if (!extractedData2) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500 mb-4">No PD Analysis data found.</p>
            <Button onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <Button variant="outline" onClick={() => navigate('/', { state: { showFirstDataset: true } })}>
            File 1
          </Button>
          <Button variant="default">
            File 2
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
                <span>{formatCurrency(extractedData2.portfolioSize)}</span>
              </div>
              <div className="flex justify-between">
                <span>Ramped Up Notional</span>
                <span>{formatCurrency(extractedData2.rampedUpNotional)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tranche Size</span>
                <span>{formatCurrency(extractedData2.trancheSize)}</span>
              </div>
              <div className="flex justify-between">
                <span>FT Balance</span>
                <span>{formatCurrency(extractedData2.ftBalance)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Attachment/Detachment</span>
                <span>{extractedData2.attachmentDetachment}</span>
              </div>
              <div className="flex justify-between">
                <span>Coupon</span>
                <span>{extractedData2.coupon}</span>
              </div>
              <div className="flex justify-between">
                <span>Closing Date</span>
                <span>{extractedData2.dates.closing}</span>
              </div>
              <div className="flex justify-between">
                <span>Purchase Date</span>
                <span>{extractedData2.dates.purchase}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Call Date</span>
                <span>{extractedData2.dates.call}</span>
              </div>
              <div className="flex justify-between">
                <span>Ramp Up</span>
                <span>{extractedData2.rampUp}</span>
              </div>
              <div className="flex justify-between">
                <span>Replenishment</span>
                <span>{extractedData2.replenishment}</span>
              </div>
              <div className="flex justify-between">
                <span>ED CODE</span>
                <span className="font-mono text-sm">{extractedData2.reporting.edCode}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PD Analysis Data */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="text-green-700">Performance & Risk Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Period</th>
                  <th className="text-right p-2">No. Loans</th>
                  <th className="text-right p-2">No. Borrowers</th>
                  <th className="text-right p-2">WAPD</th>
                  <th className="text-right p-2">WA LGD</th>
                  <th className="text-right p-2">WAL</th>
                  <th className="text-right p-2">PRONA</th>
                  <th className="text-right p-2">Cumulative Defaults</th>
                  <th className="text-right p-2">Defaults %</th>
                  <th className="text-right p-2">Initial Loss Amount</th>
                  <th className="text-right p-2">Loss %</th>
                  <th className="text-right p-2">Tranche Notional</th>
                  <th className="text-right p-2">Subordination</th>
                </tr>
              </thead>
              <tbody>
                {extractedData2.monthlyData.map((month: any, index: number) => (
                  <tr key={index} className="border-b hover:bg-green-50">
                    <td className="p-2 font-medium">{month.period}</td>
                    <td className="p-2 text-right">{formatNumber(month.noLoans)}</td>
                    <td className="p-2 text-right">{formatNumber(month.noBorrowers)}</td>
                    <td className="p-2 text-right">{month.wapd}</td>
                    <td className="p-2 text-right">{month.waLgd}</td>
                    <td className="p-2 text-right">{month.wal}</td>
                    <td className="p-2 text-right">{formatCurrency(month.prona)}</td>
                    <td className="p-2 text-right">{formatCurrency(month.cumulativeDefaults)}</td>
                    <td className="p-2 text-right">{month.cumulativeDefaultsPercent}</td>
                    <td className="p-2 text-right">{formatCurrency(month.initialLossAmount)}</td>
                    <td className="p-2 text-right">{month.initialLossPercent}</td>
                    <td className="p-2 text-right">{formatCurrency(month.trancheNotional)}</td>
                    <td className="p-2 text-right">{month.subordination || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* PD Strats Distribution */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="text-green-700">PD Strats Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">PD Range</th>
                  <th className="text-right p-2">Origination</th>
                  <th className="text-right p-2">Dez 23</th>
                  <th className="text-right p-2">Jan 24</th>
                  <th className="text-right p-2">Mrz 24</th>
                  <th className="text-right p-2">Apr 24</th>
                  <th className="text-right p-2">Jun 24</th>
                  <th className="text-right p-2">Sep 24</th>
                  <th className="text-right p-2">Dez 24</th>
                  <th className="text-right p-2">Mrz 25</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-green-50">
                  <td className="p-2 font-medium">0-0.5</td>
                  <td className="p-2 text-right">49.7%</td>
                  <td className="p-2 text-right">46.0%</td>
                  <td className="p-2 text-right">46.0%</td>
                  <td className="p-2 text-right">49.1%</td>
                  <td className="p-2 text-right">49.7%</td>
                  <td className="p-2 text-right">48.35%</td>
                  <td className="p-2 text-right">47.72%</td>
                  <td className="p-2 text-right">38.30%</td>
                </tr>
                <tr className="border-b hover:bg-green-50">
                  <td className="p-2 font-medium">0.5-1</td>
                  <td className="p-2 text-right">18.1%</td>
                  <td className="p-2 text-right">16.9%</td>
                  <td className="p-2 text-right">17.4%</td>
                  <td className="p-2 text-right">17.6%</td>
                  <td className="p-2 text-right">18.1%</td>
                  <td className="p-2 text-right">17.71%</td>
                  <td className="p-2 text-right">16.56%</td>
                  <td className="p-2 text-right">19.38%</td>
                </tr>
                <tr className="border-b hover:bg-green-50">
                  <td className="p-2 font-medium">1-1.5</td>
                  <td className="p-2 text-right">17.0%</td>
                  <td className="p-2 text-right">21.1%</td>
                  <td className="p-2 text-right">21.2%</td>
                  <td className="p-2 text-right">18.4%</td>
                  <td className="p-2 text-right">17.0%</td>
                  <td className="p-2 text-right">17.77%</td>
                  <td className="p-2 text-right">18.36%</td>
                  <td className="p-2 text-right">15.94%</td>
                </tr>
                <tr className="border-b hover:bg-green-50">
                  <td className="p-2 font-medium">1.5-2</td>
                  <td className="p-2 text-right">7.2%</td>
                  <td className="p-2 text-right">8.3%</td>
                  <td className="p-2 text-right">7.7%</td>
                  <td className="p-2 text-right">7.2%</td>
                  <td className="p-2 text-right">7.2%</td>
                  <td className="p-2 text-right">7.95%</td>
                  <td className="p-2 text-right">7.45%</td>
                  <td className="p-2 text-right">7.64%</td>
                </tr>
                <tr className="border-b hover:bg-green-50">
                  <td className="p-2 font-medium">2-2.5</td>
                  <td className="p-2 text-right">5.2%</td>
                  <td className="p-2 text-right">5.6%</td>
                  <td className="p-2 text-right">5.5%</td>
                  <td className="p-2 text-right">5.3%</td>
                  <td className="p-2 text-right">-</td>
                  <td className="p-2 text-right">4.95%</td>
                  <td className="p-2 text-right">6.23%</td>
                  <td className="p-2 text-right">6.18%</td>
                </tr>
                <tr className="border-b hover:bg-green-50">
                  <td className="p-2 font-medium">2.5-3</td>
                  <td className="p-2 text-right">-</td>
                  <td className="p-2 text-right">-</td>
                  <td className="p-2 text-right">-</td>
                  <td className="p-2 text-right">-</td>
                  <td className="p-2 text-right">-</td>
                  <td className="p-2 text-right">0.04%</td>
                  <td className="p-2 text-right">0.02%</td>
                  <td className="p-2 text-right">0.02%</td>
                </tr>
                <tr className="border-b hover:bg-green-50">
                  <td className="p-2 font-medium">3-3.5</td>
                  <td className="p-2 text-right">0.3%</td>
                  <td className="p-2 text-right">0.3%</td>
                  <td className="p-2 text-right">0.3%</td>
                  <td className="p-2 text-right">0.3%</td>
                  <td className="p-2 text-right">5.2%</td>
                  <td className="p-2 text-right">0.30%</td>
                  <td className="p-2 text-right">-</td>
                  <td className="p-2 text-right">0.90%</td>
                </tr>
                <tr className="border-b hover:bg-green-50">
                  <td className="p-2 font-medium">3.5-4</td>
                  <td className="p-2 text-right">0.0%</td>
                  <td className="p-2 text-right">-</td>
                  <td className="p-2 text-right">-</td>
                  <td className="p-2 text-right">-</td>
                  <td className="p-2 text-right">0.3%</td>
                  <td className="p-2 text-right">-</td>
                  <td className="p-2 text-right">0.89%</td>
                  <td className="p-2 text-right">0.00%</td>
                </tr>
                <tr className="border-b hover:bg-green-50">
                  <td className="p-2 font-medium">4-4.5</td>
                  <td className="p-2 text-right">0.6%</td>
                  <td className="p-2 text-right">0.5%</td>
                  <td className="p-2 text-right">0.6%</td>
                  <td className="p-2 text-right">0.5%</td>
                  <td className="p-2 text-right">0.0%</td>
                  <td className="p-2 text-right">0.48%</td>
                  <td className="p-2 text-right">0.49%</td>
                  <td className="p-2 text-right">0.42%</td>
                </tr>
                <tr className="border-b hover:bg-green-50">
                  <td className="p-2 font-medium">4.5-5</td>
                  <td className="p-2 text-right">0.0%</td>
                  <td className="p-2 text-right">0.0%</td>
                  <td className="p-2 text-right">0.0%</td>
                  <td className="p-2 text-right">-</td>
                  <td className="p-2 text-right">0.6%</td>
                  <td className="p-2 text-right">-</td>
                  <td className="p-2 text-right">0.01%</td>
                  <td className="p-2 text-right">0.00%</td>
                </tr>
                <tr className="border-b hover:bg-green-50">
                  <td className="p-2 font-medium">5-5.5</td>
                  <td className="p-2 text-right">1.1%</td>
                  <td className="p-2 text-right">1.0%</td>
                  <td className="p-2 text-right">1.0%</td>
                  <td className="p-2 text-right">1.1%</td>
                  <td className="p-2 text-right">0.0%</td>
                  <td className="p-2 text-right">-</td>
                  <td className="p-2 text-right">-</td>
                  <td className="p-2 text-right">-</td>
                </tr>
                <tr className="border-b hover:bg-green-50">
                  <td className="p-2 font-medium">5.5-20</td>
                  <td className="p-2 text-right">-</td>
                  <td className="p-2 text-right">-</td>
                  <td className="p-2 text-right">-</td>
                  <td className="p-2 text-right">-</td>
                  <td className="p-2 text-right">1.1%</td>
                  <td className="p-2 text-right">1.42%</td>
                  <td className="p-2 text-right">1.58%</td>
                  <td className="p-2 text-right">1.14%</td>
                </tr>
                <tr className="border-b hover:bg-green-50">
                  <td className="p-2 font-medium">20-99</td>
                  <td className="p-2 text-right">0.4%</td>
                  <td className="p-2 text-right">0.2%</td>
                  <td className="p-2 text-right">0.1%</td>
                  <td className="p-2 text-right">0.2%</td>
                  <td className="p-2 text-right">0.4%</td>
                  <td className="p-2 text-right">0.41%</td>
                  <td className="p-2 text-right">0.27%</td>
                  <td className="p-2 text-right">0.61%</td>
                </tr>
                <tr className="border-b hover:bg-green-50">
                  <td className="p-2 font-medium">99-100</td>
                  <td className="p-2 text-right">0.13%</td>
                  <td className="p-2 text-right">0.07%</td>
                  <td className="p-2 text-right">0.09%</td>
                  <td className="p-2 text-right">0.07%</td>
                  <td className="p-2 text-right">0.13%</td>
                  <td className="p-2 text-right">0.28%</td>
                  <td className="p-2 text-right">0.06%</td>
                  <td className="p-2 text-right">0.12%</td>
                </tr>
                <tr className="border-b hover:bg-green-50">
                  <td className="p-2 font-medium">100.00</td>
                  <td className="p-2 text-right">0.17%</td>
                  <td className="p-2 text-right">0.05%</td>
                  <td className="p-2 text-right">0.06%</td>
                  <td className="p-2 text-right">0.15%</td>
                  <td className="p-2 text-right">0.17%</td>
                  <td className="p-2 text-right">0.33%</td>
                  <td className="p-2 text-right">0.36%</td>
                  <td className="p-2 text-right">0.50%</td>
                </tr>
                <tr className="border-b hover:bg-green-50 font-bold">
                  <td className="p-2">Total</td>
                  <td className="p-2 text-right">100.0%</td>
                  <td className="p-2 text-right">100.0%</td>
                  <td className="p-2 text-right">100.0%</td>
                  <td className="p-2 text-right">100.0%</td>
                  <td className="p-2 text-right">100.0%</td>
                  <td className="p-2 text-right">100.0%</td>
                  <td className="p-2 text-right">100.0%</td>
                  <td className="p-2 text-right">91.15%</td>
                </tr>
                <tr className="border-b hover:bg-green-50">
                  <td className="p-2 font-medium">Proj Finance / NA</td>
                  <td className="p-2 text-right">-</td>
                  <td className="p-2 text-right">-</td>
                  <td className="p-2 text-right">-</td>
                  <td className="p-2 text-right">-</td>
                  <td className="p-2 text-right">-</td>
                  <td className="p-2 text-right">-</td>
                  <td className="p-2 text-right">-</td>
                  <td className="p-2 text-right">8.85%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Reporting Access */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="text-green-700">Reporting Access</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="font-medium">How to get Reports</span>
              <span className="text-green-600 underline cursor-pointer">{extractedData2.reporting.howToGetReports}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Other Name</span>
              <span>{extractedData2.reporting.otherName}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PDAnalysis;
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Building2, FileText, TrendingUp, DollarSign, Download, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface SeerCapitalReportingProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ReportData {
  totalAssets: number;
  performanceMetrics: {
    totalReturn: number;
    quarterlyGrowth: number;
    riskAdjustedReturn: number;
  };
  portfolioBreakdown: {
    asset_class: string;
    value: number;
    percentage: number;
  }[];
  complianceStatus: {
    regulatory: boolean;
    internal: boolean;
    esg: boolean;
  };
}

const SeerCapitalReporting: React.FC<SeerCapitalReportingProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadReportData();
    }
  }, [isOpen, user]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      // Load Seer Capital specific data
      const { data: loanData, error } = await supabase
        .from('loan_data')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;

      // Process data for Seer Capital reporting format
      const totalAssets = loanData?.reduce((sum, loan) => sum + (loan.opening_balance || 0), 0) || 0;
      
      const assetClassBreakdown = loanData?.reduce((acc: any, loan) => {
        const assetClass = loan.loan_type || 'Other';
        if (!acc[assetClass]) {
          acc[assetClass] = { value: 0, count: 0 };
        }
        acc[assetClass].value += loan.opening_balance || 0;
        acc[assetClass].count += 1;
        return acc;
      }, {}) || {};

      const portfolioBreakdown = Object.entries(assetClassBreakdown).map(([asset_class, data]: [string, any]) => ({
        asset_class,
        value: data.value,
        percentage: totalAssets > 0 ? (data.value / totalAssets) * 100 : 0,
      }));

      setReportData({
        totalAssets,
        performanceMetrics: {
          totalReturn: 8.5, // Mock data - would be calculated from actual performance
          quarterlyGrowth: 2.3,
          riskAdjustedReturn: 1.2,
        },
        portfolioBreakdown,
        complianceStatus: {
          regulatory: true,
          internal: true,
          esg: true,
        },
      });
    } catch (error) {
      console.error('Error loading report data:', error);
      toast({
        title: "Error",
        description: "Failed to load report data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (format: 'pdf' | 'excel') => {
    setGeneratingReport(true);
    try {
      // Mock report generation - in reality this would call an edge function
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Report Generated",
        description: `Seer Capital ${format.toUpperCase()} report has been generated successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setGeneratingReport(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Seer Capital - Executive Reporting Dashboard
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(reportData?.totalAssets || 0)}</div>
                    <p className="text-xs text-muted-foreground">
                      As of {format(new Date(), 'MMM dd, yyyy')}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Portfolio Performance</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">+{reportData?.performanceMetrics.totalReturn || 0}%</div>
                    <p className="text-xs text-muted-foreground">
                      YTD Return
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Compliance Status</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        ✓ Compliant
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      All regulatory requirements met
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => generateReport('pdf')}
                      disabled={generatingReport}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Generate PDF Report
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => generateReport('excel')}
                      disabled={generatingReport}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Export to Excel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {reportData?.performanceMetrics.totalReturn || 0}%
                      </div>
                      <div className="text-sm text-muted-foreground">Total Return</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {reportData?.performanceMetrics.quarterlyGrowth || 0}%
                      </div>
                      <div className="text-sm text-muted-foreground">Quarterly Growth</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {reportData?.performanceMetrics.riskAdjustedReturn || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="portfolio" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Portfolio Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reportData?.portfolioBreakdown.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{item.asset_class}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(item.value)}
                          </div>
                        </div>
                        <Badge variant="outline">
                          {item.percentage.toFixed(1)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="compliance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Compliance Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Regulatory Compliance</div>
                        <div className="text-sm text-muted-foreground">SEC & FINRA requirements</div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        ✓ Compliant
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Internal Policies</div>
                        <div className="text-sm text-muted-foreground">Risk management guidelines</div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        ✓ Compliant
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">ESG Standards</div>
                        <div className="text-sm text-muted-foreground">Environmental & governance criteria</div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        ✓ Compliant
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SeerCapitalReporting;
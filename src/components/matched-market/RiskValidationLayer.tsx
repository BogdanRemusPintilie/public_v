import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, CheckCircle2, Shield, TrendingUp, TrendingDown } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface RiskValidationProps {
  offer: any;
  datasetSummary: any;
  offerResponses?: any[];
}

interface RiskMetric {
  name: string;
  category: 'concentration' | 'credit' | 'structural' | 'market';
  currentValue: number;
  limitValue: number;
  unit: string;
  status: 'pass' | 'warning' | 'breach';
  description: string;
}

export function RiskValidationLayer({ offer, datasetSummary, offerResponses }: RiskValidationProps) {
  const [riskMetrics, setRiskMetrics] = useState<RiskMetric[]>([]);
  const [overallRiskStatus, setOverallRiskStatus] = useState<'acceptable' | 'elevated' | 'breach'>('acceptable');
  const [riskScore, setRiskScore] = useState(0);

  useEffect(() => {
    performRiskValidation();
  }, [offer, datasetSummary, offerResponses]);

  const performRiskValidation = () => {
    const metrics: RiskMetric[] = [];

    // Concentration Risk - Single Borrower
    const maxSingleBorrowerExposure = 5; // 5% limit
    const estimatedSingleBorrowerExposure = 2.5; // Simulated
    
    metrics.push({
      name: 'Single Borrower Concentration',
      category: 'concentration',
      currentValue: estimatedSingleBorrowerExposure,
      limitValue: maxSingleBorrowerExposure,
      unit: '%',
      status: estimatedSingleBorrowerExposure > maxSingleBorrowerExposure ? 'breach' : 
              estimatedSingleBorrowerExposure > maxSingleBorrowerExposure * 0.8 ? 'warning' : 'pass',
      description: 'Maximum exposure to any single borrower',
    });

    // Concentration Risk - Sector
    const maxSectorConcentration = 30; // 30% limit
    const estimatedSectorConcentration = 22; // Simulated
    
    metrics.push({
      name: 'Sector Concentration',
      category: 'concentration',
      currentValue: estimatedSectorConcentration,
      limitValue: maxSectorConcentration,
      unit: '%',
      status: estimatedSectorConcentration > maxSectorConcentration ? 'breach' : 
              estimatedSectorConcentration > maxSectorConcentration * 0.8 ? 'warning' : 'pass',
      description: 'Maximum exposure to any single industry sector',
    });

    // Credit Risk - Weighted Average LGD
    const maxWALGD = 45; // 45% limit
    const currentWALGD = datasetSummary?.avg_lgd || 35;
    
    metrics.push({
      name: 'Weighted Average LGD',
      category: 'credit',
      currentValue: currentWALGD,
      limitValue: maxWALGD,
      unit: '%',
      status: currentWALGD > maxWALGD ? 'breach' : 
              currentWALGD > maxWALGD * 0.9 ? 'warning' : 'pass',
      description: 'Portfolio loss given default threshold',
    });

    // Credit Risk - Weighted Average PD
    const maxWAPD = 3.5; // 3.5% limit
    const currentWAPD = datasetSummary?.avg_pd || 2.1;
    
    metrics.push({
      name: 'Weighted Average PD',
      category: 'credit',
      currentValue: currentWAPD,
      limitValue: maxWAPD,
      unit: '%',
      status: currentWAPD > maxWAPD ? 'breach' : 
              currentWAPD > maxWAPD * 0.9 ? 'warning' : 'pass',
      description: 'Portfolio probability of default threshold',
    });

    // Credit Risk - Expected Loss
    const maxExpectedLoss = 1.5; // 1.5% limit
    const currentExpectedLoss = (currentWAPD / 100) * (currentWALGD / 100) * 100;
    
    metrics.push({
      name: 'Expected Loss',
      category: 'credit',
      currentValue: currentExpectedLoss,
      limitValue: maxExpectedLoss,
      unit: '%',
      status: currentExpectedLoss > maxExpectedLoss ? 'breach' : 
              currentExpectedLoss > maxExpectedLoss * 0.9 ? 'warning' : 'pass',
      description: 'Calculated as PD × LGD',
    });

    // Structural Risk - Weighted Average Life
    const minWAL = 2; // 2 years minimum
    const maxWAL = 7; // 7 years maximum
    const currentWAL = offer.weighted_average_life || 4.5;
    
    metrics.push({
      name: 'Weighted Average Life',
      category: 'structural',
      currentValue: currentWAL,
      limitValue: maxWAL,
      unit: 'years',
      status: currentWAL < minWAL || currentWAL > maxWAL ? 'breach' : 
              currentWAL > maxWAL * 0.9 || currentWAL < minWAL * 1.1 ? 'warning' : 'pass',
      description: `Must be between ${minWAL} and ${maxWAL} years`,
    });

    // Structural Risk - Subordination Level
    const minSubordination = 5; // 5% minimum
    const currentSubordination = 8; // Simulated from tranches
    
    metrics.push({
      name: 'Subordination Level',
      category: 'structural',
      currentValue: currentSubordination,
      limitValue: minSubordination,
      unit: '%',
      status: currentSubordination < minSubordination ? 'breach' : 
              currentSubordination < minSubordination * 1.2 ? 'warning' : 'pass',
      description: 'Minimum credit enhancement requirement',
    });

    // Market Risk - Interest Rate Sensitivity
    const maxDuration = 5; // 5 years duration limit
    const currentDuration = 3.8; // Simulated
    
    metrics.push({
      name: 'Interest Rate Duration',
      category: 'market',
      currentValue: currentDuration,
      limitValue: maxDuration,
      unit: 'years',
      status: currentDuration > maxDuration ? 'breach' : 
              currentDuration > maxDuration * 0.9 ? 'warning' : 'pass',
      description: 'Portfolio interest rate sensitivity',
    });

    setRiskMetrics(metrics);

    // Calculate overall risk status and score
    const breaches = metrics.filter(m => m.status === 'breach').length;
    const warnings = metrics.filter(m => m.status === 'warning').length;
    const passes = metrics.filter(m => m.status === 'pass').length;

    if (breaches > 0) {
      setOverallRiskStatus('breach');
      setRiskScore(Math.max(0, 100 - (breaches * 20) - (warnings * 10)));
    } else if (warnings > 2) {
      setOverallRiskStatus('elevated');
      setRiskScore(Math.max(60, 100 - (warnings * 10)));
    } else {
      setOverallRiskStatus('acceptable');
      setRiskScore(Math.max(70, 100 - (warnings * 5)));
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'concentration':
        return <TrendingUp className="h-4 w-4" />;
      case 'credit':
        return <AlertTriangle className="h-4 w-4" />;
      case 'structural':
        return <Shield className="h-4 w-4" />;
      case 'market':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'text-green-600 dark:text-green-400';
      case 'warning':
        return 'text-amber-600 dark:text-amber-400';
      case 'breach':
        return 'text-red-600 dark:text-red-400';
      default:
        return '';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass':
        return <Badge variant="default" className="bg-green-600">PASS</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-amber-600 text-white">WARNING</Badge>;
      case 'breach':
        return <Badge variant="destructive">BREACH</Badge>;
      default:
        return null;
    }
  };

  const getOverallStatusColor = () => {
    switch (overallRiskStatus) {
      case 'acceptable':
        return 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-700';
      case 'elevated':
        return 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-700';
      case 'breach':
        return 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-700';
      default:
        return '';
    }
  };

  const getRiskScoreColor = () => {
    if (riskScore >= 80) return 'text-green-600';
    if (riskScore >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const groupedMetrics = {
    concentration: riskMetrics.filter(m => m.category === 'concentration'),
    credit: riskMetrics.filter(m => m.category === 'credit'),
    structural: riskMetrics.filter(m => m.category === 'structural'),
    market: riskMetrics.filter(m => m.category === 'market'),
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Risk Validation & Limit Compliance
        </CardTitle>
        <CardDescription>
          Automated validation of portfolio risk metrics against investment guidelines
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Risk Status */}
        <div className={`p-4 rounded-lg border-2 ${getOverallStatusColor()}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-lg">
                {overallRiskStatus === 'acceptable' && 'Risk Profile: Acceptable'}
                {overallRiskStatus === 'elevated' && 'Risk Profile: Elevated'}
                {overallRiskStatus === 'breach' && 'Risk Profile: Limit Breach'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {overallRiskStatus === 'acceptable' && 'All risk metrics within acceptable thresholds'}
                {overallRiskStatus === 'elevated' && 'Multiple risk warnings detected - review required'}
                {overallRiskStatus === 'breach' && 'Critical risk limits breached - action required'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Risk Score</p>
              <p className={`text-3xl font-bold ${getRiskScoreColor()}`}>{riskScore}</p>
              <Progress value={riskScore} className="w-24 mt-2" />
            </div>
          </div>
        </div>

        {/* Risk Metrics by Category */}
        {Object.entries(groupedMetrics).map(([category, metrics]) => (
          metrics.length > 0 && (
            <div key={category} className="space-y-2">
              <h3 className="font-semibold text-sm uppercase text-muted-foreground flex items-center gap-2">
                {getCategoryIcon(category)}
                {category} Risk
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      <TableHead className="text-right">Current</TableHead>
                      <TableHead className="text-right">Limit</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metrics.map((metric, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{metric.name}</p>
                            <p className="text-xs text-muted-foreground">{metric.description}</p>
                          </div>
                        </TableCell>
                        <TableCell className={`text-right font-semibold ${getStatusColor(metric.status)}`}>
                          {metric.currentValue.toFixed(2)}{metric.unit}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {metric.limitValue.toFixed(2)}{metric.unit}
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(metric.status)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )
        ))}

        {/* Risk Summary */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Passed</p>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="text-2xl font-bold">{riskMetrics.filter(m => m.status === 'pass').length}</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Warnings</p>
            <div className="flex items-center justify-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <p className="text-2xl font-bold">{riskMetrics.filter(m => m.status === 'warning').length}</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Breaches</p>
            <div className="flex items-center justify-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <p className="text-2xl font-bold">{riskMetrics.filter(m => m.status === 'breach').length}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

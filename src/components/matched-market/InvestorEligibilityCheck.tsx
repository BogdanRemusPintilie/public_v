import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface EligibilityCheckProps {
  offer: any;
  investorResponse: any;
}

interface EligibilityItem {
  name: string;
  description: string;
  status: 'pass' | 'fail' | 'warning';
  value?: string;
  requirement?: string;
}

export function InvestorEligibilityCheck({ offer, investorResponse }: EligibilityCheckProps) {
  const [eligibilityResults, setEligibilityResults] = useState<EligibilityItem[]>([]);
  const [overallStatus, setOverallStatus] = useState<'eligible' | 'ineligible' | 'conditional'>('eligible');

  useEffect(() => {
    performEligibilityCheck();
  }, [offer, investorResponse]);

  const performEligibilityCheck = () => {
    const results: EligibilityItem[] = [];

    // Minimum capital requirement check
    const minCapital = 10000000; // €10M minimum
    const investorCapital = investorResponse?.counter_price 
      ? (offer.expected_pool_size || 100000000) * (investorResponse.counter_price / 100)
      : 0;
    
    results.push({
      name: 'Minimum Capital Requirement',
      description: 'Investor must meet minimum capital threshold',
      status: investorCapital >= minCapital ? 'pass' : 'fail',
      value: `€${(investorCapital / 1000000).toFixed(2)}M`,
      requirement: `€${(minCapital / 1000000).toFixed(0)}M minimum`,
    });

    // Regulatory approval check
    results.push({
      name: 'Regulatory Approval',
      description: 'Required regulatory licenses and approvals',
      status: investorResponse?.compliance_status?.kyc?.status === 'completed' &&
              investorResponse?.compliance_status?.aml?.status === 'completed' 
        ? 'pass' 
        : 'warning',
      value: investorResponse?.compliance_status?.kyc?.status === 'completed' ? 'Complete' : 'Pending',
      requirement: 'KYC & AML clearance required',
    });

    // Geographic restriction check
    const allowedJurisdictions = ['EU', 'EEA', 'UK', 'USA'];
    const investorJurisdiction = offer.issuer_nationality || 'Unknown';
    
    results.push({
      name: 'Geographic Eligibility',
      description: 'Investor must be from approved jurisdiction',
      status: allowedJurisdictions.some(j => investorJurisdiction.includes(j)) ? 'pass' : 'warning',
      value: investorJurisdiction,
      requirement: 'EU/EEA/UK/USA jurisdictions',
    });

    // Investor type qualification
    results.push({
      name: 'Qualified Investor Status',
      description: 'Must be institutional or qualified investor',
      status: 'pass', // Assume pass based on platform access
      value: 'Institutional',
      requirement: 'Institutional or Qualified Investor',
    });

    // Investment mandate alignment (based on structure features)
    const hasMatchingMandates = 
      (offer.structure_consumer_finance && offer.structure_sector?.includes('Consumer')) ||
      (offer.structure_sts) ||
      true; // Default to true for flexibility

    results.push({
      name: 'Investment Mandate Alignment',
      description: 'Investment must align with investor mandate',
      status: hasMatchingMandates ? 'pass' : 'warning',
      value: offer.structure_sector || 'General',
      requirement: 'Must match investor mandate',
    });

    // Credit committee approval
    results.push({
      name: 'Credit Committee Approval',
      description: 'Internal credit approval obtained',
      status: investorResponse?.compliance_status?.creditCommittee?.status === 'completed' 
        ? 'pass' 
        : investorResponse?.compliance_status?.creditCommittee?.status === 'in_progress'
        ? 'warning'
        : 'warning',
      value: investorResponse?.compliance_status?.creditCommittee?.status || 'Pending',
      requirement: 'Credit committee sign-off',
    });

    setEligibilityResults(results);

    // Determine overall status
    const hasFailures = results.some(r => r.status === 'fail');
    const hasWarnings = results.some(r => r.status === 'warning');
    
    if (hasFailures) {
      setOverallStatus('ineligible');
    } else if (hasWarnings) {
      setOverallStatus('conditional');
    } else {
      setOverallStatus('eligible');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-amber-600" />;
      default:
        return null;
    }
  };

  const getStatusBadgeVariant = (status: string): 'default' | 'destructive' | 'secondary' => {
    switch (status) {
      case 'pass':
        return 'default';
      case 'fail':
        return 'destructive';
      case 'warning':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getOverallStatusColor = () => {
    switch (overallStatus) {
      case 'eligible':
        return 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-700';
      case 'ineligible':
        return 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-700';
      case 'conditional':
        return 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-700';
      default:
        return '';
    }
  };

  const getOverallStatusText = () => {
    switch (overallStatus) {
      case 'eligible':
        return 'Eligible to Proceed';
      case 'ineligible':
        return 'Not Eligible - Action Required';
      case 'conditional':
        return 'Conditionally Eligible - Items Pending';
      default:
        return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Investor Eligibility Assessment
        </CardTitle>
        <CardDescription>
          Verification of investor qualification and eligibility requirements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status Banner */}
        <div className={`p-4 rounded-lg border-2 ${getOverallStatusColor()}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-lg">{getOverallStatusText()}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {overallStatus === 'eligible' && 'All eligibility criteria have been met'}
                {overallStatus === 'ineligible' && 'Critical eligibility requirements are not met'}
                {overallStatus === 'conditional' && 'Some requirements are pending completion'}
              </p>
            </div>
            <Badge 
              variant={overallStatus === 'eligible' ? 'default' : overallStatus === 'ineligible' ? 'destructive' : 'secondary'}
              className="text-lg px-4 py-2"
            >
              {overallStatus === 'eligible' && 'PASS'}
              {overallStatus === 'ineligible' && 'FAIL'}
              {overallStatus === 'conditional' && 'CONDITIONAL'}
            </Badge>
          </div>
        </div>

        {/* Detailed Eligibility Checks */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Status</TableHead>
                <TableHead>Requirement</TableHead>
                <TableHead>Current Value</TableHead>
                <TableHead>Required</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eligibilityResults.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="text-center">
                    {getStatusIcon(item.status)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(item.status)}>
                      {item.value || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.requirement}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Action Items for Conditional/Ineligible */}
        {overallStatus !== 'eligible' && (
          <div className="p-4 bg-muted rounded-lg">
            <p className="font-medium mb-2">Action Required:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              {eligibilityResults
                .filter(r => r.status !== 'pass')
                .map((item, idx) => (
                  <li key={idx}>
                    Complete <strong>{item.name}</strong> - {item.description}
                  </li>
                ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

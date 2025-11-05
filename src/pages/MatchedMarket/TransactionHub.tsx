import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, FileText, Eye, Settings, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Unified stages for both issuers and investors
const STAGES = [
  'Offer issued',
  'Interest indicated',
  'NDA executed',
  'Transaction details',
  'Indicative offer',
  'Full loan tape',
  'Firm offer',
  'Compliance Review',
  'Allocation',
  'Transaction completed'
] as const;

const getStageColor = (stageStatus: 'blank' | 'opened' | 'in-process' | 'completed') => {
  switch (stageStatus) {
    case 'blank':
      return 'bg-muted';
    case 'opened':
      return 'bg-purple-500';
    case 'in-process':
      return 'bg-amber-500';
    case 'completed':
      return 'bg-purple-500';
    default:
      return 'bg-muted';
  }
};

type TransactionStatus = typeof STAGES[number];

interface Transaction {
  id: string;
  offer_name: string;
  status: TransactionStatus;
  issuer_nationality?: string;
  created_at: string;
  offer_id: string;
  offerResponse?: any;
}

export default function TransactionHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showKey, setShowKey] = useState(false);

  const determineTransactionStatus = (
    offerResponse: any,
    nda: any,
    offerId: string,
    offerName: string
  ): TransactionStatus => {
    // Special handling for demo offers
    if (offerId === 'demo-offer' || offerName === 'Investor Demo 7' || offerName === 'Investor Demo Offer 7') {
      return 'Full loan tape';
    }

    // If investor has submitted a firm offer, check for compliance
    if (offerResponse?.firm_price_status === 'accepted' || offerResponse?.firm_price_status === 'submitted') {
      // Check if any compliance item has moved from pending status
      const complianceStatus = offerResponse?.compliance_status;
      if (complianceStatus && (
        (complianceStatus.kyc?.status && complianceStatus.kyc.status !== 'pending') ||
        (complianceStatus.aml?.status && complianceStatus.aml.status !== 'pending') ||
        (complianceStatus.creditCommittee?.status && complianceStatus.creditCommittee.status !== 'pending') ||
        (complianceStatus.legalReview?.status && complianceStatus.legalReview.status !== 'pending')
      )) {
        return 'Compliance Review';
      }
      return 'Firm offer';
    }

    // If issuer has sent acknowledgement receipt, full loan tape completed - move to Firm offer stage
    if (offerResponse?.issuer_response) {
      return 'Firm offer';
    }

    // If investor has submitted an indicative price, full loan tape is current
    if (offerResponse?.indicative_price) {
      return 'Full loan tape';
    }

    // If investor acknowledged requirements, move to transaction details
    if (offerResponse?.requirements_acknowledged) {
      return 'Transaction details';
    }

    // NDA executed
    if (nda?.status === 'accepted') {
      return 'NDA executed';
    }

    // If no response yet, it's just issued
    if (!offerResponse) {
      return 'Offer issued';
    }

    // If declined, keep at offer issued
    if (offerResponse.status === 'declined') {
      return 'Offer issued';
    }

    // Interest indicated (interested or accepted)
    if (offerResponse.status === 'interested' || offerResponse.status === 'accepted') {
      return 'Interest indicated';
    }

    return 'Offer issued';
  };

  const fetchTransactions = async (): Promise<Transaction[]> => {
    if (!user?.email || !user?.id) {
      console.error('❌ TransactionHub - Missing user email or ID:', { email: user?.email, id: user?.id });
      return [];
    }

    const startTime = performance.now();
    console.log('📍 Fetching offers for investor:', user.email, 'ID:', user.id);
    
    try {
      // Fetch all data in parallel with minimal columns
      const offersStart = performance.now();
      const [offersResult, responsesResult, ndasResult] = await Promise.all([
        supabase
          .from('offers')
          .select('id, offer_name, issuer_nationality, created_at, status')
          .contains('shared_with_emails', [user.email])
          .eq('status', 'active')
          .order('created_at', { ascending: false }),
        supabase
          .from('offer_responses')
          .select('offer_id, status, requirements_acknowledged, indicative_price, firm_price_status, issuer_response, compliance_status')
          .eq('investor_id', user.id),
        supabase
          .from('ndas')
          .select('offer_id, status')
          .eq('investor_id', user.id)
      ]);
      
      const offersTime = performance.now() - offersStart;
      console.log(`⏱️ Database queries completed in ${offersTime.toFixed(0)}ms`);

      const { data: allOffers, error: offersError } = offersResult;
      const { data: responses, error: responsesError } = responsesResult;
      const { data: ndas, error: ndasError } = ndasResult;

      console.log('📊 Data fetched - Offers:', allOffers?.length || 0, 'Responses:', responses?.length || 0, 'NDAs:', ndas?.length || 0);

      if (offersError) throw offersError;
      if (responsesError) throw responsesError;
      if (ndasError) throw ndasError;

      // Create maps for efficient lookup
      const responseMap = new Map(responses?.map(r => [r.offer_id, r]) || []);
      const ndaMap = new Map(ndas?.map(n => [n.offer_id, n]) || []);

      // Build transactions list
      const transactionsList: Transaction[] = allOffers
        ?.filter(offer => {
          const offerResponse = responseMap.get(offer.id);
          return offerResponse?.status !== 'declined'; // Exclude declined offers
        })
        .map(offer => {
          const offerResponse = responseMap.get(offer.id);
          const nda = ndaMap.get(offer.id);
          const status = determineTransactionStatus(offerResponse, nda, offer.id, offer.offer_name);
          
          return {
            id: offer.id,
            offer_name: offer.offer_name,
            status,
            issuer_nationality: offer.issuer_nationality,
            created_at: offer.created_at,
            offer_id: offer.id,
            offerResponse,
          };
        }) || [];

      const totalTime = performance.now() - startTime;
      console.log(`✅ Total fetch completed in ${totalTime.toFixed(0)}ms`);
      
      // Show toast if loading takes too long
      if (totalTime > 4000) {
        toast({
          title: 'Data Loaded',
          description: 'Large dataset loaded successfully. Performance optimizations are active.',
          duration: 3000,
        });
      }

      return transactionsList;
    } catch (error: any) {
      console.error('❌ Error fetching transactions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load transactions',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const { data: transactions = [], isLoading, refetch } = useQuery({
    queryKey: ['transactionHub', user?.id, user?.email],
    queryFn: fetchTransactions,
    enabled: !!(user?.id && user?.email),
  });


  const getStageStatus = (
    currentStageIndex: number, 
    transactionStatus: string, 
    transaction?: Transaction
  ): 'blank' | 'opened' | 'in-process' | 'completed' => {
    const statusIndex = STAGES.indexOf(transactionStatus as any);
    const currentStageName = STAGES[currentStageIndex];
    
    if (statusIndex === -1) return 'blank';
    
    if (currentStageIndex < statusIndex) {
      return 'completed';
    } else if (currentStageIndex === statusIndex) {
      // Special handling for Firm offer stage - amber when firm price submitted
      if (currentStageName === 'Firm offer') {
        return 'in-process';
      }
      // Special handling for "Compliance Review" stage
      if (currentStageName === 'Compliance Review') {
        const complianceStatus = transaction?.offerResponse?.compliance_status;
        if (complianceStatus) {
          // Check if any compliance item has evidence uploaded or is in progress
          const hasAnyProgress = (
            (complianceStatus.kyc?.evidence && complianceStatus.kyc.evidence.length > 0) ||
            (complianceStatus.kyc?.status === 'in-progress') ||
            (complianceStatus.aml?.evidence && complianceStatus.aml.evidence.length > 0) ||
            (complianceStatus.aml?.status === 'in-progress') ||
            (complianceStatus.creditCommittee?.evidence && complianceStatus.creditCommittee.evidence.length > 0) ||
            (complianceStatus.creditCommittee?.status === 'in-progress') ||
            (complianceStatus.legalReview?.evidence && complianceStatus.legalReview.evidence.length > 0) ||
            (complianceStatus.legalReview?.status === 'in-progress')
          );
          
          if (hasAnyProgress) {
            return 'in-process';
          }
        }
      }
      return 'opened';
    }
    
    return 'blank';
  };

  const handleViewTransaction = (transaction: Transaction) => {
    navigate(`/matched-market/offers/${transaction.offer_id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold mb-2">Transaction Hub</h1>
            <p className="text-muted-foreground">Track transactions in progress with real-time status updates</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              title="Refresh transactions"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? 'Hide Key' : 'Show Key'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => navigate('/matched-market/manage-nda')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Manage NDAs
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => navigate('/matched-market/completed-transactions')}
            >
              <Eye className="mr-2 h-4 w-4" />
              Review Completed Transactions
            </Button>
          </div>
        </div>

        {/* Color Key */}
        {showKey && (
          <Card className="p-4 bg-muted/50 mb-6">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-sm">Transaction Stage Key</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowKey(false)}>×</Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-muted border rounded"></div>
                <span>Not opened</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-purple-500 rounded"></div>
                <span>Opened</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-amber-500 rounded"></div>
                <span>In process</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-purple-500 rounded"></div>
                <span>Complete</span>
              </div>
            </div>
          </Card>
        )}

        {/* Stage Grid Table */}
        <div className="bg-card rounded-lg border shadow-md overflow-x-auto">
          {transactions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No transactions in progress</p>
              </CardContent>
            </Card>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-muted/30 z-10 w-[180px] font-semibold">
                    Transaction Name
                  </TableHead>
                  {STAGES.map((stage) => (
                    <TableHead key={stage} className="text-center w-[100px] text-[11px] px-2 whitespace-normal leading-tight">
                      {stage}
                    </TableHead>
                  ))}
                  <TableHead className="text-center w-[120px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow 
                    key={transaction.id}
                    className="hover:bg-muted/30"
                  >
                    <TableCell className="sticky left-0 bg-card z-10 font-medium border-r text-sm">
                      {transaction.offer_name}
                    </TableCell>
                    {STAGES.map((stage, index) => {
                      const stageStatus = getStageStatus(index, transaction.status, transaction);
                      return (
                        <TableCell 
                          key={stage} 
                          className="p-1.5"
                        >
                          <div className={`w-full h-10 rounded ${getStageColor(stageStatus)} transition-colors`}></div>
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewTransaction(transaction)}
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}

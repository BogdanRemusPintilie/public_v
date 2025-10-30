import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, FileText, Eye, Settings } from 'lucide-react';
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

// Transaction stages for investors
const STAGES = [
  'Offer received',
  'Interest indicated',
  'NDA executed',
  'Full loan tape received',
  'Transaction details',
  'Indicative Offer submitted',
  'Firm offer submitted',
  'Compliance Review',
  'Allocation submitted',
  'Transaction completed'
] as const;

const getStageColor = (stageStatus: 'blank' | 'opened' | 'in-process' | 'completed' | 'green-completed') => {
  switch (stageStatus) {
    case 'blank':
      return 'bg-muted';
    case 'opened':
    case 'green-completed':
      return 'bg-green-500';
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (user?.email) {
      console.log('📍 TransactionHub - Fetching transactions for user:', user.email, 'user_id:', user.id);
      fetchTransactions();
    } else {
      console.log('⚠️ TransactionHub - No user email found');
      setLoading(false);
    }
  }, [user]);

  const determineTransactionStatus = (
    offerResponse: any,
    nda: any,
    offerId: string,
    offerName: string
  ): TransactionStatus => {
    // Special handling for demo offers
    if (offerId === 'demo-offer' || offerName === 'Investor Demo 7' || offerName === 'Investor Demo Offer 7') {
      return 'Full loan tape received';
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
      return 'Firm offer submitted';
    }

    // If issuer has sent acknowledgement receipt, treat as progressed beyond full loan tape
    if (offerResponse?.issuer_response) {
      return 'Firm offer submitted';
    }

    // If investor has submitted an indicative price, reflect that immediately
    if (offerResponse?.indicative_price) {
      return 'Indicative Offer submitted';
    }

    // If investor acknowledged requirements, move to transaction details
    if (offerResponse?.requirements_acknowledged) {
      return 'Transaction details';
    }

    // NDA executed
    if (nda?.status === 'accepted') {
      return 'NDA executed';
    }

    // If no response yet, it's just received
    if (!offerResponse) {
      return 'Offer received';
    }

    // If declined, keep at offer received
    if (offerResponse.status === 'declined') {
      return 'Offer received';
    }

    // Interest indicated (interested or accepted)
    if (offerResponse.status === 'interested' || offerResponse.status === 'accepted') {
      return 'Interest indicated';
    }

    return 'Offer received';
  };

  const fetchTransactions = async () => {
    if (!user?.email || !user?.id) {
      console.error('❌ TransactionHub - Missing user email or ID:', { email: user?.email, id: user?.id });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      console.log('📍 Fetching offers for investor:', user.email, 'ID:', user.id);
      
      // Fetch all data in parallel for better performance
      const [offersResult, responsesResult, ndasResult] = await Promise.all([
        supabase
          .from('offers')
          .select('*')
          .contains('shared_with_emails', [user.email])
          .eq('status', 'active')
          .order('created_at', { ascending: false }),
        supabase
          .from('offer_responses')
          .select('*')
          .eq('investor_id', user.id),
        supabase
          .from('ndas')
          .select('*')
          .eq('investor_id', user.id)
      ]);

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

      setTransactions(transactionsList);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load transactions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };


  const getStageStatus = (currentStageIndex: number, transactionStatus: string, transaction?: Transaction): 'blank' | 'opened' | 'in-process' | 'completed' | 'green-completed' => {
    const statusIndex = STAGES.indexOf(transactionStatus as any);
    
    if (statusIndex === -1) return 'blank';
    
    const currentStageName = STAGES[currentStageIndex];
    // These stages should turn purple when completed
    const purpleStages = ['Interest indicated', 'Indicative Offer submitted', 'Transaction details', 'Full loan tape received'];
    
    // Special handling: If NDA is accepted, "Full loan tape received" should be purple
    if (currentStageName === 'Full loan tape received') {
      const ndaAccepted = transaction?.offerResponse || statusIndex >= STAGES.indexOf('NDA executed');
      if (ndaAccepted && statusIndex >= STAGES.indexOf('NDA executed')) {
        return 'completed';
      }
    }
    
    if (currentStageIndex < statusIndex) {
      // Stages before current - show as completed (purple)
      return 'completed';
    } else if (currentStageIndex === statusIndex) {
      // Special handling for "Firm offer submitted" stage
      if (currentStageName === 'Firm offer submitted') {
        const firmPriceStatus = transaction?.offerResponse?.firm_price_status;
        // Show purple when accepted, amber when submitted
        if (firmPriceStatus === 'accepted') {
          return 'completed';
        }
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
      
      // Current stage - show purple for specific completed stages
      if (purpleStages.includes(currentStageName)) {
        return 'completed';
      }
      return 'opened';
    }
    
    return 'blank';
  };

  const handleViewTransaction = (transaction: Transaction) => {
    navigate(`/matched-market/offers/${transaction.offer_id}`);
  };

  if (loading) {
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
                <div className="w-6 h-6 bg-green-500 rounded"></div>
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

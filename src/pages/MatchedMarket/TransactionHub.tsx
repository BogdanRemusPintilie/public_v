import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

// Transaction status progression
const TRANSACTION_STATUSES = [
  'Offer received',
  'Interest indicated',
  'NDA executed',
  'Transaction overview',
  'Transaction details',
  'Indicative offer submitted',
  'Full loan tape submitted',
  'Allocation received',
  'Transaction complete'
] as const;

type TransactionStatus = typeof TRANSACTION_STATUSES[number];

interface Transaction {
  id: string;
  offer_name: string;
  status: TransactionStatus;
  issuer_nationality?: string;
  created_at: string;
  offer_id: string;
}

export default function TransactionHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.email) {
      fetchTransactions();
    }
  }, [user]);

  const determineTransactionStatus = (
    offerResponse: any,
    nda: any
  ): TransactionStatus => {
    // If no response yet, it's just received
    if (!offerResponse) {
      return 'Offer received';
    }

    // If declined, keep at offer received
    if (offerResponse.status === 'declined') {
      return 'Offer received';
    }

    // If interest indicated (status is interested or accepted)
    if (offerResponse.status === 'interested' || offerResponse.status === 'accepted') {
      // Check NDA status
      if (nda?.status === 'accepted') {
        // NDA executed, check for further progress
        if (offerResponse.indicative_price) {
          return 'Indicative offer submitted';
        }
        if (offerResponse.requirements_acknowledged) {
          return 'Transaction details';
        }
        return 'NDA executed';
      }
      return 'Interest indicated';
    }

    return 'Offer received';
  };

  const fetchTransactions = async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      
      // Fetch all offers shared with user
      const { data: allOffers, error: offersError } = await supabase
        .from('offers')
        .select('*')
        .contains('shared_with_emails', [user.email])
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (offersError) throw offersError;

      // Fetch user's responses
      const { data: responses, error: responsesError } = await supabase
        .from('offer_responses')
        .select('*')
        .eq('investor_id', user.id);

      if (responsesError) throw responsesError;

      // Fetch NDAs
      const { data: ndas, error: ndasError } = await supabase
        .from('ndas')
        .select('*')
        .eq('investor_id', user.id);

      if (ndasError) throw ndasError;

      // Create maps
      const responseMap = new Map(responses?.map(r => [r.offer_id, r]) || []);
      const ndaMap = new Map(ndas?.map(n => [n.offer_id, n]) || []);

      // Build transactions list
      const transactionsList: Transaction[] = [];

      allOffers?.forEach(offer => {
        const offerResponse = responseMap.get(offer.id);
        const nda = ndaMap.get(offer.id);
        
        // Only include if not declined
        if (offerResponse?.status !== 'declined') {
          const status = determineTransactionStatus(offerResponse, nda);
          
          transactionsList.push({
            id: offer.id,
            offer_name: offer.offer_name,
            status,
            issuer_nationality: offer.issuer_nationality,
            created_at: offer.created_at,
            offer_id: offer.id,
          });
        }
      });

      // Add demo transaction if no transactions exist
      if (transactionsList.length === 0) {
        transactionsList.push({
          id: 'demo-offer',
          offer_name: 'Investor Demo Offer',
          status: 'Offer received',
          issuer_nationality: 'British',
          created_at: new Date().toISOString(),
          offer_id: 'demo-offer',
        });

        // Create demo NDA
        await createDemoNDA(user.id);
      }

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

  const createDemoNDA = async (investorId: string) => {
    try {
      // Check if demo NDA already exists
      const { data: existingNDA } = await supabase
        .from('ndas')
        .select('id')
        .eq('investor_id', investorId)
        .eq('offer_id', 'demo-offer')
        .maybeSingle();

      if (existingNDA) return;

      // Create demo NDA
      await supabase
        .from('ndas')
        .insert({
          id: 'demo-nda',
          issuer_id: investorId, // Using same ID for demo purposes
          investor_id: investorId,
          offer_id: 'demo-offer',
          nda_title: 'Non-Disclosure Agreement - Investor Demo Offer',
          nda_content: `CONFIDENTIALITY AND NON-DISCLOSURE AGREEMENT

This Confidentiality and Non-Disclosure Agreement ("Agreement") is entered into by and between British CIB ("Disclosing Party") and the undersigned investor ("Receiving Party").

1. CONFIDENTIAL INFORMATION
The Disclosing Party agrees to disclose certain confidential information relating to the Investor Demo Offer, including but not limited to:
   - Detailed tranche structure analysis
   - Portfolio composition and performance metrics
   - Asset pool characteristics and risk assessments
   - Pricing and economic terms

2. OBLIGATIONS
The Receiving Party agrees to:
   a) Maintain strict confidentiality of all disclosed information
   b) Use the information solely for evaluating the investment opportunity
   c) Not disclose any information to third parties without prior written consent
   d) Return or destroy all confidential materials upon request

3. TERM
This Agreement shall remain in effect for a period of two (2) years from the date of acceptance.

4. GOVERNING LAW
This Agreement shall be governed by the laws of England and Wales.

By accepting this NDA, you acknowledge that you have read, understood, and agree to be bound by its terms and conditions.`,
          status: 'pending',
        });
    } catch (error) {
      console.error('Error creating demo NDA:', error);
      // Don't show error to user for demo NDA creation
    }
  };

  const getStatusBadgeVariant = (status: TransactionStatus): "default" | "secondary" | "outline" => {
    const index = TRANSACTION_STATUSES.indexOf(status);
    if (index <= 1) return "outline"; // Early stages
    if (index >= 7) return "default"; // Late stages (success)
    return "secondary"; // Middle stages
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

        <div className="mb-6">
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">Transaction Hub</h1>
          <p className="text-muted-foreground">Track transactions in progress with real-time status updates</p>
        </div>

        <div className="bg-card rounded-lg border shadow-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Transaction Name</TableHead>
                <TableHead className="w-[25%]">Issuer</TableHead>
                <TableHead className="w-[25%]">Status</TableHead>
                <TableHead className="w-[10%] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                    No transactions in progress
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((transaction) => (
                  <TableRow 
                    key={transaction.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleViewTransaction(transaction)}
                  >
                    <TableCell className="font-medium">
                      {transaction.offer_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {transaction.issuer_nationality || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewTransaction(transaction);
                        }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, CheckCircle, Database, FileText } from 'lucide-react';

interface InvestorResponsesManagerProps {
  offerId: string;
  datasetName: string;
}

interface InvestorResponse {
  id: string;
  investor_id: string;
  indicative_price: number | null;
  comments: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  investor_email?: string;
  investor_name?: string;
  has_data_access?: boolean;
}

export function InvestorResponsesManager({ offerId, datasetName }: InvestorResponsesManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [responses, setResponses] = useState<InvestorResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [grantingAccess, setGrantingAccess] = useState<string | null>(null);

  useEffect(() => {
    fetchResponses();
  }, [offerId]);

  const fetchResponses = async () => {
    try {
      setIsLoading(true);
      
      // Fetch offer responses
      const { data: responsesData, error: responsesError } = await supabase
        .from('offer_responses')
        .select('*')
        .eq('offer_id', offerId)
        .order('created_at', { ascending: false });

      if (responsesError) throw responsesError;

      // Fetch investor details and check data access for each response
      const responsesWithDetails = await Promise.all(
        (responsesData || []).map(async (response) => {
          // Get investor email from auth.users
          const { data: userData } = await supabase.auth.admin.getUserById(response.investor_id);
          
          // Check if investor has data access
          const { data: shareData } = await supabase
            .from('dataset_shares')
            .select('id')
            .eq('dataset_name', datasetName)
            .eq('shared_with_user_id', response.investor_id)
            .single();

          return {
            ...response,
            investor_email: userData?.user?.email || 'Unknown',
            has_data_access: !!shareData
          };
        })
      );

      setResponses(responsesWithDetails);
    } catch (error: any) {
      console.error('Error fetching responses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load investor responses',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGrantAccess = async (investorId: string, investorEmail: string) => {
    if (!user?.id) return;

    try {
      setGrantingAccess(investorId);

      // Grant data access by creating a dataset share
      const { error } = await supabase
        .from('dataset_shares')
        .insert({
          dataset_name: datasetName,
          owner_id: user.id,
          shared_with_user_id: investorId,
          shared_with_email: investorEmail
        });

      if (error) throw error;

      toast({
        title: 'Access Granted',
        description: `Successfully granted data access to ${investorEmail}`,
      });

      // Refresh responses to update access status
      fetchResponses();
    } catch (error: any) {
      console.error('Error granting access:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to grant data access',
        variant: 'destructive',
      });
    } finally {
      setGrantingAccess(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'interested':
        return <Badge variant="default">Interested</Badge>;
      case 'formal_indication':
        return <Badge className="bg-green-600">Formal Indication</Badge>;
      case 'not_interested':
        return <Badge variant="secondary">Not Interested</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (responses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Investor Responses
          </CardTitle>
          <CardDescription>
            View confirmations of interest and manage data access
          </CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No investor responses yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Investor Responses ({responses.length})
        </CardTitle>
        <CardDescription>
          View confirmations of interest and manage data access for investors
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Investor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Indicative Price</TableHead>
                <TableHead>Comments</TableHead>
                <TableHead>Response Date</TableHead>
                <TableHead className="text-center">Data Access</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {responses.map((response) => (
                <TableRow key={response.id}>
                  <TableCell className="font-medium">
                    {response.investor_email}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(response.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    {response.indicative_price 
                      ? `€${response.indicative_price.toLocaleString()}`
                      : '-'
                    }
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {response.comments || '-'}
                  </TableCell>
                  <TableCell>
                    {new Date(response.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-center">
                    {response.has_data_access ? (
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600">Granted</span>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleGrantAccess(response.investor_id, response.investor_email || '')}
                        disabled={grantingAccess === response.investor_id}
                      >
                        {grantingAccess === response.investor_id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Granting...
                          </>
                        ) : (
                          <>
                            <Database className="h-4 w-4 mr-2" />
                            Grant Access
                          </>
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

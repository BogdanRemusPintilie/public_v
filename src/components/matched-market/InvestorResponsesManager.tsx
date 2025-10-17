import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, CheckCircle, Database, FileText, MessageSquare, Bell } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

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
  nda_status?: string;
  issuer_response?: string;
  questions?: string | null;
  additional_data_needs?: string | null;
  requirements_acknowledged?: boolean;
}

export function InvestorResponsesManager({ offerId, datasetName }: InvestorResponsesManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [responses, setResponses] = useState<InvestorResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [grantingAccess, setGrantingAccess] = useState<string | null>(null);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [issuerResponse, setIssuerResponse] = useState<string>('');
  const [acknowledgingRequirements, setAcknowledgingRequirements] = useState<string | null>(null);

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

          // Check NDA status for this offer
          const { data: ndaData } = await supabase
            .from('ndas')
            .select('status')
            .eq('offer_id', offerId)
            .eq('investor_id', response.investor_id)
            .single();

          return {
            ...response,
            investor_email: userData?.user?.email || 'Unknown',
            has_data_access: !!shareData,
            nda_status: ndaData?.status || 'not_sent'
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

  const handleSaveResponse = async (responseId: string) => {
    try {
      const { error } = await supabase
        .from('offer_responses')
        .update({ issuer_response: issuerResponse })
        .eq('id', responseId);

      if (error) throw error;

      toast({
        title: 'Response Saved',
        description: 'Your response has been sent to the investor',
      });

      setRespondingTo(null);
      setIssuerResponse('');
      fetchResponses();
    } catch (error: any) {
      console.error('Error saving response:', error);
      toast({
        title: 'Error',
        description: 'Failed to save response',
        variant: 'destructive',
      });
    }
  };

  const handleAcknowledgeRequirements = async (responseId: string) => {
    setAcknowledgingRequirements(responseId);
    try {
      const { error } = await supabase
        .from('offer_responses')
        .update({ 
          requirements_acknowledged: true,
        })
        .eq('id', responseId);

      if (error) throw error;

      toast({
        title: 'Investor Notified',
        description: 'The investor has been notified that you received their requests.',
      });

      fetchResponses();
    } catch (error: any) {
      console.error('Error acknowledging requirements:', error);
      toast({
        title: 'Error',
        description: 'Failed to notify investor. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setAcknowledgingRequirements(null);
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

  const getNDABadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-600">Accepted</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="secondary">Not Sent</Badge>;
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
          Investor Interest ({responses.length})
        </CardTitle>
        <CardDescription>
          View investor confirmations and manage responses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {responses.map((response) => (
            <Card key={response.id} className="border-l-4 border-l-blue-500">
              <CardContent className="pt-6">
                <div className="grid gap-4">
                  {/* Investor Info Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-lg">{response.investor_email}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(response.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      {getStatusBadge(response.status)}
                      {getNDABadge(response.nda_status || 'not_sent')}
                    </div>
                  </div>

                  {/* Response Details */}
                  <div className="grid md:grid-cols-2 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Confirmation Status</p>
                      <p className="text-base mt-1">
                        {response.status === 'interested' && 'Confirmed Interest'}
                        {response.status === 'formal_indication' && 'Formal Indication Submitted'}
                        {response.status === 'not_interested' && 'Declined Offer'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">NDA Status</p>
                      <p className="text-base mt-1">
                        {response.nda_status === 'accepted' && 'NDA Accepted'}
                        {response.nda_status === 'rejected' && 'NDA Rejected'}
                        {response.nda_status === 'pending' && 'NDA Pending Review'}
                        {response.nda_status === 'not_sent' && 'NDA Not Sent'}
                      </p>
                    </div>
                  </div>

                  {/* Pricing Information */}
                  <div className="grid md:grid-cols-3 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Indicative Price</p>
                      <p className="text-base mt-1 font-semibold">
                        {response.indicative_price 
                          ? `${response.indicative_price}%`
                          : 'Not provided'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Firm Price</p>
                      <p className="text-base mt-1 font-semibold text-green-600">
                        {response.indicative_price 
                          ? `${response.indicative_price}%`
                          : 'Not submitted'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Full Data Access</p>
                      <div className="mt-1">
                        {response.has_data_access ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-600 font-medium">Access Granted</span>
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
                      </div>
                    </div>
                  </div>

                  {/* Investor Comments/Questions */}
                  {response.comments && (
                    <div className="pt-2 border-t">
                      <p className="text-sm font-medium text-muted-foreground">Additional Questions</p>
                      <p className="text-base mt-1 bg-muted p-3 rounded-md">{response.comments}</p>
                    </div>
                  )}

                  {/* Investor Questions and Data Requirements */}
                  {(response.questions || response.additional_data_needs) && (
                    <div className="pt-4 border-t space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-muted-foreground">Additional Data Requirements & Questions</p>
                        {!response.requirements_acknowledged ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAcknowledgeRequirements(response.id)}
                            disabled={acknowledgingRequirements === response.id}
                          >
                            <Bell className="mr-2 h-4 w-4" />
                            {acknowledgingRequirements === response.id ? 'Notifying...' : 'Acknowledge Receipt'}
                          </Button>
                        ) : (
                          <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Acknowledged
                          </Badge>
                        )}
                      </div>

                      {response.questions && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground uppercase">Questions for Issuer</p>
                          <div className="rounded-md bg-muted p-3">
                            <p className="text-sm whitespace-pre-wrap">{response.questions}</p>
                          </div>
                        </div>
                      )}

                      {response.additional_data_needs && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground uppercase">Additional Data Requested</p>
                          <div className="rounded-md bg-muted p-3">
                            <p className="text-sm whitespace-pre-wrap">{response.additional_data_needs}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Issuer Response Section */}
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Issuer Response</p>
                    {respondingTo === response.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={issuerResponse}
                          onChange={(e) => setIssuerResponse(e.target.value)}
                          placeholder="Type your response to the investor..."
                          rows={4}
                        />
                        <div className="flex gap-2">
                          <Button onClick={() => handleSaveResponse(response.id)} size="sm">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Send Response
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setRespondingTo(null);
                              setIssuerResponse('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : response.issuer_response ? (
                      <div className="bg-blue-50 p-3 rounded-md">
                        <p className="text-base">{response.issuer_response}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            setRespondingTo(response.id);
                            setIssuerResponse(response.issuer_response || '');
                          }}
                        >
                          Edit Response
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRespondingTo(response.id)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Add Response
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

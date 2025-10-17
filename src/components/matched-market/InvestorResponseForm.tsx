import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Send, FileText, Database, Download, CheckCircle2, Clock, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface InvestorResponseFormProps {
  offerId: string;
  onResponseSubmitted?: () => void;
  datasetName?: string;
}

export function InvestorResponseForm({ offerId, onResponseSubmitted, datasetName }: InvestorResponseFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingResponse, setExistingResponse] = useState<any>(null);
  const [hasDataAccess, setHasDataAccess] = useState(false);
  const [showPreviousRequests, setShowPreviousRequests] = useState(false);
  const [formData, setFormData] = useState({
    indicativePrice: '',
    comments: '',
    status: 'interested'
  });
  const [dataRequirements, setDataRequirements] = useState({
    questions: '',
    additionalDataNeeds: ''
  });

  useEffect(() => {
    checkExistingResponse();
    checkDataAccess();
  }, [offerId, user, datasetName]);

  const checkExistingResponse = async () => {
    if (!user?.id || offerId === 'demo-offer') return;

    try {
      const { data, error } = await supabase
        .from('offer_responses')
        .select('*')
        .eq('offer_id', offerId)
        .eq('investor_id', user.id)
        .single();

      if (data) {
        setExistingResponse(data);
        setFormData({
          indicativePrice: data.indicative_price?.toString() || '',
          comments: data.comments || '',
          status: data.status || 'interested'
        });
      }
    } catch (error) {
      // No existing response
    }
  };

  const checkDataAccess = async () => {
    if (!user?.id || !datasetName || offerId === 'demo-offer') return;

    try {
      const { data, error } = await supabase
        .from('dataset_shares')
        .select('id')
        .eq('dataset_name', datasetName)
        .eq('shared_with_user_id', user.id)
        .maybeSingle();

      setHasDataAccess(!!data);
    } catch (error) {
      console.error('Error checking data access:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to submit your response.',
        variant: 'destructive',
      });
      return;
    }

    // Demo offer handling
    if (offerId === 'demo-offer') {
      toast({
        title: 'Demo Offer',
        description: 'This is a demo offer. In production, your response would be saved.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const responseData = {
        offer_id: offerId,
        investor_id: user.id,
        status: formData.status,
        indicative_price: formData.indicativePrice ? parseFloat(formData.indicativePrice) : null,
        comments: formData.comments
      };

      let error;
      if (existingResponse) {
        const { error: updateError } = await supabase
          .from('offer_responses')
          .update(responseData)
          .eq('id', existingResponse.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('offer_responses')
          .insert([responseData]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: 'Response Submitted',
        description: existingResponse 
          ? 'Your response has been updated successfully.' 
          : 'Your interest has been submitted to the issuer.',
      });

      onResponseSubmitted?.();
      checkExistingResponse();
      checkDataAccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAccepted = existingResponse?.status === 'accepted';

  return (
    <>
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Express Your Interest</CardTitle>
          <CardDescription>
            Confirm your interest and provide indicative pricing information
          </CardDescription>
        </CardHeader>
        <CardContent>
        {existingResponse && !isSubmitting ? (
          <div className="space-y-6">
            {/* Display submitted response */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Your Indicative Price</p>
                  <p className="text-2xl font-bold mt-1">
                    {formData.indicativePrice ? `${formData.indicativePrice}%` : 'Not provided'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <p className="text-base mt-1 font-medium">Interest Confirmed</p>
                </div>
              </div>
              
              {formData.comments && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Your Comments</p>
                  <p className="text-base mt-1 bg-background p-3 rounded-md">{formData.comments}</p>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Submitted on {new Date(existingResponse.created_at).toLocaleDateString()}
              </div>
            </div>

            {/* Edit form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="indicativePrice">Update Indicative Price (%)</Label>
                <Input
                  id="indicativePrice"
                  type="number"
                  step="0.01"
                  placeholder="Enter indicative price"
                  value={formData.indicativePrice}
                  onChange={(e) => setFormData({ ...formData, indicativePrice: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="comments">Update Comments</Label>
                <Textarea
                  id="comments"
                  placeholder="Add any key comments or questions..."
                  value={formData.comments}
                  onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                  rows={4}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Update Response
                  </>
                )}
              </Button>
            </form>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="indicativePrice">Indicative Price (%)</Label>
              <Input
                id="indicativePrice"
                type="number"
                step="0.01"
                placeholder="Enter indicative price"
                value={formData.indicativePrice}
                onChange={(e) => setFormData({ ...formData, indicativePrice: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Provide your indicative pricing as a percentage point
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comments">Comments</Label>
              <Textarea
                id="comments"
                placeholder="Add any key comments or questions..."
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Share any requirements, concerns, or questions
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Interest
                </>
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>

    {/* Documentary Repository and Dataset Access - Only shown when accepted */}
    {isAccepted && (
      <div className="space-y-6 mt-6">
        {/* Documentary Repository */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>Documentary Repository</CardTitle>
            </div>
            <CardDescription>
              Access key documents and materials for this transaction
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Information Memorandum</p>
                    <p className="text-sm text-muted-foreground">Updated 2 days ago</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Term Sheet</p>
                    <p className="text-sm text-muted-foreground">Updated 3 days ago</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Legal Documentation</p>
                    <p className="text-sm text-muted-foreground">Updated 1 week ago</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dataset Access */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <CardTitle>Full Dataset Access</CardTitle>
            </div>
            <CardDescription>
              Access the complete portfolio dataset for detailed analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasDataAccess ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                  <Badge className="bg-green-600">Access Granted</Badge>
                  <span className="text-sm text-muted-foreground">
                    You have full access to the dataset: <strong>{datasetName}</strong>
                  </span>
                </div>
                
                <div className="grid gap-3">
                  <Button variant="default" className="w-full">
                    <Database className="h-4 w-4 mr-2" />
                    View Full Dataset
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export Dataset
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-muted/50 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">Pending Approval</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  The issuer is reviewing your request. Dataset access will be granted once approved.
                </p>
              </div>
            )}

            {/* Questions and Additional Data Requirements */}
            <Card className="mt-6 border-blue-200 dark:border-blue-900">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Questions & Additional Data Requirements</CardTitle>
                    <CardDescription>
                      Submit any questions or request additional data you need for your analysis
                    </CardDescription>
                  </div>
                  {(existingResponse?.questions || existingResponse?.additional_data_needs) && (
                    <Dialog open={showPreviousRequests} onOpenChange={setShowPreviousRequests}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <History className="h-4 w-4" />
                          Previous Requests
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Previous Requests</DialogTitle>
                          <DialogDescription>
                            View your previously submitted questions and data requirements
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4 mt-4">
                          {existingResponse.questions && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <Label className="text-sm font-semibold">Your Questions</Label>
                                {existingResponse.requirements_acknowledged ? (
                                  <Badge variant="outline" className="gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Acknowledged
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="gap-1">
                                    <Clock className="h-3 w-3" />
                                    Pending
                                  </Badge>
                                )}
                              </div>
                              <div className="bg-muted/50 p-4 rounded-md border">
                                <p className="text-sm whitespace-pre-wrap">
                                  {existingResponse.questions}
                                </p>
                              </div>
                            </div>
                          )}

                          {existingResponse.additional_data_needs && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <Label className="text-sm font-semibold">Additional Data Needs</Label>
                                {existingResponse.requirements_acknowledged ? (
                                  <Badge variant="outline" className="gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Acknowledged
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="gap-1">
                                    <Clock className="h-3 w-3" />
                                    Pending
                                  </Badge>
                                )}
                              </div>
                              <div className="bg-muted/50 p-4 rounded-md border">
                                <p className="text-sm whitespace-pre-wrap">
                                  {existingResponse.additional_data_needs}
                                </p>
                              </div>
                            </div>
                          )}

                          {existingResponse.requirements_acknowledged && existingResponse.requirements_acknowledged_at && (
                            <div className="pt-3 border-t">
                              <p className="text-sm text-muted-foreground">
                                Acknowledged on {new Date(existingResponse.requirements_acknowledged_at).toLocaleDateString()} at {new Date(existingResponse.requirements_acknowledged_at).toLocaleTimeString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="questions">Questions for Issuer</Label>
                  <Textarea
                    id="questions"
                    placeholder="Enter any questions you have about the transaction..."
                    value={dataRequirements.questions}
                    onChange={(e) => setDataRequirements({ ...dataRequirements, questions: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalDataNeeds">Additional Data Requirements</Label>
                  <Textarea
                    id="additionalDataNeeds"
                    placeholder="Specify any additional data or documentation you require..."
                    value={dataRequirements.additionalDataNeeds}
                    onChange={(e) => setDataRequirements({ ...dataRequirements, additionalDataNeeds: e.target.value })}
                    rows={4}
                  />
                </div>

                <Button 
                  type="button" 
                  className="w-full"
                  onClick={async () => {
                    try {
                      const { error } = await supabase
                        .from('offer_responses')
                        .update({
                          questions: dataRequirements.questions,
                          additional_data_needs: dataRequirements.additionalDataNeeds
                        })
                        .eq('id', existingResponse?.id);

                      if (error) throw error;

                      toast({
                        title: 'Request Submitted',
                        description: 'Your questions and data requirements have been sent to the issuer.',
                      });
                      setDataRequirements({ questions: '', additionalDataNeeds: '' });
                    } catch (error) {
                      toast({
                        title: 'Error',
                        description: 'Failed to submit your request. Please try again.',
                        variant: 'destructive'
                      });
                    }
                  }}
                  disabled={!existingResponse?.id}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Submit Request
                </Button>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    )}
  </>
  );
}

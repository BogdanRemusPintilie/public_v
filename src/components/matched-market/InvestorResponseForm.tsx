import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Send } from 'lucide-react';

interface InvestorResponseFormProps {
  offerId: string;
  onResponseSubmitted?: () => void;
}

export function InvestorResponseForm({ offerId, onResponseSubmitted }: InvestorResponseFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingResponse, setExistingResponse] = useState<any>(null);
  const [formData, setFormData] = useState({
    indicativePrice: '',
    comments: '',
    status: 'interested'
  });

  useEffect(() => {
    checkExistingResponse();
  }, [offerId, user]);

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

  return (
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
  );
}

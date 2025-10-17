import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, Clock } from 'lucide-react';

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
  const [isInterested, setIsInterested] = useState<boolean | null>(null);
  const [comments, setComments] = useState('');

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
        setIsInterested(data.status === 'accepted');
        setComments(data.comments || '');
      }
    } catch (error) {
      // No existing response
    }
  };

  const handleInterestResponse = async (interested: boolean) => {
    if (!user?.id) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to submit your response.',
        variant: 'destructive',
      });
      return;
    }

    if (offerId === 'demo-offer') {
      toast({
        title: 'Demo Offer',
        description: 'This is a demo offer. In production, your response would be saved.',
      });
      setIsInterested(interested);
      return;
    }

    setIsSubmitting(true);

    try {
      const responseData = {
        offer_id: offerId,
        investor_id: user.id,
        status: interested ? 'accepted' : 'declined',
        indicative_price: null,
        comments: comments.trim() || null
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

      setIsInterested(interested);
      
      toast({
        title: interested ? 'Interest Confirmed' : 'Interest Declined',
        description: interested 
          ? 'The issuer has been notified of your interest.' 
          : 'The issuer has been notified.',
      });

      onResponseSubmitted?.();
      await checkExistingResponse();
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
        <CardTitle>Your Response</CardTitle>
        <CardDescription>
          {isInterested === null 
            ? 'Are you interested in this offer?' 
            : isInterested 
              ? 'Your interest has been sent to the issuer'
              : 'You have declined this offer'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isInterested === null ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="comments">Comments (optional)</Label>
              <Textarea
                id="comments"
                placeholder="Add any comments or questions..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
              />
            </div>
            
            <div className="flex gap-4">
              <Button 
                onClick={() => handleInterestResponse(true)}
                disabled={isSubmitting}
                className="flex-1"
                size="lg"
              >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-5 w-5" />
              )}
              Interested
            </Button>
            <Button 
              onClick={() => handleInterestResponse(false)}
              disabled={isSubmitting}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              Not Interested
            </Button>
          </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${isInterested ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900' : 'bg-muted/50 border'}`}>
              <div className="flex items-center gap-2">
                {isInterested ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Interest Confirmed</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Interest Declined</span>
                  </>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {isInterested 
                  ? 'The issuer has been notified of your interest and will review your response.'
                  : 'The issuer has been notified.'}
              </p>
              
              {comments && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm font-medium text-muted-foreground">Your Comments</p>
                  <p className="text-sm mt-1 bg-background p-3 rounded-md">{comments}</p>
                </div>
              )}
              
              {existingResponse && (
                <p className="text-xs text-muted-foreground mt-3">
                  Submitted on {new Date(existingResponse.created_at).toLocaleDateString()}
                </p>
              )}
            </div>

            <Button 
              onClick={() => handleInterestResponse(!isInterested)}
              disabled={isSubmitting}
              variant="outline"
              className="w-full"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Change Response
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

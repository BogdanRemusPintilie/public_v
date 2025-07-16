import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, X } from 'lucide-react';

const offerSchema = z.object({
  offer_name: z.string().min(1, 'Offer name is required'),
  structure_id: z.string().min(1, 'Please select a structure'),
  shared_with_emails: z.array(z.string().email('Invalid email format')).min(0),
  comments: z.string().optional(),
});

type OfferFormData = z.infer<typeof offerSchema>;

interface Structure {
  id: string;
  structure_name: string;
  dataset_name: string;
}

interface IssueOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IssueOfferModal({ open, onOpenChange }: IssueOfferModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [structures, setStructures] = useState<Structure[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailList, setEmailList] = useState<string[]>([]);

  const form = useForm<OfferFormData>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      offer_name: '',
      structure_id: '',
      shared_with_emails: [],
      comments: '',
    },
  });

  // Fetch user's structures
  useEffect(() => {
    if (open && user) {
      fetchStructures();
    }
  }, [open, user]);

  const fetchStructures = async () => {
    try {
      const { data, error } = await supabase
        .from('tranche_structures')
        .select('id, structure_name, dataset_name')
        .eq('user_id', user?.id);

      if (error) throw error;
      setStructures(data || []);
    } catch (error) {
      console.error('Error fetching structures:', error);
      toast({
        title: 'Error',
        description: 'Failed to load structures',
        variant: 'destructive',
      });
    }
  };

  const addEmail = () => {
    const email = emailInput.trim();
    if (email && !emailList.includes(email)) {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(email)) {
        const newEmailList = [...emailList, email];
        setEmailList(newEmailList);
        form.setValue('shared_with_emails', newEmailList);
        setEmailInput('');
      } else {
        toast({
          title: 'Invalid Email',
          description: 'Please enter a valid email address',
          variant: 'destructive',
        });
      }
    }
  };

  const removeEmail = (emailToRemove: string) => {
    const newEmailList = emailList.filter(email => email !== emailToRemove);
    setEmailList(newEmailList);
    form.setValue('shared_with_emails', newEmailList);
  };

  const handleEmailKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEmail();
    }
  };

  const onSubmit = async (data: OfferFormData) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('offers')
        .insert({
          user_id: user.id,
          offer_name: data.offer_name,
          structure_id: data.structure_id,
          shared_with_emails: emailList,
          comments: data.comments || null,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Offer created successfully',
      });

      // Reset form and close modal
      form.reset();
      setEmailList([]);
      setEmailInput('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating offer:', error);
      toast({
        title: 'Error',
        description: 'Failed to create offer',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Issue New Offer</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="structure_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Structure *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a structure" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {structures.map((structure) => (
                        <SelectItem key={structure.id} value={structure.id}>
                          {structure.structure_name} ({structure.dataset_name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="offer_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Offer Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter offer name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <Label>Investor Emails</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter email address"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyPress={handleEmailKeyPress}
                />
                <Button type="button" onClick={addEmail} variant="outline">
                  Add
                </Button>
              </div>
              
              {emailList.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {emailList.map((email, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-md text-sm"
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() => removeEmail(email)}
                        className="hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comments</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional comments about this offer"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Offer'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
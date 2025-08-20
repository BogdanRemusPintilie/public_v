import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getInvestors, InvestorRecord } from '@/utils/investorUtils';
import { useToast } from '@/hooks/use-toast';


interface InvestorSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedInvestors: string[];
  onInvestorsChange: (investors: string[]) => void;
  additionalEmails: string[];
  onAdditionalEmailsChange: (emails: string[]) => void;
}

export function InvestorSelector({ 
  open, 
  onOpenChange, 
  selectedInvestors, 
  onInvestorsChange,
  additionalEmails,
  onAdditionalEmailsChange
}: InvestorSelectorProps) {
  const [newEmail, setNewEmail] = useState('');
  const [investors, setInvestors] = useState<InvestorRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadInvestors();
    }
  }, [open]);

  const loadInvestors = async () => {
    try {
      setIsLoading(true);
      const data = await getInvestors();
      setInvestors(data);
    } catch (error) {
      toast({
        title: "Error loading investors",
        description: error instanceof Error ? error.message : "Failed to load investors",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvestorToggle = (investor: string) => {
    const isSelected = selectedInvestors.includes(investor);
    if (isSelected) {
      onInvestorsChange(selectedInvestors.filter(inv => inv !== investor));
    } else {
      onInvestorsChange([...selectedInvestors, investor]);
    }
  };

  const addEmail = () => {
    const email = newEmail.trim();
    if (email && !additionalEmails.includes(email)) {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(email)) {
        onAdditionalEmailsChange([...additionalEmails, email]);
        setNewEmail('');
      }
    }
  };

  const removeEmail = (emailToRemove: string) => {
    onAdditionalEmailsChange(additionalEmails.filter(email => email !== emailToRemove));
  };

  const handleEmailKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEmail();
    }
  };

  const handleConfirm = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Investors</DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-hidden">
          {/* Investor Pool Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Investor Pool</h3>
            <ScrollArea className="h-[300px] border rounded-md">
              {isLoading ? (
                <div className="p-4 text-center text-muted-foreground">Loading investors...</div>
              ) : investors.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">No investors found. Upload data first.</div>
              ) : (
                <div className="p-2">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 w-12"></th>
                        <th className="text-left p-2 min-w-[150px]">Investor</th>
                        <th className="text-left p-2 min-w-[200px]">Overview</th>
                        <th className="text-left p-2 min-w-[120px]">Contact Name</th>
                        <th className="text-left p-2 min-w-[150px]">Contact Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {investors.map((investor) => (
                        <tr key={investor.id} className="border-b hover:bg-muted/50">
                          <td className="p-2">
                            <Checkbox
                              id={investor.id}
                              checked={selectedInvestors.includes(investor.investor)}
                              onCheckedChange={() => handleInvestorToggle(investor.investor)}
                            />
                          </td>
                          <td className="p-2 font-medium">{investor.investor}</td>
                          <td className="p-2 text-muted-foreground">
                            <div className="max-w-[200px] truncate" title={investor.overview || ''}>
                              {investor.overview || '-'}
                            </div>
                          </td>
                          <td className="p-2">{investor.contact_name || '-'}</td>
                          <td className="p-2 text-muted-foreground">
                            {investor.contact_email || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Additional Emails */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Additional Investor Emails</h3>
              
              <div className="space-y-2">
                <Label>Add Investor Email</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter email address"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyPress={handleEmailKeyPress}
                  />
                  <Button type="button" onClick={addEmail} variant="outline" size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Selected Investors and Emails Display */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Selection Summary</h3>
              <ScrollArea className="h-[200px] border rounded-md p-4">
                <div className="space-y-4">
                  {selectedInvestors.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Selected Investors</h4>
                      <div className="space-y-1">
                        {selectedInvestors.map((investor) => (
                          <Card key={investor} className="p-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">{investor}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleInvestorToggle(investor)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {additionalEmails.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Additional Emails</h4>
                      <div className="space-y-1">
                        {additionalEmails.map((email, index) => (
                          <Card key={index} className="p-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">{email}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeEmail(email)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedInvestors.length === 0 && additionalEmails.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center">
                      No investors or emails selected yet
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm}>
            Confirm Selection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
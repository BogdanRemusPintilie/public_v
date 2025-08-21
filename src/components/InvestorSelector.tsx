import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getInvestors, InvestorRecord, insertInvestors } from '@/utils/investorUtils';
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
  const [newInvestor, setNewInvestor] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [investors, setInvestors] = useState<InvestorRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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

  const addNewContact = async () => {
    const investor = newInvestor.trim();
    const contactName = newContactName.trim();
    const contactEmail = newContactEmail.trim();

    if (!investor) {
      toast({
        title: "Investor required",
        description: "Please enter an investor/company name",
        variant: "destructive",
      });
      return;
    }

    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      const newInvestorRecord: InvestorRecord = {
        investor,
        overview: '',
        contact_name: contactName || undefined,
        contact_email: contactEmail || undefined
      };

      await insertInvestors([newInvestorRecord]);
      
      toast({
        title: "Contact added",
        description: "New contact has been added to the investor pool",
      });

      // Clear form
      setNewInvestor('');
      setNewContactName('');
      setNewContactEmail('');
      
      // Reload investors
      await loadInvestors();
    } catch (error) {
      toast({
        title: "Error adding contact",
        description: error instanceof Error ? error.message : "Failed to add contact",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const removeEmail = (emailToRemove: string) => {
    onAdditionalEmailsChange(additionalEmails.filter(email => email !== emailToRemove));
  };

  const handleConfirm = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Investors</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
          {/* Investor Pool Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Investor Pool</h3>
              <div className="text-sm text-muted-foreground">
                {selectedInvestors.length} selected
              </div>
            </div>
            
            <ScrollArea className="h-[280px] border rounded-lg bg-card">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-2">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-sm text-muted-foreground">Loading investors...</p>
                  </div>
                </div>
              ) : investors.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-2 p-6">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                      <Plus className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">No investors found</p>
                    <p className="text-xs text-muted-foreground">Upload data first or add new contacts below</p>
                  </div>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {investors.map((investor) => (
                    <Card 
                      key={investor.id} 
                      className={`transition-all duration-200 hover:shadow-md cursor-pointer ${
                        selectedInvestors.includes(investor.investor) 
                          ? 'ring-2 ring-primary bg-primary/5' 
                          : 'hover:bg-muted/30'
                      }`}
                      onClick={() => handleInvestorToggle(investor.investor)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            id={investor.id}
                            checked={selectedInvestors.includes(investor.investor)}
                            onCheckedChange={() => handleInvestorToggle(investor.investor)}
                            className="mt-1"
                          />
                          
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-start justify-between">
                              <h4 className="font-semibold text-foreground truncate pr-2">
                                {investor.investor}
                              </h4>
                            </div>
                            
                            {investor.overview && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {investor.overview}
                              </p>
                            )}
                            
                            <div className="flex flex-wrap gap-4 text-xs">
                              {investor.contact_name && (
                                <div className="flex items-center space-x-1">
                                  <span className="text-muted-foreground">Contact:</span>
                                  <span className="text-foreground font-medium">{investor.contact_name}</span>
                                </div>
                              )}
                              {investor.contact_email && (
                                <div className="flex items-center space-x-1">
                                  <span className="text-muted-foreground">Email:</span>
                                  <span className="text-foreground font-mono">{investor.contact_email}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* New Contacts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">New Contacts</h3>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Investor (Company) *</Label>
                  <Input
                    placeholder="Enter company/investor name"
                    value={newInvestor}
                    onChange={(e) => setNewInvestor(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Contact Name</Label>
                  <Input
                    placeholder="Enter contact name"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter contact email"
                      value={newContactEmail}
                      onChange={(e) => setNewContactEmail(e.target.value)}
                    />
                    <Button 
                      type="button" 
                      onClick={addNewContact} 
                      variant="outline" 
                      size="icon"
                      disabled={!newInvestor.trim() || isSaving}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Investors and Emails Display */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Selection Summary</h3>
              <ScrollArea className="h-[150px] border rounded-md p-4">
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
        </ScrollArea>

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
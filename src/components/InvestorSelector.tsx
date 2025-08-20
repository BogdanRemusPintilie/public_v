import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const INVESTOR_POOL = [
  "Abrdn plc",
  "Allianz Insurance", 
  "Arch Capital Group",
  "Arini",
  "Atalaya",
  "AXA",
  "Bayview",
  "Blackstone",
  "British Business Bank",
  "Cheyne Capital Management",
  "Chorus Capital",
  "Christofferson Robb and Company",
  "Coface",
  "European Bank for Reconstruction and Development",
  "European Investment Banking Group",
  "Great Lakes Insurance",
  "Intermediate Capital Group",
  "International Finance Corporation",
  "Keva",
  "Kohlberg Kravis Roberts",
  "Luminarx",
  "M&G plc",
  "Man Group",
  "Orchard Global",
  "PGGM",
  "Seer Capital",
  "Veld Capital",
  "Zurich Insurance"
];

const INVESTOR_TRANSACTION_INFO: Record<string, string> = {
  "European Investment Banking Group": "Conducted 9 unfunded bilateral unfunded transactions",
  "Atalaya": "Conducted 1 bilateral transaction",
  "Bayview": "Conducted 2 SVP CLN bilateral transactions",
  "International Finance Corporation": "Conducted 3 bilateral transactions",
  "Luminarx": "Conducted 1 bilateral transaction",
  "PGGM": "Conducted 3 unfunded and 5 Direct CLN bilateral transactions",
  "Blackstone": "Conducted 2 transactions",
  "British Business Bank": "Conducted 1 unfunded bilateral transaction",
  "European Bank for Reconstruction and Development": "Conducted 1 unfunded bilateral transaction",
  "Veld Capital": "Conducted 1 bilateral transaction",
  "Kohlberg Kravis Roberts": "Conducted 1 SVP CLN bilateral transaction",
  "AXA": "Conducted 110 SRT deals since 2000",
  "Seer Capital": "Conducted 71 SRT deals since 2010",
  "Cheyne Capital Management": "Active in the market from 2004-2018, recently re-entered the market in 2024",
  "M&G plc": "Conducted €9.7Bn in SRT transactions since 2008",
  "Intermediate Capital Group": "No previous SRT transactions but conducted $32Bn in Structured Capital AUM (ICG)",
  "Orchard Global": "Planned up to 20 SRT deals with 7 being conducted up to 2024",
  "Arini": "No previous SRT transactions but experienced in the CLO field",
  "Man Group": "Conducts junior tranche SRT transactions",
  "Great Lakes Insurance": "No previous SRT transactions",
  "Christofferson Robb and Company": "Plays a significant institutional role in the space conducting 4 SRT transactions in 2024",
  "Coface": "No previous SRT transactions",
  "Keva": "No previous SRT transactions",
  "Chorus Capital": "Core player in the space (SRT investor of the year 2023, 2024, 2025)",
  "Zurich Insurance": "No previous SRT transactions",
  "Arch Capital Group": "Conducted nearly 30 unfunded SRT transactions since 2018, operating in 13 countries with a portfolio size of around $6Bn",
  "Abrdn plc": "No previous SRT transactions",
  "Allianz Insurance": "No previous SRT transactions but involved within the ART space"
};

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

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
          {/* Investor Pool Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Investor Pool</h3>
            <ScrollArea className="h-[400px] border rounded-md p-4">
              <div className="space-y-2">
                {INVESTOR_POOL.map((investor) => (
                  <div key={investor} className="flex items-start space-x-3">
                    <Checkbox
                      id={investor}
                      checked={selectedInvestors.includes(investor)}
                      onCheckedChange={() => handleInvestorToggle(investor)}
                    />
                    <div className="flex-1 min-w-0">
                      <label
                        htmlFor={investor}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {investor}
                      </label>
                      {INVESTOR_TRANSACTION_INFO[investor] && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {INVESTOR_TRANSACTION_INFO[investor]}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Additional Emails */}
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

            {/* Selected Investors and Emails Display */}
            <ScrollArea className="h-[350px] border rounded-md p-4">
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
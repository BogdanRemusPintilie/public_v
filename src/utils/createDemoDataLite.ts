
import { insertLoanData, LoanRecord } from './supabase';

export const createDemoDataLite = async (): Promise<void> => {
  console.log('🔄 Creating Demo Data Lite dataset...');
  
  // Generate sample loan data that matches the loan_tape structure
  const sampleLoans: LoanRecord[] = Array.from({ length: 50 }, (_, index) => {
    const loanId = `LITE-${String(index + 1).padStart(4, '0')}`;
    const openingBalance = Math.floor(Math.random() * 500000) + 50000; // $50K to $550K
    const interestRateDecimal = (Math.random() * 0.15) + 0.03; // 3% to 18%
    const interestRate = interestRateDecimal * 100; // Convert to percentage
    const termMonths = [12, 24, 36, 60, 84, 120][Math.floor(Math.random() * 6)]; // Common loan terms
    const pd = Math.random() * 0.12; // 0% to 12% probability of default
    const creditScore = Math.floor(Math.random() * 300) + 500; // 500-800 credit score
    const ltv = Math.random() * 0.95 + 0.05; // 5% to 100% LTV
    
    return {
      loan_amount: openingBalance,
      interest_rate: interestRate,
      term: termMonths,
      loan_type: ['Personal', 'Auto', 'Mortgage', 'Business'][Math.floor(Math.random() * 4)],
      credit_score: creditScore,
      ltv: ltv,
      opening_balance: openingBalance,
      pd: pd,
      file_name: 'demo_data_lite.xlsx',
      worksheet_name: 'loan_tape',
      dataset_name: 'Demo Data Lite'
    };
  });

  console.log('📊 Generated sample data:', {
    totalRecords: sampleLoans.length,
    portfolioValue: sampleLoans.reduce((sum, loan) => sum + loan.opening_balance, 0),
    avgInterestRate: sampleLoans.reduce((sum, loan) => sum + (loan.interest_rate * loan.opening_balance), 0) / 
                    sampleLoans.reduce((sum, loan) => sum + loan.opening_balance, 0),
    highRiskLoans: sampleLoans.filter(loan => loan.pd > 0.05).length
  });

  try {
    await insertLoanData(sampleLoans);
    console.log('✅ Demo Data Lite dataset created successfully');
  } catch (error) {
    console.error('❌ Error creating Demo Data Lite dataset:', error);
    throw error;
  }
};

import * as XLSX from 'xlsx';

export interface SBCLNData {
  portfolioSize: number;
  trancheF: {
    size: number;
    ftBalance: number;
    attachmentDetachment: string;
    coupon: string;
  };
  trancheG: {
    size: number;
    ftBalance: number;
    attachmentDetachment: string;
    coupon: string;
  };
  dates: {
    closing: string;
    purchase: string;
    purchasePrice: string;
    maturity: string;
    call: string;
  };
  summary: {
    monthlyData: any[];
  };
}

export interface BSTS4Data {
  portfolioSize: number;
  rampedUpNotional: number;
  trancheSize: number;
  ftBalance: number;
  attachmentDetachment: string;
  coupon: string;
  dates: {
    closing: string;
    purchase: string;
    purchasePrice: string;
    maturity: string;
    call: string;
  };
  rampUp: string;
  replenishment: string;
  reporting: {
    howToGetReports: string;
    otherName: string;
    edCode: string;
  };
  monthlyData: any[];
}

export const exportToExcel = (sbclnData?: SBCLNData, bsts4Data?: BSTS4Data) => {
  const workbook = XLSX.utils.book_new();

  // SBCLN Data Export
  if (sbclnData) {
    // Portfolio Overview
    const portfolioOverview = [
      ['Metric', 'Value'],
      ['Total Portfolio Size', sbclnData.portfolioSize],
      ['Tranche F Size', sbclnData.trancheF.size],
      ['Tranche G Size', sbclnData.trancheG.size],
      ['Tranche F Attachment/Detachment', sbclnData.trancheF.attachmentDetachment],
      ['Tranche F Coupon', sbclnData.trancheF.coupon],
      ['Tranche G Attachment/Detachment', sbclnData.trancheG.attachmentDetachment],
      ['Tranche G Coupon', sbclnData.trancheG.coupon],
      ['Closing Date', sbclnData.dates.closing],
      ['Purchase Date', sbclnData.dates.purchase],
      ['Purchase Price', sbclnData.dates.purchasePrice]
    ];

    const portfolioSheet = XLSX.utils.aoa_to_sheet(portfolioOverview);
    XLSX.utils.book_append_sheet(workbook, portfolioSheet, 'SBCLN Portfolio');

    // Monthly Performance Data
    if (sbclnData.summary.monthlyData.length > 0) {
      const monthlyHeaders = [
        'Period', 'WA IR', 'WA Remaining Term', 'Delinquency %', 
        'Cumulative Losses', 'Losses %', 'Monthly Defaults', 
        'Portfolio Balance', 'Pool Factor', 'Loans', 'F Balance', 'G Balance'
      ];

      const monthlyData = sbclnData.summary.monthlyData.map(month => [
        month.period,
        month.waIR,
        month.waRemainingTerm,
        month.delinquency || '',
        month.cumulativeLosses,
        month.cumulativeLossesPercent,
        month.monthlyDefaults,
        month.portfolioBalance,
        month.poolFactor,
        month.loans || '',
        month.fBalance,
        month.gBalance
      ]);

      const monthlySheet = XLSX.utils.aoa_to_sheet([monthlyHeaders, ...monthlyData]);
      XLSX.utils.book_append_sheet(workbook, monthlySheet, 'SBCLN Monthly Data');
    }
  }

  // BSTS 4 Data Export
  if (bsts4Data) {
    // Deal Information
    const dealInfo = [
      ['Metric', 'Value'],
      ['Initial Notional', bsts4Data.portfolioSize],
      ['Ramped Up Notional', bsts4Data.rampedUpNotional],
      ['Tranche Size', bsts4Data.trancheSize],
      ['FT Balance', bsts4Data.ftBalance],
      ['Attachment/Detachment', bsts4Data.attachmentDetachment],
      ['Coupon', bsts4Data.coupon],
      ['Closing Date', bsts4Data.dates.closing],
      ['Purchase Date', bsts4Data.dates.purchase],
      ['Call Date', bsts4Data.dates.call],
      ['Ramp Up', bsts4Data.rampUp],
      ['Replenishment', bsts4Data.replenishment],
      ['How to get Reports', bsts4Data.reporting.howToGetReports],
      ['Other name', bsts4Data.reporting.otherName],
      ['ED CODE', bsts4Data.reporting.edCode]
    ];

    const dealSheet = XLSX.utils.aoa_to_sheet(dealInfo);
    XLSX.utils.book_append_sheet(workbook, dealSheet, 'BSTS4 Deal Info');

    // Performance Data
    if (bsts4Data.monthlyData.length > 0) {
      const performanceHeaders = [
        'Period', 'No. Loans', 'No. Borrowers', 'WAPD', 'WA LGD', 'WAL', 
        'PRONA', 'Cumulative Defaults', 'Defaults %', 'Initial Loss Amount', 
        'Loss %', 'Tranche Notional', 'Subordination'
      ];

      const performanceData = bsts4Data.monthlyData.map(month => [
        month.period,
        month.noLoans,
        month.noBorrowers,
        month.wapd,
        month.waLgd,
        month.wal,
        month.prona,
        month.cumulativeDefaults,
        month.cumulativeDefaultsPercent,
        month.initialLossAmount,
        month.initialLossPercent,
        month.trancheNotional,
        month.subordination || ''
      ]);

      const performanceSheet = XLSX.utils.aoa_to_sheet([performanceHeaders, ...performanceData]);
      XLSX.utils.book_append_sheet(workbook, performanceSheet, 'BSTS4 Performance');
    }
  }

  // Generate filename with current date
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const filename = `Investment_Reports_${dateStr}.xlsx`;

  // Write the file
  XLSX.writeFile(workbook, filename);
};
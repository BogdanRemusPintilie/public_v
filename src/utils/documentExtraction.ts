
import * as XLSX from 'xlsx';

// PDF parsing types and interfaces
export interface ExtractedFinancialData {
  payment_date?: string;
  senior_tranche_os?: number;
  protected_tranche?: number;
  cpr_annualised?: number;
  cum_losses?: number;
  next_payment_date?: string;
  tranches?: TrancheData[];
  portfolio_balance?: number;
  weighted_avg_rate?: number;
  currency?: string;
}

export interface TrancheData {
  name: string;
  balance: number;
  interest_rate: number;
  wal: number;
  rating: string;
  outstanding_amount?: number;
}

export class DocumentExtractor {
  
  // Extract data from PDF files
  static async extractFromPDF(file: File): Promise<ExtractedFinancialData> {
    try {
      // Convert file to text using a simple text extraction approach
      const text = await this.pdfToText(file);
      
      console.log('PDF text extracted, length:', text.length);
      console.log('Sample text:', text.substring(0, 500));
      
      return this.parseFinancialText(text);
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error('Failed to extract data from PDF');
    }
  }

  // Extract data from Excel files
  static async extractFromExcel(file: File): Promise<ExtractedFinancialData> {
    try {
      const workbook = await this.readExcelFile(file);
      const worksheetNames = workbook.SheetNames;
      
      console.log('Excel worksheets found:', worksheetNames);
      
      // Look for common worksheet names in investor reports
      const targetSheet = worksheetNames.find(name => 
        name.toLowerCase().includes('tranche') ||
        name.toLowerCase().includes('summary') ||
        name.toLowerCase().includes('waterfall') ||
        name.toLowerCase().includes('payment')
      ) || worksheetNames[0];
      
      const worksheet = workbook.Sheets[targetSheet];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      console.log(`Processing sheet "${targetSheet}" with ${data.length} rows`);
      
      return this.parseExcelData(data as any[][]);
    } catch (error) {
      console.error('Excel extraction error:', error);
      throw new Error('Failed to extract data from Excel file');
    }
  }

  // Extract data from CSV files
  static async extractFromCSV(file: File): Promise<ExtractedFinancialData> {
    try {
      const text = await this.fileToText(file);
      const lines = text.split('\n').map(line => line.split(','));
      
      console.log('CSV data parsed, rows:', lines.length);
      
      return this.parseExcelData(lines);
    } catch (error) {
      console.error('CSV extraction error:', error);
      throw new Error('Failed to extract data from CSV file');
    }
  }

  // Helper method to convert PDF to text using pdf-parse
  private static async pdfToText(file: File): Promise<string> {
    try {
      console.log('🔍 Starting PDF text extraction...');
      const pdfParse = await import('pdf-parse');
      
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      console.log('📄 PDF buffer created, size:', buffer.length);
      
      const data = await pdfParse.default(buffer);
      console.log('✅ PDF parsed successfully, text length:', data.text.length);
      console.log('📝 First 200 chars:', data.text.substring(0, 200));
      
      return data.text;
    } catch (error) {
      console.error('❌ PDF parsing failed:', error);
      console.log('🔄 Falling back to basic text extraction');
      
      // Fallback to basic text extraction
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const text = reader.result as string || '';
          console.log('📄 Fallback extraction completed, length:', text.length);
          resolve(text);
        };
        reader.onerror = () => {
          console.log('❌ Fallback also failed, returning empty string');
          resolve('');
        };
        reader.readAsText(file);
      });
    }
  }

  // Helper method to read Excel file
  private static async readExcelFile(file: File): Promise<XLSX.WorkBook> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          resolve(workbook);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  // Helper method to convert file to text
  private static async fileToText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  // Parse financial data from text content
  private static parseFinancialText(text: string): ExtractedFinancialData {
    const result: ExtractedFinancialData = {};
    
    // Common patterns for financial data extraction
    const patterns = {
      payment_date: /payment\s+date[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{4}|\d{4}-\d{2}-\d{2})/i,
      next_payment_date: /next\s+payment[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{4}|\d{4}-\d{2}-\d{2})/i,
      senior_tranche: /senior.*?(?:balance|outstanding)[:\s]+([\d,]+\.?\d*)/i,
      protected_tranche: /protected.*?(?:balance|outstanding)[:\s]+([\d,]+\.?\d*)/i,
      cpr: /cpr[:\s]+([\d.]+)%?/i,
      losses: /(?:cumulative\s+)?losses[:\s]+([\d,]+\.?\d*)/i,
      portfolio_balance: /portfolio\s+balance[:\s]+([\d,]+\.?\d*)/i,
      weighted_rate: /weighted.*?rate[:\s]+([\d.]+)%?/i
    };

    // Extract dates
    const paymentMatch = text.match(patterns.payment_date);
    if (paymentMatch) {
      result.payment_date = this.standardizeDate(paymentMatch[1]);
    }

    const nextPaymentMatch = text.match(patterns.next_payment_date);
    if (nextPaymentMatch) {
      result.next_payment_date = this.standardizeDate(nextPaymentMatch[1]);
    }

    // Extract financial figures
    const seniorMatch = text.match(patterns.senior_tranche);
    if (seniorMatch) {
      result.senior_tranche_os = this.parseNumber(seniorMatch[1]);
    }

    const protectedMatch = text.match(patterns.protected_tranche);
    if (protectedMatch) {
      result.protected_tranche = this.parseNumber(protectedMatch[1]);
    }

    const cprMatch = text.match(patterns.cpr);
    if (cprMatch) {
      result.cpr_annualised = parseFloat(cprMatch[1]);
    }

    const lossesMatch = text.match(patterns.losses);
    if (lossesMatch) {
      result.cum_losses = this.parseNumber(lossesMatch[1]);
    }

    const portfolioMatch = text.match(patterns.portfolio_balance);
    if (portfolioMatch) {
      result.portfolio_balance = this.parseNumber(portfolioMatch[1]);
    }

    const rateMatch = text.match(patterns.weighted_rate);
    if (rateMatch) {
      result.weighted_avg_rate = parseFloat(rateMatch[1]);
    }

    // Extract tranche information
    result.tranches = this.extractTranches(text);

    console.log('Extracted financial data:', result);
    return result;
  }

  // Parse Excel/CSV data
  private static parseExcelData(data: any[][]): ExtractedFinancialData {
    const result: ExtractedFinancialData = {};
    
    if (data.length < 2) {
      throw new Error('Insufficient data in spreadsheet');
    }

    // Find header row and data rows
    let headerRowIndex = 0;
    let headers: string[] = [];
    
    // Look for the first row with meaningful headers
    for (let i = 0; i < Math.min(5, data.length); i++) {
      const row = data[i];
      if (row && row.length > 2 && this.isHeaderRow(row)) {
        headerRowIndex = i;
        headers = row.map(h => String(h).toLowerCase().trim());
        break;
      }
    }

    console.log('Found headers:', headers);

    // Extract data based on column headers
    const dataRows = data.slice(headerRowIndex + 1);
    
    // Look for tranche data
    const tranches: TrancheData[] = [];
    
    for (const row of dataRows) {
      if (!row || row.length < headers.length) continue;
      
      const tranche = this.parseTrancheRow(headers, row);
      if (tranche) {
        tranches.push(tranche);
      }
    }

    if (tranches.length > 0) {
      result.tranches = tranches;
      
      // Calculate summary statistics
      result.senior_tranche_os = tranches
        .filter(t => t.name.toLowerCase().includes('senior'))
        .reduce((sum, t) => sum + (t.balance || 0), 0);
        
      result.protected_tranche = tranches
        .filter(t => t.name.toLowerCase().includes('protected') || t.name.toLowerCase().includes('mezzanine'))
        .reduce((sum, t) => sum + (t.balance || 0), 0);
        
      result.portfolio_balance = tranches.reduce((sum, t) => sum + (t.balance || 0), 0);
      
      // Calculate weighted average rate
      const totalBalance = result.portfolio_balance || 1;
      result.weighted_avg_rate = tranches.reduce((sum, t) => 
        sum + ((t.balance || 0) * (t.interest_rate || 0)), 0
      ) / totalBalance;
    }

    // Look for specific values in the data
    result.payment_date = this.findDateInData(data, ['payment date', 'payment_date', 'pay date']);
    result.next_payment_date = this.findDateInData(data, ['next payment', 'next_payment', 'next pay']);
    result.cpr_annualised = this.findNumberInData(data, ['cpr', 'prepayment rate', 'prepayment_rate']);
    result.cum_losses = this.findNumberInData(data, ['losses', 'cumulative losses', 'cum_losses']);

    console.log('Extracted Excel data:', result);
    return result;
  }

  // Helper methods
  private static isHeaderRow(row: any[]): boolean {
    const commonHeaders = ['tranche', 'balance', 'rate', 'name', 'class', 'outstanding', 'amount'];
    const rowText = row.join(' ').toLowerCase();
    return commonHeaders.some(header => rowText.includes(header));
  }

  private static parseTrancheRow(headers: string[], row: any[]): TrancheData | null {
    const tranche: Partial<TrancheData> = {};
    
    for (let i = 0; i < headers.length && i < row.length; i++) {
      const header = headers[i];
      const value = row[i];
      
      if (!value) continue;
      
      if (header.includes('name') || header.includes('tranche') || header.includes('class')) {
        tranche.name = String(value);
      } else if (header.includes('balance') || header.includes('outstanding') || header.includes('amount')) {
        tranche.balance = this.parseNumber(value);
      } else if (header.includes('rate') || header.includes('coupon') || header.includes('interest')) {
        tranche.interest_rate = this.parseNumber(value);
      } else if (header.includes('wal') || header.includes('life')) {
        tranche.wal = this.parseNumber(value);
      } else if (header.includes('rating')) {
        tranche.rating = String(value);
      }
    }
    
    // Return only if we have essential data
    if (tranche.name && (tranche.balance || tranche.interest_rate)) {
      return {
        name: tranche.name || 'Unknown',
        balance: tranche.balance || 0,
        interest_rate: tranche.interest_rate || 0,
        wal: tranche.wal || 0,
        rating: tranche.rating || 'NR'
      };
    }
    
    return null;
  }

  private static extractTranches(text: string): TrancheData[] {
    const tranches: TrancheData[] = [];
    
    // Look for tabular data patterns
    const lines = text.split('\n');
    const tranchePattern = /(senior|protected|mezzanine|junior|class\s+[a-z])\s+.*?(\d+[\d,]*\.?\d*)\s+.*?(\d+\.?\d*%?)/i;
    
    for (const line of lines) {
      const match = line.match(tranchePattern);
      if (match) {
        tranches.push({
          name: match[1],
          balance: this.parseNumber(match[2]),
          interest_rate: this.parseNumber(match[3]),
          wal: 0,
          rating: 'NR'
        });
      }
    }
    
    return tranches;
  }

  private static findDateInData(data: any[][], searchTerms: string[]): string | undefined {
    for (const row of data) {
      for (let i = 0; i < row.length - 1; i++) {
        const cell = String(row[i]).toLowerCase();
        if (searchTerms.some(term => cell.includes(term))) {
          const dateValue = row[i + 1];
          if (dateValue && this.isDate(dateValue)) {
            return this.standardizeDate(String(dateValue));
          }
        }
      }
    }
    return undefined;
  }

  private static findNumberInData(data: any[][], searchTerms: string[]): number | undefined {
    for (const row of data) {
      for (let i = 0; i < row.length - 1; i++) {
        const cell = String(row[i]).toLowerCase();
        if (searchTerms.some(term => cell.includes(term))) {
          const numValue = this.parseNumber(row[i + 1]);
          if (numValue > 0) {
            return numValue;
          }
        }
      }
    }
    return undefined;
  }

  private static parseNumber(value: any): number {
    if (typeof value === 'number') return value;
    const str = String(value).replace(/[,$%]/g, '');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  }

  private static isDate(value: any): boolean {
    if (!value) return false;
    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  private static standardizeDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
    } catch {
      return dateStr;
    }
  }
}

import { supabase } from "@/integrations/supabase/client";

export interface InvestorReport {
  id: string;
  user_id: string;
  deal_name: string;
  issuer?: string;
  asset_class?: string;
  jurisdiction?: string;
  report_type?: string;
  period_start?: string;
  period_end?: string;
  publish_date?: string;
  currency: string;
  sustainability_labelled: boolean;
  sts_compliant: boolean;
  notes?: string;
  file_name: string;
  file_size?: number;
  file_type?: string;
  file_path: string;
  file_sha256?: string;
  extracted_data?: any;
  created_at?: string;
  updated_at?: string;
}

export interface ReportMetadata {
  deal_name: string;
  issuer?: string;
  asset_class?: string;
  jurisdiction?: string;
  report_type?: string;
  period_start?: string;
  period_end?: string;
  publish_date?: string;
  currency: string;
  sustainability_labelled: boolean;
  sts_compliant: boolean;
  notes?: string;
}

export const saveInvestorReport = async (
  file: File,
  metadata: ReportMetadata,
  extractedData?: any
): Promise<string> => {
  const user = await supabase.auth.getUser();
  if (!user.data.user) {
    throw new Error('User not authenticated');
  }

  // Upload file to storage
  const fileName = `${user.data.user.id}/${Date.now()}_${file.name}`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('investor-reports')
    .upload(fileName, file);

  if (uploadError) {
    throw new Error(`Failed to upload file: ${uploadError.message}`);
  }

  // Save report record to database
  const { data, error } = await supabase
    .from('investor_reports')
    .insert({
      user_id: user.data.user.id,
      deal_name: metadata.deal_name,
      issuer: metadata.issuer,
      asset_class: metadata.asset_class,
      jurisdiction: metadata.jurisdiction,
      report_type: metadata.report_type,
      period_start: metadata.period_start,
      period_end: metadata.period_end,
      publish_date: metadata.publish_date,
      currency: metadata.currency,
      sustainability_labelled: metadata.sustainability_labelled,
      sts_compliant: metadata.sts_compliant,
      notes: metadata.notes,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      file_path: uploadData.path,
      extracted_data: extractedData,
    })
    .select()
    .single();

  if (error) {
    // Clean up uploaded file if database insert fails
    await supabase.storage.from('investor-reports').remove([fileName]);
    throw new Error(`Failed to save report: ${error.message}`);
  }

  return data.id;
};

export const getInvestorReports = async (): Promise<InvestorReport[]> => {
  const { data, error } = await supabase
    .from('investor_reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch reports: ${error.message}`);
  }

  return data || [];
};

export const getInvestorReportById = async (id: string): Promise<InvestorReport | null> => {
  const { data, error } = await supabase
    .from('investor_reports')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Record not found
    }
    throw new Error(`Failed to fetch report: ${error.message}`);
  }

  return data;
};

export const updateInvestorReport = async (
  id: string,
  updates: Partial<ReportMetadata>
): Promise<void> => {
  const { error } = await supabase
    .from('investor_reports')
    .update(updates)
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to update report: ${error.message}`);
  }
};

export const deleteInvestorReport = async (id: string): Promise<void> => {
  // Get report to find file path
  const report = await getInvestorReportById(id);
  if (!report) {
    throw new Error('Report not found');
  }

  // Delete file from storage
  const { error: storageError } = await supabase.storage
    .from('investor-reports')
    .remove([report.file_path]);

  if (storageError) {
    console.warn('Failed to delete file from storage:', storageError.message);
  }

  // Delete record from database
  const { error } = await supabase
    .from('investor_reports')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete report: ${error.message}`);
  }
};

export const getFileDownloadUrl = async (filePath: string): Promise<string> => {
  const { data, error } = await supabase.storage
    .from('investor-reports')
    .createSignedUrl(filePath, 3600); // 1 hour expiry

  if (error) {
    throw new Error(`Failed to generate download URL: ${error.message}`);
  }

  return data.signedUrl;
};
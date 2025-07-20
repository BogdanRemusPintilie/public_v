import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ETLJob {
  id: string;
  file_url: string;
  mime_type: string;
  needs_ocr: boolean;
  status: 'queued' | 'running' | 'done' | 'failed';
  warnings: any;
  created_at: string;
  updated_at: string;
}

interface ETLJobStatusProps {
  jobId?: string;
  onJobComplete?: (jobId: string, success: boolean) => void;
}

export const ETLJobStatus: React.FC<ETLJobStatusProps> = ({ jobId, onJobComplete }) => {
  const [jobs, setJobs] = useState<ETLJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchJobs();
    
    // Set up real-time subscription for job updates
    const channel = supabase
      .channel('etl-jobs')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'etl_jobs'
        },
        (payload) => {
          console.log('ETL job update:', payload);
          fetchJobs();
          
          // Notify parent component if job completed
          if (payload.eventType === 'UPDATE' && onJobComplete && payload.new) {
            const job = payload.new as ETLJob;
            if ((job.status === 'done' || job.status === 'failed') && jobId === job.id) {
              onJobComplete(job.id, job.status === 'done');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId, onJobComplete]);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('etl_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setJobs((data || []).map(job => ({
        ...job,
        status: job.status as 'queued' | 'running' | 'done' | 'failed',
        warnings: Array.isArray(job.warnings) ? job.warnings : [],
        needs_ocr: job.needs_ocr || false,
        created_at: job.created_at || new Date().toISOString(),
        updated_at: job.updated_at || new Date().toISOString()
      })) as ETLJob[]);
    } catch (error) {
      console.error('Error fetching ETL jobs:', error);
      toast.error('Failed to fetch job status');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: ETLJob['status']) => {
    switch (status) {
      case 'queued':
        return <Clock className="h-4 w-4" />;
      case 'running':
        return <Clock className="h-4 w-4 animate-spin" />;
      case 'done':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (job: ETLJob) => {
    const variants = {
      queued: 'secondary',
      running: 'secondary',
      done: 'default',
      failed: 'destructive'
    } as const;

    return (
      <Badge variant={variants[job.status]} className="flex items-center gap-1">
        {getStatusIcon(job.status)}
        {job.status.toUpperCase()}
        {job.needs_ocr && <span className="text-xs">(OCR)</span>}
      </Badge>
    );
  };

  const toggleJobExpansion = (jobId: string) => {
    const newExpanded = new Set(expandedJobs);
    if (newExpanded.has(jobId)) {
      newExpanded.delete(jobId);
    } else {
      newExpanded.add(jobId);
    }
    setExpandedJobs(newExpanded);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getFileName = (fileUrl: string) => {
    return fileUrl.split('/').pop() || fileUrl;
  };

  if (isLoading && jobs.length === 0) {
    return <div className="text-sm text-muted-foreground">Loading jobs...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Extraction Jobs</h3>
        <Button variant="outline" size="sm" onClick={fetchJobs}>
          Refresh
        </Button>
      </div>

      {jobs.length === 0 ? (
        <div className="text-sm text-muted-foreground">No extraction jobs found</div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="font-medium">{getFileName(job.file_url)}</div>
                  {getStatusBadge(job)}
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {formatTimestamp(job.created_at)}
                  </span>
                  
                  {(job.warnings.length > 0 || job.status === 'failed') && (
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleJobExpansion(job.id)}
                          className="flex items-center gap-1"
                        >
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          <ChevronDown 
                            className={`h-4 w-4 transition-transform ${
                              expandedJobs.has(job.id) ? 'rotate-180' : ''
                            }`} 
                          />
                        </Button>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent className="mt-3">
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="space-y-1">
                            <div className="font-medium">Extraction Log:</div>
                            {Array.isArray(job.warnings) ? job.warnings.map((warning, index) => (
                              <div key={index} className="text-sm">
                                • {warning}
                              </div>
                            )) : (
                              <div className="text-sm">
                                • {job.warnings || 'No warnings available'}
                              </div>
                            )}
                          </AlertDescription>
                        </Alert>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </div>
              </div>

              {job.status === 'done' && (
                <div className="mt-2 text-sm text-muted-foreground">
                  Extraction completed successfully
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
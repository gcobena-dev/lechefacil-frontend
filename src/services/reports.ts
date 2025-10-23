import { apiFetch } from './client';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Browser } from '@capacitor/browser';
import { Share } from '@capacitor/share';
import { toast } from 'sonner';

// Types for Reports API responses
export interface ReportParameter {
  name: string;
  type: 'date' | 'select' | 'text' | 'number';
  required: boolean;
  options?: string[];
  default_value?: string;
}

export interface ReportDefinition {
  id: string;
  title: string;
  description: string;
  parameters: ReportParameter[];
  formats: string[];
}

export interface ReportDefinitionsResponse {
  reports: ReportDefinition[];
}

export interface ReportResponse {
  report_id: string;
  title: string;
  generated_at: string;
  format: string;
  content?: string; // base64 content for PDF
  data?: any; // JSON data for JSON format
  file_name: string;
}

export interface ReportRequest {
  date_from: string;
  date_to: string;
  period?: 'daily' | 'weekly' | 'monthly';
  format?: 'pdf' | 'json';
  filters?: {
    animal_ids?: string[];
    buyer_ids?: string[];
    labels?: string[];
    breed_ids?: string[];
    lot_ids?: string[];
    status_ids?: string[];
    include_inactive?: boolean;
    [key: string]: any;
  };
  [key: string]: any; // Additional parameters based on report type
}

export interface ProductionReportData {
  summary: {
    total_liters_produced: number;
    total_liters_delivered: number;
    retention_difference: number;
    retention_percentage: number;
    total_records: number;
    avg_per_record: number;
    period_from: string;
    period_to: string;
  };
  period_production_data: Record<string, number>;
  period_delivery_data: Record<string, number>;
  top_producers: Array<{
    animal_name: string;
    animal_tag: string;
    total_liters: number;
    avg_per_day: number;
  }>;
  daily_by_animal?: Record<string, Record<string, { weight_lb: number; total_liters: number }>>;
  animals?: Array<{
    id: string;
    tag: string;
    name: string | null;
  }>;
}

export interface AnimalsReportData {
  summary: {
    total_animals: number;
    active_animals: number;
    inactive_animals: number;
    period_from: string;
    period_to: string;
  };
  animals: Array<{
    name: string;
    tag: string;
    status: string;
    total_liters: number;
    records_count: number;
    avg_per_record: number;
  }>;
}

export interface FinancialReportData {
  summary: {
    total_revenue: number;
    production_revenue: number;
    delivery_revenue: number;
    total_liters_produced: number;
    total_liters_delivered: number;
    avg_price_per_liter: number;
    period_from: string;
    period_to: string;
  };
  period_revenue: Record<string, number>;
  buyer_breakdown: Array<{
    buyer_name: string;
    total_revenue: number;
    percentage: number;
  }>;
}

// Reports API service functions
export async function getReportDefinitions(): Promise<ReportDefinitionsResponse> {
  return apiFetch<ReportDefinitionsResponse>(`/api/v1/reports/definitions`, {
    method: 'GET',
    withAuth: true,
    withTenant: true,
  });
}

export async function generateProductionReport(params: ReportRequest): Promise<ReportResponse> {
  return apiFetch<ReportResponse>(`/api/v1/reports/production`, {
    method: 'POST',
    body: params,
    withAuth: true,
    withTenant: true,
  });
}

export async function generateFinancialReport(params: ReportRequest): Promise<ReportResponse> {
  return apiFetch<ReportResponse>(`/api/v1/reports/financial`, {
    method: 'POST',
    body: params,
    withAuth: true,
    withTenant: true,
  });
}

export async function generateAnimalsReport(params: ReportRequest): Promise<ReportResponse> {
  return apiFetch<ReportResponse>(`/api/v1/reports/animals`, {
    method: 'POST',
    body: params,
    withAuth: true,
    withTenant: true,
  });
}

export async function generateHealthReport(params: ReportRequest): Promise<ReportResponse> {
  return apiFetch<ReportResponse>(`/api/v1/reports/health`, {
    method: 'POST',
    body: params,
    withAuth: true,
    withTenant: true,
  });
}

export async function exportAllReports(params: {
  date_from: string;
  date_to: string;
  format?: string;
}): Promise<ReportResponse[]> {
  return apiFetch<ReportResponse[]>(`/api/v1/reports/export-all`, {
    method: 'POST',
    query: params,
    withAuth: true,
    withTenant: true,
  });
}

// Helper function to download PDF content
export function downloadPDFReport(report: ReportResponse): void {
  console.log('Downloading PDF report:', report);

  if (!report.content) {
    console.error('No content available for download');
    throw new Error('No content available for download');
  }

  // Handle native (Capacitor) mobile environment
  if (Capacitor.isNativePlatform()) {
    (async () => {
      try {
        const fileName = report.file_name?.endsWith('.pdf')
          ? report.file_name
          : `${report.file_name || 'reporte'}.pdf`;

        // Normalize base64 (remove potential data URL prefix)
        const base64 = report.content.includes(',') ? report.content.split(',')[1] : report.content;

        const platform = Capacitor.getPlatform();

        if (platform === 'android') {
          // Save internally and share to open with external viewer (grants access)
          await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Data });
          try {
            const sharePayload: any = {
              title: fileName,
              text: 'Abrir/guardar PDF',
              files: [{ path: fileName, mimeType: 'application/pdf' }],
            };
            await (Share as any).share(sharePayload);
            return;
          } catch (e) {
            console.warn('Share failed, will try in-app open', e);
            const { uri } = await Filesystem.getUri({ path: fileName, directory: Directory.Data });
            const fileUrl = Capacitor.convertFileSrc(uri);
            const opened = window.open?.(fileUrl, '_blank');
            if (!opened) {
              const a = document.createElement('a');
              a.href = fileUrl;
              a.target = '_blank';
              a.rel = 'noopener';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }
            return;
          }
        } else {
          // iOS and others: use Documents and share
          await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Documents });
          try {
            const sharePayload: any = {
              title: fileName,
              text: 'Abrir/guardar PDF',
              files: [{ path: fileName, mimeType: 'application/pdf' }],
            };
            await (Share as any).share(sharePayload);
            return;
          } catch (e) {
            console.warn('Share failed on iOS/others, trying browser open', e);
            const { uri } = await Filesystem.getUri({ path: fileName, directory: Directory.Documents });
            const fileUrl = Capacitor.convertFileSrc(uri);
            const opened = window.open?.(fileUrl, '_blank');
            if (!opened) {
              const a = document.createElement('a');
              a.href = fileUrl;
              a.target = '_blank';
              a.rel = 'noopener';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }
            return;
          }
        }
      } catch (err) {
        console.error('Failed to save/open PDF on mobile:', err);
      }
    })();
    return;
  }

  // Web: convert base64 to Blob and trigger browser download
  const byteCharacters = atob(report.content);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = report.file_name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Helper function to download multiple reports as ZIP (if needed in the future)
export function downloadMultipleReports(reports: ReportResponse[]): void {
  reports.forEach(report => {
    if (report.content) {
      downloadPDFReport(report);
    }
  });
}

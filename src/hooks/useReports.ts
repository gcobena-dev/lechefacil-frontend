import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getReportDefinitions,
  generateProductionReport,
  generateFinancialReport,
  generateAnimalsReport,
  generateHealthReport,
  exportAllReports,
  downloadPDFReport,
  downloadMultipleReports,
  type ReportDefinitionsResponse,
  type ReportResponse,
  type ReportRequest,
} from "@/services/reports";

export function useReportDefinitions() {
  return useQuery<ReportDefinitionsResponse>({
    queryKey: ["reports", "definitions"],
    queryFn: getReportDefinitions,
    staleTime: 30 * 60 * 1000, // 30 minutes - definitions don't change often
  });
}

export function useGenerateReport() {
  const queryClient = useQueryClient();

  const productionMutation = useMutation({
    mutationFn: generateProductionReport,
    onSuccess: (report: ReportResponse) => {
      toast.success("Reporte de producción generado exitosamente");
      downloadPDFReport(report);
    },
    onError: (error: any) => {
      toast.error(`Error al generar reporte de producción: ${error.message}`);
    },
  });

  const financialMutation = useMutation({
    mutationFn: generateFinancialReport,
    onSuccess: (report: ReportResponse) => {
      toast.success("Reporte financiero generado exitosamente");
      downloadPDFReport(report);
    },
    onError: (error: any) => {
      toast.error(`Error al generar reporte financiero: ${error.message}`);
    },
  });

  const animalsMutation = useMutation({
    mutationFn: generateAnimalsReport,
    onSuccess: (report: ReportResponse) => {
      toast.success("Reporte de animales generado exitosamente");
      downloadPDFReport(report);
    },
    onError: (error: any) => {
      toast.error(`Error al generar reporte de animales: ${error.message}`);
    },
  });

  const healthMutation = useMutation({
    mutationFn: generateHealthReport,
    onSuccess: (report: ReportResponse) => {
      toast.success("Reporte de salud generado exitosamente");
      downloadPDFReport(report);
    },
    onError: (error: any) => {
      toast.error(`Error al generar reporte de salud: ${error.message}`);
    },
  });

  const exportAllMutation = useMutation({
    mutationFn: exportAllReports,
    onSuccess: (reports: ReportResponse[]) => {
      toast.success(`Se generaron ${reports.length} reportes exitosamente`);
      downloadMultipleReports(reports);
    },
    onError: (error: any) => {
      toast.error(`Error al exportar reportes: ${error.message}`);
    },
  });

  return {
    generateProductionReport: productionMutation.mutate,
    generateFinancialReport: financialMutation.mutate,
    generateAnimalsReport: animalsMutation.mutate,
    generateHealthReport: healthMutation.mutate,
    exportAllReports: exportAllMutation.mutate,

    isGenerating: {
      production: productionMutation.isPending,
      financial: financialMutation.isPending,
      animals: animalsMutation.isPending,
      health: healthMutation.isPending,
      all: exportAllMutation.isPending,
    },

    errors: {
      production: productionMutation.error,
      financial: financialMutation.error,
      animals: animalsMutation.error,
      health: healthMutation.error,
      all: exportAllMutation.error,
    },
  };
}

// Helper hook for generating reports with parameters dialog
export function useReportGenerator() {
  const {
    generateProductionReport,
    generateFinancialReport,
    generateAnimalsReport,
    generateHealthReport,
    isGenerating,
  } = useGenerateReport();

  const generateReport = (
    type: "production" | "financial" | "animals" | "health",
    params: ReportRequest
  ) => {
    // Set format to PDF by default
    const reportParams = { ...params, format: "pdf" as const };

    console.log("Generating report:", type, reportParams);

    switch (type) {
      case "production":
        generateProductionReport(reportParams);
        break;
      case "financial":
        generateFinancialReport(reportParams);
        break;
      case "animals":
        generateAnimalsReport(reportParams);
        break;
      case "health":
        generateHealthReport(reportParams);
        break;
    }
  };

  return {
    generateReport,
    isGenerating:
      isGenerating.production ||
      isGenerating.financial ||
      isGenerating.animals ||
      isGenerating.health,
  };
}

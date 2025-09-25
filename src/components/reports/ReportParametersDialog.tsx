import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "@/hooks/useTranslation";
import type { ReportDefinition, ReportRequest } from "@/services/reports";

interface ReportParametersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportDefinition: ReportDefinition | null;
  onGenerate: (reportType: string, params: ReportRequest) => void;
  isGenerating: boolean;
}

// Helper function to detect if a parameter is boolean
function isBooleanParameter(paramName: string): boolean {
  const booleanParams = [
    'include_inactive',
    'include_health_events',
    'include_costs',
    'include_deliveries',
    'include_statistics',
    'group_by_animal',
    'show_trends'
  ];
  return booleanParams.includes(paramName) || paramName.startsWith('include_') || paramName.startsWith('show_');
}

// Helper function to get user-friendly parameter labels
function getParameterLabel(paramName: string, t: any): string {
  const labelMap: Record<string, string> = {
    'date_from': t("reports.dateFrom"),
    'date_to': t("reports.dateTo"),
    'period': t("reports.period"),
    'format': t("reports.format"),
    'animal_ids': 'Animales específicos',
    'include_inactive': 'Incluir animales inactivos',
    'include_health_events': 'Incluir eventos de salud',
    'group_by': 'Agrupar por',
    'buyer_id': 'Comprador específico',
    'include_costs': 'Incluir costos',
    'currency': 'Moneda',
  };

  return labelMap[paramName] || paramName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Helper function for select option labels
function getSelectOptionLabel(paramName: string, option: string, t: any): string {
  if (paramName === 'period') {
    switch (option) {
      case 'daily': return t("reports.daily");
      case 'weekly': return t("reports.weekly");
      case 'monthly': return t("reports.monthly");
      default: return option;
    }
  }

  if (paramName === 'format') {
    switch (option) {
      case 'pdf': return t("reports.pdf");
      case 'json': return t("reports.json");
      default: return option;
    }
  }

  // For boolean-like options
  if (option === 'true' || option === 'false') {
    return option === 'true' ? 'Sí' : 'No';
  }

  return option;
}

// Helper function for parameter placeholders
function getParameterPlaceholder(paramName: string): string {
  const placeholderMap: Record<string, string> = {
    'animal_ids': 'Ej: A001,A002,B001',
    'buyer_id': 'ID del comprador',
    'currency': 'USD',
  };

  return placeholderMap[paramName] || '';
}

export default function ReportParametersDialog({
  open,
  onOpenChange,
  reportDefinition,
  onGenerate,
  isGenerating
}: ReportParametersDialogProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    if (!reportDefinition) return;

    const newErrors: Record<string, string> = {};

    // Validate required parameters
    reportDefinition.parameters.forEach(param => {
      if (param.required && !formData[param.name]) {
        newErrors[param.name] = `${getParameterLabel(param.name, t)} ${t("reports.required").toLowerCase()}`;
      }

      // Additional validations based on parameter type
      if (formData[param.name]) {
        if (param.type === 'number') {
          const value = Number(formData[param.name]);
          if (isNaN(value)) {
            newErrors[param.name] = `${getParameterLabel(param.name, t)} debe ser un número válido`;
          }
        }

        if (param.name === 'animal_ids' && formData[param.name]) {
          // Validate animal IDs format (comma-separated)
          const ids = formData[param.name].split(',').map(id => id.trim());
          if (ids.some(id => !id)) {
            newErrors[param.name] = 'Formato inválido. Use IDs separados por comas (ej: A001,A002)';
          }
        }
      }
    });

    // Validate date range
    if (formData.date_from && formData.date_to) {
      if (new Date(formData.date_from) > new Date(formData.date_to)) {
        newErrors.date_range = t("reports.invalidDateRange");
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Set default values and convert boolean strings to actual booleans
    const params: ReportRequest = {
      date_from: formData.date_from || '',
      date_to: formData.date_to || '',
      period: formData.period || 'daily',
      format: 'pdf', // Always PDF as requested
    };

    // Add other parameters, converting boolean strings to actual booleans
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== 'date_from' && key !== 'date_to' && key !== 'period' && key !== 'format') {
        if (isBooleanParameter(key)) {
          (params as any)[key] = value === 'true';
        } else {
          (params as any)[key] = value;
        }
      }
    });

    onGenerate(reportDefinition.id, params);
    setFormData({});
    setErrors({});
  };

  const handleClose = () => {
    setFormData({});
    setErrors({});
    onOpenChange(false);
  };

  // Helper function to get local date in YYYY-MM-DD format
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const setQuickDateRange = (range: 'lastWeek' | 'lastMonth' | 'last3Months' | 'thisYear') => {
    const today = new Date();
    const startDate = new Date();

    switch (range) {
      case 'lastWeek':
        startDate.setDate(today.getDate() - 7);
        break;
      case 'lastMonth':
        startDate.setMonth(today.getMonth() - 1);
        break;
      case 'last3Months':
        startDate.setMonth(today.getMonth() - 3);
        break;
      case 'thisYear':
        startDate.setMonth(0);
        startDate.setDate(1);
        break;
    }

    setFormData(prev => ({
      ...prev,
      date_from: getLocalDateString(startDate),
      date_to: getLocalDateString(today)
    }));
  };

  if (!reportDefinition) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("reports.parametersTitle")}</DialogTitle>
          <DialogDescription>
            {reportDefinition.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Quick date range buttons */}
          <div className="space-y-2">
            <Label>{t("reports.selectPeriod")}</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickDateRange('lastWeek')}
                type="button"
              >
                {t("reports.lastWeek")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickDateRange('lastMonth')}
                type="button"
              >
                {t("reports.lastMonth")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickDateRange('last3Months')}
                type="button"
              >
                {t("reports.last3Months")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickDateRange('thisYear')}
                type="button"
              >
                {t("reports.thisYear")}
              </Button>
            </div>
          </div>

          {/* Dynamic parameters */}
          {reportDefinition.parameters.map(param => {
            // Skip format parameter as we always use PDF
            if (param.name === 'format') return null;

            return (
              <div key={param.name} className="space-y-2">
                {!isBooleanParameter(param.name) && (
                  <Label htmlFor={param.name}>
                    {getParameterLabel(param.name, t)}
                    {param.required && " *"}
                  </Label>
                )}

              {param.type === 'date' && (
                <Input
                  id={param.name}
                  type="date"
                  value={formData[param.name] || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    [param.name]: e.target.value
                  }))}
                  className={errors[param.name] ? "border-destructive" : ""}
                />
              )}

              {param.type === 'select' && param.options && (
                <Select
                  value={formData[param.name] || param.default_value}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    [param.name]: value
                  }))}
                >
                  <SelectTrigger className={errors[param.name] ? "border-destructive" : ""}>
                    <SelectValue placeholder={t("reports.selectOption")} />
                  </SelectTrigger>
                  <SelectContent>
                    {param.options.map(option => (
                      <SelectItem key={option} value={option}>
                        {getSelectOptionLabel(param.name, option, t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Checkbox for boolean parameters */}
              {isBooleanParameter(param.name) && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={param.name}
                    checked={formData[param.name] === 'true'}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      [param.name]: checked ? 'true' : 'false'
                    }))}
                  />
                  <Label
                    htmlFor={param.name}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {getParameterLabel(param.name, t)}
                    {param.required && " *"}
                  </Label>
                </div>
              )}

              {param.type === 'text' && !isBooleanParameter(param.name) && (
                <Input
                  id={param.name}
                  type="text"
                  value={formData[param.name] || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    [param.name]: e.target.value
                  }))}
                  placeholder={getParameterPlaceholder(param.name)}
                  className={errors[param.name] ? "border-destructive" : ""}
                />
              )}

              {param.type === 'number' && !isBooleanParameter(param.name) && (
                <Input
                  id={param.name}
                  type="number"
                  value={formData[param.name] || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    [param.name]: e.target.value
                  }))}
                  placeholder={getParameterPlaceholder(param.name)}
                  className={errors[param.name] ? "border-destructive" : ""}
                />
              )}

              {errors[param.name] && (
                <p className="text-sm text-destructive">{errors[param.name]}</p>
              )}
              </div>
            );
          }).filter(Boolean)}

          {errors.date_range && (
            <p className="text-sm text-destructive">{errors.date_range}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isGenerating}>
            {t("reports.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isGenerating}>
            {isGenerating ? t("reports.generating") : t("reports.generate")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
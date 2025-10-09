import { useState, useEffect } from "react";
import { Camera, Upload, Loader2, CheckCircle, AlertCircle, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface OcrResult {
  animalId: string | null;
  animalName: string;
  liters: number;
  matchConfidence: number;
  extractedName: string;
  suggestions?: Array<{ animalId: string; name: string; similarity: number }>;
}

interface OcrPhotoUploadProps {
  onResultsProcessed: (results: OcrResult[]) => void;
  disabled?: boolean;
  resetKey?: string | number;
}

export default function OcrPhotoUpload({ onResultsProcessed, disabled, resetKey }: OcrPhotoUploadProps) {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState<number | null>(null);
  const [unmatchedCount, setUnmatchedCount] = useState<number>(0);
  const [unmatchedNames, setUnmatchedNames] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError(t('milk.ocrInvalidImage'));
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError(t('milk.ocrImageTooLarge'));
      return;
    }

    setSelectedFile(file);
    setError(null);
    setProcessedCount(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleProcess = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Step 1: Get presigned upload URL
      const { getOcrUploadUrl, uploadToS3, processOcrImage } = await import('@/services/milkProductions');

      const presignedData = await getOcrUploadUrl(selectedFile.type);

      // Step 2: Upload to S3
      const storageKey = await uploadToS3(presignedData, selectedFile);

      // Step 3: Process OCR with OpenAI
      const ocrResponse = await processOcrImage({
        storage_key: storageKey,
        mime_type: selectedFile.type,
        size_bytes: selectedFile.size,
      });

      // Convert backend response to frontend format
      const results: OcrResult[] = ocrResponse.matched.map(match => ({
        animalId: match.animal_id,
        animalName: match.animal_name,
        liters: match.liters,
        matchConfidence: match.match_confidence,
        extractedName: match.extracted_name,
      }));

      // Track unmatched for user feedback
      setUnmatchedCount(ocrResponse.unmatched.length);
      setUnmatchedNames(ocrResponse.unmatched.map(u => u.extracted_name));

      setProcessedCount(results.length);
      onResultsProcessed(results);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage.includes('OpenAI')
        ? t('milk.ocrProcessingError')
        : `Error: ${errorMessage}`
      );
      console.error('OCR processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setProcessedCount(null);
    setUnmatchedCount(0);
    setUnmatchedNames([]);
    setError(null);
  };

  // Clear component state when resetKey changes (e.g., after successful bulk submit)
  useEffect(() => {
    handleClear();
    const el = document.getElementById('ocr-file-input') as HTMLInputElement | null;
    if (el) {
      try { el.value = ''; } catch (e) { 
        console.warn('Failed to reset file input value', e);
      }
    }
     
  }, [resetKey]);

  return (
    <Card className="border-dashed border-2">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">{t('milk.ocrUploadTitle')}</h3>
          </div>

          {/* File input */}
          {!previewUrl && (
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="ocr-file-input"
                disabled={disabled}
              />
              <label
                htmlFor="ocr-file-input"
                className="flex flex-col items-center gap-2 cursor-pointer"
              >
                <Upload className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-center">
                  {t('milk.ocrSelectPhoto')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('milk.ocrFileTypes')}
                </p>
              </label>
            </div>
          )}

          {/* Preview */}
          {previewUrl && (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={previewUrl}
                  alt={t('milk.previewAlt')}
                  className="w-full h-auto max-h-64 object-contain rounded-lg border"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleClear}
                  disabled={isProcessing}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {processedCount === null ? (
                <Button
                  onClick={handleProcess}
                  disabled={isProcessing || disabled}
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('milk.ocrProcessing')}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {t('milk.ocrProcessWithAI')}
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-2">
                  {processedCount > 0 && (
                    <Alert className="border-green-200 bg-green-50 text-green-900">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        ✓ {t('milk.ocrRecordsLoaded').replace('{count}', processedCount.toString())}
                      </AlertDescription>
                    </Alert>
                  )}
                  {unmatchedCount > 0 && (
                    <Alert className="border-yellow-200 bg-yellow-50 text-yellow-900">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        <p className="font-medium">⚠️ {t('milk.ocrUnmatchedSummary').replace('{count}', unmatchedCount.toString())}</p>
                        {/* Intentionally not listing all names to keep card compact */}
                      </AlertDescription>
                    </Alert>
                  )}
                  {processedCount === 0 && unmatchedCount === 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{t('milk.ocrNoRecordsFound')}</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

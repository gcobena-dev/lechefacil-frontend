import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import {
  CERTIFICATE_ACCEPT,
  type CertificateFile,
  deleteCertificateFile,
  listCertificateFiles,
  uploadCertificateFiles,
} from "@/services/animalCertificates";

interface CertificateFilesProps {
  animalId: string;
  /** Viewers can open the scans but not add or remove them. */
  canEdit?: boolean;
}

const MAX_FILE_MB = 15;

const isImage = (mimeType: string) => mimeType.startsWith("image/");

const formatSize = (bytes?: number | null) => {
  if (!bytes) return null;
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
};

/**
 * The scan of the paper certificate, image or PDF.
 *
 * Several files are allowed on purpose: a certificate is often photographed
 * front and back, and registries hand out more than one sheet.
 */
export default function CertificateFiles({
  animalId,
  canEdit = true,
}: CertificateFilesProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { data: files = [], isLoading } = useQuery({
    queryKey: ["animal-certificate-files", animalId],
    queryFn: () => listCertificateFiles(animalId),
    enabled: !!animalId,
  });

  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: ["animal-certificate-files", animalId],
    });

  const uploadMutation = useMutation({
    mutationFn: (selected: File[]) => uploadCertificateFiles(animalId, selected),
    onSuccess: (uploaded) => {
      void refresh();
      toast({
        title: t("animals.certificateFileUploaded"),
        description: `${uploaded.length}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("animals.certificateFileUploadError"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (fileId: string) => deleteCertificateFile(animalId, fileId),
    onSuccess: () => {
      void refresh();
      toast({ title: t("animals.certificateFileDeleted") });
    },
    onError: (error: Error) => {
      toast({
        title: t("animals.certificateFileDeleteError"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const selected = Array.from(list);

    // Checked here as well as on the server so a farmer on a slow connection
    // is told before the upload starts, not after it fails.
    const tooBig = selected.find((f) => f.size > MAX_FILE_MB * 1024 * 1024);
    if (tooBig) {
      toast({
        title: t("animals.certificateFileTooLarge").replace(
          "{max}",
          String(MAX_FILE_MB)
        ),
        description: tooBig.name,
        variant: "destructive",
      });
      return;
    }

    const accepted = CERTIFICATE_ACCEPT.split(",");
    const unsupported = selected.find((f) => !accepted.includes(f.type));
    if (unsupported) {
      toast({
        title: t("animals.certificateFileUnsupported"),
        description: unsupported.name,
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(selected);
  };

  const renderFile = (file: CertificateFile) => (
    <Card key={file.id} className="relative group overflow-hidden">
      <a
        href={file.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
        title={file.title ?? undefined}
      >
        {isImage(file.mime_type) ? (
          <img
            src={file.url}
            alt={file.title ?? t("animals.certificate")}
            className="w-full aspect-[3/4] object-cover bg-muted"
            loading="lazy"
          />
        ) : (
          <div className="w-full aspect-[3/4] flex flex-col items-center justify-center gap-2 bg-muted">
            <FileText className="h-10 w-10 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">PDF</span>
          </div>
        )}
      </a>

      {canEdit && (
        <button
          type="button"
          onClick={() => deleteMutation.mutate(file.id)}
          disabled={deleteMutation.isPending}
          aria-label={t("animals.certificateFileDelete")}
          // Always visible on touch, where there is no hover to reveal it.
          className="absolute top-2 right-2 rounded-full bg-destructive p-1.5 text-destructive-foreground shadow-lg opacity-80 hover:opacity-100 transition-opacity"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}

      <div className="p-2 bg-card">
        <p className="text-xs truncate" title={file.title ?? undefined}>
          {file.title || t("animals.certificate")}
        </p>
        {formatSize(file.size_bytes) && (
          <p className="text-xs text-muted-foreground/70">
            {formatSize(file.size_bytes)}
          </p>
        )}
      </div>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">
          {t("animals.certificateFiles")}
        </h4>
        {canEdit && files.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={uploadMutation.isPending}
          >
            {uploadMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {t("animals.certificateFileAdd")}
          </Button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={CERTIFICATE_ACCEPT}
        multiple
        onChange={(e) => {
          handleFiles(e.target.files);
          // Cleared so re-picking the same file fires change again.
          e.target.value = "";
        }}
        className="hidden"
      />

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : files.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {files.map(renderFile)}
        </div>
      ) : canEdit ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary"
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            {uploadMutation.isPending ? (
              <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
            ) : (
              <Upload className="h-10 w-10 text-muted-foreground" />
            )}
            <p className="text-sm text-muted-foreground">
              {t("animals.certificateFileDropHere")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("animals.certificateFileHint").replace(
                "{max}",
                String(MAX_FILE_MB)
              )}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t("animals.certificateNoFiles")}
        </p>
      )}
    </div>
  );
}

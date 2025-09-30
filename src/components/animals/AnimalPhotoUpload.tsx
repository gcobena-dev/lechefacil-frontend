import { useState, useRef } from "react";
import { X, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";

export interface PhotoFile {
  id: string;
  file: File;
  preview: string;
}

interface AnimalPhotoUploadProps {
  photos: PhotoFile[];
  onPhotosChange: (photos: PhotoFile[]) => void;
  maxPhotos?: number;
}

export function AnimalPhotoUpload({
  photos,
  onPhotosChange,
  maxPhotos = 6,
}: AnimalPhotoUploadProps) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const remainingSlots = maxPhotos - photos.length;
    const filesToAdd = Array.from(files).slice(0, remainingSlots);

    const newPhotos: PhotoFile[] = filesToAdd
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
      }));

    onPhotosChange([...photos, ...newPhotos]);
  };

  const handleRemovePhoto = (id: string) => {
    const photoToRemove = photos.find((p) => p.id === id);
    if (photoToRemove) {
      URL.revokeObjectURL(photoToRemove.preview);
    }
    onPhotosChange(photos.filter((p) => p.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {photos.length < maxPhotos && (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors duration-200
            ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-gray-300 hover:border-primary"
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-10 w-10 text-gray-400" />
            <p className="text-sm text-gray-600">
              {t('animals.dragPhotosHere')}
            </p>
            <p className="text-xs text-gray-500">
              {t('animals.maxPhotos').replace('{max}', String(maxPhotos)).replace('{current}', String(photos.length))}
            </p>
          </div>
        </div>
      )}

      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {photos.map((photo, index) => (
            <Card key={photo.id} className="relative group overflow-hidden">
              <div className="aspect-square relative">
                <img
                  src={photo.preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {index === 0 && (
                  <div className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded">
                    {t('animals.primaryPhoto')}
                  </div>
                )}
                <button
                  onClick={() => handleRemovePhoto(photo.id)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-2 bg-white">
                <p className="text-xs text-gray-500 truncate">
                  {photo.file.name}
                </p>
                <p className="text-xs text-gray-400">
                  {(photo.file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
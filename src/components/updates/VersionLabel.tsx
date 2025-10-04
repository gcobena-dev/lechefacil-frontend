import { useEffect, useState } from 'react';
import { updateService } from '@/services/updateService';
import { Capacitor } from '@capacitor/core';

interface VersionLabelProps {
  variant?: 'default' | 'small';
  className?: string;
}

export const VersionLabel = ({ variant = 'default', className = '' }: VersionLabelProps) => {
  const [version, setVersion] = useState<string>('');
  const [bundleVersion, setBundleVersion] = useState<string | null>(null);

  useEffect(() => {
    const loadVersion = async () => {
      // Get base version from package.json
      const baseVersion = updateService.getCurrentVersion();
      setVersion(baseVersion);

      // If on native platform, check if running from a bundle
      if (Capacitor.isNativePlatform()) {
        try {
          const { CapacitorUpdater } = await import("@capgo/capacitor-updater");
          const current = await CapacitorUpdater.current();

          // If running from bundle (not built-in), show bundle version
          if (current.bundle?.id && !current.native) {
            setBundleVersion(current.bundle.version || null);
          }
        } catch (error) {
          console.error('Failed to get bundle version:', error);
        }
      }
    };

    loadVersion();
  }, []);

  const displayVersion = bundleVersion || version;

  if (variant === 'small') {
    return (
      <span className={`text-xs text-muted-foreground ${className}`}>
        v{displayVersion}
      </span>
    );
  }

  return (
    <div className={`text-sm text-muted-foreground ${className}`}>
      <span>v{displayVersion}</span>
      {bundleVersion && (
        <span className="ml-1 text-xs opacity-70">(OTA)</span>
      )}
    </div>
  );
};

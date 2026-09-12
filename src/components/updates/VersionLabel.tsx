import { useEffect, useState } from 'react';
import { updateService } from '@/services/updateService';
import { Capacitor } from '@capacitor/core';

interface VersionLabelProps {
  variant?: 'default' | 'small';
  className?: string;
}

export const VersionLabel = ({ variant = 'default', className = '' }: VersionLabelProps) => {
  const [version, setVersion] = useState<string>('');
  const [isOta, setIsOta] = useState(false);
  // Versión del APK instalado. Desde que existe el gate de versión nativa puede
  // ir por detrás del bundle (APK 983 corriendo bundle 985), y sin verla no hay
  // forma de saber por qué una función nueva no responde: fue exactamente lo
  // que escondió el bug del botón atrás durante meses.
  const [nativeVersion, setNativeVersion] = useState<string | null>(null);

  useEffect(() => {
    const loadVersion = async () => {
      // Viaja compilada dentro del bundle, así que ya es la versión del bundle
      // que está corriendo, venga de fábrica o de una actualización OTA.
      setVersion(updateService.getCurrentVersion());

      if (!Capacitor.isNativePlatform()) return;

      try {
        const { CapacitorUpdater } = await import("@capgo/capacitor-updater");
        const current = await CapacitorUpdater.current();

        // `current.native` es la versión del APK y siempre viene; la condición
        // anterior era `!current.native`, que nunca se cumplía, así que esto no
        // se marcaba jamás. Lo que distingue un bundle OTA es su id.
        setIsOta(!!current.bundle?.id && current.bundle.id !== 'builtin');
        setNativeVersion(current.native || null);
      } catch (error) {
        console.error('Failed to get bundle version:', error);
      }
    };

    loadVersion();
  }, []);

  const displayVersion = version;
  // Sólo se muestra cuando difiere: en un equipo al día sería ruido.
  const showNative = !!nativeVersion && nativeVersion !== version;

  if (variant === 'small') {
    return (
      <span
        className={`text-xs text-muted-foreground ${className}`}
        title={nativeVersion ? `APK ${nativeVersion}` : undefined}
      >
        v{displayVersion}
        {showNative && (
          <span className="ml-1 opacity-70">· APK {nativeVersion}</span>
        )}
      </span>
    );
  }

  return (
    <div className={`text-sm text-muted-foreground ${className}`}>
      <span>v{displayVersion}</span>
      {isOta && <span className="ml-1 text-xs opacity-70">(OTA)</span>}
      {showNative && (
        <span className="ml-1 text-xs opacity-70">· APK {nativeVersion}</span>
      )}
    </div>
  );
};

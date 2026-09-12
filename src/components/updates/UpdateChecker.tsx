import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  updateService,
  type NativeUpdateRequired,
} from '@/services/updateService';
import { Capacitor } from '@capacitor/core';
import { UpdateLoadingOverlay } from './UpdateLoadingOverlay';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const UpdateChecker = () => {
  const { t } = useTranslation();
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [installedVersion, setInstalledVersion] = useState('');
  // El shell instalado no puede correr el bundle publicado: hay que instalar un
  // APK, no descargar nada. No se puede descartar con un "después" porque la
  // app se queda con funciones muertas hasta que se instale.
  const [nativeUpdate, setNativeUpdate] = useState<NativeUpdateRequired | null>(null);

  useEffect(() => {
    // Only run on native platforms (not web)
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // Check if we just updated (show success dialog)
    const checkIfJustUpdated = async () => {
      try {
        const { CapacitorUpdater } = await import("@capgo/capacitor-updater");
        const current = await CapacitorUpdater.current();

        // `current.native` es la versión del APK, siempre presente, así que la
        // condición anterior (`!current.native`) nunca se cumplía y el aviso de
        // "actualización completada" no salía nunca. Lo que distingue a un
        // bundle OTA del que viene de fábrica es su id.
        const isOtaBundle =
          !!current.bundle?.id && current.bundle.id !== 'builtin';
        if (isOtaBundle) {
          const version = current.bundle.version || updateService.getCurrentVersion();
          console.log('📱 Running updated version:', version);

          // Show success dialog after a short delay
          setTimeout(() => {
            setInstalledVersion(version);
            setShowSuccessDialog(true);
          }, 1000);
        }
      } catch (error) {
        console.error('Failed to check current bundle:', error);
      }
    };

    // Check for just-updated state first
    checkIfJustUpdated();

    const checkForUpdates = async () => {
      try {
        console.log('🔍 Checking for updates...');
        const { update, nativeUpdate: native } = await updateService.checkForUpdates();

        if (native) {
          console.warn(
            `📵 APK ${native.installedBuild ?? 'desconocido'} es anterior al mínimo ` +
              `${native.minNativeBuild}: se requiere instalar desde la tienda.`
          );
          setNativeUpdate(native);
          return;
        }

        if (update) {
          console.log('📦 Update available:', update.version);

          // Show native confirm dialog
          const shouldUpdate = confirm(
            t('updates.updateMessage', {
              version: update.version,
              changelog: update.changelog || t('updates.newVersionAvailable'),
            })
          );

          if (shouldUpdate) {
            console.log('🔄 User accepted update');

            // Block UI with overlay
            setIsUpdating(true);
            setUpdateMessage(t('updates.downloading'));

            try {
              // Download and apply update
              setUpdateMessage(t('updates.downloading'));
              const success = await updateService.downloadAndInstall(update);

              if (success) {
                setUpdateMessage(t('updates.updateSuccess'));
                // App should reload automatically, but just in case:
                setTimeout(() => {
                  window.location.reload();
                }, 1000);
              } else {
                setIsUpdating(false);
                alert(t('updates.updateError'));
              }
            } catch (error) {
              console.error('❌ Update failed:', error);
              setIsUpdating(false);
              alert(t('updates.updateError') + '\n\nError: ' + String(error));
            }
          } else {
            console.log('⏭️  User declined update');
          }
        } else {
          console.log('✅ Already on latest version');
        }
      } catch (error) {
        console.error('❌ Error checking for updates:', error);
        // Silently fail - don't bother the user if update check fails
      }
    };

    // Check on mount with slight delay to ensure app is ready
    const timer = setTimeout(() => {
      checkForUpdates();
    }, 2000);

    return () => clearTimeout(timer);
  }, [t]);

  // Render overlay when updating and success dialog
  return (
    <>
      {isUpdating && <UpdateLoadingOverlay message={updateMessage} />}

      {/* Sin botón de cierre ni onOpenChange: mientras el APK sea viejo el
          bundle no se puede instalar, así que ofrecer "más tarde" sólo deja al
          usuario con una app a medias sin saberlo. */}
      <AlertDialog open={!!nativeUpdate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('updates.nativeUpdateTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('updates.nativeUpdateMessage', {
                version: nativeUpdate?.version ?? '',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {nativeUpdate?.apkUrl && (
              <AlertDialogAction
                onClick={() => {
                  // Abre en el navegador del sistema: la descarga de un APK
                  // dentro del WebView no dispara el instalador.
                  window.open(nativeUpdate.apkUrl as string, '_blank');
                }}
              >
                {t('updates.nativeUpdateAction')}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('updates.updateInstalledTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('updates.updateInstalledSuccess', { version: installedVersion })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowSuccessDialog(false)}>
              {t('common.ok')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

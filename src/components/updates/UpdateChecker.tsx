import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { updateService } from '@/services/updateService';
import { Capacitor } from '@capacitor/core';

export const UpdateChecker = () => {
  const { t } = useTranslation();

  useEffect(() => {
    // Only run on native platforms (not web)
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const checkForUpdates = async () => {
      try {
        const update = await updateService.checkForUpdates();

        if (update) {
          // Show native confirm dialog
          const shouldUpdate = confirm(
            t('updates.updateMessage', {
              version: update.version,
              changelog: update.changelog || t('updates.newVersionAvailable'),
            })
          );

          if (shouldUpdate) {
            // Show downloading message
            const success = await updateService.downloadAndInstall(update);

            if (!success) {
              alert(t('updates.updateError'));
            }
          }
        }
      } catch (error) {
        console.error('Error checking for updates:', error);
        // Silently fail - don't bother the user if update check fails
      }
    };

    // Check on mount
    checkForUpdates();
  }, [t]);

  // This component doesn't render anything
  return null;
};

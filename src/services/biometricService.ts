import { NativeBiometric, BiometryType } from '@capgo/capacitor-native-biometric';
import { Capacitor } from '@capacitor/core';

export class BiometricService {
  /**
   * Verifica si el dispositivo soporta biometría
   */
  async isAvailable(): Promise<{
    isAvailable: boolean;
    biometryType?: BiometryType;
    errorCode?: number;
  }> {
    // Solo funciona en plataformas nativas
    if (!Capacitor.isNativePlatform()) {
      return { isAvailable: false };
    }

    try {
      const result = await NativeBiometric.isAvailable();
      return {
        isAvailable: result.isAvailable,
        biometryType: result.biometryType,
      };
    } catch (error: any) {
      return { isAvailable: false, errorCode: error.code };
    }
  }

  /**
   * Verifica credenciales guardadas
   */
  async hasCredentials(server: string): Promise<boolean> {
    try {
      const credentials = await NativeBiometric.getCredentials({
        server,
      });
      return !!credentials.username && !!credentials.password;
    } catch (error) {
      return false;
    }
  }

  /**
   * Guarda credenciales de forma segura
   */
  async saveCredentials(
    server: string,
    username: string,
    password: string
  ): Promise<void> {
    await NativeBiometric.setCredentials({
      server,
      username,
      password,
    });
  }

  /**
   * Autentica con biometría y recupera credenciales
   */
  async authenticateAndGetCredentials(
    server: string,
    options?: {
      reason?: string;
      title?: string;
      subtitle?: string;
      description?: string;
      negativeButtonText?: string;
    }
  ): Promise<{
    username: string;
    password: string;
  } | null> {
    try {
      // Verificar que el usuario puede autenticarse
      await NativeBiometric.verifyIdentity({
        reason: options?.reason || 'Inicia sesión con tu huella dactilar',
        title: options?.title || 'Autenticación biométrica',
        subtitle: options?.subtitle || 'Coloca tu dedo en el sensor',
        description: options?.description || 'Usa tu huella para acceder a LecheFácil',
        negativeButtonText: options?.negativeButtonText || 'Cancelar',
        maxAttempts: 3,
      });

      // Si llegamos aquí, la autenticación fue exitosa
      // Recuperar credenciales
      const credentials = await NativeBiometric.getCredentials({
        server,
      });

      return {
        username: credentials.username,
        password: credentials.password,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Elimina credenciales guardadas
   */
  async deleteCredentials(server: string): Promise<void> {
    try {
      await NativeBiometric.deleteCredentials({
        server,
      });
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Obtiene el tipo de biometría disponible
   */
  getBiometryTypeName(type: BiometryType): string {
    switch (type) {
      case BiometryType.TOUCH_ID:
        return 'Touch ID';
      case BiometryType.FACE_ID:
        return 'Face ID';
      case BiometryType.FINGERPRINT:
        return 'Huella dactilar';
      case BiometryType.FACE_AUTHENTICATION:
        return 'Reconocimiento facial';
      case BiometryType.IRIS_AUTHENTICATION:
        return 'Reconocimiento de iris';
      default:
        return 'Biometría';
    }
  }
}

export const biometricService = new BiometricService();

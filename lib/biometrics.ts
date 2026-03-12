import * as LocalAuthentication from 'expo-local-authentication';

export interface BiometricResult {
  success: boolean;
  error?: string;
  biometricType?: string;
}

export const checkBiometricAvailability = async (): Promise<{
  available: boolean;
  biometricType: string | null;
  error?: string;
}> => {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
    
    if (!hasHardware) {
      return {
        available: false,
        biometricType: null,
        error: 'Biometric hardware not available on this device',
      };
    }

    let biometricType = null;
    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      biometricType = 'Face ID';
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      biometricType = 'Touch ID / Fingerprint';
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      biometricType = 'Iris Recognition';
    }

    return {
      available: true,
      biometricType,
    };
  } catch (error: any) {
    return {
      available: false,
      biometricType: null,
      error: error.message || 'Failed to check biometric availability',
    };
  }
};

export const authenticateWithBiometrics = async (
  promptMessage: string = 'Authenticate to continue'
): Promise<BiometricResult> => {
  try {
    const { available, biometricType, error } = await checkBiometricAvailability();
    
    if (!available) {
      return {
        success: false,
        error: error || 'Biometric authentication not available',
      };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: 'Use Passcode',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

    return {
      success: result.success,
      biometricType: biometricType || undefined,
      error: result.success ? undefined : 'Authentication failed',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Biometric authentication failed',
    };
  }
};

export const checkIfBiometricsEnrolled = async (): Promise<boolean> => {
  try {
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  } catch (error) {
    return false;
  }
};

export const getBiometricTypeDisplay = (type: string): string => {
  switch (type) {
    case 'Face ID':
      return 'Face ID';
    case 'Touch ID / Fingerprint':
      return 'Touch ID';
    case 'Iris Recognition':
      return 'Iris Scan';
    default:
      return 'Biometric Authentication';
  }
};

import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { formatGhanaPhone } from '../../lib/constants';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { setMockProfile, setMockSession } from '../../lib/mockAuth';

export default function PhoneOTPScreen() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [mockOtp, setMockOtp] = useState('');
  const router = useRouter();

  const handleSendOTP = async () => {
    if (!phone) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = formatGhanaPhone(phone);

      if (!isSupabaseConfigured) {
        const generated = Math.floor(1000 + Math.random() * 9000).toString();
        setMockOtp(generated);
        Alert.alert('OTP Sent', `Use ${generated} to verify (mock).`);
        setStep('otp');
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) throw error;
      setStep('otp');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 4 || otp.length > 8) {
      Alert.alert('Error', 'Please enter a valid verification code');
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = formatGhanaPhone(phone);

      if (!isSupabaseConfigured) {
        if (mockOtp && otp !== mockOtp) {
          Alert.alert('Error', 'Invalid OTP');
          return;
        }
        await setMockProfile({ phone: formattedPhone });
        await setMockSession('phone@hommie.com');
        router.replace('/(tabs)/home');
        return;
      }

      const { error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: 'sms',
      });
      if (error) throw error;
      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!phone) {
      Alert.alert('Error', 'Please enter your phone number');
      setStep('phone');
      return;
    }
    await handleSendOTP();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {step === 'phone' ? 'Forgot Password' : 'Verify Code'}
            </Text>
            {step === 'phone' ? (
              <Text style={styles.subtitle}>
                Enter your phone number and we will send you a verification code.
              </Text>
            ) : (
              <>
                <Text style={styles.subtitle}>Please enter the code we just sent to your phone</Text>
                <Text style={styles.emailText}>{formatGhanaPhone(phone)}</Text>
              </>
            )}
          </View>

          <View style={styles.form}>
            {step === 'phone' && (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Phone Number</Text>
                  <View style={styles.phoneInputContainer}>
                    <Text style={styles.countryCode}>+233</Text>
                    <TextInput
                      style={styles.phoneInput}
                      placeholder="24 000 0000"
                      placeholderTextColor="#999"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleSendOTP}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>
                    {loading ? 'Sending...' : 'Send code'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {step === 'otp' && (
              <>
              <View style={styles.otpContainer}>
                {[0, 1, 2, 3].map((index) => (
                  <TextInput
                    key={index}
                    style={styles.otpInput}
                    placeholder="-"
                    placeholderTextColor="#999"
                    value={otp[index] || ''}
                    onChangeText={(text) => {
                      const newOtp = otp.split('');
                      newOtp[index] = text;
                      setOtp(newOtp.join('').slice(0, 4));
                    }}
                    keyboardType="number-pad"
                    maxLength={1}
                    textAlign="center"
                  />
                ))}
              </View>

              <View style={styles.resendContainer}>
                <Text style={styles.resendQuestion}>Didn't receive OTP?</Text>
                <TouchableOpacity onPress={handleResendOTP}>
                  <Text style={styles.resendLink}>Resend code</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleVerifyOTP}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Verifying...' : 'Verify'}
                </Text>
              </TouchableOpacity>
            </>
          )}

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  logo: {
    fontSize: 36,
    fontWeight: '700',
    color: '#4560F7',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  emailText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#F9F9F9',
    alignItems: 'center',
  },
  countryCode: {
    fontSize: 16,
    color: '#666',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  otpInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 16,
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    backgroundColor: '#FFF',
  },
  button: {
    backgroundColor: '#4560F7',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    gap: 4,
  },
  resendQuestion: {
    fontSize: 14,
    color: '#999',
  },
  resendLink: {
    fontSize: 14,
    color: '#4560F7',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  backButton: {
    alignSelf: 'center',
    marginTop: 'auto',
  },
  backText: {
    fontSize: 14,
    color: '#666',
  },
});


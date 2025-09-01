// app/reset-password/ResetPasswordForm.tsx
'use client';

import { useState, useEffect, JSX } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronRight, Eye, EyeOff, Lock, Shield, CheckCircle, ArrowLeft } from 'lucide-react';

interface ResetFormData {
  email: string;
  otp: string[];
  newPassword: string;
  confirmPassword: string;
}

interface PasswordStrength {
  score: number;
  text: string;
  color: string;
}

export default function ResetPasswordForm(): JSX.Element {
  const [formData, setFormData] = useState<ResetFormData>({
    email: '',
    otp: ['', '', '', '', '', ''],
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setFormData(prev => ({ ...prev, email: decodeURIComponent(emailParam) }));
    }
  }, [searchParams]);

  const handleOtpChange = (index: number, value: string): void => {
    if (value.length > 1 || !/^\d*$/.test(value)) return;
    
    const newOtp = [...formData.otp];
    newOtp[index] = value;
    setFormData(prev => ({ ...prev, otp: newOtp }));
    setError('');

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`) as HTMLInputElement;
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Backspace' && !formData.otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
        const newOtp = [...formData.otp];
        newOtp[index - 1] = '';
        setFormData(prev => ({ ...prev, otp: newOtp }));
      }
    }
  };

  const handleVerifyOTP = async (): Promise<void> => {
    const otpCode = formData.otp.join('');
    
    if (!formData.email || otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          otp: otpCode,
          type: 'password_reset'
        })
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setCurrentStep(2);
      } else {
        setError('Invalid or expired reset code');
        setFormData(prev => ({ ...prev, otp: ['', '', '', '', '', ''] }));
        const firstInput = document.getElementById('otp-0') as HTMLInputElement;
        firstInput?.focus();
      }
    } catch (_error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!formData.newPassword || !formData.confirmPassword) {
      setError('Please fill in both password fields');
      setIsLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          otp: formData.otp.join(''),
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/login?reset=success'), 3000);
      } else {
        setError(data.error || 'Password reset failed');
      }
    } catch (_error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (password: string): PasswordStrength => {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const strengthMap: Record<number, { text: string; color: string }> = {
      0: { text: 'Very weak', color: '#ef4444' },
      1: { text: 'Weak', color: '#ef4444' },
      2: { text: 'Fair', color: '#f59e0b' },
      3: { text: 'Good', color: '#3b82f6' },
      4: { text: 'Strong', color: '#10b981' },
      5: { text: 'Very strong', color: '#10b981' }
    };

    return { score: Math.min(score, 4), ...strengthMap[score] };
  };

  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 30%, #3730a3 60%, #1e1b4b 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <CheckCircle size={80} style={{ color: '#10b981', margin: '0 auto 32px' }} />
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px' }}>
            Password Reset Successful!
          </h1>
          <p style={{ fontSize: '18px', color: '#cbd5e1', marginBottom: '24px' }}>
            Your password has been successfully reset.
          </p>
          <p style={{ fontSize: '16px', color: '#94a3b8' }}>
            Redirecting you to login...
          </p>
        </div>
      </div>
    );
  }

  const passwordStrength = getPasswordStrength(formData.newPassword);
  const isPasswordFormValid = formData.newPassword && formData.confirmPassword && formData.newPassword === formData.confirmPassword;

  return (
    <>
      <style jsx>{`
        @keyframes rotate {
          from { transform: rotate(45deg); }
          to { transform: rotate(405deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .rotating { animation: rotate 4s linear infinite; }
        .pulsing { animation: pulse 3s ease-in-out infinite; }
        .bouncing { animation: bounce 2s infinite; }
        
        .delay-1 { animation-delay: 1s; }
        .delay-2 { animation-delay: 2s; }
        
        .glassmorphism {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .input-focus:focus {
          border-color: rgba(96, 165, 250, 0.6) !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3) !important;
          outline: none;
        }
        
        .otp-input:focus {
          border-color: rgba(96, 165, 250, 0.6) !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3) !important;
          outline: none;
        }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 30%, #3730a3 60%, #1e1b4b 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px', position: 'relative', overflow: 'hidden'
      }}>
        {/* Background Elements */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div className="pulsing" style={{
            position: 'absolute', top: '10%', right: '20%', width: '200px', height: '200px',
            borderRadius: '50%', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.3), transparent)', filter: 'blur(60px)'
          }} />
          <div className="pulsing delay-2" style={{
            position: 'absolute', bottom: '20%', left: '15%', width: '250px', height: '250px',
            borderRadius: '50%', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3), transparent)', filter: 'blur(60px)'
          }} />
          <div className="bouncing" style={{
            position: 'absolute', top: '25%', left: '25%', width: '6px', height: '6px',
            borderRadius: '50%', backgroundColor: 'rgba(110, 231, 183, 0.6)'
          }} />
        </div>

        <div style={{ maxWidth: '500px', width: '100%', position: 'relative', zIndex: 10 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ marginBottom: '32px' }}>
              <div style={{ width: '96px', height: '96px', margin: '0 auto 24px', position: 'relative' }}>
                <div className="rotating" style={{
                  position: 'absolute', inset: 0, background: 'linear-gradient(45deg, #10b981, #3b82f6, #059669)',
                  borderRadius: '20px', transform: 'rotate(12deg)'
                }} />
                <div className="rotating delay-1" style={{
                  position: 'absolute', inset: 0, background: 'linear-gradient(45deg, #059669, #2563eb)',
                  borderRadius: '20px', transform: 'rotate(6deg)'
                }} />
                <div style={{
                  position: 'absolute', inset: '8px', backgroundColor: 'white', borderRadius: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <span style={{
                    fontSize: '32px', fontWeight: 'bold',
                    background: 'linear-gradient(45deg, #059669, #2563eb)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                  }}>MP</span>
                </div>
              </div>
              
              <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', margin: '0 0 16px' }}>
                {currentStep === 1 ? 'Verify Reset Code' : 'Create New Password'}
              </h1>
              <p style={{ color: '#cbd5e1', fontSize: '16px', margin: 0 }}>
                {currentStep === 1 
                  ? 'Enter the 6-digit code sent to your email'
                  : 'Choose a strong password for your account'
                }
              </p>
              {currentStep === 1 && formData.email && (
                <p style={{ color: '#93c5fd', fontSize: '14px', fontWeight: '600', margin: '8px 0 0' }}>
                  {formData.email}
                </p>
              )}
            </div>
          </div>

          {/* Form Container */}
          <div className="glassmorphism" style={{
            borderRadius: '24px', padding: '40px 32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            {/* Security Badge */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                backgroundColor: currentStep === 1 ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                padding: '8px 16px', borderRadius: '9999px',
                border: currentStep === 1 ? '1px solid rgba(147, 197, 253, 0.3)' : '1px solid rgba(110, 231, 183, 0.3)'
              }}>
                <Shield style={{ width: '16px', height: '16px', color: currentStep === 1 ? '#93c5fd' : '#6ee7b7' }} />
                <span style={{ color: currentStep === 1 ? '#dbeafe' : '#a7f3d0', fontSize: '14px', fontWeight: '500' }}>
                  {currentStep === 1 ? 'Code Verification' : 'Password Reset'}
                </span>
              </div>
            </div>

            {error && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(248, 113, 113, 0.3)',
                borderRadius: '12px', padding: '16px', marginBottom: '24px', textAlign: 'center'
              }}>
                <span style={{ color: '#fca5a5', fontSize: '14px' }}>{error}</span>
              </div>
            )}

            {currentStep === 1 ? (
              // Step 1: OTP Verification
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
                  {formData.otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="otp-input"
                      style={{
                        width: '56px', height: '56px', fontSize: '24px', fontWeight: 'bold',
                        textAlign: 'center', backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        border: '2px solid rgba(255, 255, 255, 0.2)', borderRadius: '12px',
                        color: 'white', backdropFilter: 'blur(4px)', transition: 'all 0.3s ease'
                      }}
                      disabled={isLoading}
                    />
                  ))}
                </div>

                <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px', marginBottom: '32px' }}>
                  Code expires in 10 minutes
                </p>

                <button
                  onClick={handleVerifyOTP}
                  disabled={isLoading || formData.otp.some(digit => !digit)}
                  style={{
                    width: '100%', padding: '16px 24px', borderRadius: '12px', border: 'none',
                    fontWeight: '600', fontSize: '16px', color: 'white',
                    background: isLoading || formData.otp.some(digit => !digit)
                      ? 'rgba(107, 114, 128, 0.5)' 
                      : 'linear-gradient(45deg, #3b82f6, #8b5cf6, #6366f1)',
                    cursor: isLoading || formData.otp.some(digit => !digit) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '12px',
                    boxShadow: isLoading || formData.otp.some(digit => !digit) ? 'none' : '0 10px 25px rgba(59, 130, 246, 0.3)'
                  }}
                >
                  {isLoading ? (
                    <>
                      <div style={{
                        width: '20px', height: '20px', border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite'
                      }} />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify Code</span>
                      <ChevronRight size={20} />
                    </>
                  )}
                </button>
              </div>
            ) : (
              // Step 2: New Password Form
              <form onSubmit={handlePasswordReset}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* New Password */}
                  <div>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)', marginBottom: '8px', display: 'block' }}>
                      New Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: 'rgba(255, 255, 255, 0.4)', pointerEvents: 'none' }} />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.newPassword}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, newPassword: e.target.value }));
                          setError('');
                        }}
                        className="input-focus"
                        style={{
                          width: '100%', padding: '16px 56px 16px 48px',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)', border: '2px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '12px', color: 'white', fontSize: '16px', backdropFilter: 'blur(4px)',
                          transition: 'all 0.3s ease', boxSizing: 'border-box'
                        }}
                        placeholder="Create a secure password"
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', color: 'rgba(255, 255, 255, 0.6)',
                          cursor: 'pointer', padding: '4px', transition: 'color 0.2s ease'
                        }}
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>

                    {formData.newPassword && (
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                          {[...Array(4)].map((_, i) => (
                            <div key={i} style={{
                              height: '4px', flex: 1, borderRadius: '2px',
                              backgroundColor: i < passwordStrength.score ? passwordStrength.color : 'rgba(255, 255, 255, 0.2)'
                            }} />
                          ))}
                        </div>
                        <p style={{ color: passwordStrength.color, fontSize: '12px', margin: 0 }}>
                          {passwordStrength.text}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)', marginBottom: '8px', display: 'block' }}>
                      Confirm New Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: 'rgba(255, 255, 255, 0.4)', pointerEvents: 'none' }} />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, confirmPassword: e.target.value }));
                          setError('');
                        }}
                        className="input-focus"
                        style={{
                          width: '100%', padding: '16px 56px 16px 48px',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          border: `2px solid ${formData.confirmPassword && formData.newPassword !== formData.confirmPassword ? 'rgba(239, 68, 68, 0.6)' : 'rgba(255, 255, 255, 0.2)'}`,
                          borderRadius: '12px', color: 'white', fontSize: '16px', backdropFilter: 'blur(4px)',
                          transition: 'all 0.3s ease', boxSizing: 'border-box'
                        }}
                        placeholder="Confirm your new password"
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{
                          position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', color: 'rgba(255, 255, 255, 0.6)',
                          cursor: 'pointer', padding: '4px', transition: 'color 0.2s ease'
                        }}
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                      <p style={{ color: '#fca5a5', fontSize: '12px', margin: '4px 0 0' }}>
                        Passwords do not match
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading || !isPasswordFormValid}
                    style={{
                      width: '100%', marginTop: '16px', padding: '16px 24px', borderRadius: '12px',
                      border: 'none', fontWeight: '600', fontSize: '16px', color: 'white',
                      background: isLoading || !isPasswordFormValid
                        ? 'rgba(107, 114, 128, 0.5)' 
                        : 'linear-gradient(45deg, #10b981, #059669, #047857)',
                      cursor: isLoading || !isPasswordFormValid ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: '12px',
                      boxShadow: isLoading || !isPasswordFormValid ? 'none' : '0 10px 25px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    {isLoading ? (
                      <>
                        <div style={{
                          width: '20px', height: '20px', border: '2px solid rgba(255, 255, 255, 0.3)',
                          borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite'
                        }} />
                        <span>Resetting Password...</span>
                      </>
                    ) : (
                      <>
                        <span>Reset Password</span>
                        <ChevronRight size={20} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Navigation */}
            <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'center' }}>
              <button 
                onClick={() => currentStep === 1 ? router.push('/forgot-password') : setCurrentStep(1)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  color: '#93c5fd', fontWeight: '600', fontSize: '14px',
                  background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s ease'
                }}
              >
                <ArrowLeft size={16} />
                <span>{currentStep === 1 ? 'Back to Email Entry' : 'Back to Code Entry'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
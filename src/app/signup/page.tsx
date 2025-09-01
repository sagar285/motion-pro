// app/signup/page.tsx
'use client';

import { JSX, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Eye, EyeOff, Lock, Mail, Shield, User, Phone } from 'lucide-react';

interface SignupFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface PasswordStrength {
  score: number;
  text: string;
  color: string;
}

export default function SignupPage(): JSX.Element {
  const [formData, setFormData] = useState<SignupFormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Name is required';
    if (!formData.email.trim()) return 'Email is required';
    if (!formData.password) return 'Password is required';
    if (!formData.confirmPassword) return 'Please confirm your password';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return 'Please enter a valid email address';
    
    if (formData.password.length < 6) return 'Password must be at least 6 characters long';
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || undefined,
          password: formData.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
      } else {
        setError(data.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      setError('Network error. Please check your connection and try again.');
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

  const isFormValid = (): boolean => {
    return !!(
      formData.name.trim() && 
      formData.email.trim() && 
      formData.password && 
      formData.confirmPassword &&
      formData.password === formData.confirmPassword
    );
  };

  const passwordStrength = getPasswordStrength(formData.password);

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
        .delay-3 { animation-delay: 3s; }
        
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
      `}</style>

      <div 
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 30%, #3730a3 60%, #1e1b4b 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Background Elements */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div className="pulsing" style={{
            position: 'absolute', top: '5%', left: '10%', width: '300px', height: '300px',
            borderRadius: '50%', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3), transparent)', filter: 'blur(60px)'
          }} />
          <div className="pulsing delay-2" style={{
            position: 'absolute', top: '30%', right: '15%', width: '250px', height: '250px',
            borderRadius: '50%', background: 'radial-gradient(circle, rgba(147, 51, 234, 0.3), transparent)', filter: 'blur(60px)'
          }} />
          <div className="bouncing" style={{
            position: 'absolute', top: '20%', right: '25%', width: '8px', height: '8px',
            borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.4)'
          }} />
        </div>

        <div style={{ maxWidth: '500px', width: '100%', position: 'relative', zIndex: 10 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ marginBottom: '32px' }}>
              <div style={{ width: '96px', height: '96px', margin: '0 auto 24px', position: 'relative' }}>
                <div className="rotating" style={{
                  position: 'absolute', inset: 0, background: 'linear-gradient(45deg, #60a5fa, #a855f7, #6366f1)',
                  borderRadius: '20px', transform: 'rotate(12deg)'
                }} />
                <div className="rotating delay-1" style={{
                  position: 'absolute', inset: 0, background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
                  borderRadius: '20px', transform: 'rotate(6deg)'
                }} />
                <div style={{
                  position: 'absolute', inset: '8px', backgroundColor: 'white', borderRadius: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <span style={{
                    fontSize: '32px', fontWeight: 'bold',
                    background: 'linear-gradient(45deg, #2563eb, #9333ea)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                  }}>MP</span>
                </div>
              </div>
              
              <h1 style={{ fontSize: '40px', fontWeight: 'bold', color: 'white', margin: 0 }}>
                Motion-Pro
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '12px' }}>
                <Shield style={{ width: '16px', height: '16px', color: '#93c5fd' }} />
                <span style={{ color: '#bfdbfe', fontSize: '14px', fontWeight: '500' }}>
                  Secure Management System
                </span>
              </div>
            </div>
            
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', margin: '0 0 8px' }}>
              Create Your Account
            </h2>
            <p style={{ color: '#cbd5e1', fontSize: '18px', margin: 0 }}>
              Join Motion-Pro today
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="glassmorphism" style={{
              borderRadius: '24px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
              {/* Header Badge */}
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  backgroundColor: 'rgba(59, 130, 246, 0.2)', padding: '8px 16px',
                  borderRadius: '9999px', border: '1px solid rgba(147, 197, 253, 0.3)'
                }}>
                  <Lock style={{ width: '16px', height: '16px', color: '#93c5fd' }} />
                  <span style={{ color: '#dbeafe', fontSize: '14px', fontWeight: '500' }}>
                    Secure Registration
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Name Input */}
                <div>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)', marginBottom: '8px', display: 'block' }}>
                    Full Name *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: 'rgba(255, 255, 255, 0.4)', pointerEvents: 'none' }} />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="input-focus"
                      style={{
                        width: '100%', paddingLeft: '48px', padding: '16px 16px 16px 48px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)', border: '2px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px', color: 'white', fontSize: '16px', backdropFilter: 'blur(4px)',
                        transition: 'all 0.3s ease', boxSizing: 'border-box'
                      }}
                      placeholder="John Doe"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Email Input */}
                <div>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)', marginBottom: '8px', display: 'block' }}>
                    Email Address *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: 'rgba(255, 255, 255, 0.4)', pointerEvents: 'none' }} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="input-focus"
                      style={{
                        width: '100%', padding: '16px 16px 16px 48px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)', border: '2px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px', color: 'white', fontSize: '16px', backdropFilter: 'blur(4px)',
                        transition: 'all 0.3s ease', boxSizing: 'border-box'
                      }}
                      placeholder="john.doe@company.com"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Phone Input */}
                <div>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)', marginBottom: '8px', display: 'block' }}>
                    Phone Number (Optional)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: 'rgba(255, 255, 255, 0.4)', pointerEvents: 'none' }} />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="input-focus"
                      style={{
                        width: '100%', padding: '16px 16px 16px 48px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)', border: '2px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px', color: 'white', fontSize: '16px', backdropFilter: 'blur(4px)',
                        transition: 'all 0.3s ease', boxSizing: 'border-box'
                      }}
                      placeholder="+1 (555) 123-4567"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)', marginBottom: '8px', display: 'block' }}>
                    Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: 'rgba(255, 255, 255, 0.4)', pointerEvents: 'none' }} />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
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
                  
                  {formData.password && (
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
                    Confirm Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: 'rgba(255, 255, 255, 0.4)', pointerEvents: 'none' }} />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="input-focus"
                      style={{
                        width: '100%', padding: '16px 56px 16px 48px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        border: `2px solid ${formData.confirmPassword && formData.password !== formData.confirmPassword ? 'rgba(239, 68, 68, 0.6)' : 'rgba(255, 255, 255, 0.2)'}`,
                        borderRadius: '12px', color: 'white', fontSize: '16px', backdropFilter: 'blur(4px)',
                        transition: 'all 0.3s ease', boxSizing: 'border-box'
                      }}
                      placeholder="Confirm your password"
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
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p style={{ color: '#fca5a5', fontSize: '12px', margin: '4px 0 0' }}>
                      Passwords do not match
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || !isFormValid()}
                  style={{
                    width: '100%', marginTop: '32px', padding: '16px 24px', borderRadius: '12px',
                    border: 'none', fontWeight: '600', fontSize: '16px', color: 'white',
                    background: isLoading || !isFormValid() 
                      ? 'rgba(107, 114, 128, 0.5)' 
                      : 'linear-gradient(45deg, #3b82f6, #8b5cf6, #6366f1)',
                    cursor: isLoading || !isFormValid() ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '12px',
                    boxShadow: isLoading || !isFormValid() ? 'none' : '0 10px 25px rgba(59, 130, 246, 0.3)'
                  }}
                >
                  {isLoading ? (
                    <>
                      <div style={{
                        width: '20px', height: '20px', border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite'
                      }} />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ChevronRight size={20} />
                    </>
                  )}
                </button>
              </div>

              {/* Footer */}
              <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'center' }}>
                <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px', margin: 0 }}>
                  Already have an account?{' '}
                  <button 
                    type="button"
                    onClick={() => router.push('/login')}
                    style={{
                      color: '#93c5fd', fontWeight: '600', background: 'none', border: 'none',
                      cursor: 'pointer', textDecoration: 'underline', transition: 'color 0.2s ease'
                    }}
                    disabled={isLoading}
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </div>
          </form>

          {/* Security Badge */}
          <div style={{ marginTop: '32px', textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.2)', padding: '8px 16px',
              borderRadius: '9999px', border: '1px solid rgba(110, 231, 183, 0.3)'
            }}>
              <Shield style={{ width: '16px', height: '16px', color: '#6ee7b7' }} />
              <span style={{ color: '#a7f3d0', fontSize: '12px', fontWeight: '500' }}>
                256-bit SSL Encrypted
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
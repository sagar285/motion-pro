'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Mail, Shield, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!email) {
      setError('Please enter your email address');
      setIsLoading(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueToReset = () => {
    router.push(`/reset-password?email=${encodeURIComponent(email)}`);
  };

  return (
    <>
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes rotate {
          from { transform: rotate(45deg); }
          to { transform: rotate(405deg); }
        }
        
        .pulsing { animation: pulse 3s ease-in-out infinite; }
        .bouncing { animation: bounce 2s infinite; }
        .rotating { animation: rotate 4s linear infinite; }
        
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
        {/* Animated Background Elements */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div 
            className="pulsing"
            style={{
              position: 'absolute',
              top: '15%',
              right: '20%',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(239, 68, 68, 0.3), transparent)',
              filter: 'blur(60px)'
            }}
          />
          <div 
            className="pulsing delay-2"
            style={{
              position: 'absolute',
              bottom: '20%',
              left: '15%',
              width: '250px',
              height: '250px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(245, 158, 11, 0.3), transparent)',
              filter: 'blur(60px)'
            }}
          />
          
          <div 
            className="bouncing"
            style={{
              position: 'absolute',
              top: '25%',
              left: '25%',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'rgba(252, 165, 165, 0.6)'
            }}
          />
          <div 
            className="bouncing delay-1"
            style={{
              position: 'absolute',
              bottom: '30%',
              right: '30%',
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              backgroundColor: 'rgba(251, 191, 36, 0.5)'
            }}
          />
        </div>

        <div 
          style={{
            maxWidth: '500px',
            width: '100%',
            position: 'relative',
            zIndex: 10
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            {/* Logo */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ width: '96px', height: '96px', margin: '0 auto 24px', position: 'relative' }}>
                <div 
                  className="rotating"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(45deg, #ef4444, #f59e0b, #dc2626)',
                    borderRadius: '20px',
                    transform: 'rotate(12deg)'
                  }}
                />
                <div 
                  className="rotating delay-1"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(45deg, #dc2626, #ea580c)',
                    borderRadius: '20px',
                    transform: 'rotate(6deg)'
                  }}
                />
                <div 
                  style={{
                    position: 'absolute',
                    inset: '8px',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(4px)'
                  }}
                >
                  <span 
                    style={{ 
                      fontSize: '32px',
                      fontWeight: 'bold',
                      background: 'linear-gradient(45deg, #dc2626, #ea580c)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    MP
                  </span>
                </div>
              </div>
              
              <h1 style={{ 
                fontSize: '32px',
                fontWeight: 'bold',
                color: 'white',
                margin: '0 0 16px'
              }}>
                {success ? 'Check Your Email' : 'Reset Password'}
              </h1>
              
              <p style={{ color: '#cbd5e1', fontSize: '16px', margin: 0, lineHeight: '1.6' }}>
                {success 
                  ? 'We\'ve sent a reset code to your email address'
                  : 'Enter your email to receive a password reset code'
                }
              </p>
            </div>
          </div>

          {/* Form or Success Message */}
          <div 
            className="glassmorphism"
            style={{
              borderRadius: '24px',
              padding: '40px 32px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              textAlign: 'center'
            }}
          >
            {success ? (
              // Success State
              <>
                <div style={{ marginBottom: '32px' }}>
                  <CheckCircle 
                    size={64} 
                    style={{ 
                      color: '#10b981', 
                      margin: '0 auto 24px',
                      display: 'block'
                    }} 
                  />
                  <div 
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      padding: '8px 16px',
                      borderRadius: '9999px',
                      border: '1px solid rgba(110, 231, 183, 0.3)',
                      marginBottom: '24px'
                    }}
                  >
                    <Shield style={{ width: '16px', height: '16px', color: '#6ee7b7' }} />
                    <span style={{ color: '#a7f3d0', fontSize: '14px', fontWeight: '500' }}>
                      Reset Code Sent
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom: '32px' }}>
                  <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px', marginBottom: '16px' }}>
                    We've sent a 6-digit reset code to:
                  </p>
                  <p style={{ color: '#6ee7b7', fontSize: '16px', fontWeight: '600', marginBottom: '24px' }}>
                    {email}
                  </p>
                  <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>
                    The code will expire in 10 minutes. Check your spam folder if you don't see it.
                  </p>
                </div>

                <button
                  onClick={handleContinueToReset}
                  style={{
                    width: '100%',
                    padding: '16px 24px',
                    borderRadius: '12px',
                    border: 'none',
                    fontWeight: '600',
                    fontSize: '16px',
                    color: 'white',
                    background: 'linear-gradient(45deg, #10b981, #059669, #047857)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)',
                    marginBottom: '24px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(45deg, #059669, #047857, #065f46)';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(45deg, #10b981, #059669, #047857)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <span>Continue to Reset</span>
                  <ChevronRight size={20} />
                </button>

                <div 
                  style={{ 
                    paddingTop: '24px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px', marginBottom: '16px' }}>
                    Didn't receive the email?
                  </p>
                  <button 
                    onClick={() => {
                      setSuccess(false);
                      setEmail('');
                      setError('');
                    }}
                    style={{
                      backgroundColor: 'transparent',
                      border: '2px solid rgba(147, 197, 253, 0.3)',
                      borderRadius: '8px',
                      padding: '12px 24px',
                      color: '#93c5fd',
                      fontWeight: '600',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#bfdbfe';
                      e.currentTarget.style.color = '#bfdbfe';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(147, 197, 253, 0.3)';
                      e.currentTarget.style.color = '#93c5fd';
                    }}
                  >
                    Try Different Email
                  </button>
                </div>
              </>
            ) : (
              // Form State
              <>
                <div style={{ marginBottom: '32px' }}>
                  <div 
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: 'rgba(239, 68, 68, 0.2)',
                      padding: '8px 16px',
                      borderRadius: '9999px',
                      border: '1px solid rgba(248, 113, 113, 0.3)'
                    }}
                  >
                    <Shield style={{ width: '16px', height: '16px', color: '#fca5a5' }} />
                    <span style={{ color: '#fecaca', fontSize: '14px', fontWeight: '500' }}>
                      Password Recovery
                    </span>
                  </div>
                </div>

                {error && (
                  <div 
                    style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid rgba(248, 113, 113, 0.3)',
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '24px'
                    }}
                  >
                    <span style={{ color: '#fca5a5', fontSize: '14px' }}>
                      {error}
                    </span>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: '32px', textAlign: 'left' }}>
                    <label 
                      style={{ 
                        fontSize: '14px',
                        fontWeight: '600',
                        color: 'rgba(255, 255, 255, 0.9)',
                        marginBottom: '12px',
                        display: 'block'
                      }}
                    >
                      Email Address
                    </label>
                    <div style={{ position: 'relative' }}>
                      <div 
                        style={{
                          position: 'absolute',
                          left: '16px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          pointerEvents: 'none'
                        }}
                      >
                        <Mail style={{ width: '20px', height: '20px', color: 'rgba(255, 255, 255, 0.4)' }} />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError('');
                        }}
                        className="input-focus"
                        style={{
                          width: '100%',
                          paddingLeft: '48px',
                          paddingRight: '16px',
                          paddingTop: '16px',
                          paddingBottom: '16px',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          border: '2px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '12px',
                          color: 'white',
                          fontSize: '16px',
                          backdropFilter: 'blur(4px)',
                          transition: 'all 0.3s ease',
                          boxSizing: 'border-box'
                        }}
                        placeholder="Enter your email address"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !email}
                    style={{
                      width: '100%',
                      padding: '16px 24px',
                      borderRadius: '12px',
                      border: 'none',
                      fontWeight: '600',
                      fontSize: '16px',
                      color: 'white',
                      background: isLoading || !email 
                        ? 'rgba(107, 114, 128, 0.5)' 
                        : 'linear-gradient(45deg, #ef4444, #dc2626, #b91c1c)',
                      cursor: isLoading || !email ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      boxShadow: isLoading || !email
                        ? 'none' 
                        : '0 10px 25px rgba(239, 68, 68, 0.3)',
                      marginBottom: '24px'
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoading && email) {
                        e.currentTarget.style.background = 'linear-gradient(45deg, #dc2626, #b91c1c, #991b1b)';
                        e.currentTarget.style.transform = 'scale(1.02)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isLoading && email) {
                        e.currentTarget.style.background = 'linear-gradient(45deg, #ef4444, #dc2626, #b91c1c)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }
                    }}
                  >
                    {isLoading ? (
                      <>
                        <div 
                          style={{
                            width: '20px',
                            height: '20px',
                            border: '2px solid rgba(255, 255, 255, 0.3)',
                            borderTop: '2px solid white',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }}
                        />
                        <span>Sending Reset Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Reset Code</span>
                        <ChevronRight size={20} />
                      </>
                    )}
                  </button>
                </form>

                <div 
                  style={{ 
                    paddingTop: '24px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <Link 
                    href="/login"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#93c5fd',
                      fontWeight: '600',
                      fontSize: '14px',
                      textDecoration: 'none',
                      transition: 'color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#bfdbfe'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#93c5fd'}
                  >
                    <ArrowLeft size={16} />
                    <span>Back to Login</span>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
// // app/verify-email/page.tsx
// 'use client';

// import { useState, useEffect } from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';
// import { ChevronRight, Shield, Mail, CheckCircle } from 'lucide-react';
// import Link from 'next/link';

// export default function VerifyEmailPage() {
//   const [otp, setOtp] = useState(['', '', '', '', '', '']);
//   const [email, setEmail] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [isResending, setIsResending] = useState(false);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState(false);
//   const router = useRouter();
//   const searchParams = useSearchParams();

//   useEffect(() => {
//     const emailParam = searchParams.get('email');
//     if (emailParam) {
//       setEmail(decodeURIComponent(emailParam));
//     }
//   }, [searchParams]);

//   // For handleOtpChange
// const handleOtpChange = (index: number, value: string) => {
//   if (value.length > 1) return;

//   const newOtp = [...otp];
//   newOtp[index] = value;
//   setOtp(newOtp);
//   setError('');

//   // Auto-focus next input
//   if (value && index < 5) {
//     const nextInput = document.getElementById(`otp-${index + 1}`) as HTMLInputElement | null;
//     if (nextInput) nextInput.focus();
//   }

//   // Auto-submit when all fields are filled
//   if (newOtp.every(digit => digit !== '') && !isLoading) {
//     handleVerifyOTP(newOtp.join(''));
//   }
// };

// // For handleKeyDown
// const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
//   // Handle backspace
//   if (e.key === 'Backspace' && !otp[index] && index > 0) {
//     const prevInput = document.getElementById(`otp-${index - 1}`) as HTMLInputElement | null;
//     if (prevInput) {
//       prevInput.focus();
//       const newOtp = [...otp];
//       newOtp[index - 1] = '';
//       setOtp(newOtp);
//     }
//   }
// };


//   const handleVerifyOTP = async (otpCode = otp.join('')) => {
//     if (!email || otpCode.length !== 6) {
//       setError('Please enter the complete 6-digit code');
//       return;
//     }

//     setIsLoading(true);
//     setError('');

//     try {
//       const response = await fetch('/api/auth/verify-email', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//           email,
//           otp: otpCode
//         })
//       });

//       const data = await response.json();

//       if (response.ok) {
//         setSuccess(true);
//         setTimeout(() => {
//           router.push('/login?verified=true');
//         }, 2000);
//       } else {
//         setError(data.error || 'Verification failed');
//         // Reset OTP on error
//         setOtp(['', '', '', '', '', '']);
//         const firstInput = document.getElementById('otp-0');
//         if (firstInput) firstInput.focus();
//       }
//     } catch (error) {
//       setError('Network error. Please try again.');
//       setOtp(['', '', '', '', '', '']);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleResendOTP = async () => {
//     if (!email) return;

//     setIsResending(true);
//     setError('');

//     try {
//       const response = await fetch('/api/auth/verify-email', {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({ email })
//       });

//       const data = await response.json();

//       if (response.ok) {
//         setSuccess(false);
//         setOtp(['', '', '', '', '', '']);
//         const firstInput = document.getElementById('otp-0');
//         if (firstInput) firstInput.focus();
//         // Show success message briefly
//         setError('');
//         setTimeout(() => setError(''), 3000);
//       } else {
//         setError(data.error || 'Failed to resend code');
//       }
//     } catch (error) {
//       setError('Network error. Please try again.');
//     } finally {
//       setIsResending(false);
//     }
//   };

//   if (success) {
//     return (
//       <div 
//         style={{
//           minHeight: '100vh',
//           background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 30%, #3730a3 60%, #1e1b4b 100%)',
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'center',
//           padding: '16px'
//         }}
//       >
//         <div style={{ textAlign: 'center', color: 'white' }}>
//           <div style={{ marginBottom: '32px' }}>
//             <CheckCircle size={80} style={{ color: '#10b981', margin: '0 auto' }} />
//           </div>
//           <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px' }}>
//             Email Verified!
//           </h1>
//           <p style={{ fontSize: '18px', color: '#cbd5e1', marginBottom: '24px' }}>
//             Your account has been successfully verified.
//           </p>
//           <p style={{ fontSize: '16px', color: '#94a3b8' }}>
//             Redirecting you to login...
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <>
//       <style jsx>{`
//         @keyframes pulse {
//           0%, 100% { opacity: 0.3; }
//           50% { opacity: 0.8; }
//         }
        
//         @keyframes bounce {
//           0%, 100% { transform: translateY(0); }
//           50% { transform: translateY(-10px); }
//         }
        
//         .pulsing { animation: pulse 3s ease-in-out infinite; }
//         .bouncing { animation: bounce 2s infinite; }
        
//         .delay-1 { animation-delay: 1s; }
//         .delay-2 { animation-delay: 2s; }
//         .delay-3 { animation-delay: 3s; }
        
//         .glassmorphism {
//           background: rgba(255, 255, 255, 0.1);
//           backdrop-filter: blur(20px);
//           -webkit-backdrop-filter: blur(20px);
//           border: 1px solid rgba(255, 255, 255, 0.2);
//         }
        
//         .otp-input:focus {
//           border-color: rgba(96, 165, 250, 0.6) !important;
//           box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3) !important;
//           outline: none;
//         }
//       `}</style>

//       <div 
//         style={{
//           minHeight: '100vh',
//           background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 30%, #3730a3 60%, #1e1b4b 100%)',
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'center',
//           padding: '16px',
//           position: 'relative',
//           overflow: 'hidden'
//         }}
//       >
//         {/* Animated Background Elements */}
//         <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
//           <div 
//             className="pulsing"
//             style={{
//               position: 'absolute',
//               top: '10%',
//               right: '20%',
//               width: '200px',
//               height: '200px',
//               borderRadius: '50%',
//               background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3), transparent)',
//               filter: 'blur(60px)'
//             }}
//           />
//           <div 
//             className="pulsing delay-2"
//             style={{
//               position: 'absolute',
//               bottom: '20%',
//               left: '15%',
//               width: '250px',
//               height: '250px',
//               borderRadius: '50%',
//               background: 'radial-gradient(circle, rgba(147, 51, 234, 0.3), transparent)',
//               filter: 'blur(60px)'
//             }}
//           />
          
//           <div 
//             className="bouncing"
//             style={{
//               position: 'absolute',
//               top: '25%',
//               left: '25%',
//               width: '6px',
//               height: '6px',
//               borderRadius: '50%',
//               backgroundColor: 'rgba(147, 197, 253, 0.6)'
//             }}
//           />
//           <div 
//             className="bouncing delay-1"
//             style={{
//               position: 'absolute',
//               bottom: '30%',
//               right: '30%',
//               width: '4px',
//               height: '4px',
//               borderRadius: '50%',
//               backgroundColor: 'rgba(196, 181, 253, 0.5)'
//             }}
//           />
//         </div>

//         <div 
//           style={{
//             maxWidth: '500px',
//             width: '100%',
//             position: 'relative',
//             zIndex: 10
//           }}
//         >
//           {/* Header */}
//           <div style={{ textAlign: 'center', marginBottom: '48px' }}>
//             {/* Logo */}
//             <div style={{ marginBottom: '32px' }}>
//               <div style={{ width: '80px', height: '80px', margin: '0 auto 24px', position: 'relative' }}>
//                 <div 
//                   style={{
//                     width: '100%',
//                     height: '100%',
//                     background: 'linear-gradient(45deg, #60a5fa, #a855f7)',
//                     borderRadius: '16px',
//                     display: 'flex',
//                     alignItems: 'center',
//                     justifyContent: 'center'
//                   }}
//                 >
//                   <Mail style={{ width: '40px', height: '40px', color: 'white' }} />
//                 </div>
//               </div>
              
//               <h1 style={{ 
//                 fontSize: '32px',
//                 fontWeight: 'bold',
//                 color: 'white',
//                 margin: '0 0 16px'
//               }}>
//                 Verify Your Email
//               </h1>
              
//               <p style={{ color: '#cbd5e1', fontSize: '16px', margin: 0, lineHeight: '1.6' }}>
//                 We've sent a 6-digit verification code to
//               </p>
//               <p style={{ color: '#93c5fd', fontSize: '16px', fontWeight: '600', margin: '8px 0 0' }}>
//                 {email}
//               </p>
//             </div>
//           </div>

//           {/* Verification Form */}
//           <div 
//             className="glassmorphism"
//             style={{
//               borderRadius: '24px',
//               padding: '40px 32px',
//               boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
//               textAlign: 'center'
//             }}
//           >
//             {/* Security Badge */}
//             <div style={{ marginBottom: '32px' }}>
//               <div 
//                 style={{
//                   display: 'inline-flex',
//                   alignItems: 'center',
//                   gap: '8px',
//                   backgroundColor: 'rgba(59, 130, 246, 0.2)',
//                   padding: '8px 16px',
//                   borderRadius: '9999px',
//                   border: '1px solid rgba(147, 197, 253, 0.3)'
//                 }}
//               >
//                 <Shield style={{ width: '16px', height: '16px', color: '#93c5fd' }} />
//                 <span style={{ color: '#dbeafe', fontSize: '14px', fontWeight: '500' }}>
//                   Email Verification
//                 </span>
//               </div>
//             </div>

//             {error && (
//               <div 
//                 style={{
//                   backgroundColor: 'rgba(239, 68, 68, 0.2)',
//                   border: '1px solid rgba(248, 113, 113, 0.3)',
//                   borderRadius: '12px',
//                   padding: '16px',
//                   marginBottom: '24px'
//                 }}
//               >
//                 <span style={{ color: '#fca5a5', fontSize: '14px' }}>
//                   {error}
//                 </span>
//               </div>
//             )}

//             {/* OTP Input Fields */}
//             <div style={{ marginBottom: '32px' }}>
//               <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px', marginBottom: '24px' }}>
//                 Enter the 6-digit code sent to your email
//               </p>
              
//               <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
//                 {otp.map((digit, index) => (
//                   <input
//                     key={index}
//                     id={`otp-${index}`}
//                     type="text"
//                     maxLength={1}
//                     value={digit}
//                     onChange={(e) => handleOtpChange(index, e.target.value)}
//                     onKeyDown={(e) => handleKeyDown(index, e)}
//                     className="otp-input"
//                     style={{
//                       width: '56px',
//                       height: '56px',
//                       fontSize: '24px',
//                       fontWeight: 'bold',
//                       textAlign: 'center',
//                       backgroundColor: 'rgba(255, 255, 255, 0.1)',
//                       border: '2px solid rgba(255, 255, 255, 0.2)',
//                       borderRadius: '12px',
//                       color: 'white',
//                       backdropFilter: 'blur(4px)',
//                       transition: 'all 0.3s ease'
//                     }}
//                     disabled={isLoading}
//                   />
//                 ))}
//               </div>

//               <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px', margin: 0 }}>
//                 Code expires in 10 minutes
//               </p>
//             </div>

//             {/* Manual Verify Button */}
//             <button
//               onClick={() => handleVerifyOTP()}
//               disabled={isLoading || otp.some(digit => !digit)}
//               style={{
//                 width: '100%',
//                 padding: '16px 24px',
//                 borderRadius: '12px',
//                 border: 'none',
//                 fontWeight: '600',
//                 fontSize: '16px',
//                 color: 'white',
//                 background: isLoading || otp.some(digit => !digit)
//                   ? 'rgba(107, 114, 128, 0.5)' 
//                   : 'linear-gradient(45deg, #3b82f6, #8b5cf6, #6366f1)',
//                 cursor: isLoading || otp.some(digit => !digit) ? 'not-allowed' : 'pointer',
//                 transition: 'all 0.3s ease',
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'center',
//                 gap: '12px',
//                 boxShadow: isLoading || otp.some(digit => !digit)
//                   ? 'none' 
//                   : '0 10px 25px rgba(59, 130, 246, 0.3)',
//                 marginBottom: '24px'
//               }}
//             >
//               {isLoading ? (
//                 <>
//                   <div 
//                     style={{
//                       width: '20px',
//                       height: '20px',
//                       border: '2px solid rgba(255, 255, 255, 0.3)',
//                       borderTop: '2px solid white',
//                       borderRadius: '50%',
//                       animation: 'spin 1s linear infinite'
//                     }}
//                   />
//                   <span>Verifying...</span>
//                 </>
//               ) : (
//                 <>
//                   <span>Verify Email</span>
//                   <ChevronRight size={20} />
//                 </>
//               )}
//             </button>

//             {/* Resend Code */}
//             <div 
//               style={{ 
//                 paddingTop: '24px',
//                 borderTop: '1px solid rgba(255, 255, 255, 0.1)'
//               }}
//             >
//               <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px', marginBottom: '16px' }}>
//                 Didn't receive the code?
//               </p>
//               <button 
//                 onClick={handleResendOTP}
//                 disabled={isResending}
//                 style={{
//                   backgroundColor: 'transparent',
//                   border: '2px solid rgba(147, 197, 253, 0.3)',
//                   borderRadius: '8px',
//                   padding: '12px 24px',
//                   color: '#93c5fd',
//                   fontWeight: '600',
//                   fontSize: '14px',
//                   cursor: isResending ? 'not-allowed' : 'pointer',
//                   transition: 'all 0.2s ease',
//                   marginBottom: '16px'
//                 }}
//                 onMouseEnter={(e) => {
//                   if (!isResending) {
//                     e.currentTarget.style.borderColor = '#bfdbfe';
//                     e.currentTarget.style.color = '#bfdbfe';
//                   }
//                 }}
//                 onMouseLeave={(e) => {
//                   if (!isResending) {
//                     e.currentTarget.style.borderColor = 'rgba(147, 197, 253, 0.3)';
//                     e.currentTarget.style.color = '#93c5fd';
//                   }
//                 }}
//               >
//                 {isResending ? 'Sending...' : 'Resend Code'}
//               </button>

//               <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px', margin: 0 }}>
//                 <Link 
//                   href="/login"
//                   style={{
//                     color: '#93c5fd',
//                     fontWeight: '600',
//                     textDecoration: 'underline',
//                     transition: 'color 0.2s ease'
//                   }}
//                 >
//                   Back to Login
//                 </Link>
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>

//       <style jsx>{`
//         @keyframes spin {
//           from { transform: rotate(0deg); }
//           to { transform: rotate(360deg); }
//         }
//       `}</style>
//     </>
//   );
// }

// app/verify-email/page.tsx
import { Suspense } from 'react';
import VerifyEmailForm from './VerifyEmailForm';

function VerifyEmailLoading() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 30%, #3730a3 60%, #1e1b4b 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{ textAlign: 'center', color: 'white' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderTop: '4px solid white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }} />
        <p>Loading verification...</p>
        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailLoading />}>
      <VerifyEmailForm />
    </Suspense>
  );
}
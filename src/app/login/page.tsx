// // app/login/page.tsx
// 'use client';

// import { useState, useEffect, JSX } from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';
// import { ChevronRight, Eye, EyeOff, Lock, Mail, Shield } from 'lucide-react';

// export default function LoginPage(): JSX.Element {
//   const [showPassword, setShowPassword] = useState(false);
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [rememberMe, setRememberMe] = useState(false);
//   const [error, setError] = useState('');
//   const [successMessage, setSuccessMessage] = useState('');
//   const router = useRouter();
//   const searchParams = useSearchParams();

//   useEffect(() => {
//     // Check for success messages from URL params
//     const verified = searchParams.get('verified');
//     const reset = searchParams.get('reset');
    
//     if (verified === 'true') {
//       setSuccessMessage('Email verified successfully! You can now log in.');
//     } else if (reset === 'success') {
//       setSuccessMessage('Password reset successfully! You can now log in with your new password.');
//     }
//   }, [searchParams]);

//   const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     setIsLoading(true);
//     setError('');

//     if (!email || !password) {
//       setError('Please fill in all fields');
//       setIsLoading(false);
//       return;
//     }

//     try {
//       const response = await fetch('/api/auth/login', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//           email,
//           password,
//           rememberMe
//         })
//       });

//       const data = await response.json();

//       if (response.ok) {
//         // Successful login
//         router.push('/dashboard');
//       } else {
//         if (data.requiresVerification) {
//           // Email not verified
//           setError(data.error);
//           setTimeout(() => {
//             router.push(`/verify-email?email=${encodeURIComponent(email)}`);
//           }, 2000);
//         } else {
//           setError(data.error || 'Login failed');
//         }
//       }
//     } catch (error) {
//       setError('Network error. Please try again.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleSignup = () => {
//     router.push('/signup');
//   };

//   const handleForgotPassword = () => {
//     router.push('/forgot-password');
//   };

//   return (
//     <>
//       <style jsx>{`
//         @keyframes float {
//           0%, 100% { transform: translateY(0px); }
//           50% { transform: translateY(-20px); }
//         }
        
//         @keyframes rotate {
//           from { transform: rotate(45deg); }
//           to { transform: rotate(405deg); }
//         }
        
//         @keyframes pulse {
//           0%, 100% { opacity: 0.3; }
//           50% { opacity: 0.8; }
//         }
        
//         @keyframes bounce {
//           0%, 100% { transform: translateY(0); }
//           50% { transform: translateY(-10px); }
//         }
        
//         .floating { animation: float 6s ease-in-out infinite; }
//         .rotating { animation: rotate 4s linear infinite; }
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
        
//         .input-focus:focus {
//           border-color: rgba(96, 165, 250, 0.6) !important;
//           box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3) !important;
//           outline: none;
//         }
        
//         @media (max-width: 768px) {
//           .mobile-container {
//             padding: 16px;
//             max-width: 100%;
//           }
          
//           .mobile-form {
//             padding: 24px;
//           }
          
//           .mobile-title {
//             font-size: 28px;
//           }
          
//           .mobile-subtitle {
//             font-size: 16px;
//           }
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
//           {/* Large floating orbs */}
//           <div 
//             className="pulsing"
//             style={{
//               position: 'absolute',
//               top: '5%',
//               left: '10%',
//               width: '300px',
//               height: '300px',
//               borderRadius: '50%',
//               background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3), transparent)',
//               filter: 'blur(60px)'
//             }}
//           />
//           <div 
//             className="pulsing delay-2"
//             style={{
//               position: 'absolute',
//               top: '30%',
//               right: '15%',
//               width: '250px',
//               height: '250px',
//               borderRadius: '50%',
//               background: 'radial-gradient(circle, rgba(147, 51, 234, 0.3), transparent)',
//               filter: 'blur(60px)'
//             }}
//           />
//           <div 
//             className="pulsing delay-1"
//             style={{
//               position: 'absolute',
//               bottom: '10%',
//               left: '30%',
//               width: '200px',
//               height: '200px',
//               borderRadius: '50%',
//               background: 'radial-gradient(circle, rgba(79, 70, 229, 0.3), transparent)',
//               filter: 'blur(50px)'
//             }}
//           />
          
//           {/* Small floating dots */}
//           <div 
//             className="bouncing"
//             style={{
//               position: 'absolute',
//               top: '20%',
//               right: '25%',
//               width: '8px',
//               height: '8px',
//               borderRadius: '50%',
//               backgroundColor: 'rgba(255, 255, 255, 0.4)'
//             }}
//           />
//           <div 
//             className="bouncing delay-1"
//             style={{
//               position: 'absolute',
//               bottom: '35%',
//               left: '20%',
//               width: '6px',
//               height: '6px',
//               borderRadius: '50%',
//               backgroundColor: 'rgba(147, 197, 253, 0.6)'
//             }}
//           />
//           <div 
//             className="bouncing delay-3"
//             style={{
//               position: 'absolute',
//               top: '50%',
//               right: '30%',
//               width: '4px',
//               height: '4px',
//               borderRadius: '50%',
//               backgroundColor: 'rgba(196, 181, 253, 0.5)'
//             }}
//           />
//         </div>

//         <div 
//           className="mobile-container"
//           style={{
//             maxWidth: '500px',
//             width: '100%',
//             position: 'relative',
//             zIndex: 10
//           }}
//         >
//           {/* Logo and Header Section */}
//           <div style={{ textAlign: 'center', marginBottom: '48px' }}>
//             {/* Logo */}
//             <div style={{ position: 'relative', marginBottom: '32px' }}>
//               <div style={{ width: '96px', height: '96px', margin: '0 auto 24px', position: 'relative' }}>
//                 <div 
//                   className="rotating"
//                   style={{
//                     position: 'absolute',
//                     inset: 0,
//                     background: 'linear-gradient(45deg, #60a5fa, #a855f7, #6366f1)',
//                     borderRadius: '20px',
//                     transform: 'rotate(12deg)'
//                   }}
//                 />
//                 <div 
//                   className="rotating delay-1"
//                   style={{
//                     position: 'absolute',
//                     inset: 0,
//                     background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
//                     borderRadius: '20px',
//                     transform: 'rotate(6deg)'
//                   }}
//                 />
//                 <div 
//                   style={{
//                     position: 'absolute',
//                     inset: '8px',
//                     backgroundColor: 'white',
//                     borderRadius: '12px',
//                     display: 'flex',
//                     alignItems: 'center',
//                     justifyContent: 'center',
//                     backdropFilter: 'blur(4px)'
//                   }}
//                 >
//                   <span 
//                     style={{ 
//                       fontSize: '32px',
//                       fontWeight: 'bold',
//                       background: 'linear-gradient(45deg, #2563eb, #9333ea)',
//                       WebkitBackgroundClip: 'text',
//                       WebkitTextFillColor: 'transparent',
//                       backgroundClip: 'text'
//                     }}
//                   >
//                     MP
//                   </span>
//                 </div>
//               </div>
              
//               {/* Title and subtitle */}
//               <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
//                 <h1 
//                   className="mobile-title"
//                   style={{ 
//                     fontSize: '40px',
//                     fontWeight: 'bold',
//                     color: 'white',
//                     letterSpacing: '-0.025em',
//                     margin: 0
//                   }}
//                 >
//                   Motion-Pro
//                 </h1>
//                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
//                   <Shield style={{ width: '16px', height: '16px', color: '#93c5fd' }} />
//                   <span style={{ color: '#bfdbfe', fontSize: '14px', fontWeight: '500' }}>
//                     Secure Management System
//                   </span>
//                 </div>
//               </div>
//             </div>
            
//             <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
//               <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', margin: 0 }}>
//                 Welcome Back
//               </h2>
//               <p 
//                 className="mobile-subtitle"
//                 style={{ color: '#cbd5e1', fontSize: '18px', margin: 0 }}
//               >
//                 Sign in to access your workspace
//               </p>
//             </div>
//           </div>

//           {/* Login Form */}
//           <form onSubmit={handleLogin}>
//             <div 
//               className="glassmorphism mobile-form"
//               style={{
//                 borderRadius: '24px',
//                 padding: '32px',
//                 boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
//                 position: 'relative'
//               }}
//             >
//               {/* Form Header */}
//               <div style={{ textAlign: 'center', marginBottom: '32px' }}>
//                 <div 
//                   style={{
//                     display: 'inline-flex',
//                     alignItems: 'center',
//                     gap: '8px',
//                     backgroundColor: 'rgba(59, 130, 246, 0.2)',
//                     padding: '8px 16px',
//                     borderRadius: '9999px',
//                     border: '1px solid rgba(147, 197, 253, 0.3)'
//                   }}
//                 >
//                   <Lock style={{ width: '16px', height: '16px', color: '#93c5fd' }} />
//                   <span style={{ color: '#dbeafe', fontSize: '14px', fontWeight: '500' }}>
//                     Secure Login
//                   </span>
//                 </div>
//               </div>

//               {/* Success Message */}
//               {successMessage && (
//                 <div 
//                   style={{
//                     backgroundColor: 'rgba(16, 185, 129, 0.2)',
//                     border: '1px solid rgba(110, 231, 183, 0.3)',
//                     borderRadius: '12px',
//                     padding: '16px',
//                     marginBottom: '24px',
//                     textAlign: 'center'
//                   }}
//                 >
//                   <span style={{ color: '#6ee7b7', fontSize: '14px' }}>
//                     {successMessage}
//                   </span>
//                 </div>
//               )}

//               {/* Error Message */}
//               {error && (
//                 <div 
//                   style={{
//                     backgroundColor: 'rgba(239, 68, 68, 0.2)',
//                     border: '1px solid rgba(248, 113, 113, 0.3)',
//                     borderRadius: '12px',
//                     padding: '16px',
//                     marginBottom: '24px',
//                     textAlign: 'center'
//                   }}
//                 >
//                   <span style={{ color: '#fca5a5', fontSize: '14px' }}>
//                     {error}
//                   </span>
//                 </div>
//               )}

//               <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
//                 {/* Email Input */}
//                 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
//                   <label 
//                     style={{ 
//                       fontSize: '14px',
//                       fontWeight: '600',
//                       color: 'rgba(255, 255, 255, 0.9)',
//                       marginBottom: '12px'
//                     }}
//                   >
//                     Email Address
//                   </label>
//                   <div style={{ position: 'relative' }}>
//                     <div 
//                       style={{
//                         position: 'absolute',
//                         left: '16px',
//                         top: '50%',
//                         transform: 'translateY(-50%)',
//                         pointerEvents: 'none'
//                       }}
//                     >
//                       <Mail style={{ width: '20px', height: '20px', color: 'rgba(255, 255, 255, 0.4)' }} />
//                     </div>
//                     <input
//                       type="email"
//                       value={email}
//                       onChange={(e) => {
//                         setEmail(e.target.value);
//                         setError('');
//                         setSuccessMessage('');
//                       }}
//                       className="input-focus"
//                       style={{
//                         width: '100%',
//                         paddingLeft: '48px',
//                         paddingRight: '16px',
//                         paddingTop: '16px',
//                         paddingBottom: '16px',
//                         backgroundColor: 'rgba(255, 255, 255, 0.1)',
//                         border: '2px solid rgba(255, 255, 255, 0.2)',
//                         borderRadius: '12px',
//                         color: 'white',
//                         fontSize: '16px',
//                         backdropFilter: 'blur(4px)',
//                         transition: 'all 0.3s ease',
//                         boxSizing: 'border-box'
//                       }}
//                       placeholder="john.doe@company.com"
//                       required
//                       disabled={isLoading}
//                     />
//                   </div>
//                 </div>

//                 {/* Password Input */}
//                 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
//                   <label 
//                     style={{ 
//                       fontSize: '14px',
//                       fontWeight: '600',
//                       color: 'rgba(255, 255, 255, 0.9)',
//                       marginBottom: '12px'
//                     }}
//                   >
//                     Password
//                   </label>
//                   <div style={{ position: 'relative' }}>
//                     <div 
//                       style={{
//                         position: 'absolute',
//                         left: '16px',
//                         top: '50%',
//                         transform: 'translateY(-50%)',
//                         pointerEvents: 'none'
//                       }}
//                     >
//                       <Lock style={{ width: '20px', height: '20px', color: 'rgba(255, 255, 255, 0.4)' }} />
//                     </div>
//                     <input
//                       type={showPassword ? "text" : "password"}
//                       value={password}
//                       onChange={(e) => {
//                         setPassword(e.target.value);
//                         setError('');
//                         setSuccessMessage('');
//                       }}
//                       className="input-focus"
//                       style={{
//                         width: '100%',
//                         paddingLeft: '48px',
//                         paddingRight: '56px',
//                         paddingTop: '16px',
//                         paddingBottom: '16px',
//                         backgroundColor: 'rgba(255, 255, 255, 0.1)',
//                         border: '2px solid rgba(255, 255, 255, 0.2)',
//                         borderRadius: '12px',
//                         color: 'white',
//                         fontSize: '16px',
//                         backdropFilter: 'blur(4px)',
//                         transition: 'all 0.3s ease',
//                         boxSizing: 'border-box'
//                       }}
//                       placeholder="Enter your password"
//                       required
//                       disabled={isLoading}
//                     />
//                     <button
//                       type="button"
//                       onClick={() => setShowPassword(!showPassword)}
//                       style={{
//                         position: 'absolute',
//                         right: '16px',
//                         top: '50%',
//                         transform: 'translateY(-50%)',
//                         background: 'none',
//                         border: 'none',
//                         color: 'rgba(255, 255, 255, 0.6)',
//                         cursor: 'pointer',
//                         padding: '4px',
//                         transition: 'color 0.2s ease'
//                       }}
//                       onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
//                       onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'}
//                       disabled={isLoading}
//                     >
//                       {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
//                     </button>
//                   </div>
//                 </div>

//                 {/* Remember me and Forgot password */}
//                 <div 
//                   style={{ 
//                     display: 'flex', 
//                     alignItems: 'center', 
//                     justifyContent: 'space-between',
//                     paddingTop: '8px',
//                     flexWrap: 'wrap',
//                     gap: '12px'
//                   }}
//                 >
//                   <label 
//                     style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '12px' }}
//                   >
//                     <div style={{ position: 'relative' }}>
//                       <input 
//                         type="checkbox" 
//                         checked={rememberMe}
//                         onChange={(e) => setRememberMe(e.target.checked)}
//                         style={{ opacity: 0, position: 'absolute' }}
//                         disabled={isLoading}
//                       />
//                       <div 
//                         style={{
//                           width: '20px',
//                           height: '20px',
//                           borderRadius: '4px',
//                           border: '2px solid',
//                           borderColor: rememberMe ? '#3b82f6' : 'rgba(255, 255, 255, 0.4)',
//                           backgroundColor: rememberMe ? '#3b82f6' : 'transparent',
//                           transition: 'all 0.2s ease',
//                           display: 'flex',
//                           alignItems: 'center',
//                           justifyContent: 'center'
//                         }}
//                       >
//                         {rememberMe && (
//                           <ChevronRight 
//                             style={{ 
//                               width: '12px', 
//                               height: '12px', 
//                               color: 'white',
//                               transform: 'rotate(90deg)'
//                             }} 
//                           />
//                         )}
//                       </div>
//                     </div>
//                     <span 
//                       style={{ 
//                         fontSize: '14px',
//                         color: 'rgba(255, 255, 255, 0.8)',
//                         transition: 'color 0.2s ease'
//                       }}
//                     >
//                       Keep me signed in
//                     </span>
//                   </label>
                  
//                   <button 
//                     type="button"
//                     onClick={handleForgotPassword}
//                     style={{
//                       fontSize: '14px',
//                       color: '#93c5fd',
//                       fontWeight: '500',
//                       background: 'none',
//                       border: 'none',
//                       cursor: 'pointer',
//                       transition: 'color 0.2s ease',
//                       textDecoration: 'underline'
//                     }}
//                     onMouseEnter={(e) => e.currentTarget.style.color = '#bfdbfe'}
//                     onMouseLeave={(e) => e.currentTarget.style.color = '#93c5fd'}
//                     disabled={isLoading}
//                   >
//                     Forgot password?
//                   </button>
//                 </div>

//                 {/* Login Button */}
//                 <button
//                   type="submit"
//                   disabled={isLoading || !email || !password}
//                   style={{
//                     width: '100%',
//                     marginTop: '32px',
//                     padding: '16px 24px',
//                     borderRadius: '12px',
//                     border: 'none',
//                     fontWeight: '600',
//                     fontSize: '16px',
//                     color: 'white',
//                     background: isLoading || !email || !password 
//                       ? 'rgba(107, 114, 128, 0.5)' 
//                       : 'linear-gradient(45deg, #3b82f6, #8b5cf6, #6366f1)',
//                     cursor: isLoading || !email || !password ? 'not-allowed' : 'pointer',
//                     transition: 'all 0.3s ease',
//                     display: 'flex',
//                     alignItems: 'center',
//                     justifyContent: 'center',
//                     gap: '12px',
//                     boxShadow: isLoading || !email || !password 
//                       ? 'none' 
//                       : '0 10px 25px rgba(59, 130, 246, 0.3)',
//                     transform: 'scale(1)'
//                   }}
//                   onMouseEnter={(e) => {
//                     if (!isLoading && email && password) {
//                       e.currentTarget.style.transform = 'scale(1.02)';
//                       e.currentTarget.style.background = 'linear-gradient(45deg, #2563eb, #7c3aed, #4f46e5)';
//                     }
//                   }}
//                   onMouseLeave={(e) => {
//                     if (!isLoading && email && password) {
//                       e.currentTarget.style.transform = 'scale(1)';
//                       e.currentTarget.style.background = 'linear-gradient(45deg, #3b82f6, #8b5cf6, #6366f1)';
//                     }
//                   }}
//                 >
//                   {isLoading ? (
//                     <>
//                       <div 
//                         style={{
//                           width: '20px',
//                           height: '20px',
//                           border: '2px solid rgba(255, 255, 255, 0.3)',
//                           borderTop: '2px solid white',
//                           borderRadius: '50%',
//                           animation: 'spin 1s linear infinite'
//                         }}
//                       />
//                       <span>Signing you in...</span>
//                     </>
//                   ) : (
//                     <>
//                       <span>Access Dashboard</span>
//                       <ChevronRight size={20} />
//                     </>
//                   )}
//                 </button>
//               </div>

//               {/* Bottom Section */}
//               <div 
//                 style={{ 
//                   marginTop: '32px',
//                   paddingTop: '24px',
//                   borderTop: '1px solid rgba(255, 255, 255, 0.1)'
//                 }}
//               >
//                 <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
//                   <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px', margin: 0 }}>
//                     New to Motion-Pro?{' '}
//                     <button 
//                       type="button"
//                       onClick={handleSignup}
//                       style={{
//                         color: '#93c5fd',
//                         fontWeight: '600',
//                         background: 'none',
//                         border: 'none',
//                         cursor: 'pointer',
//                         transition: 'color 0.2s ease',
//                         textDecoration: 'underline'
//                       }}
//                       onMouseEnter={(e) => e.currentTarget.style.color = '#bfdbfe'}
//                       onMouseLeave={(e) => e.currentTarget.style.color = '#93c5fd'}
//                       disabled={isLoading}
//                     >
//                       Create Account
//                     </button>
//                   </p>
                  
//                   <div 
//                     style={{ 
//                       display: 'flex', 
//                       alignItems: 'center', 
//                       justifyContent: 'center',
//                       gap: '16px',
//                       fontSize: '12px',
//                       color: 'rgba(255, 255, 255, 0.4)',
//                       flexWrap: 'wrap'
//                     }}
//                   >
//                     <span>© 2024 Motion-Pro</span>
//                     <span>•</span>
//                     <button 
//                       type="button"
//                       style={{
//                         background: 'none',
//                         border: 'none',
//                         color: 'inherit',
//                         cursor: 'pointer',
//                         transition: 'color 0.2s ease'
//                       }}
//                       onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'}
//                       onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)'}
//                     >
//                       Privacy
//                     </button>
//                     <span>•</span>
//                     <button 
//                       type="button"
//                       style={{
//                         background: 'none',
//                         border: 'none',
//                         color: 'inherit',
//                         cursor: 'pointer',
//                         transition: 'color 0.2s ease'
//                       }}
//                       onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'}
//                       onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)'}
//                     >
//                       Terms
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </form>

//           {/* Security Badge */}
//           <div style={{ marginTop: '32px', textAlign: 'center' }}>
//             <div 
//               style={{
//                 display: 'inline-flex',
//                 alignItems: 'center',
//                 gap: '8px',
//                 backgroundColor: 'rgba(16, 185, 129, 0.2)',
//                 padding: '8px 16px',
//                 borderRadius: '9999px',
//                 border: '1px solid rgba(110, 231, 183, 0.3)'
//               }}
//             >
//               <Shield style={{ width: '16px', height: '16px', color: '#6ee7b7' }} />
//               <span style={{ color: '#a7f3d0', fontSize: '12px', fontWeight: '500' }}>
//                 256-bit SSL Encrypted
//               </span>
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

// app/login/page.tsx
import { Suspense } from 'react';
import LoginForm from './LoginForm';

function LoginLoading() {
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
        <p>Loading login...</p>
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

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}
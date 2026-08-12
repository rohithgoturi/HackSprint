import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCivic } from '../context/CivicContext';
import Container from '../components/Container';
import Button from '../components/Button';
import { Landmark, ShieldAlert, User, KeyRound, AlertCircle, Loader2, Wrench } from 'lucide-react';
 
 const Login = () => {
   const { loginUser, loginDemoCitizen, loginDemoAdmin, loginDemoWorker } = useCivic();
   const navigate = useNavigate();
   const [searchParams] = useSearchParams();

   const redirectUrl = searchParams.get('redirect') || '';

   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [isAdminRole, setIsAdminRole] = useState(false);
   const [error, setError] = useState('');
   const [isSubmitting, setIsSubmitting] = useState(false);

   const handleSignIn = async (e) => {
     e.preventDefault();
     if (!email.trim() || !password.trim()) {
       setError('Please enter both your email address and password to sign in.');
       return;
     }

     setError('');
     setIsSubmitting(true);

     try {
       const user = await loginUser(email.trim(), password.trim(), isAdminRole);
       if (redirectUrl) {
         navigate(redirectUrl);
       } else if (user.role === 'admin') {
         navigate('/admin');
       } else if (user.role === 'worker') {
         navigate('/worker');
       } else {
         navigate('/reports');
       }
     } catch (err) {
       setError(err.message || 'Invalid email or password');
     } finally {
       setIsSubmitting(false);
     }
   };

   const handleDemoCitizenClick = async () => {
     setError('');
     setIsSubmitting(true);
     try {
       const user = await loginDemoCitizen();
       if (user) {
         if (redirectUrl && !redirectUrl.startsWith('/admin')) {
           navigate(redirectUrl);
         } else {
           navigate('/reports');
         }
       }
     } catch (err) {
       setError(err.message || 'Demo citizen sign-in failed');
     } finally {
       setIsSubmitting(false);
     }
   };

   const handleDemoAdminClick = async () => {
     setError('');
     setIsSubmitting(true);
     try {
       const user = await loginDemoAdmin();
       if (user) {
         if (redirectUrl) {
           navigate(redirectUrl);
         } else {
           navigate('/admin');
         }
       }
     } catch (err) {
       setError(err.message || 'Demo admin sign-in failed');
     } finally {
       setIsSubmitting(false);
     }
   };

   const handleDemoWorkerClick = async () => {
     setError('');
     setIsSubmitting(true);
     try {
       const user = await loginDemoWorker();
       if (user) {
         if (redirectUrl) {
           navigate(redirectUrl);
         } else {
           navigate('/worker');
         }
       }
     } catch (err) {
       setError(err.message || 'Demo worker sign-in failed');
     } finally {
       setIsSubmitting(false);
     }
   };

   return (
     <Container className="max-w-md py-12 font-sans text-left">
       <div className="bg-white border border-civic-border rounded-xl shadow-civic-normal p-6 md:p-8 space-y-6">
         
         {/* Header Branding */}
         <div className="text-center space-y-2">
           <div className="inline-flex items-center justify-center p-3 bg-blue-50 border border-blue-100 rounded-full text-civic-action mb-1">
             <Landmark className="w-6 h-6" />
           </div>
           <h1 className="text-xl font-extrabold tracking-tight text-[#10213F] uppercase">
             WELCOME TO CIVICAI
           </h1>
           <p className="text-xs text-civic-muted leading-relaxed max-w-xs mx-auto">
             "Access your civic reports and follow issues through resolution."
           </p>
         </div>

         {/* Inline Error Message */}
         {error && (
           <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-xs text-red-700 flex items-start gap-2 animate-in fade-in duration-150">
             <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
             <span className="font-medium">{error}</span>
           </div>
         )}

         {/* Form */}
         <form onSubmit={handleSignIn} className="space-y-4">
           <div>
             <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-wider text-[#10213F] mb-1.5">
               Email Address <span className="text-red-500">*</span>
             </label>
             <input
               type="email"
               id="email"
               value={email}
               onChange={(e) => {
                 setEmail(e.target.value);
                 setError('');
               }}
               placeholder="citizen@example.com"
               disabled={isSubmitting}
               className="w-full text-xs border border-civic-border rounded-lg px-3.5 py-2.5 bg-white text-[#10213F] focus:outline-none focus:ring-1 focus:ring-civic-action disabled:bg-slate-50"
             />
           </div>

           <div>
             <label htmlFor="password" className="block text-[10px] font-bold uppercase tracking-wider text-[#10213F] mb-1.5">
               Password <span className="text-red-500">*</span>
             </label>
             <input
               type="password"
               id="password"
               value={password}
               onChange={(e) => {
                 setPassword(e.target.value);
                 setError('');
               }}
               placeholder="••••••••"
               disabled={isSubmitting}
               className="w-full text-xs border border-civic-border rounded-lg px-3.5 py-2.5 bg-white text-[#10213F] focus:outline-none focus:ring-1 focus:ring-civic-action disabled:bg-slate-50"
             />
           </div>

           {/* Admin Role Checkbox Toggle */}
           <div className="flex items-center space-x-2 pt-1">
             <input
               type="checkbox"
               id="isAdminRole"
               checked={isAdminRole}
               onChange={(e) => setIsAdminRole(e.target.checked)}
               className="h-4 w-4 rounded border-slate-300 text-civic-action focus:ring-civic-action cursor-pointer"
             />
             <label htmlFor="isAdminRole" className="text-xs font-semibold text-[#10213F] select-none cursor-pointer flex items-center gap-1">
               <ShieldAlert className="w-3.5 h-3.5 text-slate-400" /> Sign in as Municipal Administrator
             </label>
           </div>

           {/* Primary Action Button */}
           <Button
             type="submit"
             variant="primary"
             size="md"
             disabled={isSubmitting}
             className="w-full mt-2 font-bold cursor-pointer"
             icon={isSubmitting ? Loader2 : KeyRound}
           >
             {isSubmitting ? 'SIGNING IN...' : 'SIGN IN'}
           </Button>
         </form>

         {/* Secondary Quick Access Buttons */}
         <div className="border-t border-slate-100 pt-5 space-y-3">
           <span className="text-[10px] font-bold text-civic-muted uppercase tracking-wider block text-center">
             Quick System Demo Access
           </span>

           <div className="space-y-2">
             <button
               type="button"
               onClick={handleDemoCitizenClick}
               disabled={isSubmitting}
               className="w-full bg-slate-100 hover:bg-slate-200 text-[#10213F] text-xs font-bold py-2.5 px-4 rounded-lg transition-colors inline-flex items-center justify-center gap-2 cursor-pointer border border-slate-200 disabled:opacity-50"
             >
               <User className="w-3.5 h-3.5 text-civic-action" />
               Continue as Demo Citizen
             </button>

             <button
               type="button"
               onClick={handleDemoAdminClick}
               disabled={isSubmitting}
               className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-4 rounded-lg transition-colors inline-flex items-center justify-center gap-2 cursor-pointer border border-slate-800 disabled:opacity-50"
             >
               <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
               Continue as Demo Admin
             </button>

             <button
               type="button"
               onClick={handleDemoWorkerClick}
               disabled={isSubmitting}
               className="w-full bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold py-2.5 px-4 rounded-lg transition-colors inline-flex items-center justify-center gap-2 cursor-pointer border border-amber-200 disabled:opacity-50"
             >
               <Wrench className="w-3.5 h-3.5 text-amber-600" />
               Continue as Demo Field Worker
             </button>
           </div>
         </div>

        {/* System Notice */}
        <div className="border-t border-slate-100 pt-4 text-center">
          <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
            Connected to CivicAI Backend API (JWT Secured)
          </p>
        </div>

      </div>
    </Container>
  );
};

export default Login;

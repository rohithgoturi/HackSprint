import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCivic } from '../context/CivicContext';
import Container from '../components/Container';
import Button from '../components/Button';
import { Landmark, ShieldAlert, KeyRound, AlertCircle } from 'lucide-react';

const Login = () => {
  const { loginUser, authStatus, currentUser } = useCivic();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    
    setError('');
    // Mock authentication
    const user = loginUser(email, password, isAdminLogin);
    
    if (user.role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <Container className="max-w-md py-10">
      <div className="bg-white border border-civic-border rounded-lg shadow-civic-normal p-6 md:p-8 text-left space-y-6">
        
        {/* Logo and Intro */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-2.5 bg-blue-50 border border-blue-100 rounded-full text-civic-action mb-1">
            <Landmark className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-civic-navy">
            Sign In to CivicAI
          </h2>
          <p className="text-xs text-civic-muted leading-relaxed max-w-xs mx-auto">
            Access citizen reporting history or manage municipal service work dispatches.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded p-3 text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-wider text-civic-navy mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sarah.jenkins@example.com"
              className="w-full text-xs border border-civic-border rounded px-3.5 py-2.5 bg-white text-civic-navy focus:outline-none focus:ring-1 focus:ring-civic-action"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-[10px] font-bold uppercase tracking-wider text-civic-navy mb-1.5">
              Password
            </label>
            <input
              type="password"
              id="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-xs border border-civic-border rounded px-3.5 py-2.5 bg-white text-civic-navy focus:outline-none focus:ring-1 focus:ring-civic-action"
            />
          </div>

          {/* Admin Toggle */}
          <div className="flex items-center space-x-2 pt-1.5">
            <input
              type="checkbox"
              id="isAdminLogin"
              checked={isAdminLogin}
              onChange={(e) => setIsAdminLogin(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-civic-action focus:ring-civic-action cursor-pointer"
            />
            <label htmlFor="isAdminLogin" className="text-xs font-semibold text-civic-navy select-none cursor-pointer flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-slate-400" /> Sign in as Municipal Administrator
            </label>
          </div>

          <Button type="submit" variant="primary" size="md" className="w-full mt-2" icon={KeyRound}>
            Sign In to Account
          </Button>
        </form>

        {/* Tip section */}
        <div className="border-t border-slate-100 pt-4 text-center">
          <p className="text-[10px] text-civic-muted leading-relaxed">
            <strong>For testing:</strong> Enter any email and password. Check the Administrator box to access the city supervisor management panel, or leave unchecked for citizen dashboard history.
          </p>
        </div>

      </div>
    </Container>
  );
};

export default Login;

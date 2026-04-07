import React from 'react';
import { motion } from 'motion/react';
import { User as UserIcon, UserPlus, XCircle, X } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

interface LoginViewProps {
  isRegistering: boolean;
  setIsRegistering: (val: boolean) => void;
  loginError: string;
  setLoginError: (val: string) => void;
  loginEmail: string;
  setLoginEmail: (val: string) => void;
  loginPassword: string;
  setLoginPassword: (val: string) => void;
  registerName: string;
  setRegisterName: (val: string) => void;
  isLoading: boolean;
  handleLogin: (e: React.FormEvent) => void;
  handleGoogleLogin: (credentialResponse: any) => void;
  setView: (view: 'home' | 'selection' | 'quiz' | 'admin' | 'results' | 'login') => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  isRegistering,
  setIsRegistering,
  loginError,
  setLoginError,
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  registerName,
  setRegisterName,
  isLoading,
  handleLogin,
  handleGoogleLogin,
  setView
}) => {
  return (
    <motion.div
      key="login"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="min-h-[60vh] flex items-center justify-center"
    >
      <div className="bg-[#1a1a1a] border border-white/5 p-10 rounded-3xl w-full max-w-md shadow-2xl">
        <div className="text-center space-y-4 mb-10">
          <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto">
            {isRegistering ? <UserPlus className="text-orange-500" size={32} /> : <UserIcon className="text-orange-500" size={32} />}
          </div>
          <h2 className="text-3xl font-bold text-white">{isRegistering ? 'Create Account' : 'Login'}</h2>
          <p className="text-gray-400">{isRegistering ? 'Join our community of learners today.' : 'Enter your credentials to access your account.'}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {loginError && (
            <div className={`p-5 border rounded-[1.5rem] flex flex-col gap-3 shadow-xl transition-all ${
              loginError.toLowerCase().includes('banned') 
                ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                : 'bg-orange-500/10 border-orange-500/20 text-orange-400'
            }`}>
              <div className="flex items-center gap-3">
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setLoginError('');
                  }}
                  className="hover:scale-110 transition-transform flex items-center justify-center p-1 -ml-1 rounded-full hover:bg-white/10"
                  title="Dismiss alert"
                >
                  <XCircle size={20} className={loginError.toLowerCase().includes('banned') ? 'text-red-500' : 'text-orange-500'} />
                </button>
                <span className="text-xs font-black uppercase tracking-widest">
                  {loginError.toLowerCase().includes('banned') ? 'Account Suspended' : 'Authentication Error'}
                </span>
              </div>
              <p className="text-[12px] font-bold leading-relaxed text-red-500/90 pl-8">
                {loginError}
              </p>
              {loginError.toLowerCase().includes('banned') && (
                <p className="text-[10px] font-black uppercase tracking-widest text-red-500/50 pl-8 mt-1 border-t border-red-500/10 pt-3">
                  CONTACT ADMINISTRATOR FOR FURTHER DETAILS.
                </p>
              )}
            </div>
          )}
          
          {isRegistering && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Full Name</label>
              <input
                type="text"
                required
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-orange-500 transition-all"
                placeholder="John Doe"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Email Address</label>
            <input
              type="text"
              required
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-orange-500 transition-all"
              placeholder="your@email.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Password</label>
            <input
              type="password"
              required
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-orange-500 transition-all"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : (isRegistering ? 'Create Account' : 'Login')}
          </button>

          <div className="relative flex items-center py-4">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink mx-4 text-gray-500 text-xs font-bold uppercase">OR</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          <div className="flex justify-center w-full">
            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={() => setLoginError('Google Login Failed')}
              theme="filled_black"
              shape="pill"
              width="360"
            />
          </div>
          
          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setLoginError('');
              }}
              className="text-sm text-orange-500 hover:text-orange-400 font-medium transition-colors"
            >
              {isRegistering ? 'Already have an account? Login' : "Don't have an account? Create one"}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setView('home')}
            className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all"
          >
            Cancel
          </button>
        </form>
      </div>
    </motion.div>
  );
};

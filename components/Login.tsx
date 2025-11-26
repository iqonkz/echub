
import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

interface LoginProps {
  onLogin: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Login state handled by onAuthStateChanged in App.tsx
    } catch (err: any) {
      console.error(err);
      setError('Ошибка входа: Неверный email или пароль');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Premium Background with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0 scale-100"
        style={{ backgroundImage: "url('https://unsplash.com/photos/H2Z8A4af4Zo/download?ixid=M3wxMjA3fDB8MXxhbGx8fHx8fHx8fHwxNzY0MTI4ODk1fA&force=true&w=1920')" }}
      />
     <div className="absolute inset-0 bg-black/0 backdrop-blur-[0px] z-1" />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-[440px] bg-white/85 dark:bg-gray-900/80 backdrop-blur-[5px] rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden flex flex-col animate-fade-in-up">
        
        {/* Header Section */}
        <div className="pt-10 pb-6 px-8 flex flex-col items-center">
            {/* SVG Logo (Extracted from Sidebar) */}
            <div className="w-64 h-auto mb-6 transform hover:scale-105 transition-transform duration-500">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 517.26 72">
                    <g>
                        <rect width="324" height="72" fill="#111827"/>
                        <rect x="324" width="193.26" height="72" fill="#f6c218"/>
                    </g>
                    <g>
                        {/* ENGINEERING Text (Yellow) */}
                        <path fill="#f6c218" d="M17.09,48.48h15.04v3.95H13V19.53H31.61v3.9h-14.52v10.2h13.3v3.81h-13.3v11.04Z"/>
                        <path fill="#f6c218" d="M59.93,19.53h4.04V52.43h-3.48l-18.75-25.66v25.66h-3.99V19.53h3.71l18.47,25.38V19.53Z"/>
                        <path fill="#f6c218" d="M85.46,36.12h17.62c-.09,4.95-1.67,9-4.72,12.15s-6.96,4.72-11.73,4.72-8.81-1.61-11.96-4.82c-3.15-3.21-4.72-7.28-4.72-12.2s1.57-8.94,4.72-12.15c3.15-3.21,7.1-4.82,11.87-4.82,2.63,0,5.08,.51,7.36,1.53,2.27,1.02,4.17,2.44,5.69,4.25,1.52,1.82,2.51,3.89,2.98,6.2h-4.23c-.47-1.57-1.27-2.95-2.4-4.16-1.13-1.21-2.5-2.14-4.11-2.8-1.61-.66-3.34-.99-5.19-.99-2.38,0-4.52,.55-6.42,1.65-1.9,1.1-3.38,2.63-4.44,4.61-1.07,1.97-1.6,4.2-1.6,6.67,0,3.82,1.15,6.94,3.45,9.35,2.3,2.41,5.3,3.62,9,3.62,2,0,3.85-.38,5.52-1.13,1.68-.75,3.07-1.8,4.18-3.15,1.11-1.35,1.87-2.9,2.28-4.65h-13.16v-3.9Z"/>
                        <path fill="#f6c218" d="M108.88,52.43V19.53h4.09V52.43h-4.09Z"/>
                        <path fill="#f6c218" d="M143.2,19.53h4.04V52.43h-3.48l-18.75-25.66v25.66h-3.99V19.53h3.71l18.47,25.38V19.53Z"/>
                        <path fill="#f6c218" d="M159.38,48.48h15.04v3.95h-19.13V19.53h18.61v3.9h-14.52v10.2h13.3v3.81h-13.3v11.04Z"/>
                        <path fill="#f6c218" d="M184.12,48.48h15.04v3.95h-19.13V19.53h18.61v3.9h-14.52v10.2h13.3v3.81h-13.3v11.04Z"/>
                        <path fill="#f6c218" d="M223.91,52.43l-7.52-12.88h-7.52v12.88h-4.09V19.53h12.45c3.1,0,5.66,.95,7.68,2.84,2.02,1.9,3.03,4.3,3.03,7.21,0,2.29-.66,4.28-1.97,5.99-1.32,1.71-3.07,2.88-5.26,3.5l7.85,13.35h-4.65Zm-15.04-29v12.22h8.18c1.97,0,3.59-.57,4.84-1.72,1.25-1.14,1.88-2.61,1.88-4.39s-.63-3.25-1.88-4.39c-1.25-1.14-2.87-1.72-4.84-1.72h-8.18Z"/>
                        <path fill="#f6c218" d="M234.2,52.43V19.53h4.09V52.43h-4.09Z"/>
                        <path fill="#f6c218" d="M268.53,19.53h4.04V52.43h-3.48l-18.75-25.66v25.66h-3.99V19.53h3.71l18.47,25.38V19.53Z"/>
                        <path fill="#f6c218" d="M294.06,36.12h17.62c-.09,4.95-1.67,9-4.72,12.15s-6.96,4.72-11.73,4.72-8.81-1.61-11.96-4.82c-3.15-3.21-4.72-7.28-4.72-12.2s1.57-8.94,4.72-12.15c3.15-3.21,7.1-4.82,11.87-4.82,2.63,0,5.08,.51,7.36,1.53,2.27,1.02,4.17,2.44,5.69,4.25,1.52,1.82,2.51,3.89,2.98,6.2h-4.23c-.47-1.57-1.27-2.95-2.4-4.16-1.13-1.21-2.5-2.14-4.11-2.8-1.61-.66-3.34-.99-5.19-.99-2.38,0-4.52,.55-6.42,1.65-1.9,1.1-3.38,2.63-4.44,4.61-1.07,1.97-1.6,4.2-1.6,6.67,0,3.82,1.15,6.94,3.45,9.35,2.3,2.41,5.3,3.62,9,3.62,2,0,3.85-.38,5.52-1.13,1.68-.75,3.07-1.8,4.18-3.15,1.11-1.35,1.87-2.9,2.28-4.65h-13.16v-3.9Z"/>
                    </g>
                    <g>
                        {/* CENTRE Text (Dark) */}
                        <path fill="#111827" d="M351.31,52.97c-4.89,0-8.92-1.6-12.1-4.79-3.18-3.2-4.77-7.25-4.77-12.17s1.59-8.98,4.77-12.17c3.18-3.2,7.21-4.79,12.1-4.79,2.51,0,4.83,.48,6.98,1.43,2.15,.96,3.96,2.31,5.45,4.07,1.49,1.75,2.53,3.81,3.13,6.16h-4.18c-.88-2.38-2.32-4.25-4.32-5.59-2.01-1.35-4.36-2.02-7.05-2.02-3.7,0-6.73,1.21-9.09,3.64-2.37,2.43-3.55,5.53-3.55,9.31s1.18,6.87,3.55,9.28c2.37,2.41,5.4,3.62,9.09,3.62,2.76,0,5.15-.71,7.19-2.14,2.04-1.43,3.48-3.41,4.32-5.95h4.23c-.94,3.73-2.83,6.68-5.66,8.86-2.84,2.18-6.2,3.27-10.08,3.27Z"/>
                        <path fill="#111827" d="M376.52,48.5h15.04v3.95h-19.13V19.55h18.61v3.9h-14.52v10.2h13.3v3.81h-13.3v11.04Z"/>
                        <path fill="#111827" d="M419.36,19.55h4.04V52.45h-3.48l-18.75-25.66v25.66h-3.99V19.55h3.71l18.47,25.38V19.55Z"/>
                        <path fill="#111827" d="M451.99,19.55v3.85h-10.01v29.05h-4.14V23.4h-10.01v-3.85h24.16Z"/>
                        <path fill="#111827" d="M475.55,52.45l-7.52-12.88h-7.52v12.88h-4.09V19.55h12.45c3.1,0,5.66,.95,7.68,2.84,2.02,1.9,3.03,4.3,3.03,7.21,0,2.29-.66,4.28-1.97,5.99-1.32,1.71-3.07,2.88-5.26,3.5l7.85,13.35h-4.65Zm-15.04-29v12.22h8.18c1.97,0,3.59-.57,4.84-1.72,1.25-1.14,1.88-2.61,1.88-4.39s-.63-3.25-1.88-4.39c-1.25-1.14-2.87-1.72-4.84-1.72h-8.18Z"/>
                        <path fill="#111827" d="M489.96,48.5h15.04v3.95h-19.13V19.55h18.61v3.9h-14.52v10.2h13.3v3.81h-13.3v11.04Z"/>
                    </g>
                </svg>
            </div>
            
            <p className="text-center text-black dark:text-white text-sm font-medium">Корпоративная CRM система</p>
        </div>

        {/* Form Section */}
        <div className="px-8 pb-10">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 rounded-xl flex items-center gap-3 text-sm animate-fade-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0" /> 
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase text-black dark:text-white mb-1.5 ml-1">Email</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-black dark:text-white group-focus-within:text-primary-500 transition-colors">
                    <Mail className="w-5 h-5" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 text-black dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all placeholder-gray-500 text-sm font-medium"
                  placeholder="user@engineering-centre.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-black dark:text-white mb-1.5 ml-1">Пароль</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-black dark:text-white group-focus-within:text-primary-500 transition-colors">
                    <Lock className="w-5 h-5" />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 text-black dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all placeholder-gray-500 text-sm font-medium"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-primary-400 to-primary-500 hover:from-primary-500 hover:to-primary-600 text-gray-900 font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Вход...
                  </>
              ) : (
                  <>
                    Войти в систему
                    <ArrowRight className="w-5 h-5" />
                  </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700/50 text-center">
             <p className="text-xs text-black dark:text-gray-300 font-medium">
               Engineering Centre HUB v0.1.6 • Protected by Firebase
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

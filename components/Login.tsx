import React, { useState } from 'react';
import { Settings, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Successful login is handled by the onAuthStateChanged listener in App.tsx usually,
      // but we can verify here too.
      console.log("Logged in:", userCredential.user.email);
    } catch (err: any) {
      console.error(err);
      setError('Ошибка входа: Неверный email или пароль');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-8">
          <div className="flex justify-center mb-8">
            <div className="bg-primary-500 p-4 rounded-full">
              <Settings className="w-12 h-12 text-gray-900" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">EC HUB</h1>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-8">Вход в корпоративную систему</p>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
                  placeholder="madi@engineering-centre.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Пароль</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-primary-500 hover:bg-primary-400 text-gray-900 font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoading ? 'Авторизация...' : 'Войти'}
              {!isLoading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 text-center">
             <p className="text-xs text-gray-400 dark:text-gray-500">Protected by Firebase Authentication</p>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900/50 px-8 py-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Нет аккаунта? <span className="text-primary-600 cursor-pointer hover:underline">Обратитесь к администратору</span></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
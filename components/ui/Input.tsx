import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'glass';
  containerClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ 
  label, 
  icon, 
  variant = 'default', 
  className = '', 
  containerClassName = '',
  id,
  ...props 
}, ref) => {
  const inputId = id || props.name || Math.random().toString(36).substr(2, 9);

  const baseStyles = "w-full rounded-xl border outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    default: "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 focus:bg-white dark:focus:bg-gray-600",
    glass: "bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-600 text-black dark:text-white placeholder-gray-500 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-gray-800/70 focus:bg-white dark:focus:bg-gray-800"
  };

  const paddingClass = icon ? "pl-11 pr-4 py-3" : "px-4 py-3";

  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label htmlFor={inputId} className="block text-xs font-bold uppercase text-gray-900 dark:text-gray-300 ml-1">
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors pointer-events-none z-10">
            {icon}
          </div>
        )}
        <input 
          ref={ref}
          id={inputId}
          className={`${baseStyles} ${variants[variant]} ${paddingClass} ${className}`}
          {...props}
        />
      </div>
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
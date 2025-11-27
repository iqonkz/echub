import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  icon?: React.ReactNode;
  options?: SelectOption[];
  containerClassName?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({ 
  label, 
  icon, 
  options, 
  children,
  className = '', 
  containerClassName = '',
  id,
  ...props 
}, ref) => {
  const selectId = id || props.name || Math.random().toString(36).substr(2, 9);

  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label htmlFor={selectId} className="block text-xs font-bold uppercase text-gray-900 dark:text-gray-300 ml-1">
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors pointer-events-none">
            {icon}
          </div>
        )}
        <select 
          ref={ref}
          id={selectId}
          className={`w-full appearance-none bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl ${icon ? 'pl-11' : 'pl-4'} pr-10 py-3 text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer disabled:opacity-50 ${className}`}
          {...props}
        >
          {options ? options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          )) : children}
        </select>
        <div className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
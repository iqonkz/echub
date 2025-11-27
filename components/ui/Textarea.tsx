import React, { forwardRef } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  containerClassName?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ 
  label, 
  className = '', 
  containerClassName = '',
  id,
  ...props 
}, ref) => {
  const textareaId = id || props.name || Math.random().toString(36).substr(2, 9);

  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label htmlFor={textareaId} className="block text-xs font-bold uppercase text-gray-900 dark:text-gray-300 ml-1">
          {label}
        </label>
      )}
      <textarea 
        ref={ref}
        id={textareaId}
        className={`w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none placeholder-gray-400 disabled:opacity-50 ${className}`}
        {...props}
      />
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;
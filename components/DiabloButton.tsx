import React from 'react';

interface DiabloButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
}

export const DiabloButton: React.FC<DiabloButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading = false,
  className = '',
  ...props 
}) => {
  const baseStyles = "relative px-6 py-2 uppercase tracking-widest font-serif font-bold transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed clip-path-slant";
  
  const variants = {
    primary: "bg-red-900/80 hover:bg-red-800 text-amber-100 border border-amber-700/50 shadow-[0_0_15px_rgba(127,29,29,0.4)] hover:shadow-[0_0_25px_rgba(220,38,38,0.6)]",
    secondary: "bg-stone-900/80 hover:bg-stone-800 text-stone-300 border border-stone-700 hover:border-stone-500",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Przyzywanie...
        </span>
      ) : (
        <>
          <span className="absolute inset-0 border border-white/10 opacity-50 mix-blend-overlay pointer-events-none"></span>
          {children}
        </>
      )}
    </button>
  );
};

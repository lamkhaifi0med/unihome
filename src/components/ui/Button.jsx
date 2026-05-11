export default function Button({ children, variant = 'primary', size = 'md', className = '', disabled = false, onClick, type = 'button', ...props }) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'bg-red-600 hover:bg-red-700 text-white font-display font-semibold rounded-xl transition-all duration-200 active:scale-95',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  }

  const baseVariant = variant === 'primary' || variant === 'secondary' || variant === 'ghost' ? '' : sizes[size]

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${variants[variant]} ${baseVariant} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

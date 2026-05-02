const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };

const LoadingSpinner = ({ size = 'md', className = '' }) => (
  <div className={`inline-block animate-spin rounded-full border-2 border-neutral-200 border-t-primary-600 ${sizes[size]} ${className}`} />
);

export default LoadingSpinner;

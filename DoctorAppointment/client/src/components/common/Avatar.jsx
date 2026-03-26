const DEFAULT_AVATAR_BG = [
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-fuchsia-500 to-pink-500',
  'from-amber-500 to-orange-500',
];

const getInitials = (name = '') => {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
};

const Avatar = ({
  src = '',
  alt = 'Profile image',
  name = '',
  size = 'md',
  className = '',
}) => {
  const initials = getInitials(name) || 'AI';
  const gradient = DEFAULT_AVATAR_BG[name.length % DEFAULT_AVATAR_BG.length];

  const sizeClasses = {
    xs: 'h-8 w-8 text-xs',
    sm: 'h-10 w-10 text-sm',
    md: 'h-12 w-12 text-base',
    lg: 'h-16 w-16 text-lg',
    xl: 'h-24 w-24 text-2xl',
  };

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`rounded-full object-cover shadow-sm ${sizeClasses[size]} ${className}`}
      />
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br ${gradient} font-semibold text-white shadow-sm ${sizeClasses[size]} ${className}`}
      aria-label={alt}
      title={name || alt}
    >
      {initials}
    </div>
  );
};

export default Avatar;

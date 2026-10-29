import React from 'react';
import * as Icons from 'lucide-react';

interface CategoryIconProps {
  name: string;
  color?: string;
  className?: string;
  size?: number;
  showBg?: boolean;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  name,
  color = '#6B7F8E',
  className = '',
  size = 18,
  showBg = true,
}) => {
  // Normalize icon name
  const LucideIcon = (Icons as any)[name] || (Icons as any)['Tag'] || Icons.CircleDollarSign;

  if (!showBg) {
    return <LucideIcon size={size} color={color} className={className} />;
  }

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full shrink-0 ${className}`}
      style={{
        backgroundColor: `${color}18`, // 10% opacity tint
        width: size * 2,
        height: size * 2,
      }}
    >
      <LucideIcon size={size} style={{ color }} />
    </div>
  );
};

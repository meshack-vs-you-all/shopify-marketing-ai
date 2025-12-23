'use client';

import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  id?: string;
}

export function Card({ children, className = '', hover = false, padding = 'md', id }: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      id={id}
      className={`
        bg-white rounded-xl shadow-soft border border-gray-100
        ${paddingClasses[padding]}
        ${hover ? 'shadow-hover cursor-pointer transition-all duration-300' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}


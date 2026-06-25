import React from 'react';
import { cn } from '@/lib/utils';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Container: React.FC<ContainerProps> = ({ children, className, ...props }) => {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-[1280px] px-4 sm:px-6 md:px-8',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

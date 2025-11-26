import React, { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden flex items-center justify-center">
      {children}
    </div>
  );
};

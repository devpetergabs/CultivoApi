import React, { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export function Layout({ children }: Props) {
  return (
    <div className="layout">
      {children}
    </div>
  );
}

import { ReactNode } from 'react';

export default function WalletLayout({ children }: { children: ReactNode }) {
  return (
    <div className="animate-fade-in-up">
      {children}
    </div>
  );
}

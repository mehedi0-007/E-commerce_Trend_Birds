import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface ForbiddenViewProps {
  moduleName?: string;
}

export const ForbiddenView: React.FC<ForbiddenViewProps> = ({ moduleName }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.15)',
          color: 'var(--danger)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem',
          border: '1px solid rgba(239, 68, 68, 0.3)',
        }}
      >
        <ShieldAlert size={36} />
      </div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        403 - Access Denied
      </h2>
      <p
        style={{
          color: 'var(--text-secondary)',
          maxWidth: '480px',
          marginBottom: '1.5rem',
          fontSize: '0.925rem',
        }}
      >
        You do not have the required watch permission to access the{' '}
        <strong>{moduleName || 'requested resource'}</strong>. Please contact your system administrator if you believe this is an error.
      </p>
    </div>
  );
};

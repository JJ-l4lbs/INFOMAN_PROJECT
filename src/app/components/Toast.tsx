"use client";

import React, { useEffect } from 'react';
import { X, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'var(--color-approved-bg, #d1fae5)',
          border: 'var(--color-approved-border, #a7f3d0)',
          text: 'var(--color-approved, #059669)',
          icon: <CheckCircle2 size={20} />
        };
      case 'error':
        return {
          bg: 'var(--color-rejected-bg, #ffe4e6)',
          border: 'var(--color-rejected-border, #fecdd3)',
          text: 'var(--color-rejected, #e11d48)',
          icon: <AlertTriangle size={20} />
        };
      default:
        return {
          bg: 'var(--bg-secondary, #ffffff)',
          border: 'var(--color-border, #cbd5e1)',
          text: 'var(--text-primary, #0f172a)',
          icon: <Info size={20} />
        };
    }
  };

  const colors = getColors();

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: 'var(--radius-lg, 0.75rem)',
        boxShadow: 'var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1))',
        color: colors.text,
        minWidth: '320px',
        maxWidth: '480px',
        animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{colors.icon}</div>
      <div 
        style={{ 
          flexGrow: 1, 
          fontSize: '0.875rem', 
          fontWeight: 500, 
          lineHeight: 1.4, 
          color: 'var(--text-primary, #0f172a)',
          whiteSpace: 'pre-wrap'
        }}
      >
        {message}
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '2px',
          color: 'var(--text-secondary, #475569)',
          opacity: 0.6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'var(--transition-smooth, all 0.2s ease)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
      >
        <X size={16} />
      </button>
    </div>
  );
}

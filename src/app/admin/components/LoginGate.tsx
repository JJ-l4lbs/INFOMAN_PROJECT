"use client";

import React from 'react';
import { Lock } from 'lucide-react';

interface LoginGateProps {
  password: string;
  setPassword: (val: string) => void;
  authError: string;
  handleLogin: (e: React.FormEvent) => void;
}

export default function LoginGate({
  password,
  setPassword,
  authError,
  handleLogin
}: LoginGateProps) {
  return (
    <main style={{ maxWidth: '400px', margin: '6rem auto', padding: '0 1.5rem', animation: 'fadeIn 0.3s ease-out' }}>
      <div className="card" style={{ padding: '2.5rem', borderRadius: 'var(--radius-xl)', textAlign: 'center' }}>
        <div style={{
          width: '3.5rem',
          height: '3.5rem',
          borderRadius: '50%',
          backgroundColor: 'var(--color-primary-light)',
          color: 'var(--color-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem'
        }}>
          <Lock size={24} />
        </div>
        
        <h1 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-accent)', marginBottom: '0.5rem' }}>
          Admin Console Gate
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          Please authenticate using your administrative credentials to manage exam records.
        </p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group" style={{ textAlign: 'left' }}>
            <label className="form-label">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="form-input" 
              placeholder="Enter password..." 
              required 
            />
          </div>
          
          {authError && (
            <p style={{ color: 'var(--color-rejected)', fontSize: '0.8rem', fontWeight: 500 }}>
              ❌ {authError}
            </p>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
            Login Credentials
          </button>
        </form>
        
        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '1.5rem' }}>
          Tip: Default password is <strong>admin123</strong>
        </p>
      </div>
    </main>
  );
}

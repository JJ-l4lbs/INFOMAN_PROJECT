"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Application, Applicant } from '@/types';
import { Search, Loader2, AlertCircle, Calendar, MapPin, CheckCircle, Info, Landmark } from 'lucide-react';

interface JoinResult extends Application {
  applicants: Applicant;
}

function TrackingContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<JoinResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Automatically trigger search if 'ref' is present in URL parameters
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setQuery(ref);
      triggerSearch(ref);
    }
  }, [searchParams]);

  const triggerSearch = async (searchVal: string) => {
    if (!searchVal.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);
    setSearched(true);

    try {
      // Step 1: Check if input is email. If so, find applicant_id(s) first
      let applicantIds: string[] = [];
      if (searchVal.includes('@')) {
        const { data: applicantData, error: applicantErr } = await supabase
          .from('applicants')
          .select('applicant_id')
          .eq('email', searchVal.trim());
        
        if (applicantErr) throw new Error(applicantErr.message);
        if (applicantData && applicantData.length > 0) {
          applicantIds = applicantData.map(a => a.applicant_id);
        }
      }

      // Step 2: Query applications by application_no or applicant_ids
      let queryBuilder = supabase
        .from('applications')
        .select(`
          *,
          applicants (
            applicant_id,
            name,
            email,
            mobile_number,
            permanent_address
          )
        `);

      if (applicantIds.length > 0) {
        queryBuilder = queryBuilder.or(`application_no.eq.${searchVal.trim()},applicant_id.in.(${applicantIds.map(id => `"${id}"`).join(',')})`);
      } else {
        queryBuilder = queryBuilder.eq('application_no', searchVal.trim());
      }

      const { data, error: queryErr } = await queryBuilder;

      if (queryErr) throw new Error(queryErr.message);

      if (data) {
        setResults(data as unknown as JoinResult[]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to search application record.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerSearch(query);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-accent)', marginBottom: '0.5rem' }}>
          Track Application
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
          Search by your Application Reference Number (e.g., APPNO-XXXXX) or your registered Email Address.
        </p>
      </header>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} style={{
        display: 'flex',
        gap: '0.75rem',
        maxWidth: '550px',
        width: '100%',
        margin: '0 auto'
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{
            position: 'absolute',
            left: '0.875rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)'
          }} />
          <input
            type="text"
            placeholder="Enter Application No. or Email Address..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '2.5rem' }}
            required
          />
        </div>
        <button type="submit" disabled={loading} className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {loading ? <Loader2 className="spinner" /> : 'Search'}
        </button>
      </form>

      {error && (
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          backgroundColor: 'var(--color-rejected-bg)',
          color: 'var(--color-rejected)',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-rejected-border)',
          maxWidth: '600px',
          margin: '0 auto',
          fontSize: '0.9rem'
        }}>
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Spinner */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
          <Loader2 className="spinner" style={{ color: 'var(--color-primary)', width: '2.5rem', height: '2.5rem' }} />
        </div>
      )}

      {/* Results Display */}
      {!loading && searched && (
        <div style={{ maxWidth: '600px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {results.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-secondary)' }}>
              <Info size={36} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
              <p style={{ fontWeight: '500' }}>No Application Record Found</p>
              <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Double check the application reference code or registered email.</p>
            </div>
          ) : (
            results.map((app) => {
              const status = app.status || 'Pending';
              return (
                <div key={app.application_no} className="card animate-fade-in" style={{
                  padding: '2rem',
                  borderRadius: 'var(--radius-xl)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.5rem',
                  borderTop: `4px solid ${
                    status === 'Approved' ? 'var(--color-approved)' : 
                    status === 'Rejected' ? 'var(--color-rejected)' : 'var(--color-pending)'
                  }`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>APPLICATION NUMBER</span>
                      <h2 style={{ fontSize: '1.25rem', fontFamily: 'monospace', fontWeight: 700 }}>{app.application_no}</h2>
                    </div>
                    <span className={`badge badge-${status.toLowerCase()}`}>
                      {status}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', padding: '1rem 0' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Applicant Name</span>
                      <p style={{ fontWeight: '500', fontSize: '0.95rem' }}>{app.applicants?.name}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Registered Email</span>
                      <p style={{ fontWeight: '500', fontSize: '0.95rem' }}>{app.applicants?.email}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Submitted Date</span>
                      <p style={{ fontWeight: '500', fontSize: '0.95rem' }}>{app.forms_date}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Examination Applied For</span>
                      <p style={{ fontWeight: '500', fontSize: '0.95rem' }}>{app.exam_applied_for}</p>
                    </div>
                  </div>

                  {/* Contextual Status Alerts */}
                  {status === 'Approved' && (
                    <div style={{
                      backgroundColor: 'var(--color-approved-bg)',
                      border: '1px solid var(--color-approved-border)',
                      color: 'var(--color-approved)',
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-lg)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontWeight: 600, fontSize: '0.95rem' }}>
                        <CheckCircle size={18} />
                        Your Application is Approved!
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-approved)' }}>
                        Please review the schedules below. Make sure to bring your valid government ID and printed exam confirmation on the day of the exam.
                      </p>
                      
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        marginTop: '0.25rem',
                        borderTop: '1px solid var(--color-approved-border)',
                        paddingTop: '0.75rem',
                        color: 'var(--color-approved)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                          <Calendar size={16} />
                          <strong>Date:</strong> {app.exam_date}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                          <MapPin size={16} />
                          <strong>Venue:</strong> {app.exam_place}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                          <Landmark size={16} />
                          <strong>CSC regional Office:</strong> Region {app.csr_regional_office}
                        </div>
                      </div>
                    </div>
                  )}

                  {status === 'Pending' && (
                    <div style={{
                      backgroundColor: 'var(--color-pending-bg)',
                      border: '1px solid var(--color-pending-border)',
                      color: 'var(--color-pending)',
                      padding: '1rem',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: '0.875rem',
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'flex-start'
                    }}>
                      <Info size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                      <div>
                        <strong>Validation Pending:</strong> Our database managers are currently validating your education records and eligibility credentials. Check back soon for scheduling updates.
                      </div>
                    </div>
                  )}

                  {status === 'Rejected' && (
                    <div style={{
                      backgroundColor: 'var(--color-rejected-bg)',
                      border: '1px solid var(--color-rejected-border)',
                      color: 'var(--color-rejected)',
                      padding: '1rem',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: '0.875rem',
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'flex-start'
                    }}>
                      <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                      <div>
                        <strong>Application Denied:</strong> Your submission did not meet the validation criteria or contained duplicate filings. Please coordinate with your CSC Regional Office ({app.csr_regional_office}) for re-evaluations.
                      </div>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default function Track() {
  return (
    <main style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1.5rem', animation: 'fadeIn 0.3s ease-out' }}>
      <Suspense fallback={
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
          <Loader2 className="spinner" style={{ color: 'var(--color-primary)', width: '2.5rem', height: '2.5rem' }} />
        </div>
      }>
        <TrackingContent />
      </Suspense>
    </main>
  );
}

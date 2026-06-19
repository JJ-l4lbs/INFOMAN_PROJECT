"use client";

import React from 'react';
import { 
  User, BookOpen, Briefcase, Award, CheckCircle, 
  ArrowRight, ArrowLeft, Loader2, AlertCircle
} from 'lucide-react';

import { useApplyForm } from './hooks/useApplyForm';
import PersonalInfoForm from './components/PersonalInfoForm';
import EducationForm from './components/EducationForm';
import EmploymentForm from './components/EmploymentForm';
import DisabilitiesForm from './components/DisabilitiesForm';
import ReviewStep from './components/ReviewStep';
import SuccessDisplay from './components/SuccessDisplay';

export default function Apply() {
  const {
    step,
    schools,
    agencies,
    loadingLookups,
    submitting,
    submitError,
    successDetails,
    personal,
    education,
    employment,
    disabilities,
    setDisabilities,
    eligibilityProofs,
    newProof,
    setNewProof,
    handlePersonalChange,
    handleEducationChange,
    handleEmploymentChange,
    addEligibilityProof,
    removeEligibilityProof,
    validateStep,
    handleSubmit,
    nextStep,
    prevStep
  } = useApplyForm();

  if (successDetails) {
    return <SuccessDisplay successDetails={successDetails} />;
  }

  return (
    <main style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1.5rem', animation: 'fadeIn 0.3s ease-out' }}>
      <div className="card" style={{ padding: '2.5rem', borderRadius: 'var(--radius-xl)' }}>
        
        {/* Step Indicator Header */}
        <header style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-accent)', marginBottom: '1.25rem' }}>
            Exam Application Form
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative' }}>
            {[
              { num: 1, label: 'Personal', icon: <User size={16} /> },
              { num: 2, label: 'Education', icon: <BookOpen size={16} /> },
              { num: 3, label: 'Employment', icon: <Briefcase size={16} />, hide: personal.employment_status !== 'Employed' },
              { num: 4, label: 'Credentials', icon: <Award size={16} /> },
              { num: 5, label: 'Review', icon: <CheckCircle size={16} /> }
            ].filter(s => !s.hide).map((s, idx, arr) => (
              <React.Fragment key={s.num}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: step === s.num ? 'var(--color-primary)' : step > s.num ? 'var(--color-approved)' : 'var(--text-muted)',
                  fontWeight: step === s.num ? '600' : '500',
                  fontSize: '0.85rem'
                }}>
                  <div style={{
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '50%',
                    backgroundColor: step === s.num ? 'var(--color-primary-light)' : step > s.num ? 'var(--color-approved-bg)' : 'var(--bg-tertiary)',
                    border: `1px solid ${step === s.num ? 'var(--color-primary)' : step > s.num ? 'var(--color-approved-border)' : 'var(--color-border)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {s.icon}
                  </div>
                  <span className="font-accent" style={{ display: 'none', sm: 'inline' } as any}>{s.label}</span>
                </div>
                {idx < arr.length - 1 && (
                  <div style={{
                    flex: 1,
                    height: '2px',
                    backgroundColor: step > s.num ? 'var(--color-approved-border)' : 'var(--color-border)',
                    minWidth: '1rem'
                  }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </header>

        {loadingLookups ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '3rem 0' }}>
            <Loader2 className="spinner" style={{ color: 'var(--color-primary)' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Retrieving lookup lists from database...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            
            {submitError && (
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                backgroundColor: 'var(--color-rejected-bg)',
                border: '1px solid var(--color-rejected-border)',
                color: 'var(--color-rejected)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.5rem',
                fontSize: '0.875rem'
              }}>
                <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                <span>{submitError}</span>
              </div>
            )}

            {step === 1 && (
              <PersonalInfoForm personal={personal} onChange={handlePersonalChange} />
            )}

            {step === 2 && (
              <EducationForm education={education} onChange={handleEducationChange} schools={schools} />
            )}

            {step === 3 && personal.employment_status === 'Employed' && (
              <EmploymentForm employment={employment} onChange={handleEmploymentChange} agencies={agencies} />
            )}

            {step === 4 && (
              <DisabilitiesForm
                disabilities={disabilities}
                setDisabilities={setDisabilities}
                eligibilityProofs={eligibilityProofs}
                newProof={newProof}
                setNewProof={setNewProof}
                addEligibilityProof={addEligibilityProof}
                removeEligibilityProof={removeEligibilityProof}
              />
            )}

            {step === 5 && (
              <ReviewStep
                personal={personal}
                education={education}
                employment={employment}
                disabilities={disabilities}
                eligibilityProofs={eligibilityProofs}
              />
            )}

            {/* Navigation Buttons Footer */}
            <footer style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '2.5rem',
              borderTop: '1px solid var(--color-border)',
              paddingTop: '1.5rem'
            }}>
              {step > 1 ? (
                <button type="button" onClick={prevStep} className="btn btn-secondary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <ArrowLeft size={16} /> Back
                </button>
              ) : (
                <div />
              )}

              {step < 5 ? (
                <button type="button" onClick={nextStep} disabled={!validateStep()} className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  Next <ArrowRight size={16} />
                </button>
              ) : (
                <button type="submit" disabled={submitting} className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', backgroundColor: 'var(--color-approved)' }}>
                  {submitting ? (
                    <>
                      <Loader2 className="spinner" /> Submitting...
                    </>
                  ) : (
                    <>
                      Submit Application <CheckCircle size={16} />
                    </>
                  )}
                </button>
              )}
            </footer>
          </form>
        )}
      </div>
    </main>
  );
}

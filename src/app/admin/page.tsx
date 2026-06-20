"use client";

import React from 'react';
import { Database, LogOut } from 'lucide-react';
import { useAdminDashboard } from './hooks/useAdminDashboard';

import LoginGate from './components/LoginGate';
import ApplicationsTable from './components/ApplicationsTable';
import DetailSidebar from './components/DetailSidebar';
import CreateModal from './components/CreateModal';
import EditModal from './components/EditModal';
import Toast from '../components/Toast';

export default function Admin() {
  const {
    isAuthenticated,
    password,
    setPassword,
    authError,
    handleLogin,
    handleLogout,
    loading,
    error,
    schools,
    agencies,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    selectedApp,
    setSelectedApp,
    loadingDetail,
    detailedData,
    editStatus,
    setEditStatus,
    editRegionalOffice,
    setEditRegionalOffice,
    editExamDate,
    setEditExamDate,
    editExamPlace,
    setEditExamPlace,
    savingEdit,
    handleUpdateApplication,
    handleDeleteApplicant,
    handleViewDetails,
    showCreateModal,
    setShowCreateModal,
    showEditModal,
    setShowEditModal,
    activeTab,
    setActiveTab,
    formValues,
    handleFormChange,
    handleDisabilityChange,
    newProof,
    setNewProof,
    addProof,
    removeProof,
    proofs,
    savingModal,
    actionError,
    handleSaveFullEdit,
    handleSaveManualCreate,
    filteredApps,
    handleOpenCreateModal,
    handleOpenEditModal,
    fetchApplications,
    toast,
    setToast,
    sortField,
    sortOrder,
    handleSort
  } = useAdminDashboard();

  if (!isAuthenticated) {
    return (
      <LoginGate
        password={password}
        setPassword={setPassword}
        authError={authError}
        handleLogin={handleLogin}
      />
    );
  }

  return (
    <main style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1.5rem', animation: 'fadeIn 0.2s ease-out' }}>
      
      {/* Title Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-accent)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={28} style={{ color: 'var(--color-primary)' }} />
            Database Control Panel
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Inspect, schedule, validate, or delete exam applicant registrations under strict Row Level Security.
          </p>
        </div>
        <button onClick={handleLogout} className="btn btn-secondary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem' }}>
          <LogOut size={16} /> Log Out
        </button>
      </header>

      {/* Main Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        
        <ApplicationsTable
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          handleOpenCreateModal={handleOpenCreateModal}
          loading={loading}
          error={error}
          fetchApplications={fetchApplications}
          filteredApps={filteredApps}
          selectedApp={selectedApp}
          handleViewDetails={handleViewDetails}
          handleDeleteApplicant={handleDeleteApplicant}
          sortField={sortField}
          sortOrder={sortOrder}
          handleSort={handleSort}
        />

      </div>

      {selectedApp && !showEditModal && (
        <DetailSidebar
          selectedApp={selectedApp}
          setSelectedApp={setSelectedApp}
          handleOpenEditModal={handleOpenEditModal}
          loadingDetail={loadingDetail}
          detailedData={detailedData}
          editStatus={editStatus}
          setEditStatus={setEditStatus}
          editRegionalOffice={editRegionalOffice}
          setEditRegionalOffice={setEditRegionalOffice}
          editExamDate={editExamDate}
          setEditExamDate={setEditExamDate}
          editExamPlace={editExamPlace}
          setEditExamPlace={setEditExamPlace}
          handleUpdateApplication={handleUpdateApplication}
          savingEdit={savingEdit}
        />
      )}

      {showCreateModal && (
        <CreateModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleSaveManualCreate}
          actionError={actionError}
          formValues={formValues}
          handleFormChange={handleFormChange}
          handleDisabilityChange={handleDisabilityChange}
          newProof={newProof}
          setNewProof={setNewProof}
          addProof={addProof}
          proofs={proofs}
          removeProof={removeProof}
          savingModal={savingModal}
          schools={schools}
          agencies={agencies}
        />
      )}

      {showEditModal && selectedApp && (
        <EditModal
          onClose={() => setShowEditModal(false)}
          onSubmit={handleSaveFullEdit}
          actionError={actionError}
          selectedApp={selectedApp}
          formValues={formValues}
          handleFormChange={handleFormChange}
          handleDisabilityChange={handleDisabilityChange}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          newProof={newProof}
          setNewProof={setNewProof}
          addProof={addProof}
          proofs={proofs}
          removeProof={removeProof}
          savingModal={savingModal}
          schools={schools}
          agencies={agencies}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

    </main>
  );
}

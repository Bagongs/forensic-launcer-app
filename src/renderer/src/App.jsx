/* eslint-disable react/prop-types */
import { useState } from 'react'
import './assets/main.css'

import { IoMdCloseCircle } from 'react-icons/io'
import CloseConfirmModal from './components/CloseConfirmModal'

import bgLauncher from './assets/images/Background Launcher.png'
import headerImg from './assets/images/Launcher Header.svg'

import cardSvg from './assets/icons/Card.svg'
import buttonSvg from './assets/icons/Button.svg'

import iconCase from './assets/icons/Case Management.svg'
import iconAnalytics from './assets/icons/Analytic.svg'
import iconEncryptor from './assets/icons/Encryptor.svg'
import LicenseGate from './components/LicensePage'

function AppCard({ icon, title, description, onLaunch }) {
  return (
    <div className="launcher-card">
      {/* background card */}
      <img src={cardSvg} alt="" className="launcher-card-bg" />

      <div className="launcher-card-inner">
        {/* icon app */}
        <div className="launcher-card-icon-wrapper">
          <img src={icon} alt={title} className="launcher-card-icon" />
        </div>

        {/* texts */}
        <div className="launcher-card-text">
          <h2 className="launcher-card-title">{title}</h2>
          <p className="launcher-card-description">{description}</p>
        </div>

        {/* button */}
        <button className="launcher-btn" onClick={onLaunch}>
          <img src={buttonSvg} alt="Launch" className="launcher-btn-bg" />
          <span className="launcher-btn-label">LAUNCH APPS</span>
        </button>
      </div>
    </div>
  )
}

function App() {
  const api = window.api || {}

  // === STATE UNTUK MODAL ===
  const [showConfirm, setShowConfirm] = useState(false)

  // === Launch handlers ===
  const launchCase = () => api.launchApp?.('case')
  const launchAnalytics = () => api.launchApp?.('analytics')
  const launchEncryptor = () => api.launchApp?.('encryptor')

  // === Close button di pojok kanan atas ===
  const handleClickClose = () => {
    setShowConfirm(true)
  }

  const handleCancelClose = () => {
    setShowConfirm(false)
  }

  const handleConfirmClose = () => {
    api.quitLauncher?.() // Electron akan menutup app
  }

  return (
    <LicenseGate>
      <>
        <div className="launcher-root" style={{ backgroundImage: `url(${bgLauncher})` }}>
          {/* Header */}
          <img src={headerImg} alt="Big Data Analysis Platform" className="launcher-header" />

          {/* Close Button -> buka modal */}
          <button className="launcher-close" onClick={handleClickClose} aria-label="Close">
            <IoMdCloseCircle className="launcher-close-icon" />
          </button>

          {/* kontainer kartu */}
          <div className="launcher-center">
            <AppCard
              icon={iconCase}
              title="Case Analytics Platform"
              description="System for managing cases, evidence records, and suspect profiles."
              onLaunch={launchCase}
            />

            <AppCard
              icon={iconAnalytics}
              title="Data Analytics Platform"
              description="Processes SDP data into structured analytical outputs."
              onLaunch={launchAnalytics}
            />

            <AppCard
              icon={iconEncryptor}
              title="Encryptor Analytics Platform"
              description="Converts XLS/CSV/TXT files into standardized SDP format."
              onLaunch={launchEncryptor}
            />
          </div>

          {/* Footer */}
          <div className="launcher-footer">© Copyright 2025</div>
        </div>

        {/* Modal Close Confirmation */}
        <CloseConfirmModal
          open={showConfirm}
          onCancel={handleCancelClose}
          onConfirm={handleConfirmClose}
        />
      </>
    </LicenseGate>
  )
}

export default App

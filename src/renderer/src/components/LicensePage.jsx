import { useEffect, useState } from 'react'

// eslint-disable-next-line react/prop-types
export default function LicenseGate({ children }) {
  const [licenseData, setLicenseData] = useState(null)
  const [backendError, setBackendError] = useState(false)

  // ===== FRONTEND CHECK =====
  const FRONTEND_EXPIRED_DATE = '2028-01-01'
  const frontendExpired = new Date() >= new Date(FRONTEND_EXPIRED_DATE)

  if (frontendExpired) {
    return (
      <div className="license-overlay">
        <h1 className="license-text">License Expired</h1>
      </div>
    )
  }

  // ===== BACKEND CHECK =====
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    async function checkLicense() {
      try {
        const res = await window.license.getInfo()

        if (!res || !res.data || !res.data.now || !res.data.end_date) {
          setBackendError(true)
          return
        }

        setLicenseData(res)
      } catch (err) {
        setBackendError(true)
      }
    }

    checkLicense()
  }, [])

  // ===== LOADING =====
  if (!licenseData && !backendError) {
    return (
      <div className="license-overlay">
        <h1 className="license-text">Connecting...</h1>
      </div>
    )
  }

  // ===== BACKEND RESULT =====
  if (licenseData && licenseData.data) {
    const { now, end_date } = licenseData.data
    const expired = new Date(now) >= new Date(end_date)

    if (expired) {
      return (
        <div className="license-overlay">
          <h1 className="license-text">License Expired</h1>
        </div>
      )
    }
  }

  // ===== LICENSE VALID / BACKEND MATI =====
  return children
}

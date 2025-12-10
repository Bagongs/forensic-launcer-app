import { useEffect, useState } from 'react'

// eslint-disable-next-line react/prop-types
export default function LicenseGate({ children }) {
  const [licenseData, setLicenseData] = useState(null)

  useEffect(() => {
    async function checkLicense() {
      try {
        const res = await window.license.getInfo()
        setLicenseData(res)
      } catch (e) {
        console.error('Failed to load license:', e)
      }
    }

    checkLicense()
  }, [])

  if (!licenseData) {
    return (
      <div className="license-overlay">
        <h1 className="license-text">Checking License...</h1>
      </div>
    )
  }

  const { now, end_date } = licenseData.data

  const nowDate = new Date(now)
  const endDate = new Date(end_date)

  const expired = nowDate >= endDate

  if (expired) {
    return (
      <div className="license-overlay">
        <h1 className="license-text">License Expired</h1>
      </div>
    )
  }

  return children
}

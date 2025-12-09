/* eslint-disable react/prop-types */
import { AiFillWarning } from 'react-icons/ai'
import '../assets/main.css' // pakai CSS global kamu

export default function CloseConfirmModal({ open, onCancel, onConfirm }) {
  if (!open) return null

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="close-confirm-title"
      onClick={onCancel}
    >
      {/* overlay */}
      <div className="modal-backdrop" />

      {/* dialog */}
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()} // supaya klik dalam modal tidak menutup
      >
        {/* Header */}
        <div className="modal-header">
          <h2 id="close-confirm-title" className="modal-title">
            Close Confirmation
          </h2>
          <button onClick={onCancel} aria-label="Close" className="modal-header-close">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <AiFillWarning className="modal-warning-icon" />
          <p className="modal-text">Are you sure want to close app?</p>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" onClick={onCancel} className="modal-btn modal-btn-cancel">
            CANCEL
          </button>
          <button type="button" onClick={onConfirm} className="modal-btn modal-btn-confirm">
            YES
          </button>
        </div>
      </div>
    </div>
  )
}

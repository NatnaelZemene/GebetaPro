import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { LogOut, ShieldCheck, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from './Button.jsx'
import { useFocusTrap } from '../../hooks/useFocusTrap.js'

export function LogoutConfirmation({ isOpen, onCancel, onConfirm }) {
  const { t } = useTranslation()
  const dialogRef = useFocusTrap(isOpen)

  useEffect(() => {
    if (!isOpen) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-[3px] animate-fade-in"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel()
      }}
    >
      <section
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="logout-dialog-title"
        aria-describedby="logout-dialog-description"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            event.stopPropagation()
            onCancel()
          }
        }}
        className="relative my-auto w-full max-w-[430px] overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-black/20 outline-none animate-fade-in"
      >
        <div className="flex items-start gap-4 px-6 pb-5 pt-6 sm:px-7 sm:pt-7">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-200 bg-danger-bg text-danger shadow-sm dark:border-red-900/40">
            <LogOut size={21} strokeWidth={1.8} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-ink-3">
              GebetaPro · {t('nav.logout', 'Log out')}
            </p>
            <h2 id="logout-dialog-title" className="text-[19px] font-semibold tracking-[-0.025em] text-ink sm:text-[21px]">
              {t('nav.logoutDialogTitle')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label={t('nav.cancelLogout')}
            className="-mr-2 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <X size={17} aria-hidden="true" />
          </button>
        </div>

        <div className="px-6 pb-6 sm:px-7 sm:pb-7">
          <p id="logout-dialog-description" className="text-[13.5px] leading-6 text-ink-2">
            {t('nav.logoutDialogDescription')}
          </p>
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-border bg-canvas px-4 py-3.5">
            <ShieldCheck size={17} className="mt-0.5 shrink-0 text-brand" strokeWidth={1.8} aria-hidden="true" />
            <div>
              <p className="text-[12.5px] font-semibold text-ink">{t('nav.logoutDialogSecurity')}</p>
              <p className="mt-0.5 text-[11.5px] leading-5 text-ink-3">{t('nav.logoutDialogSecurityText')}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" size="md" onClick={onCancel} className="w-full sm:w-auto">
              {t('nav.cancelLogout')}
            </Button>
            <Button variant="danger" size="md" onClick={onConfirm} icon={<LogOut size={14} aria-hidden="true" />} className="w-full sm:w-auto">
              {t('nav.confirmLogout')}
            </Button>
          </div>
        </div>
      </section>
    </div>,
    document.body,
  )
}

import { Shield } from 'lucide-react'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="shrink-0 border-t border-border">
      <div className="max-w-5xl mx-auto px-4 lg:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-text-tertiary">
          <Shield size={13} className="text-brand-400" />
          <span>FinVeil &copy; {year} &mdash; Confidential Credit Infrastructure</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-text-tertiary">
          {['Docs', 'Whitepaper', 'GitHub', 'Terms'].map((link) => (
            <a key={link} href="#" className="hover:text-text-primary transition-colors no-underline">
              {link}
            </a>
          ))}
          <span className="text-border">|</span>
          <span>
            Built on <span className="text-accent-400">Fhenix</span> &amp;{' '}
            <span className="text-accent-400">CoFHE</span>
          </span>
        </div>
      </div>
    </footer>
  )
}

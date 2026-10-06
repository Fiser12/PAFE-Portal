import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function VolverAlPortal() {
  return (
    <Link
      href="/"
      className="btn btn--style-secondary btn--size-small btn--icon-style-without-border"
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', margin: 0 }}
    >
      <ArrowLeft size={16} aria-hidden="true" />
      Volver al portal
    </Link>
  )
}

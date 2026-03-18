'use client'

import { useState } from 'react'

export function ShareButton() {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard not available (e.g., non-HTTPS in dev) — silent fail
    }
  }

  return (
    <button
      type="button"
      title="Copy link"
      onClick={() => void handleCopy()}
      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-xs"
    >
      {copied ? '✓' : '🔗'}
    </button>
  )
}

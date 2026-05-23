import React from 'react'

/**
 * Custom Payload admin Logo — shown on the login screen.
 * Replaces the default Payload mark with the fullstp.com wordmark.
 *
 * Sizing: Payload renders this in a ~200x80px hero area on the login page,
 * so we use a generous fluid type with the wordmark on a transparent ground
 * to inherit the admin theme (light or dark).
 */
export default function Logo() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem 0',
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <span
        style={{
          fontSize: '2.5rem',
          fontWeight: 800,
          letterSpacing: '-0.04em',
          lineHeight: 1,
          color: 'var(--theme-elevation-1000, #0a0a0a)',
        }}
      >
        fullstp
        <span style={{ color: 'var(--theme-success-500, #16a34a)' }}>.</span>
        <span style={{ color: 'var(--theme-elevation-600, #71717a)', fontWeight: 600 }}>com</span>
      </span>
    </div>
  )
}

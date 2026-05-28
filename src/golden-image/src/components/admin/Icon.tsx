import React from 'react'

/**
 * Custom Payload admin Icon — shown in the dashboard top-left nav,
 * page tabs, and browser favicon-adjacent spots. Smaller scale than
 * the login Logo. Same wordmark, sized for the nav rail.
 */
export default function Icon() {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        fontSize: '1rem',
        fontWeight: 700,
        letterSpacing: '-0.025em',
        lineHeight: 1,
        color: 'var(--theme-elevation-1000, #0a0a0a)',
      }}
    >
      fullstp
      <span style={{ color: 'var(--theme-success-500, #16a34a)' }}>.</span>
      <span style={{ color: 'var(--theme-elevation-600, #71717a)', fontWeight: 600 }}>com</span>
    </span>
  )
}

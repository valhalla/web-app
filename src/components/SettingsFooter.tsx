import React from 'react'

export const SettingsFooter = () => {
  return (
    <div className="ml2 mr2">
      <span className="custom-label">
        Calculations by{' '}
        <a
          href="https://github.com/valhalla/valhalla"
          target="_blank"
          rel="noopener noreferrer"
        >
          Valhalla
        </a>{' '}
        • Visualized with{' '}
        <a
          href="https://github.com/gis-ops/valhalla-app/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Valhalla App
        </a>
      </span>
    </div>
  )
}

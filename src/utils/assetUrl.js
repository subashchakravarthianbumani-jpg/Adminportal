'use client'

const stripApiSuffix = url => (url || '').replace(/\/api\/?$/, '')

export const buildAssetUrl = path => {
  if (!path) return ''

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  const apiBase = stripApiSuffix(process.env.NEXT_PUBLIC_API_URL)
  const appBase = process.env.NEXT_PUBLIC_APP_URL || ''
  const runtimeBase = typeof window !== 'undefined' ? window.location.origin : ''

  const isLocalHost = url => /^(https?:\/\/)?(localhost|127\.|0\.0\.0\.0|192\.168\.)/i.test(url || '')

  let base = apiBase || appBase

  if ((!base || isLocalHost(base)) && runtimeBase && !isLocalHost(runtimeBase)) {
    base = runtimeBase
  }

  if (!base) {
    base = runtimeBase || ''
  }

  const cleanPath = path.startsWith('/') ? path : `/${path}`

  return `${base}${cleanPath}`
}

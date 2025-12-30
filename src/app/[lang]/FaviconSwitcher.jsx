'use client'

import { useEffect } from 'react'

import useSettingsList from '../../views/useSettingsList'
import { buildAssetUrl } from '@/utils/assetUrl'

export default function FaviconSwitcher() {
  const { settingsList } = useSettingsList()

  const AdminFaviLogo = settingsList?.find(x => x.Key === 'AdminFaviLogo')?.Value
  const faviconHref = buildAssetUrl(AdminFaviLogo)

  useEffect(() => {
    if (!faviconHref) return

    const link = document.querySelector("link[rel='icon']")

    if (link) {
      link.href = faviconHref
    } else {
      const newLink = document.createElement("link")

      newLink.rel = "icon"
      newLink.href = faviconHref
      document.head.appendChild(newLink)
    }
  }, [faviconHref])

  return null
}

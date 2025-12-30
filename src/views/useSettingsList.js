'use client'

import { useEffect, useState } from 'react'

export default function useSettingsList() {
  const [settingsList, setSettings] = useState(null)
  const [loadingList, setLoading] = useState(true)

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/apps/settingslist')
      const json = await res.json()

      if (json.status) {
        setSettings(json.data)
      }
    } catch (error) {
      console.error('Settings fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  return { settingsList, loadingList }
}

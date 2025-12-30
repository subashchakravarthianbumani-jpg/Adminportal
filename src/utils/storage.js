export const getLocalStorageItem = (key) => {
  if (typeof window === 'undefined') return null // avoid SSR crash

  try {
    return localStorage.getItem(key)
  } catch (err) {
    console.error('LocalStorage read error:', err)

    return null
  }
}

export const setLocalStorageItem = (key, value) => {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(key, value)
  } catch (err) {
    console.error('LocalStorage write error:', err)
  }
}

export const removeLocalStorageItem = (key) => {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(key)
  } catch (err) {
    console.error('LocalStorage remove error:', err)
  }
}

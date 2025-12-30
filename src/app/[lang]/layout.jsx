// Next Imports
import { headers } from 'next/headers'

// Third-party Imports

// Component Imports

// HOC Imports
import TranslationWrapper from '@/hocs/TranslationWrapper'

// Config Imports
import { i18n } from '@configs/i18n'

// Style Imports
import '@/app/globals.css'

import 'react-quill/dist/quill.snow.css';


// Generated Icon CSS Imports
import '@assets/iconify-icons/generated-icons.css'

import FaviconSwitcher from './FaviconSwitcher'


export const metadata = {
  title: 'TN-BEAT 2026',
  description:
    ''
}

const RootLayout = ({ children, params }) => {
  // Vars
  const headersList = headers()
  const direction = i18n.langDirection[params.lang]

  return (
    <TranslationWrapper headersList={headersList} lang={params.lang}>
      <html id='__next' lang={params.lang} dir={direction}>
        <FaviconSwitcher />
        <body className='flex is-full min-bs-full flex-auto flex-col'>{children}</body>
      </html>
    </TranslationWrapper>
  )
}

export default RootLayout

// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

// Third-party Imports
import classnames from 'classnames'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

const defaultSuggestions = [
  {
    sectionLabel: 'Pages',
    items: [
      {
        label: 'Dashboard',
        href: '/dashboards/dashboard',
        icon: 'ri-bar-chart-line'
      },
      {
        label: 'Registration',
        href: '/dashboards/registration',
        icon: 'ri-user-line'
      },
      {
        label: 'Stall Allocation',
        href: '/dashboards/stallallocation',
        icon: 'ri-store-3-line  '
      },
      {
        label: 'Daily Report',
        href: '/dashboards/dailyreport',
        icon: 'ri-line-chart-fill'
      },
      {
        label: 'Configuration',
        href: '/dashboards/configuration',
        icon: 'ri-global-line'
      },
    ]
  },
  {
    sectionLabel: 'Pages',
    items: [

      {
        label: 'Form Settings',
        href: '/dashboards/formSettings',
        icon: 'ri-file-text-line'
      },
      {
        label: 'Admin Settings',
        href: '/dashboards/adminSettings',
        icon: 'ri-admin-line'
      },
      {
        label: 'Stall Settings',
        href: '/dashboards/stallSettings',
        icon: 'ri-store-2-line'
      },
      {
        label: 'Logs',
        href: '/dashboards/logs',
        icon: 'ri-history-fill'
      },

    ]
  }
]

const DefaultSuggestions = ({ setOpen }) => {
  // Hooks
  const { lang: locale } = useParams()

  return (
    <div className='flex grow flex-wrap gap-x-[48px] gap-y-8 plb-6 pli-8 overflow-y-auto overflow-x-hidden bs-full max-h-[60vh]'>
    {defaultSuggestions.map((section, index) => (
      <div
        key={index}
        className='flex flex-col overflow-x-hidden gap-4 basis-full sm:basis-[calc((100%-3rem)/2)]'
      >
        <p className='text-xs leading-[1.16667] uppercase text-textDisabled tracking-[0.8px]'>
          {section.sectionLabel}
        </p>
        <ul className='flex flex-col gap-4'>
          {section.items.map((item, i) => (
            <li key={i} className='flex'>
              <Link
                href={getLocalizedUrl(item.href, locale)}
                className='flex items-center overflow-x-hidden cursor-pointer gap-2 hover:text-primary focus-visible:text-primary focus-visible:outline-0'
                onClick={() => setOpen(false)}
              >
                {item.icon && <i className={classnames(item.icon, 'flex text-xl')} />}
                <p className='text-[15px] leading-[1.4667] truncate'>{item.label}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    ))}
  </div>

  )
}

export default DefaultSuggestions

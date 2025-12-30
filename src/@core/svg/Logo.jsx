import useSettingsList from '../../views/useSettingsList'

const Logo = props => {
  const { settingsList, loadingList } = useSettingsList()

  const loginMedia = settingsList?.find(x => x.Key === 'LoginMedia')?.Value
  const adminLogo = settingsList?.find(x => x.Key === 'AdminLogo')?.Value

  return (
       <img src={adminLogo} alt='react' height={70} width={200} />

    // <img src='/images/logos/TN_BEAT-Logo_New.png' alt='react' height={70} width={200} />
  )
}

export default Logo

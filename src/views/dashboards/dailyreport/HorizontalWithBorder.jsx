'use client'

// MUI Imports
import MuiCard from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import { styled } from '@mui/material/styles'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

// Styled Card Component
const Card = styled(MuiCard)(({ color }) => ({
  borderBottomWidth: '5px',
  borderBottomColor: `var(--mui-palette-${color}-main)`,
  boxShadow: 'var(--mui-customShadows-xl)',
  marginBlockEnd: '-1px',
  '[data-skin="bordered"] &:hover': {
    boxShadow: 'none',
  },
  '&:hover': {
    borderBottomWidth: '3px',
    borderBottomColor: `var(--mui-palette-${color}-light)`, // Use a brighter variant
    boxShadow: 'var(--mui-customShadows-xxl)', // Stronger shadow for hover
    marginBlockEnd: '-1px', // Keep consistent margin
  },
}));

const HorizontalWithBorder = props => {
  // Props
  const { title, stats, trendNumber, avatarIcon, color, trendText = 'than last week' } = props

  // Diamond CSS as inline styles
  const diamondStyle = {
    width: '45px',
    height: '45px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
    backgroundColor: `var(--mui-palette-${color}-main)`,
    position: 'relative',
  }

  return (
    <Card color={color}>
      <CardContent className='flex flex-col gap-2'>
        {/* Top Section: Avatar and Stats */}
        <Typography variant='h4'>{title}</Typography>

        <div className='flex items-center gap-4'>
          {/* Diamond-shaped Avatar */}
          {/* <div style={diamondStyle}>
            <i className={avatarIcon} style={{ color: 'white', fontSize: '20px' }} />
          </div> */}
          <Typography variant='h4'>{stats}</Typography>
        </div>

        {/* Bottom Section: Title and Trend Info */}
        <div className='flex flex-col justify-center'>
          <Typography color='text.primary'>{"Today's Count"}</Typography>
        </div>
      </CardContent>
    </Card>
  );

}

export default HorizontalWithBorder;

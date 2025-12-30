'use client'

// MUI Imports
import MuiCard from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import { styled } from '@mui/material/styles'

// Styled Card Component
const Card = styled(MuiCard)(({ color }) => ({
  backgroundColor: '#006D5D', // Apply the background color (dark green)
  color: 'white', // Set the text color to white
  borderRadius: '12px', // Rounded corners
  maxWidth: '350px', // Further reduced maximum width
  maxHeight: '110px', // Further reduced maximum height
  padding: '8px', // Reduced padding for smaller card
  textAlign: 'center', // Center align all content
  '&:hover': {
    boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.2)', // Hover shadow
  },
}))

const HorizontalRegistration = (props) => {
  // Props
  const { title, stats, trendNumber, color, trendText = 'than yesterday' } = props

  return (
    <Card color={color}>
      <CardContent className='flex flex-col items-center gap-2'>
        {/* Title */}
        <Typography
          variant='h6'
          sx={{
            fontFamily: 'Alice, serif',
            fontSize: '25px', // Further reduced font size
            fontWeight: 800,
            lineHeight: '0.5',
            color: 'white',
          }}
        >
          {title}
        </Typography>

        {/* Stats */}
        <Typography
          variant='h3'
          sx={{
            fontFamily: 'Alice, serif',
            fontSize: '30px', // Further reduced font size
            fontWeight: 700,
            lineHeight: '2.2',
            color: 'white',
          }}
        >
          {stats}
        </Typography>

        {/* Trend */}
        {trendNumber !== undefined && (
          <Typography
            variant='body2'
            sx={{
              fontFamily: 'Alice, serif',
              fontSize: '12px', // Further reduced font size
              fontWeight: 400,
              lineHeight: '1.4',
              color: 'white',
            }}
          >
            {`${trendNumber > 0 ? '+' : ''}${trendNumber}% ${trendText}`}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

export default HorizontalRegistration

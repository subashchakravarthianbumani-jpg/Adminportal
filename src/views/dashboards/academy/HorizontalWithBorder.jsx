'use client'

// MUI Imports
import MuiCard from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import { styled } from '@mui/material/styles'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

const Card = styled(MuiCard)(({ theme, color }) => ({
  transition: 'border 0.3s ease-in-out, box-shadow 0.3s ease-in-out, margin 0.3s ease-in-out',
  borderBottomWidth: '2px',
  borderBottomColor: theme.palette[color]?.dark || theme.palette.primary.dark,
  backgroundColor: theme.palette[color]?.darker || theme.palette.primary.darker,
  '[data-skin="bordered"] &:hover': {
    boxShadow: 'none'
  },
  '&:hover': {
    borderBottomWidth: '3px',
    borderBottomColor: theme.palette[color]?.main || theme.palette.primary.main,
    boxShadow: theme.shadows[6],
    marginBlockEnd: '-1px'
  }
}));

const HorizontalWithBorder = props => {
  // Props
  const { title, stats, trendNumber, avatarIcon, color } = props;

  return (
    <Card color={color || 'primary'}>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <CustomAvatar color={color} skin="light" variant="rounded">
            <i className={avatarIcon} />
          </CustomAvatar>
          <Typography variant="h4">{stats}</Typography>
        </div>
        <div className="flex flex-col justify-center">
          <Typography color="text.primary">{title}</Typography>
          <div className="flex items-center gap-2">
            {/* Additional content can be added here */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HorizontalWithBorder;

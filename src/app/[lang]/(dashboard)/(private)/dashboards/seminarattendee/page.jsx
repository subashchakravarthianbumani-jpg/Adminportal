// MUI Imports
import Grid from '@mui/material/Grid'

// Components Imports
import UserListCards from '@/views/dashboards/ecommerce/UserListCards'
import KitchenSink from '@/views/dashboards/ecommerce/KitchenSink'



const DashboardECommerce = () => {
  return <>
    <Grid container spacing={6}>
    <Grid item xs={12} md={12}>
     <UserListCards/>
      </Grid>
      <Grid item xs={12} md={12} lg={12}>
      <KitchenSink/>
      </Grid>

    </Grid>
  </>
}

export default DashboardECommerce

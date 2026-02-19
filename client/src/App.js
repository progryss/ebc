import { useState } from "react";
import AppHeader from './components/AppHeader';
import Login from './components/authentication/Login';
import PasswordChange from './components/authentication/PasswordChangeForm';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import AuthGuard from './components/authentication/userProtected';
import Dashboard from './components/Dashboard';
import Users from './components/users';
import FilterTags from './components/filterTags';
import InventoryStore from './components/inventoryStore';
import SortingTags from './components/sortingTags';

import BikeSortingTags from "./bikeComponents/bikeSortingTags";
import BikeDashboard from "./bikeComponents/bikeDashboard";
import BikeFilterTags from "./bikeComponents/bikeFilterTags";

import HomeIcon from '@mui/icons-material/Home';
import Person2Icon from '@mui/icons-material/Person2';
import InventoryIcon from '@mui/icons-material/Inventory';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import SettingsIcon from '@mui/icons-material/Settings';

const theme = createTheme({
  typography: {
    fontFamily: [
      'Poppins',
    ].join(','),
  }
});

function App() {

  const [dasboardMode, setDashboardMode] = useState('cars');

  const dashBreadcrumb = {
    link1: dasboardMode === 'cars' ? 'Car Dashboard' : 'Bike Dashboard',
    link2: '',
    text: '',
    icon1: <HomeIcon sx={{ mr: 1,marginTop:'-2px' }} fontSize="small" />
  }

  const changePasswordBreadcrumb = {
    link1: 'User',
    link2: '',
    text: 'Change Password',
    icon1: <Person2Icon sx={{ mr: 1,marginTop:'-2px' }} fontSize="small" />,
  }

  const usersBreadcrumb = {
    link1: 'Users',
    link2: '',
    text: 'Manage Users',
    icon1: <Person2Icon sx={{ mr: 1,marginTop:'-2px' }} fontSize="small" />,
    icon3: <SettingsIcon sx={{ mr: 1,marginTop:'-2px',width:"18px" }} />
  }

  const inventoryBreadcrumb = {
    link1: 'Inventory',
    link2: '',
    text: 'Store Inventory',
    icon1: <InventoryIcon sx={{ mr: 1,marginTop:'-2px' }} fontSize="small" />
  }

  const filterBreadcrumb = {
    link1: dasboardMode === 'cars' ? 'Car Dashboard' : 'Bike Dashboard',
    link2: '',
    text: 'Filter Tags',
    icon1: <HomeIcon sx={{ mr: 1,marginTop:'-2px' }} fontSize="small" />,
    icon3: <LocalOfferIcon sx={{ mr: 1,marginTop:'-2px', width:"16px" }} />
  }

  const SortBreadcrumb = {
    link1: dasboardMode === 'cars' ? 'Car Dashboard' : 'Bike Dashboard',
    link2: '',
    text: 'Sorting Tags',
    icon1: <HomeIcon sx={{ mr: 1,marginTop:'-2px' }} fontSize="small" />,
    icon3: <LocalOfferIcon sx={{ mr: 1,marginTop:'-2px', width:"16px" }} />
  }

  const router = createBrowserRouter([
    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "/",
      element: (
        <AuthGuard>
          <AppHeader setDashboardMode={setDashboardMode} dasboardMode={dasboardMode} breadcrumbData={dashBreadcrumb} />
          {dasboardMode === 'cars' ? <Dashboard /> : <BikeDashboard />}
        </AuthGuard>
      ),
    },
    {
      path: "/filter-tags",
      element: (
        <AuthGuard>
          <AppHeader setDashboardMode={setDashboardMode} dasboardMode={dasboardMode} breadcrumbData={filterBreadcrumb} />
          {dasboardMode === 'cars' ? <FilterTags /> : <BikeFilterTags />}
        </AuthGuard>
      ),
    },
    {
      path: "/sorting-tags",
      element: (
        <AuthGuard>
          <AppHeader setDashboardMode={setDashboardMode} dasboardMode={dasboardMode} breadcrumbData={SortBreadcrumb} />
          {dasboardMode === 'cars' ? <SortingTags /> : <BikeSortingTags />}
        </AuthGuard>
      ),
    },
    {
      path: "/store-inventory",
      element: (
        <AuthGuard>
          <AppHeader setDashboardMode={setDashboardMode} dasboardMode={dasboardMode} breadcrumbData={inventoryBreadcrumb} />
          <InventoryStore />
        </AuthGuard>
      ),
    },
    {
      path: "/users",
      element: (
        <AuthGuard>
          <AppHeader setDashboardMode={setDashboardMode} dasboardMode={dasboardMode} breadcrumbData={usersBreadcrumb} />
          <Users />
        </AuthGuard>
      ),
    },
    {
      path: "/change-password",
      element: (
        <AuthGuard>
          <AppHeader setDashboardMode={setDashboardMode} dasboardMode={dasboardMode} breadcrumbData={changePasswordBreadcrumb} />
          <PasswordChange />
        </AuthGuard>
      ),
    },
  ]);

  return (
    <ThemeProvider theme={theme}>
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}

export default App;

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
    link1: dasboardMode === 'cars' ? 'Dashboard ( Cars )' : 'Dashboard ( Bikes )',
    link2: ''
  }

  const changePasswordBreadcrumb = {
    link1: 'Dashboard ( Cars )',
    link2: 'Change-password'
  }

  const userRegistrationBreadcrumb = {
    link1: 'Dashboard ( Cars )',
    link2: 'Users'
  }

  const filterBreadcrumb = {
    link1: dasboardMode === 'cars' ? 'Dashboard ( Cars )' : 'Dashboard ( Bikes )',
    link2: 'Filter-tags'
  }

  const SortBreadcrumb = {
    link1: dasboardMode === 'cars' ? 'Dashboard ( Cars )' : 'Dashboard ( Bikes )',
    link2: 'Sorting-tags'
  }

  const router = createBrowserRouter([
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
      path: "/change-password",
      element: (
        <AuthGuard>
          <AppHeader setDashboardMode={setDashboardMode} dasboardMode={dasboardMode} breadcrumbData={changePasswordBreadcrumb} />
          <PasswordChange />
        </AuthGuard>
      ),
    },
    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "/user-register",
      element: (
        <AuthGuard>
          <AppHeader setDashboardMode={setDashboardMode} dasboardMode={dasboardMode} breadcrumbData={userRegistrationBreadcrumb} />
          <Users />
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
      path: "/inventory-store",
      element: (
        <AuthGuard>
          <AppHeader setDashboardMode={setDashboardMode} dasboardMode={dasboardMode} breadcrumbData={filterBreadcrumb} />
          <InventoryStore />
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

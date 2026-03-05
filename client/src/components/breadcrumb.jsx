
import * as React from 'react';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';

function handleClick(event) {
  event.preventDefault();
  console.info('You clicked a breadcrumb.');
}

export default function CustomizedBreadcrumbs({data}) {
  const breadcrumbs = [
    <Link underline="none" key="1" color="inherit" to="/" onClick={handleClick} sx={{display:'flex',alignItems:'center',fontSize:'14px'}}>
       {data.icon1 && React.cloneElement(data.icon1)}{data.link1}
    </Link>,
    data.link2 && (<Link
      underline="hover"
      key="2"
      color="inherit"
      href="/material-ui/getting-started/installation/"
      onClick={handleClick}
      sx={{display:'flex',alignItems:'center',fontSize:'14px'}}
    >
      {data.link2}
    </Link>),
    data.text &&
    <Typography key="3" color="inherit" sx={{display:'flex',alignItems:'center',fontSize:'14px'}}>{data.icon3 && React.cloneElement(data.icon3)}{data.text}</Typography>
  ];

  return (
    <Stack sx={{ width: '100%',padding:"5px 10px" }}>
      <Breadcrumbs separator=">" aria-label="breadcrumb">
        {breadcrumbs}
      </Breadcrumbs>
    </Stack>
  );
}

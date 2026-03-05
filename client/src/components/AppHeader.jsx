import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import Box from "@mui/material/Box";
import CustomizedMenus from "./selectMenu";
import logo from "../images/logo.png";
import { FormGroup, Stack, Typography, Switch } from "@mui/material";
import { styled } from "@mui/material/styles";
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import CustomizedBreadcrumbs from "./breadcrumb";

const AntSwitch = styled(Switch)(({ theme }) => ({
  width: 61,
  height: 21,
  padding: 0,
  display: "flex",
  overflow:'visible',
  "&:active": {
    "& .MuiSwitch-thumb": {
      width: 20,
    },
    "& .MuiSwitch-switchBase.Mui-checked": {
      transform: "translateX(0)",
    },
  },
  "& .MuiSwitch-switchBase": {
    padding: 2,
    "&.Mui-checked": {
      transform: "translateX(37px)",
      color: "#fff",
      "& + .MuiSwitch-track": {
        opacity: 1,
        backgroundColor: "transparent",
        ...theme.applyStyles("dark", {
          backgroundColor: "#177ddc",
        }),
      },
    },
  },
  "& .MuiSwitch-thumb": {
    boxShadow: "0 2px 4px 0 rgb(0 35 11 / 20%)",
    width: 20,
    height: 17,
    position:'relative',
    top:'0',
    backgroundColor:'#1976d2',
    borderRadius: 8,
    transition: theme.transitions.create(["width"], {
      duration: 200,
    }),
  },
  "& .MuiSwitch-track": {
    borderRadius: 10,
    opacity: 1,
    backgroundColor: "transparent",
    border:'1px solid grey',
    boxSizing: "border-box",
    ...theme.applyStyles("dark", {
      backgroundColor: "rgba(246, 246, 246, 0.84)",
    }),
  },
}));

function AppHeader(props) {
  const { validUser, dasboardMode, setDashboardMode , breadcrumbData} = props;
  const [switcher, setSwitcher] = useState(false);
  const navigate = useNavigate();

  const headerWrapperCss = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px",
    backgroundImage: 'linear-gradient(#d2d8de, #fff)',
    borderBottom:'1px solid #eeebeb'
  };

  const changeMode = async () => {
    setSwitcher((prev) => !prev);
  };

  useEffect(() => {
    const mode = switcher ? "bikes" : "cars";
    setDashboardMode(mode);
  }, [switcher]);

  const goToHome = ()=>{
    navigate('/');
  }

  return (
    <>
      <Box className="header" sx={headerWrapperCss}>
        <div style={{minWidth:'250px'}}>
          <img src={logo} alt="" width="100" onClick={goToHome} style={{cursor:'pointer'}}/>
        </div>
        <FormGroup>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Typography className="me-5 pb-1">
              <DirectionsCarIcon sx={{ transform: 'scaleX(-1)',color: switcher ? 'silver' : '#1976d2' }} fontSize="large"/>
            </Typography>
            <AntSwitch
              checked={switcher}
              inputProps={{ "aria-label": "ant design" }}
              onClick={changeMode}
              className="ms-0"
            />
            <Typography className="ms-5">
              <TwoWheelerIcon fontSize="large" sx={{color: switcher ? '#1976d2' : 'silver'}} />
            </Typography>
          </Stack>
        </FormGroup>
        <CustomizedMenus user={validUser} mode={dasboardMode} />
      </Box>
      <CustomizedBreadcrumbs data={breadcrumbData} />
    </>
  );
}

export default AppHeader;

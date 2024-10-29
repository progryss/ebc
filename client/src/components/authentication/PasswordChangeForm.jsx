import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { createTheme, styled, ThemeProvider } from '@mui/material/styles';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LockPersonRoundedIcon from '@mui/icons-material/LockPersonRounded';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { IconButton, InputAdornment } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const Card = styled(MuiCard)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignSelf: 'center',
    width: '100%',
    padding: theme.spacing(4),
    gap: theme.spacing(2),
    margin: 'auto',
    [theme.breakpoints.up('sm')]: {
        maxWidth: '450px',
    },
    boxShadow:
        'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
    ...theme.applyStyles('dark', {
        boxShadow:
            'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
    }),
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
    minHeight: '100%',
    padding: theme.spacing(2),
    [theme.breakpoints.up('sm')]: {
        padding: theme.spacing(4),
    },
    '&::before': {
        content: '""',
        display: 'block',
        position: 'absolute',
        zIndex: -1,
        inset: 0,
        backgroundImage:
            'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
        backgroundRepeat: 'no-repeat',
        ...theme.applyStyles('dark', {
            backgroundImage:
                'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
        }),
    },
}));

const theme = createTheme({
    palette: {
        primary: {
            main: '#000000',
        },
    },
    components: {
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'black',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'black',
                    },
                },
            },
        },
    },
});

export default function PasswordChange(props) {
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState(false);
    const [passwordErrorMessage, setPasswordErrorMessage] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState(false);
    const [confirmPasswordErrorMessage, setConfirmPasswordErrorMessage] = useState('');
    const [apiError, setApiError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showconfirmPassword, setShowconfirmPassword] = useState(false);

    const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';

    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();;

        const changedPass = {
            newPassword: password,
        };

        if (validateInputs()) {
            try {
                const res = await axios.put(`${serverUrl}/api/change-password`, changedPass, {
                    headers: {
                        "Content-Type": "application/json"
                    },
                    withCredentials: true
                }
                );
                const data = res ? res?.data : null;
                const status = res ? res.status : 500;

                if (status === 200) {
                    toast.success("Password changed successfully")
                    setTimeout(() => {
                        navigate("/", { replace: true });
                    }, 700)
                }

                console.log(data ? "Password changed" : "Password Not changed")
                resetForm();
            } catch (error) {
                console.log(error, "Change Password API Error");
                setApiError("Cannot change Password now due to server error");
            }
        }
    };

    const validateInputs = () => {
        const password = document.getElementById('password');
        const confirmPassword = document.getElementById('confirm_password');

        let isValid = true;

        if (!password.value || password.value.length < 6) {
            setPasswordError(true);
            setPasswordErrorMessage('Password must be at least 6 characters long.');
            isValid = false;
        } else {
            setPasswordError(false);
            setPasswordErrorMessage('');
        }

        if (!confirmPassword?.value || confirmPassword?.value?.length < 6) {
            setConfirmPasswordError(true);
            setConfirmPasswordErrorMessage('Confirm Password must be at least 6 characters long.');
            isValid = false;
        } else if (confirmPassword?.value !== password?.value) {
            setConfirmPasswordError(true);
            setConfirmPasswordErrorMessage('Confirm password not matched with the password');
            isValid = false;
        } else {
            setConfirmPasswordError(false);
            setConfirmPasswordErrorMessage('');
        }

        return isValid;
    };

    const resetForm = () => {
        setConfirmPassword("");
        setPassword("");
        setConfirmPasswordError(false);
        setConfirmPasswordErrorMessage('');
        setPasswordError(false);
        setPasswordErrorMessage("");
    };

    const handleTogglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleToggleConfirmPasswordVisibility = () => {
        setShowconfirmPassword(!showconfirmPassword);
    };


    return (
        <SignInContainer direction="column" justifyContent="space-between" height="100vh" sx={{ backgroundColor: "whitesmoke" }} >
            <ToastContainer
                position="top-right"
                autoClose={600}
                theme="light"
            />
            <ThemeProvider theme={theme}>
                <Card variant="outlined">
                    <Typography
                        component="h1"
                        variant="h4"
                        sx={{ width: '100%', fontSize: { xs: '24px', md: '28px' } }}
                    >
                        Change Your Password <LockPersonRoundedIcon />
                    </Typography>
                    <Box
                        component="form"
                        onSubmit={handleSubmit}
                        noValidate
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            width: '100%',
                            gap: 2,
                        }}
                    >
                        <FormControl>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <FormLabel htmlFor="password" sx={{ marginBottom: '10px' }}>Password</FormLabel>
                            </Box>
                            <TextField
                                error={passwordError}
                                helperText={passwordErrorMessage}
                                name="password"
                                placeholder="••••••"
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                autoComplete="current-password"
                                autoFocus
                                required
                                fullWidth
                                variant="outlined"
                                color={passwordError ? 'error' : 'primary'}
                                onChange={(e) => setPassword(e.target.value)}
                                value={password}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle password visibility"
                                                onClick={handleTogglePasswordVisibility}
                                                edge="end"
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </FormControl>

                        <FormControl>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <FormLabel htmlFor="confirm password" sx={{ marginBottom: '10px' }}>Confirm Password</FormLabel>
                            </Box>
                            <TextField
                                error={confirmPasswordError}
                                helperText={confirmPasswordErrorMessage}
                                type={showconfirmPassword ? 'text' : 'password'}
                                name="confirm_password"
                                placeholder="••••••"
                                id="confirm_password"
                                autoComplete="current-password"
                                autoFocus
                                required
                                fullWidth
                                variant="outlined"
                                color={confirmPasswordError ? 'error' : 'primary'}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                value={confirmPassword}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle password visibility"
                                                onClick={handleToggleConfirmPasswordVisibility}
                                                edge="end"
                                            >
                                                {showconfirmPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </FormControl>

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ backgroundColor: "black" }}
                        >
                            Submit
                        </Button>
                        <Typography variant='body1' color='#d32f2f' textAlign="center" component={'span'}>{apiError}</Typography>
                    </Box>
                </Card>
            </ThemeProvider>
        </SignInContainer>
    );
}

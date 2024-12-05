import * as React from 'react';
import axios from 'axios';
import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { useProgressToast } from "./customHooks/useProgressToast";
const serverUrl = process.env.REACT_APP_SERVER_URL;

export default function AddRow({ refresh, close }) {

    const { showProgressToast, updateProgress, finalizeToast, setProgress } = useProgressToast();

    const addNewRow = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const payload = Object.fromEntries(formData.entries());

        setProgress(0);
        const estimatedSubmitTime = 5000;
        const increment = 100 / (estimatedSubmitTime / 100);

        const toastId = showProgressToast('Saving');
        const progressInterval = setInterval(() => {
            setProgress((prev) => {
                const newProgress = prev + increment;
                updateProgress(toastId, newProgress, 'Saving');
                if (newProgress >= 100) clearInterval(progressInterval);
                return newProgress < 100 ? newProgress : 100;
            });
        }, 100);

        try {
            const response = await axios.post(`${serverUrl}/api/add-row`, payload, {
                headers: { "Content-Type": "application/json" }
            });

            if (response.status === 201) {
                finalizeToast(toastId, true, "Saved Successfully!");
                refresh();
                close();
            }
        } catch (error) {
            finalizeToast(toastId, false, "", "Failed to save");
            console.error('Error submitting form:', error);
        } finally {
            clearInterval(progressInterval);
            setProgress(0);
        }
    };

    const modelStyle = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600,
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4,
    };

    return (
        <>
            <Box sx={modelStyle}>
                <Box component="form" autoComplete="off" onSubmit={addNewRow}>
                    <CloseIcon onClick={close} sx={{ position: 'absolute', right: '10px', top: '10px', cursor: 'pointer' }} />

                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', paddingBottom: '20px' }}>
                        <TextField label="Make" name="make" size="small" variant="standard" required />
                        <TextField label="Model Sub Model" name="model" size="small" variant="standard" required />
                        <TextField label="Engine Type" name="engineType" size="small" variant="standard" required />
                        <TextField label="Year" name="year" size="small" variant="standard" required />
                        <TextField label="Bhp" name="bhp" size="small" variant="standard" required />
                        <TextField label="Front Brake Caliper Make" name="frontBrakeCaliperMake" size="small" variant="standard" required />
                        <TextField label="Rear Brake Caliper Make" name="rearBrakeCaliperMake" size="small" variant="standard" required />
                        <TextField label="Fitment Position" name="fitmentPosition" size="small" variant="standard" required />
                        <TextField label="Disc Diameter" name="discDiameter" size="small" variant="standard" required />
                        <TextField label="Part Code" name="sku" size="small" variant="standard" required />
                        <TextField label="Kit Components" name="included" size="small" variant="standard" required />
                    </Box>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        sx={{ float: 'right', mt: 2 }}
                    >
                        Add Row
                    </Button>
                </Box>
            </Box>
        </>
    );
}

import React, { useState } from "react";
import axios from "axios";
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import { useProgressToast } from "./customHooks/useProgressToast";

const serverUrl = process.env.REACT_APP_SERVER_URL;

function RowDetails({ data, refresh, closeModel }) {

    const { showProgressToast, updateProgress, finalizeToast, setProgress } = useProgressToast();

    const initialEditValues = {
        _id: data._id,
        make: data.make,
        model: data.model,
        year: data.year,
        engineType: data.engineType,
        sku: data.sku,
        bhp: data.bhp,
        caliper: data.caliper,
        discDiameter: data.discDiameter,
        included: data.included,
        carEnd: data.carEnd
    };

    const [isReadOnly, setIsReadOnly] = useState(true);
    const [editableValues, setEditableValues] = useState(initialEditValues);
    const [flyObject, setFlyObject] = useState(initialEditValues);

    const editEnquiry = () => {
        setIsReadOnly(false);
    };


    const saveEnquiry = async () => {
        setProgress(0);
        const estimatedSubmitTime = 5000;
        const increment = 100 / (estimatedSubmitTime / 100);
        const toastId = showProgressToast('Updating');
        const progressInterval = setInterval(() => {
            setProgress((prev) => {
                const newProgress = prev + increment;
                updateProgress(toastId, newProgress, 'Updating');
                if (newProgress >= 100) clearInterval(progressInterval);
                return newProgress < 100 ? newProgress : 100;
            });
        }, 100);

        try {
            await axios.put(`${serverUrl}/api/update-row`, flyObject, {
                headers: { 'Content-Type': 'application/json' }
            });
            finalizeToast(toastId, true, "Update Successful!");
            setEditableValues(flyObject);
            setIsReadOnly(true);
            refresh();
            closeModel();
        } catch (error) {
            finalizeToast(toastId, false, "", "Update Failed");
            console.error('Error updating:', error);
        } finally {
            clearInterval(progressInterval);
            setProgress(0);
        }
    };

    const deleteRowFromTable = async () => {
        const userResponse = window.confirm('Are you sure you want to delete?');
        if (!userResponse) return;

        setProgress(0);
        const estimatedDeleteTime = 3000;
        const increment = 100 / (estimatedDeleteTime / 100);

        const toastId = showProgressToast('Deleting');
        const progressInterval = setInterval(() => {
            setProgress((prev) => {
                const newProgress = prev + increment;
                updateProgress(toastId, newProgress, 'Deleting');
                if (newProgress >= 100) clearInterval(progressInterval);
                return newProgress < 100 ? newProgress : 100;
            });
        }, 100);

        try {
            await axios.delete(`${serverUrl}/api/delete-rows`, {
                headers: { 'Content-Type': 'application/json' },
                data: { ids: [editableValues._id] }
            });
            finalizeToast(toastId, true, "Delete Successful!");
            refresh();
            closeModel();
        } catch (error) {
            finalizeToast(toastId, false, "", "Delete Failed");
            console.error('Error deleting:', error);
        } finally {
            clearInterval(progressInterval);
            setProgress(0);
        }
    };


    const handleChange = (field, value) => {
        setFlyObject(prev => ({ ...prev, [field]: value }));
    };

    const cancelEdit = () => {
        setFlyObject(initialEditValues);
        setIsReadOnly(true);
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
            <div className="container-fluid customer-details mt-3">
                <div className="mb-3" style={modelStyle}>
                    <div className="card">
                        <div className="card-body" sx={{ position: 'relative' }}>
                            <div className="d-flex justify-content-between pb-2">
                                <div></div>
                                <div>
                                    {isReadOnly ? (
                                        <EditIcon onClick={editEnquiry} className="me-2" sx={{ cursor: 'pointer' }} />
                                    ) : ''}
                                    <DeleteOutlineIcon className="me-2" onClick={deleteRowFromTable} sx={{ cursor: 'pointer' }} />
                                    <CloseIcon onClick={() => closeModel()} sx={{ cursor: 'pointer' }} />
                                </div>
                            </div>
                            <div className="two-column-layout">
                                <div className="second-column-box">
                                    <div>
                                        <div className="label-title">Make:</div>
                                        <input
                                            type="text"
                                            className="label-value"
                                            onChange={(e) => handleChange('make', e.target.value)}
                                            readOnly={isReadOnly}
                                            value={flyObject.make ? flyObject.make : ''}
                                        />
                                    </div>
                                    <div>
                                        <div className="label-title">Model:</div>
                                        <input
                                            type="text"
                                            className="label-value"
                                            onChange={(e) => handleChange('model', e.target.value)}
                                            readOnly={isReadOnly}
                                            value={flyObject.model ? flyObject.model : ''}
                                        />
                                    </div>
                                    <div>
                                        <div className="label-title">Year:</div>
                                        <input
                                            type="text"
                                            className="label-value"
                                            onChange={(e) => handleChange('year', (e.target.value).split(','))}
                                            readOnly={isReadOnly}
                                            value={flyObject.year ? flyObject.year : ''}
                                        />
                                    </div>
                                    <div>
                                        <div className="label-title">Engine Type:</div>
                                        <input
                                            type="text"
                                            className="label-value"
                                            onChange={(e) => handleChange('engineType', e.target.value)}
                                            readOnly={isReadOnly}
                                            value={flyObject.engineType ? flyObject.engineType : ''}
                                        />
                                    </div>
                                    <div>
                                        <div className="label-title">Sku:</div>
                                        <input
                                            type="text"
                                            className="label-value"
                                            onChange={(e) => handleChange('sku', e.target.value)}
                                            readOnly={isReadOnly}
                                            value={flyObject.sku ? flyObject.sku : ''}
                                        />
                                    </div>
                                    <div>
                                        <div className="label-title">Bhp:</div>
                                        <input
                                            type="text"
                                            className="label-value"
                                            onChange={(e) => handleChange('bhp', e.target.value)}
                                            readOnly={isReadOnly}
                                            value={flyObject.bhp ? flyObject.bhp : ''}
                                        />
                                    </div>
                                    <div>
                                        <div className="label-title">Caliper:</div>
                                        <input
                                            type="text"
                                            className="label-value"
                                            onChange={(e) => handleChange('caliper', e.target.value)}
                                            readOnly={isReadOnly}
                                            value={flyObject.caliper ? flyObject.caliper : ''}
                                        />
                                    </div>
                                    <div>
                                        <div className="label-title">DiscDiameter:</div>
                                        <input
                                            type="text"
                                            className="label-value"
                                            onChange={(e) => handleChange('discDiameter', e.target.value)}
                                            readOnly={isReadOnly}
                                            value={flyObject.discDiameter ? flyObject.discDiameter : ''}
                                        />
                                    </div>
                                    <div>
                                        <div className="label-title">Included:</div>
                                        <input
                                            type="text"
                                            className="label-value"
                                            onChange={(e) => handleChange('included', e.target.value)}
                                            readOnly={isReadOnly}
                                            value={flyObject.included ? flyObject.included : ''}
                                        />
                                    </div>
                                    <div>
                                        <div className="label-title">Car End:</div>
                                        <input
                                            type="text"
                                            className="label-value"
                                            onChange={(e) => handleChange('carEnd', e.target.value)}
                                            readOnly={isReadOnly}
                                            value={flyObject.carEnd ? flyObject.carEnd : ''}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="d-flex justify-content-between pt-4">
                                {!isReadOnly ? (
                                    <div>
                                        <button className="btn btn-outline-secondary me-2 btn-sm" onClick={cancelEdit}>Cancel</button>
                                        <button className="btn btn-primary saveBtn btn-sm" onClick={saveEnquiry}>Save</button>
                                    </div>
                                ) : (
                                    <div style={{ height: '32px' }}></div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default RowDetails;

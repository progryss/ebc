import React, { useState } from "react";
import axios from "axios";
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import { useProgressToast } from "../components/customHooks/useProgressToast";

const serverUrl = process.env.REACT_APP_SERVER_URL;

export default function BikeRowDetails({ data, refresh, closeModel }) {

    const { showProgressToast, updateProgress, finalizeToast, setProgress } = useProgressToast();

    let yearString = data.years && data.years.length == 1 ? data.years[0]
                        : data.years && data.years.length > 1 ? `${data.years[0]}-${data.years[data.years.length-1]}`
                        : '' ;

    const initialEditValues = {
        _id: data._id,
        make: data.make ? data.make :'',
        model: data.model ? data.model :'',
        subModel: data.subModel ? data.subModel :'',
        engine: data.engine ? data.engine :'',
        engineType: data.engineType ? data.engineType :'',
        fuelType: data.fuelType ? data.fuelType : '',
        vehicleQualifier: data.vehicleQualifier ? data.vehicleQualifier : '',
        years: yearString ? yearString :'',
        bhp: data.bhp ? data.bhp :'',
        valves: data.valves ? data.valves :'',
        fitmentPosition: data.fitmentPosition ? data.fitmentPosition :'',
        specialComments: data.specialComments ? data.specialComments :'',
        frontBrakeCaliperMake: data.frontBrakeCaliperMake ? data.frontBrakeCaliperMake :'',
        rearBrakeCaliperMake: data.rearBrakeCaliperMake ? data.rearBrakeCaliperMake :'',
        frontDiscDiameter: data.frontDiscDiameter ? data.frontDiscDiameter :'',
        rearDiscDiameter: data.rearDiscDiameter ? data.rearDiscDiameter :'',
        kitComponents: data.KitComponents ? data.kitComponents :'',
        sku: data.sku
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
            await axios.put(`${serverUrl}/api/update-bike-row`, flyObject, {
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
            await axios.delete(`${serverUrl}/api/delete-bike-rows`, {
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
                                        <div className="label-title">Make</div>
                                        <input
                                            type="text"
                                            className="label-value"
                                            onChange={(e) => handleChange('make', e.target.value)}
                                            readOnly={isReadOnly}
                                            value={flyObject.make ? flyObject.make : ''}
                                        />
                                    </div>
                                    <div>
                                        <div className="label-title">Model</div>
                                        <input
                                            type="text"
                                            className="label-value"
                                            onChange={(e) => handleChange('model', e.target.value)}
                                            readOnly={isReadOnly}
                                            value={flyObject.model ? flyObject.model : ''}
                                        />
                                    </div>
                                    <div>
                                        <div className="label-title">Sub Model</div>
                                        <input
                                            type="text"
                                            className="label-value"
                                            onChange={(e) => handleChange('subModel', e.target.value)}
                                            readOnly={isReadOnly}
                                            value={flyObject.subModel ? flyObject.subModel : ''}
                                        />
                                    </div>
                                    <div>
                                        <div className="label-title">Engine</div>
                                        <input
                                            type="text"
                                            className="label-value"
                                            onChange={(e) => handleChange('engine', e.target.value)}
                                            readOnly={isReadOnly}
                                            value={flyObject.engine ? flyObject.engine : ''}
                                        />
                                    </div>
                                    <div>
                                        <div className="label-title">Engine Type</div>
                                        <input
                                            type="text"
                                            className="label-value"
                                            onChange={(e) => handleChange('engineType', e.target.value)}
                                            readOnly={isReadOnly}
                                            value={flyObject.engineType ? flyObject.engineType : ''}
                                        />
                                    </div>
                                    <div>
                                        <div className="label-title">Fuel Type</div>
                                        <input
                                            type="text"
                                            className="label-value"
                                            onChange={(e) => handleChange('fuelType', e.target.value)}
                                            readOnly={isReadOnly}
                                            value={flyObject.fuelType ? flyObject.fuelType : ''}
                                        />
                                    </div>
                                    <div>
                                        <div className="label-title">Vehicle Qualifier</div>
                                        <input
                                            type="text"
                                            className="label-value"
                                            onChange={(e) => handleChange('vehicleQualifier', e.target.value)}
                                            readOnly={isReadOnly}
                                            value={flyObject.vehicleQualifier ? flyObject.vehicleQualifier : ''}
                                        />
                                    </div>
                                    <div>
                                        <div className="label-title">Years</div>
                                        <input
                                            type="text"
                                            className="label-value"
                                            onChange={(e) => handleChange('years', e.target.value)}
                                            readOnly={isReadOnly}
                                            value={flyObject.years ? flyObject.years : ''}
                                        />
                                    </div>
                                    <div>
                                        <div className="label-title">BHP</div>
                                        <input
                                            type="text"
                                            className="label-value"
                                            onChange={(e) => handleChange('bhp', e.target.value)}
                                            readOnly={isReadOnly}
                                            value={flyObject.bhp ? flyObject.bhp : ''}
                                        />
                                    </div>
                                    <div>
                                        <div className="label-title">valves</div>
                                        <input
                                            type="text"
                                            className="label-value"
                                            onChange={(e) => handleChange('valves', e.target.value)}
                                            readOnly={isReadOnly}
                                            value={flyObject.valves ? flyObject.valves : ''}
                                        />
                                    </div>
                                    <div>
                                        <div className="label-title">Fitment Position</div>
                                        <input
                                            type="text"
                                            className="label-value"
                                            onChange={(e) => handleChange('fitmentPosition', e.target.value)}
                                            readOnly={isReadOnly}
                                            value={flyObject.fitmentPosition ? flyObject.fitmentPosition : ''}
                                        />
                                    </div>
                                    <div>
                                        <div className="label-title">Special Comments</div>
                                        <input
                                            type="text"
                                            className="label-value"
                                            onChange={(e) => handleChange('specialComments', e.target.value)}
                                            readOnly={isReadOnly}
                                            value={flyObject.specialComments ? flyObject.specialComments : ''}
                                        />
                                    </div>
                                    <div>
                                        <div className="label-title">Front Brake Caliper</div>
                                        <input
                                            type="text"
                                            className="label-value"
                                            onChange={(e) => handleChange('frontBrakeCaliperMake', e.target.value)}
                                            readOnly={isReadOnly}
                                            value={flyObject.frontBrakeCaliperMake ? flyObject.frontBrakeCaliperMake : ''}
                                        />
                                    </div>
                                    <div>
                                        <div className="label-title">Rear Brake Caliper</div>
                                        <input
                                            type="text"
                                            className="label-value"
                                            onChange={(e) => handleChange('rearBrakeCaliperMake', e.target.value)}
                                            readOnly={isReadOnly}
                                            value={flyObject.rearBrakeCaliperMake ? flyObject.rearBrakeCaliperMake : ''}
                                        />
                                    </div>
                                    <div>
                                        <div className="label-title">Front Disc Diameter</div>
                                        <input
                                            type="text"
                                            className="label-value"
                                            onChange={(e) => handleChange('frontDiscDiameter', e.target.value)}
                                            readOnly={isReadOnly}
                                            value={flyObject.frontDiscDiameter ? flyObject.frontDiscDiameter : ''}
                                        />
                                    </div>
                                    <div>
                                        <div className="label-title">Rear Disc Diameter</div>
                                        <input
                                            type="text"
                                            className="label-value"
                                            onChange={(e) => handleChange('rearDiscDiameter', e.target.value)}
                                            readOnly={isReadOnly}
                                            value={flyObject.rearDiscDiameter ? flyObject.rearDiscDiameter : ''}
                                        />
                                    </div>
                                    <div>
                                        <div className="label-title">Kit Components</div>
                                        <input
                                            type="text"
                                            className="label-value"
                                            onChange={(e) => handleChange('kitComponents', e.target.value)}
                                            readOnly={isReadOnly}
                                            value={flyObject.kitComponents ? flyObject.kitComponents : ''}
                                        />
                                    </div>
                                    <div>
                                        <div className="label-title">Part No</div>
                                        <input
                                            type="text"
                                            className="label-value"
                                            onChange={(e) => handleChange('sku', e.target.value)}
                                            readOnly={isReadOnly}
                                            value={flyObject.sku ? flyObject.sku : ''}
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


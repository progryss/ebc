import React, { useState, useEffect } from "react";
import axios from "axios";
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import { ToastContainer, toast } from 'react-toastify';

const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';
function MemberDetails({ customer, onBack }) {

    
    const initialEditValues = {
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        zip: customer.zip,
        countryCode: customer.countryCode,
        dueDate: customer.dueDate,
        relationship: customer.relationship,
        customerId: customer.customerId,
        companyId: customer.companyId,
        locationId: customer.locationId,
        companyRoleId: customer.companyRoleId,
        companyContactId: customer.companyContactId,
        newsletter: customer.newsletter,
        comments: customer.comments
    };

    const [comment, setComment] = useState("");
    const [isReadOnly, setIsReadOnly] = useState(true);
    //   const { showNotification } = useNotification();
    const [editableValues, setEditableValues] = useState(initialEditValues);
    const [flyObject, setFlyObject] = useState(initialEditValues);

    const handleCommentChange = (e) => {
        setComment(e.target.value);
    };

    const handleCommentDelete = (index) => {
        editableValues.comments.splice(index, 1);
        // console.log(editableValues.comments)
        setEditableValues((object) => ({
            ...object,
            comments: editableValues.comments
        }))
    };

    const editEnquiry = () => {
        // console.log('edit start');
        setIsReadOnly(false);
    }

    const saveEnquiry = async () => {
        toast.success('Update Successfully')
        setEditableValues(flyObject)
        setIsReadOnly(true);
    }

    const handleChange = (field, value) => {
        setFlyObject(prev => ({ ...prev, [field]: value }));
    };

    const cancelEdit = () => {
        setFlyObject(initialEditValues);
        setIsReadOnly(true);
    }

    const deleteCompany = async () => {
        const userResponse = window.confirm("Are you sure you want to delete this company?");
        if (userResponse) {
            try {
                await axios.delete(`${serverUrl}/api/delete-company/${customer._id}`);
                console.log('company deleted successfully')
            } catch (error) {
                console.log("error in deleting company", error)
            }
            onBack()
        }
    }

    useEffect(() => {
        console.log('useeffect')
        async function hit() {
            // console.log(editableValues)
            try {
                const config = {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                };
                await axios.put(`${serverUrl}/api/update-user/${customer._id}`, editableValues, config);
            } catch (error) {
                console.log('Error sending PUT request', error);
            }
        }
        hit()
    }, [editableValues])



    const handleCommentSubmit = async () => {
        if (comment.trim() !== "") {
            const now = new Date();
            const timestamp = now.toLocaleString();
            const newComment = { comment_text: comment, comment_date: timestamp };
            const updatedCommentsList = [newComment, ...editableValues.comments];

            setEditableValues((object) => ({
                ...object,
                comments: updatedCommentsList
            }));

            setComment("");
            //   showNotification('Comment added successfully!', 'success', 'green', 'white');
        } else {
            //   showNotification("Can't be blank!", "error", "red", "white");
        }
    };

    return (
        <>
            <ToastContainer
                position="top-right"
                autoClose={600}
                theme="light"
            />
            <div className="container-fluid customer-details mt-3">
                <div className="card mb-3">
                    <div className="card-body p-0 d-flex">
                        <div className="bg-light add-cutomer-section p-3">
                            <div className="row">
                                <div className="col-lg-12">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div className="d-flex align-items-center gap-2">
                                            <span><i className="fa fa-arrow-left" onClick={onBack}></i></span>
                                            <span><AccountCircleOutlinedIcon variant="outlined" sx={{ fontSize: "50px" }} /></span>
                                            <span>
                                                <h5 className="mb-0"><strong>{customer.name}</strong></h5>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="d-flex gap-5 p-3">
                            <div>
                                <div className="label-title">Name:</div>
                                <div className="label-value">{`${flyObject.firstName} ${flyObject.lastName}`}</div>
                            </div>
                            <div>
                                <div className="label-title">Email:</div>
                                <div className="label-value">
                                    <a href={`mailto:${flyObject.email}`} style={{ textDecoration: 'none', color: '#4199FD' }}>
                                        {flyObject.email}
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="customer-details-grid">
                    <div className="mb-3">
                        <div className="card">
                            <div className="card-body" sx={{ position: 'relative' }}>
                                <div className="detail-tab-box d-flex justify-content-between pb-2">
                                    <div></div>
                                    <div>
                                        {!isReadOnly ? (<><button className="btn btn-outline-primary me-2 btn-sm" onClick={cancelEdit}>Cancel</button><button className="btn btn-primary me-2 saveBtn btn-sm" onClick={saveEnquiry}>Update</button></>) : (<><button className='btn btn-link me-2 updateBtn' onClick={editEnquiry}><i className="fa fa-edit"></i></button><button className="btn btn-link text-danger me-2 deleteBtn" onClick={deleteCompany}><i className="fa fa-trash"></i></button></>)}
                                    </div>
                                </div>
                                <div className="two-column-layout">
                                    <h6 className="mb-3">Questions</h6>
                                    <div className="second-column-box">
                                        <div>
                                            <div className="label-title">Due Date / Birth Date:</div>
                                            <input
                                                type="date"
                                                className="label-value"
                                                onChange={(e) => handleChange('dueDate', new Date(e.target.value).getTime() / 1000)} // Convert back to Unix timestamp
                                                readOnly={isReadOnly}
                                                value={flyObject.dueDate ? new Date(flyObject.dueDate * 1000).toISOString().split('T')[0] : ''} // Convert Unix to YYYY-MM-DD format
                                            />
                                        </div>
                                        <div>
                                            <div className="label-title">Relationship to little person :</div>
                                            <select
                                                className="label-value"
                                                value={flyObject.relationship}
                                                onChange={(e) => handleChange('relationship', e.target.value)}
                                                disabled={isReadOnly}
                                            >
                                                <option value="">Select</option>
                                                <option value="father">Father</option>
                                                <option value="mother">Mother</option>
                                                <option value="grandparent">Grandparent</option>
                                                <option value="friend">Friend</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="card mt-3">
                            <div className="two-column-layout card-body">
                                <h6 className="mb-3">User Details</h6>
                                <div className="first-column-box">
                                    <div className="mb-4">
                                        <div className="label-title">First Name:</div>
                                        <input className="label-value" onChange={(e) => handleChange('firstName', e.target.value)} value={flyObject.firstName} readOnly={true} />
                                    </div>
                                    <div className="mb-4">
                                        <div className="label-title">Last Name:</div>
                                        <input className="label-value" onChange={(e) => handleChange('lastName', e.target.value)} value={flyObject.lastName} readOnly={true} />
                                    </div>
                                    <div className="mb-4">
                                        <div className="label-title">Email:</div>
                                        <input className="label-value" onChange={(e) => handleChange('email', e.target.value)} readOnly={true} value={flyObject.email} />
                                    </div>
                                    <div className="mb-4">
                                        <div className="label-title">Newsletter :</div>
                                        <input className="label-value" onChange={(e) => handleChange('newsletter', e.target.value)} readOnly={true} value={flyObject.newsletter} />
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                    <div className="card mb-3">
                        <div className="card-body">
                            <div className="textarea-box">
                                <textarea
                                    rows="3"
                                    className="form-control mb-3"
                                    value={comment}
                                    onChange={handleCommentChange}
                                    placeholder="Write your comment here..."
                                ></textarea>
                                <button
                                    className="btn btn-primary mb-3"
                                    onClick={handleCommentSubmit}
                                >
                                    Post Comment
                                </button>
                            </div>
                            <div className="comment-box">
                                {editableValues.comments.length > 0 && (
                                    <>
                                        {editableValues.comments.map((comment, index) => (
                                            <div key={index} className="card mb-3">
                                                <div className="card-body p-2 pb-0">

                                                    <div>
                                                        <div className="comment-text mb-2"><pre style={{ fontFamily: "inherit", lineHeight: "20px" }}>{comment.comment_text}</pre></div>
                                                        <hr className="m-0 mt-3" />
                                                        <div className="comment-timestamp d-flex justify-content-between align-items-baseline">
                                                            <div>
                                                                <span className="fs-12">{comment.comment_date}</span>
                                                            </div>
                                                            <div>
                                                                <button className="btn btn-link text-danger" onClick={(e) => handleCommentDelete(index)}><i className="fa fa-trash"></i></button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default MemberDetails;

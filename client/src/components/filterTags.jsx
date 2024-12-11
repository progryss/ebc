import React, { useEffect, useState } from 'react';
import { Button, TextField, Box } from '@mui/material';
import axios from 'axios';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { useDropzone } from 'react-dropzone';

const serverUrl = process.env.REACT_APP_SERVER_URL;

function FilterTags() {

    const [category, setCategory] = useState('');
    const [subCategory, setSubcategory] = useState('');
    const [filterData, setFilterData] = useState([]);
    const [r1, setR1] = useState(true);
    const [selectValue, setSelectValue] = useState('blank');
    const [color, setColor] = useState('#d9d9d9');
    const [labelText, setLabelText] = useState('');
    const [labelImage, setLabelImage] = useState(null);
    const [showImage, setShowImage] = useState(null);

    const addCategory = async () => {
        if (!category.trim()) {
            return alert('category name cant be empty')
        }
        const payload = {
            name: category
        };
        try {
            const response = await axios.post(`${serverUrl}/api/add-category`, payload, {
                withCredentials: true
            });
            console.log(response.data);
            setCategory('');
            setR1(!r1)
        } catch (error) {
            console.error('Failed to add category:', error);
        }
    };

    const addSubCategory = async () => {
        if (selectValue === 'blank') {
            alert('Select Category First');
            return;
        }
        if (!subCategory.trim()) {
            alert('Sub Category name can\'t be empty');
            return;
        }

        const formData = new FormData();
        formData.append('category', selectValue);
        formData.append('subCategory', subCategory);
        formData.append('labelBg', color);
        formData.append('labelText', labelText);
        formData.append('labelImage', labelImage); // Make sure labelImage is the File object

        try {
            const response = await axios.put(`${serverUrl}/api/update-category`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                withCredentials: true,
            });
            setSelectValue('blank');
            setSubcategory('');
            setColor('#d9d9d9');
            setLabelText('');
            setLabelImage(null);
            setShowImage(null);
            setR1(!r1);
        } catch (error) {
            console.error('Failed to add sub category:', error);
        }
    };

    useEffect(() => {
        getCategory()
    }, [r1])

    const getCategory = async () => {
        try {
            const response = await axios.get(`${serverUrl}/api/get-category`, {
                withCredentials: true
            })
            setFilterData(response.data)
        } catch (error) {
            console.log('error in fetching filter data')
        }
    }

    // image upload
    const onDrop = (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            setLabelImage(file); // Save the file object itself, not the URL
            setShowImage(URL.createObjectURL(file));
        }
    };

    const { getRootProps, getInputProps } = useDropzone({
        accept: 'image/*',
        onDrop,
    });

    return (
        <>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <Box className="ps-2">
                    {/* <Box>
                        <p>Add Filter Section -</p>
                        <TextField
                            label="Enter Filter Heading"
                            name="category"
                            size="small"
                            variant="outlined"
                            required
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        />
                        <Button
                            variant="contained"
                            className='ms-2'
                            onClick={() => {
                                addCategory();
                            }}
                        >
                            Add Heading
                        </Button>
                    </Box> */}
                    <Box className='mt-3' >
                        <p>Add Filter Option - </p>
                        <Box>
                            <label>Choose Filter Heading:</label>
                            <Select
                                size="small"
                                labelId="demo-simple-select-label"
                                id="demo-simple-select"
                                value={selectValue}
                                onChange={e => setSelectValue(e.target.value)}
                                sx={{ marginLeft: '42px' }}
                            >
                                <MenuItem value='blank' disabled>Select Heading</MenuItem>
                                {filterData.map((element, index) => (
                                    <MenuItem key={`${element.name}-${index}`} value={element.name}>{element.name}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                        <Box className='mt-3'>
                            <Box>
                                <label>Filter Option <br /><span>(same as product tag)</span>:</label>
                                <input
                                    name="subCategory"
                                    value={subCategory}
                                    onChange={(e) => setSubcategory(e.target.value)}
                                    required
                                    className='labelText'
                                    style={{ marginLeft: '55px' }}
                                    placeholder='Enter option name'
                                />
                            </Box>
                            <Box className="mt-4">
                                <Box className="d-flex">
                                    <label>Label Bg Color:</label>
                                    <input
                                        type="color"
                                        value={color}
                                        onChange={e => setColor(e.target.value)}
                                        style={{ width: '100px', marginLeft: '104px' }}
                                    />
                                </Box>
                                <Box className="d-flex mt-3" sx={{ alignItems: 'center' }}>
                                    <label>Label Text:</label>
                                    <input
                                        type='text'
                                        placeholder='enter label text'
                                        value={labelText}
                                        onChange={e => setLabelText(e.target.value)}
                                        className='labelText'
                                    />
                                </Box>
                                <Box className="d-flex mt-4" >
                                    <label>Label Image:</label>
                                    <div className='d-flex' style={{ alignItems: 'center', marginLeft: '120px' }}>
                                        <div
                                            {...getRootProps()}
                                            style={{
                                                border: '2px dashed rgb(204, 204, 204)',
                                                cursor: 'pointer',
                                                height: '50px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                padding: '0 20px'
                                            }}
                                        >
                                            <input {...getInputProps()} />
                                            <p style={{ margin: '0' }}>Choose image</p>
                                        </div>
                                        {labelImage && (
                                            <div>
                                                <img src={showImage} alt="Selected" style={{ height: '50px' }} />
                                            </div>
                                        )}
                                    </div>
                                </Box>
                            </Box>
                            <Button
                                variant="contained"
                                className='mt-4'
                                onClick={() => {
                                    addSubCategory()
                                }}
                            >
                                Add Filter Option
                            </Button>
                        </Box>

                    </Box>
                </Box>
                <Box className="mt-3 ps-2">
                    <p>Filter List -</p>
                    <ul style={{ listStyle: 'none', padding: '0', maxWidth: '400px' }}>
                        {filterData.map((element, index) => (
                            <li key={`${element.name}-${index}`} style={{ padding: '6px 10px', border: '1px solid silver' }}>
                                {element.name}
                                <ul>
                                    {element.options.map((option, index) => (
                                        <li key={`${option.labelText}-${index}`} style={{ padding: '6px 10px', display: 'flex', justifyContent: 'space-between' }}>
                                            {option.subCategory}
                                            {option.labelImage ? (
                                                <img src={`${serverUrl}${option.labelImage}`} style={{ height: '25px' }} />
                                            ) : option.labelText && option.labelImage == null ? (
                                                <span style={{
                                                    width: '100px',
                                                    background: `${option.labelBg}`,
                                                    fontSize:'12px',
                                                    fontWeight:'600',
                                                    display:'flex',
                                                    justifyContent:'center',
                                                    alignItems:'center'
                                                }}>
                                                    {option.labelText}
                                                </span>
                                            ) : (
                                                <span style={{ width: '100px', background: `${option.labelBg}` }}>{option.labelText}</span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                </Box>
            </Box>
        </>
    );
}

export default FilterTags;

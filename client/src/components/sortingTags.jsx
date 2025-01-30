import { Button } from '@mui/material';
import axios from 'axios';
import React, { useEffect, useState } from 'react'

const serverUrl = process.env.REACT_APP_SERVER_URL;
function SortingTags() {

    const [value,setValue] = useState('')

    const updateSortingTags = async()=>{
        const payload = {
            sortingTags : value
        }
        try {
            const response = await axios.put(`${serverUrl}/api/update-sorting-tags`,payload)
            console.log(response)
        } catch (error) {
            console.log(error)
        }
    }

    const getSortingTags = async()=>{
        try {
            const response = await axios.get(`${serverUrl}/api/sorting-tags`);
            setValue(response.data[0].sortTag)
        } catch (error) {
            console.log(error)
        }
    }
    useEffect(()=>{
        getSortingTags()
    },[])
    return (
        <div className='mt-4 ms-2'>
            <p>Sorting Tags :</p>
            <textarea onChange={e=>setValue(e.target.value)} name="w3review" rows="3" cols="50" value={value} placeholder='Add tags here...' style={{ padding: '10px' }} />
            <div>
                <Button variant='contained' className='mt-3' onClick={updateSortingTags}>Update</Button>
            </div>
        </div>
    )
}

export default SortingTags;

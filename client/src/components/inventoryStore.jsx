import { Button } from '@mui/material'
import React, { useEffect, useState } from 'react'
import Box from '@mui/material/Box';
import axios from 'axios'
import Loader from './loader';
const serverUrl = process.env.REACT_APP_SERVER_URL;

function InventoryStore() {

  const historyBox = {
    border: '1px solid silver',
    marginBottom: '10px',
    padding: '20px',
    borderRadius: '5px',
    display: 'grid',
    gridTemplateColumns: '2fr 1fr'
  }

  const saveFreshInventory = async()=>{
    try {
      const response = await axios.get(`${serverUrl}/api/fresh-inventory`)
      console.log(response)
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <div style={{ padding: '15px 10px', maxWidth: '900px', margin: 'auto' }}>
      <Button onClick={saveFreshInventory} variant='contained' sx={{ marginBottom: '10px' }}>
        Update Inventory
      </Button>
    </div>
  )
}

export default InventoryStore
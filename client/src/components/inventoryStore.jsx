import React, { useEffect, useState } from 'react';
import { Button } from '@mui/material';
import axios from 'axios';

const serverUrl = process.env.REACT_APP_SERVER_URL;

function InventoryStore() {
  const [notification, setNotification] = useState({
    totalSku: 0,
    startTimeDb: '',
    updatedSkuDb: 0,
    failedSkuDb: 0,
    endTimeDb: '',
    startTimeStore: '',
    updatedSkuStore: 0,
    failedSkuStore: 0,
    endTimeStore: ''
  });  // State to hold messages from the server

  useEffect(() => {
    // Establish the connection when the component mounts
    const eventSource = new EventSource(`${serverUrl}/api/events`);

    eventSource.onmessage = function (event) {
      const newData = JSON.parse(event.data);
      setNotification(prev => ({ ...prev, ...newData.result }));
    };

    eventSource.onerror = function (error) {
      // Handle errors
      console.error('EventSource failed:', error);
      eventSource.close();
    };

    // Cleanup on component unmount
    return () => {
      eventSource.close();
    };
  }, []);

  useEffect(() => {
    // Save the updated notification state to localStorage
    localStorage.setItem('notification', JSON.stringify(notification));
  }, [notification]);

  const saveFreshInventory = async () => {
    setNotification({
      totalSku: 0,
      startTimeDb: '',
      updatedSkuDb: 0,
      failedSkuDb: 0,
      endTimeDb: '',
      startTimeStore: '',
      updatedSkuStore: 0,
      failedSkuStore: 0,
      endTimeStore: ''
    })
    try {
      const response = await axios.get(`${serverUrl}/api/fresh-inventory`);
      console.log(response);
    } catch (error) {
      console.error('Error updating inventory:', error);
    }
  };

  return (
    <div style={{ padding: '15px 10px', maxWidth: '900px', margin: 'auto' }}>
      <Button onClick={saveFreshInventory} variant='contained' sx={{ marginBottom: '10px' }}>
        Update Inventory
      </Button>
      <div>
        <div style={{ border: '1px solid red' }}>
          <h3>Inventory to DB</h3>
          <p>{`Start Time - ${notification.startTimeDb !== '' ? new Date(notification.startTimeDb) : ''}`}</p>
          <p>{`Total Products - ${notification.totalSku}`}</p>
          <p>{`Updated Sku DB - ${notification.updatedSkuDb}`}</p>
          <p>{`Failed Sku DB - ${notification.failedSkuDb}`}</p>
          <p>{`End Time - ${notification.endTimeDb !== '' ? new Date(notification.endTimeDb) : ''}`}</p>
        </div>
        <div style={{ border: '1px solid red' }}>
          <h3>DB to Shopify</h3>
          <p>{`Start Time - ${notification.startTimeStore !== '' ? new Date(notification.startTimeStore) : ''}`}</p>
          <p>{`Updated Sku DB - ${notification.updatedSkuStore}`}</p>
          <p>{`Failed Sku DB - ${notification.failedSkuStore}`}</p>
          <p>{`End Time - ${notification.endTimeStore !== '' ? new Date(notification.endTimeStore) : ''}`}</p>
        </div>
      </div>
    </div>
  );
}

export default InventoryStore;

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
  const [data, setData] = useState(() => {
    const saved = sessionStorage.getItem('inventoryData');
    return saved ? JSON.parse(saved) : {};
  });
  const [inventoryHistory, setInventoryHistory] = useState([]);

  useEffect(() => {
    if (data) {
      sessionStorage.setItem('inventoryData', JSON.stringify(data));
    }
  }, [data]);

  useEffect(() => {
    getInventoryHistory();
  }, []);

  const getInventoryHistory = async () => {
    try {
      const response = await axios.get(`${serverUrl}/api/get-inventory-history`);
      setInventoryHistory(response.data.reverse())
    } catch (error) {
      console.log(error)
    }
  }
  const setupEventSource = () => {
    const evtSource = new EventSource(`${serverUrl}/api/test`);

    evtSource.onmessage = function (event) {
      const newData = JSON.parse(event.data);
      console.log('Received update:', newData);
      setData(prevData => ({ ...prevData, ...newData.result }));
      // Optionally check for a final message to close the connection
      if (data.message === 'All batches processed successfully') {
        evtSource.close();
      }
    };

    evtSource.onerror = function (event) {
      if (event.currentTarget.readyState === EventSource.CLOSED) {
        console.error('EventSource closed unexpectedly');
      } else if (event.currentTarget.readyState === EventSource.CONNECTING) {
        console.log('EventSource reconnecting…');
      } else {
        console.error('EventSource encountered an error:', event);
      }
      // Decide based on your application's needs whether to close on error
      // evtSource.close(); 
    };
  };

  const downloadFailedSkus = (failedSkus, index) => {
    // Create CSV content with headers
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "S.No.,SKU\n";  // Adding CSV headers

    // Append each failed SKU to the CSV content with a serial number
    failedSkus.forEach((sku, index) => {
      csvContent += `${index + 1},${sku}\n`;  // Adding data with serial number starting from 1
    });

    // Encode the CSV content to prepare it for download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `failed_skus_list_${index}.csv`);
    document.body.appendChild(link);  // Required for FF
    link.click();  // Trigger the download
    document.body.removeChild(link);  // Clean up the temporary element
  }


  return (
    <div style={{ padding: '15px 10px', maxWidth: '900px', margin: 'auto' }}>
      <Button onClick={setupEventSource} variant='contained' sx={{ marginBottom: '10px' }}>
        Update Inventory
      </Button>
      {data.processStartTime && !data.processEndTime ? (
        <Box sx={historyBox}>
          <div>
            <div style={{display:'flex',alignItems:'baseline'}}><p style={{ fontWeight: '600', fontSize: '19px' }}>Inventory Updating ...</p><Loader /></div>
            <p>
              <span style={{ fontSize: '15px', padding: '2px 10px', background: '#e7e7e7', borderRadius: '15px' }}>Total : {data.totalSku}</span>
              <span style={{ fontSize: '15px', padding: '2px 10px', background: 'rgb(175 254 191)', borderRadius: '15px', marginLeft: '10px' }}>Updated : {data.updatedSku}</span>
              <span style={{ fontSize: '15px', padding: '2px 10px', background: 'rgb(255 0 0 / 41%)', borderRadius: '15px', marginLeft: '10px' }}>Failed : {data.failedSku && data.failedSku.length}</span>
            </p>
            <p style={{ color: 'grey', paddingTop: '10px', marginBottom: '5px' }}>Started At : {data.processStartTime}</p>
            <p style={{ color: 'grey', marginBottom: '0' }}>Finished At : {data.processEndTime}</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'end', alignItems: 'end' }}>
            {data.failedSku && data.failedSku.length > 0 &&
              <button onClick={() => downloadFailedSkus(data.failedSku, 99)} style={{ border: '1px solid silver', padding: '2px 10px' }}>
                Download Failed SKUs CSV
              </button>
            }
          </div>
        </Box>
      ) : ''}
      {inventoryHistory.length > 0 && inventoryHistory.map((element, index) => (
        <Box key={`key-${index}`} sx={historyBox}>
          <div>
            <p style={{ fontWeight: '600', fontSize: '19px' }}>Inventory</p>
            <p>
              <span style={{ fontSize: '15px', padding: '2px 10px', background: '#e7e7e7', borderRadius: '15px' }}>Total : {element.totalSku}</span>
              <span style={{ fontSize: '15px', padding: '2px 10px', background: 'rgb(175 254 191)', borderRadius: '15px', marginLeft: '10px' }}>Updated : {element.updatedSku}</span>
              <span style={{ fontSize: '15px', padding: '2px 10px', background: 'rgb(255 0 0 / 41%)', borderRadius: '15px', marginLeft: '10px' }}>Failed : {element.failedSku.length}</span>
            </p>
            <p style={{ color: 'grey', paddingTop: '10px', marginBottom: '5px' }}>Started At : {element.processStartTime}</p>
            <p style={{ color: 'grey', marginBottom: '0' }}>Finished At : {element.processEndTime}</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'end', alignItems: 'end' }}>
            {element.failedSku.length > 0 &&
              <button onClick={() => downloadFailedSkus(element.failedSku, index)} style={{ border: '1px solid silver', padding: '2px 10px' }}>
                Download Failed SKUs
              </button>
            }
          </div>
        </Box>
      ))}
    </div>
  )
}

export default InventoryStore

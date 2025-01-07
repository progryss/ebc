require('dotenv').config();
const axios = require('axios');
const {Product,inventoryData,inventoryUpdateHistory} = require('../models/user-models');
const { sendToAll } = require('./inventoryEvent');

const performUpdateInventory = async () => {
    let notificationResult = {
        totalSku: 0,
        startTimeDb: new Date(),
        updatedSkuDb: 0,
        failedSkuDb: [],
        endTimeDb: '',
        startTimeStore: '',
        updatedSkuStore: 0,
        failedSkuStore: 0,
        endTimeStore: ''
    }
    updateInventoryInDB(notificationResult).then(result => {
        updateInventoryInStore(notificationResult)
    }).catch(err => {
        console.log(err)
    });
}

const updateInventoryInDB = async (notificationResult) => {

    try {
        const tokenResponse = await axios.post(`${process.env.GRAVITE_API_URL}`, {
            api_credentials: {
                app_user: process.env.GRAVITE_API_USER,
                app_key: process.env.GRAVITE_API_KEY
            },
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (tokenResponse.data.connection !== 'OK') {
            throw new Error("Error retrieving token: " + tokenResponse.data.error);
        }
        const apiToken = tokenResponse.data.token;
        console.log('-----------')
        console.log('Third Party Api Token - ', apiToken)

        // Get Location Id from Store
        const locationResponse = await axios.get(`${process.env.STORE_API_URL}/locations.json`, {
            headers: { 'X-Shopify-Access-Token': process.env.STORE_API_PASSWORD }
        });
        const locationId = locationResponse.data.locations[0].id;
        console.log('-----------')
        console.log('Store Location ID - ', locationId)

        // Fetch SKUs and inventory item of store product variants from db
        const products = await Product.find({
            $and: [
                { "variants.sku": { $ne: "" } },
                { "variants.sku": { $ne: null } }
            ]
        })

        const allSkuArr = products.flatMap(product => product.variants.map(variant => variant.sku ? ({
            sku: variant.sku,
            inventory_item_id: variant.inventory_item_id
        }) : ''));
        console.log('-----------')
        console.log('Total products - ', allSkuArr.length)

        // Notify clients that the batch process has started
        notificationResult.totalSku = allSkuArr.length;
        sendToAll({ message: "Batch process started", result: notificationResult });

        let result = await processBatches(allSkuArr, apiToken, locationId, notificationResult);

        // Notify clients that all batches are completed
        notificationResult.endTimeDb = new Date();
        sendToAll({ message: "All batches completed", result: notificationResult });

        const existingEntry = await inventoryUpdateHistory.findOne({ startTimeDb: notificationResult.startTimeDb })
        if (!existingEntry) {
            const newHistory = new inventoryUpdateHistory(notificationResult)
            await newHistory.save()
            console.log('-----------')
            console.log('Inventory saved to DB Successfully')
        }


    } catch (error) {
        console.error("Failed to update inventory in db", error);
    }

};

const updateInventoryInStore = async (notificationResult) => {

    try {
        // Fetch SKUs and inventory item of store product variants from db
        const freshInventoryList = await inventoryData.find()
        const batches = chunkArray(freshInventoryList, 200);

        notificationResult.startTimeStore = new Date();
        sendToAll({ message: "Shopify Batch process started", result: notificationResult });

        let count = 0;
        let results = []
        for (const batch of batches) {
            count++;
            const batchData = await Promise.allSettled(batch.map(element => element && updateShopifyProductStock(element)));
            results.push(batchData)
            notificationResult.updatedSkuStore += batchData.length;
            console.log(`Store Batch ${count} Updated with ${notificationResult.updatedSkuStore} skus`)
            sendToAll({ message: `Shopify Batch processed ${count}`, result: notificationResult });
        }

        notificationResult.endTimeStore = new Date()
        sendToAll({ message: "All Shopify Batch processed", result: notificationResult });

        await inventoryUpdateHistory.findOneAndUpdate(
            { startTimeDb: notificationResult.startTimeDb },
            notificationResult
        )

        console.log('-----------')
        console.log('store process successfully complete')

        // Now all delete the previous data
        await inventoryData.deleteMany({});

        console.log('-----------')
        console.log('all inventory queries successfully deleted from DB')

    } catch (error) {
        console.log('error in updating shopify inventory', error)
    }
};

async function processBatches(allSkus, apiToken, locationId, notificationResult) {

    let result = {
        batchCount: 0,
        failedSku: [],
        updatedSku: 0
    }

    const batches = chunkArray(allSkus, 200);

    for (const batch of batches) {

        result.batchCount++;

        console.log('-----------')
        console.log(`batch - ${result.batchCount}`)

        // Notify clients that a batch has started
        sendToAll({ message: `Batch processing ${result.batchCount}`, result: notificationResult });

        const skuList = batch.map(element => ({ code: element.sku }));

        console.log('-----------')
        console.log('Sku To Third Party App - ', skuList.length)

        const resultFromThirdParty = await sendBatchRequest(skuList, apiToken);
        if (resultFromThirdParty.connection !== 'OK') {
            throw new Error("Error fetching stock levels: " + resultFromThirdParty.data.error);
        }

        const updatedInventory = Object.entries(resultFromThirdParty.product_stock);

        // creating new objects to set the updated inventory in store
        let inventoryObject = batch.map((element) => {
            let c = updatedInventory.find(ele => ele[0] == element.sku)
            if (c) {
                let obj = {
                    sku: element.sku,
                    inventory_item_id: element.inventory_item_id,
                    available: parseInt(c[1].freestock),
                    locationId: locationId
                }
                return obj;
            } else {
                result.failedSku.push(element.sku)
                return undefined;
            }
        }).filter(element => element != undefined)

        inventoryObject.forEach(async (element) => {

            const newObj = new inventoryData(element);
            await newObj.save();

        })

        result.updatedSku += inventoryObject.length;
        console.log('-----------')
        console.log('Inventory Data Saved To DB - ', inventoryObject.length)

        console.log('-----------')
        console.log('Failed Sku - ', result.failedSku.length)

        notificationResult.updatedSkuDb += inventoryObject.length;
        notificationResult.failedSkuDb = result.failedSku;
        sendToAll({ message: `Batch processed ${result.batchCount}`, result: notificationResult });

    }

    return result;

}

function chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
}

// function to fetch fresh inventory from thirdparty
async function sendBatchRequest(skuList, apiToken) {
    try {
        const response = await axios.post(`${process.env.GRAVITE_API_URL}`, {
            api_credentials: {
                app_user: process.env.GRAVITE_API_USER,
                app_key: process.env.GRAVITE_API_KEY,
                app_token: apiToken
            },
            product_codes: skuList
        });
        return response.data; // Assuming API returns JSON data
    } catch (error) {
        console.error('Failed to fetch stock levels:', error);
        throw error; // or handle the error as needed
    }
}

async function updateShopifyProductStock(element) {
    const url = `${process.env.STORE_API_URL}/inventory_levels/set.json`;
    const headers = {
        'X-Shopify-Access-Token': process.env.STORE_API_PASSWORD
    };
    const payload = {
        location_id: element.locationId,
        inventory_item_id: element.inventory_item_id,
        available: element.available
    };

    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    // Initial delay before the request
    await delay(0);

    try {
        const response = await axios.post(url, payload, { headers });
        // Check the API call limit status and adjust the delay accordingly
        const apiCallLimit = response.headers['x-shopify-shop-api-call-limit'];
        const [usedCalls, maxCalls] = apiCallLimit.split('/').map(Number);
        if (maxCalls - usedCalls < 5) { // If close to limit, increase delay
            await delay(1000);
        }
        if (response.status === 200) {
            return response.data;
        }
    } catch (error) {
        if (error.response && error.response.status === 429) {
            // If hit with a rate limit error, increase delay significantly
            await delay(2000);
            return updateShopifyProductStock(element); // Retry the request
        }
        console.error('Error updating product stock:', error);
        throw error;
    }
}

module.exports = {
    performUpdateInventory,
    updateInventoryInDB,
    updateInventoryInStore,
    processBatches,
    chunkArray,
    sendBatchRequest,
    updateShopifyProductStock
}
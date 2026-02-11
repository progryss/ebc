const mongoose = require('mongoose');

const inventoryDataSchema = new mongoose.Schema({
    sku:{
        type:String
    },
    inventory_item_id:{
        type:String
    },
    current_qt:{
        type:Number
    },
    available:{
        type:Number
    },
    locationId:{
        type:Number
    }
});

const inventoryUpdateHistorySchema = new mongoose.Schema({
    totalSku:{
        type:Number
    },
    startTimeDb:{
        type:Date
    },
    updatedSkuDb:{
        type:Number
    },
    failedSkuDb:{
        type:Array
    },
    endTimeDb:{
        type:Date
    },
    startTimeStore:{
        type:Date
    },
    updatedSkuStore:{
        type:Array
    },
    failedSkuStore:{
        type:Array
    },
    endTimeStore:{
        type:Date
    }
})

const inventoryData = mongoose.model('Inventory Queries', inventoryDataSchema);
const inventoryUpdateHistory = mongoose.model('Inventory History',inventoryUpdateHistorySchema);

module.exports = { inventoryData, inventoryUpdateHistory };
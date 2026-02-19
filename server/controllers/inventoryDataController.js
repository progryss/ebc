const { performUpdateInventory } = require('../services/inventryUpdate');
const { inventoryUpdateHistory } = require('../models/inventoryDataModel');

const getInventoryHistory = async (req, res) => {
    try {
        const response = await inventoryUpdateHistory.find({ endTimeStore: { $ne: null } })
            .sort({ endTimeStore: -1 })
            .limit(10);
        res.status(200).send(response)
    } catch (error) {
        res.status(500).send('error in getting inventory history')
    }
}

const updateInventory = async (req, res) => {
    try {
        performUpdateInventory()
        res.status(202).send("process started")
    } catch (error) {
        res.status(500).send(error)
        console.log(error)
    }
}

module.exports = {
    getInventoryHistory,
    updateInventory
}
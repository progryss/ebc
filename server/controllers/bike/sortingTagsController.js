const {BikeSortTags} = require('../../models/bike/sortingTagModel');

const updateSortingTags = async (req, res) => {
    try {
        const data = req.body.sortingTags;
        await BikeSortTags.updateOne(
            {},
            { $set: { sortTag: data } },
            { upsert: true }
        )
        res.status(200).send('sorting tags updated')
    } catch (error) {
        res.status(500).send('error in updating sorting tags')
    }
}

const getSortingTags = async (req, res) => {
    try {
        const response = await BikeSortTags.find();
        res.status(200).send(response)
    } catch (error) {
        res.status(500).send('error in getting sorting tags')
    }
}

module.exports = {
    updateSortingTags,
    getSortingTags
}
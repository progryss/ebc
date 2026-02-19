const fs = require('fs');
const csv = require('fast-csv');
const { CsvData } = require('../../models/car/csvDataModel');

async function insertBatch(batch, batchNumber) {
    console.log(`Inserting batch ${batchNumber} with ${batch.length} records.`);
    await CsvData.insertMany(batch);
    console.log(`Batch ${batchNumber} inserted successfully.`);
}

const BATCH_SIZE = 50000;
let batchNumber = 0;
let totalRecords = 0;

// function to save csv product to db in batch
async function processCsvFile(filePath) {
    let batch = []; // Array to hold the batch
    return new Promise((resolve, reject) => {
        const stream = fs.createReadStream(filePath);
        const csvStream = csv.parse({ headers: true })
            .transform(data => {
                let capitalizedMake = data.Make.trim().toLowerCase().replace(/\b\w/g, function (char) {
                    return char.toUpperCase();
                });
                let combineEngineType = `${data.Engine ? data.Engine.trim() : ''}${data.EngineType ? ` ${data.EngineType.trim()}` : ''}${data.FuelType ? ` ${data.FuelType.trim()}` : ''}${data['BHP'] ? ` (${data['BHP'].trim()})` : ''}`;
                const transformed = {
                    make: data.Make.trim().toLowerCase(),
                    model: data.SubModel ? `${data.Model.trim()} ${data.SubModel.trim()}`.toLowerCase() : data.Model.trim().toLowerCase(),
                    engineType: combineEngineType.toLowerCase().trim(),
                    year: data.YearNo.trim(),
                    bhp: data['BHP'] ? data['BHP'].trim() : '',
                    frontBrakeCaliperMake: data.FrontBrakeCaliperMake ? data.FrontBrakeCaliperMake.trim() : '',
                    rearBrakeCaliperMake: data.RearBrakeCaliperMake ? data.RearBrakeCaliperMake.trim() : '',
                    fitmentPosition: data.FitmentPosition ? data.FitmentPosition.trim() : '',
                    discDiameter: data.DiscDiameter ? data.DiscDiameter.trim() : '',
                    included: data.KitComponents ? data.KitComponents.split(',').map(item => item.trim()) : [],
                    sku: data.PartCode.trim(),
                };
                return transformed;
            })

            .on('error', error => {
                console.error('Error reading CSV:', error);
                reject()
            })
            .on('data', async (row) => {
                batch.push(row);

                if (batch.length >= BATCH_SIZE) {
                    csvStream.pause(); // Pause the stream to manage flow control
                    batchNumber++;
                    // Asynchronously insert the batch
                    insertBatch(batch, batchNumber).then(() => {
                        batch = []; // Clear the batch after successful insertion
                        csvStream.resume(); // Resume the stream
                    }).catch(error => {
                        console.error(`Error inserting batch ${batchNumber}:`, error);
                        csvStream.resume(); // Optionally continue processing after a failed insert
                    });
                }
                resolve()
            })
            .on('end', () => {
                // Handle the last batch
                if (batch.length > 0) {
                    batchNumber++;
                    insertBatch(batch, batchNumber).then(() => {
                        console.log(`Final batch ${batchNumber} inserted.`);
                    }).catch(error => {
                        console.error(`Error inserting final batch ${batchNumber}:`, error);
                    });
                }
                console.log('CSV file has been processed successfully.');
            });

        stream.pipe(csvStream);
    })
}

async function countCsvRows(filePath) {
    return new Promise((resolve, reject) => {
        let rowCount = 0;
        fs.createReadStream(filePath)
            .pipe(csv.parse({ headers: true }))  // Parse CSV with headers
            .on('data', (row) => {
                rowCount++;
            })
            .on('end', () => {
                console.log(`Total batches: ${rowCount / BATCH_SIZE}`);
                resolve(rowCount);
            })
            .on('error', reject);  // Handle any errors
    });
}

const uploadCsvData = async (req, res) => {
    batchNumber = 0;
    totalRecords = 0;
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    totalRecords = await countCsvRows(req.file.path);
    try {
        // Assume a function processCsvFile that processes your CSV file
        await processCsvFile(req.file.path);
        res.status(200).send('csv uploaded successfully.');
        fs.unlinkSync(req.file.path);
    } catch (error) {
        console.log('Error uploading csv:', error);
        res.status(500).send('Error uploading csv');
        try {
            fs.unlinkSync(req.file.path);
            console.log('File was deleted after a failure');
        } catch (deleteError) {
            console.error('Failed to delete the file after processing error:', deleteError);
        }
    }
};

const progress = async (req, res) => {

    if (totalRecords > 0) {
        res.json({
            status: 'processing',
            progress: batchNumber,
            totalBatches: totalRecords / BATCH_SIZE,
            totalRecords: totalRecords
        });
    } else {
        res.json({
            status: 'complete',
            progress: totalRecords
        });
    }
}

const deleteCsvData = async (req, res) => {
    try {
        await CsvData.deleteMany({});
        res.status(200).send('Csv data deleted successfully.')
    } catch (error) {
        console.error('Error deleting csv data:', error);
        res.status(500).send('Failed to delete csv data')
    }
};

const getCsvData = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;  // Default and maximum rows per page
    const skip = (page - 1) * limit;
    const search = req.query.search;
    // Build the query object
    let query = {};
    if (search) {
        query = {
            $text: { $search: `"${search}"` } // Using text search for efficiency
        };
    }

    try {
        // Find documents based on the query
        const csvData = await CsvData.find(query)
            .skip(skip)
            .limit(limit);
        // Count only the documents that match the query
        const total = search != "" ? await CsvData.countDocuments(query) : await CsvData.estimatedDocumentCount();

        res.status(200).send({
            total,
            data: csvData,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Error fetching csv data:', error);
        res.status(500).json({ error: 'Failed to fetch csv data' });
    }
};

const deleteMultipleRows = async (req, res) => {
    try {
        const rowId = req.body.ids;
        if (!Array.isArray(rowId) || rowId.length === 0) {
            return res.status(400).send('Invalid or no IDs provided');
        }
        const result = await CsvData.deleteMany({
            _id: { $in: rowId }
        });
        if (result.deletedCount === 0) {
            return res.status(404).send('No row found to delete');
        }
        return res.status(200).send(`${result.deletedCount} csv data deleted successfully`);
    } catch (error) {
        console.error('Error deleting csv data:', error);
        res.status(500).send('Error deleting csv data');
    }
}

const updateRow = async (req, res) => {
    try {
        const data = req.body;
        const updatedRow = await CsvData.findByIdAndUpdate(
            data._id,
            {
                $set: {
                    make: data.make,
                    model: data.model,
                    engineType: data.engineType,
                    year: data.year,
                    bhp: data.bhp,
                    frontBrakeCaliperMake: data.frontBrakeCaliperMake,
                    rearBrakeCaliperMake: data.rearBrakeCaliperMake,
                    fitmentPosition: data.fitmentPosition,
                    discDiameter: data.discDiameter,
                    sku: data.sku,
                    included: data.included
                }
            },
            { new: true, runValidators: true }
        )
        if (!updatedRow) {
            return res.status(404).send('row not found');
        }

        res.status(200).send('row data updated successfully');
    } catch (error) {
        console.error('Error in row data:', error);
        res.status(500).send('Error updating row data');
    }
}

const addRow = async (req, res) => {
    const data = req.body;
    try {
        const newRow = new CsvData({
            make: data.make,
            model: data.model,
            engineType: data.engineType,
            year: data.year,
            bhp: data.bhp,
            frontBrakeCaliperMake: data.frontBrakeCaliperMake,
            rearBrakeCaliperMake: data.rearBrakeCaliperMake,
            fitmentPosition: data.fitmentPosition,
            discDiameter: data.discDiameter,
            sku: data.sku,
            included: data.included.split(',')
        });

        await newRow.save()
        return res.status(201).send('new row added')

    } catch (error) {
        console.log('error in adding new row data', error)
        return res.status(500).send('error in adding new row data')
    }
}

const removeAllDuplicates = async (req, res) => {
    try {
        // Step 1: Identify duplicates
        const duplicates = await CsvData.aggregate([
            {
                $group: {
                    _id: {
                        make: "$make",
                        model: "$model",
                        engineType: "$engineType",
                        year: "$year",
                        bhp: "$bhp",
                        frontBrakeCaliperMake: "$frontBrakeCaliperMake",
                        rearBrakeCaliperMake: "$rearBrakeCaliperMake",
                        fitmentPosition: "$fitmentPosition",
                        discDiameter: "$discDiameter",
                        sku: "$sku",
                        included: "$included"
                    },
                    docIds: { $addToSet: "$_id" },
                    count: { $sum: 1 }
                }
            },
            {
                $match: {
                    count: { $gt: 1 } // filters groups having more than one document
                }
            }
        ], { allowDiskUse: true });

        // Step 2: Remove duplicates
        let countRemoved = 0;
        for (let duplicate of duplicates) {
            // Keep the first document and remove the rest
            const idsToRemove = duplicate.docIds.slice(1); // Skip the first element to keep
            await CsvData.deleteMany({ _id: { $in: idsToRemove } });
            countRemoved += idsToRemove.length;
        }

        res.status(200).send(`${countRemoved} Duplicates Entries Removed.`);
    } catch (error) {
        res.status(500).send("Error removing duplicates: " + error.message);
    }
};

module.exports = {
    uploadCsvData,
    getCsvData,
    deleteCsvData,
    deleteMultipleRows,
    updateRow,
    addRow,
    removeAllDuplicates,
    progress
}
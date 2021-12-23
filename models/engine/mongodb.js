if (process.env.MONGODB_URL === undefined) {
    console.log("please fill in the MongoDB URL in .env file !");
    process.exit(1);
}

const { MongoClient, ObjectId } = require("mongodb");
const mdb = new MongoClient(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true });
mdb.connect((error, client) => {
    if (error) {
        console.log("Error connecting to MongoDB! ", { error });
        process.exit(1);
    }
    console.log("MongoDB Connected!");
    client.close();
});

/**
 * 
 * @param {*} callback 
 * @param {boolean} debug 
 * @returns 
 */
async function MongoConnect(callback, debug = false) {
    const mongodb = new MongoClient(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true });
    try {
        await mongodb.connect();
        if (debug)
            console.log("MongoDB Connected...")
        //
        return await callback(mongodb);
    } finally {
        // Ensures that the mongodb will close when you finish/error
        await mongodb.close();
        if (debug)
            console.log("MongoDB Closed...")
    }
}

/**
 * 
 * @param {String} database select database target
 * @param {String} collection target collection yang ingin di input
 * @param {*} new_data boleh array atau object
 * @returns 
 */
async function insertDocument(database, collection, new_data) {
    return await MongoConnect(async mongodb => {
        const coll = mongodb.db(database).collection(collection);
        if (
            typeof new_data === 'object' &&
            Array.isArray(new_data) &&
            new_data !== null
        ) { // insertMany
            return await coll.insertMany(new_data);
        } else {
            return await coll.insertOne(new_data);
        }
    })
}

/**
 * 
 * @param {String} database select database target
 * @param {[]} array_collection list target collection yang ingin di tampilkan
 * @returns 
 */
async function showCollection(database, array_collection) {
    return await MongoConnect(async mongodb => {
        const save = {};
        for (i in array_collection) {
            const coll = await mongodb.db(database).collection(array_collection[i]);
            const result = await coll.find().toArray();
            save[array_collection[i]] = result;
            // global[array_collection[i]] = result;
        }
        const coll = await mongodb.db("server").collection("system");
        const system = await coll.find().toArray();
        save["system"] = system
            .filter(data => {
                return data.database === database;
            })
            .map(data => {
                delete data.database
                return data
            })[0];
        if (!save["system"]) {
            delete save["system"]
        }
        return save;
    })
}

/**
 * 
 * @param {String} database select database target
 * @param {String} collection target collection yang ingin di input
 * @param {String} _id document selector (primary)
 * @returns 
 */
async function showDocumentByID(database, collection, _id) {
    return await MongoConnect(async mongodb => {
        const coll = mongodb.db(database).collection(collection);
        return await coll.find({
            _id: ObjectId(_id)
        }).toArray();
    })
}

/**
 * 
 * @param {String} database select database target
 * @param {String} collection target collection yang ingin di input
 * @param {String} _id document selector (primary)
 * @param {Object} new_update field yang akan dirubah value nya (object)
 * @returns 
 */
async function updateDocumentByID(database, collection, _id, new_update) {
    return await MongoConnect(async mongodb => {
        const coll = mongodb.db(database).collection(collection);
        return await coll.updateOne({
            _id: ObjectId(_id),
        }, {
            $set: {
                ...new_update,
            },
        });
    })
}

/**
 * 
 * @param {String} database select database target
 * @param {String} collection target collection yang ingin di input
 * @param {String} select_object selector by other key
 * @param {Object} new_update field yang akan dirubah value nya (object)
 * @returns 
 */
async function updateDocumentByObject(database, collection, select_object, new_update) {
    return await MongoConnect(async mongodb => {
        const coll = mongodb.db(database).collection(collection);
        return await coll.updateOne({
            ...select_object,
        }, {
            $set: {
                ...new_update,
            },
        });
    })
}

/**
 * 
 * @param {String} database select database target
 * @param {String} collection target collection yang ingin di input
 * @param {String} _id document selector (primary) or other key
 * @returns 
 */
async function deleteDocumentByID(database, collection, _id) {
    return await MongoConnect(async mongodb => {
        const coll = mongodb.db(database).collection(collection);
        if (
            typeof _id === 'object' &&
            !Array.isArray(_id) &&
            _id !== null
        ) {
            return await coll.deleteMany({
                ..._id,
            });
        } else {
            if (typeof _id === "string") {
                return await coll.deleteOne({
                    _id: ObjectId(_id),
                });
            } else {
                return false;
            }
        }
    })
}

/**
 * 
 * @param {String} database select database target
 * @param {String} collection target collection yang ingin di input
 * @returns 
 */
async function clearCollection(database, collection) {
    return await MongoConnect(async mongodb => {
        const coll = mongodb.db(database).collection(collection);
        const result = await coll.remove({})
        global[collection] = [];
        return result;
    })
}

module.exports = {
    MongoConnect,

    insertDocument,
    showCollection,
    showDocumentByID,
    updateDocumentByID,
    updateDocumentByObject,
    deleteDocumentByID,
    clearCollection,
}
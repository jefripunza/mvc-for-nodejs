const config = require('../../config');

const { MongoClient } = require("mongodb");
const mdb = new MongoClient(config.database.mongodb.uri, { useNewUrlParser: true, useUnifiedTopology: true });
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
 * @param {String} database select database target
 * @param {String} collection target collection yang ingin di input
 * @param {*} new_data boleh array atau object
 * @returns 
 */
async function insertDocument(database, collection, new_data) {
    const monggodb = new MongoClient(config.database.mongodb.uri, { useNewUrlParser: true, useUnifiedTopology: true });
    try {
        await monggodb.connect();
        //
        const coll = monggodb.db(database).collection(collection);
        if (
            typeof new_data === 'object' &&
            Array.isArray(new_data) &&
            new_data !== null
        ) { // insertMany
            return await coll.insertMany(new_data);
        } else {
            return await coll.insertOne(new_data);
        }
    } finally {
        // Ensures that the monggodb will close when you finish/error
        await monggodb.close();
    }
}

/**
 * 
 * @param {String} database select database target
 * @param {Array} collection target collection yang ingin di input (array)
 * @returns 
 */
async function showCollection(database, array_collection) {
    const monggodb = new MongoClient(config.database.mongodb.uri, { useNewUrlParser: true, useUnifiedTopology: true });
    try {
        await monggodb.connect();
        //
        const save = {};
        for (i in array_collection) {
            const coll = await monggodb.db(database).collection(array_collection[i]);
            const result = await coll.find().toArray();
            save[array_collection[i]] = result;
            // global[array_collection[i]] = result;
        }
        const coll = await monggodb.db("server").collection("system");
        const system = await coll.find().toArray();
        save["system"] = system
            .filter(data => {
                return data.database === database;
            })
            .map(data => {
                delete data.database
                return data
            })[0];
        return save;
    } finally {
        // Ensures that the monggodb will close when you finish/error
        await monggodb.close();
    }
}

/**
 * 
 * @param {String} database select database target
 * @param {String} collection target collection yang ingin di input
 * @param {String} _id document selector (primary)
 * @returns 
 */
async function showDocumentByID(database, collection, _id) {
    const monggodb = new MongoClient(config.database.mongodb.uri, { useNewUrlParser: true, useUnifiedTopology: true });
    try {
        await monggodb.connect();
        //
        const coll = monggodb.db(database).collection(collection);
        return await coll.find({
            _id: ObjectID(_id)
        }).toArray();
    } finally {
        // Ensures that the monggodb will close when you finish/error
        await monggodb.close();
    }
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
    const monggodb = new MongoClient(config.database.mongodb.uri, { useNewUrlParser: true, useUnifiedTopology: true });
    try {
        await monggodb.connect();
        //
        const coll = monggodb.db(database).collection(collection);
        return await coll.updateOne({
            _id: ObjectID(_id),
        }, {
            $set: {
                ...new_update,
            },
        });
    } finally {
        // Ensures that the monggodb will close when you finish/error
        await monggodb.close();
    }
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
    const monggodb = new MongoClient(config.database.mongodb.uri, { useNewUrlParser: true, useUnifiedTopology: true });
    try {
        await monggodb.connect();
        //
        const coll = monggodb.db(database).collection(collection);
        return await coll.updateOne({
            ...select_object,
        }, {
            $set: {
                ...new_update,
            },
        });
    } finally {
        // Ensures that the monggodb will close when you finish/error
        await monggodb.close();
    }
}

/**
 * 
 * @param {String} database select database target
 * @param {String} collection target collection yang ingin di input
 * @param {String} _id document selector (primary) or other key
 * @returns 
 */
async function deleteDocumentByID(database, collection, _id) {
    const monggodb = new MongoClient(config.database.mongodb.uri, { useNewUrlParser: true, useUnifiedTopology: true });
    try {
        await monggodb.connect();
        //
        const coll = monggodb.db(database).collection(collection);
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
                    _id: ObjectID(_id),
                });
            } else {
                return false;
            }
        }
    } finally {
        // Ensures that the monggodb will close when you finish/error
        await monggodb.close();
    }
}

/**
 * 
 * @param {String} database select database target
 * @param {String} collection target collection yang ingin di input
 * @returns 
 */
async function clearCollection(database, collection) {
    const monggodb = new MongoClient(config.database.mongodb.uri, { useNewUrlParser: true, useUnifiedTopology: true });
    try {
        await monggodb.connect();
        //
        const coll = monggodb.db(database).collection(collection);
        const result = await coll.remove({})
        global[collection] = [];
        return result;
    } finally {
        // Ensures that the monggodb will close when you finish/error
        await monggodb.close();
    }
}

module.exports = {
    insertDocument,
    showCollection,
    showDocumentByID,
    updateDocumentByID,
    updateDocumentByObject,
    deleteDocumentByID,
    clearCollection,
}
//read env-files (not used by heroku task!)
const dotenv = require('dotenv');
dotenv.config();

async function updatedb(nrToAdd, Typ, source, resetdb = false) {
    var url = process.env.MONGODB_URI;
    console.log("adding: " + nrToAdd + " to " + Typ + " in db!");
    const dbName = url.split("?")[0].split("/")[3];

    if (isNaN(+nrToAdd)) {
        console.log("Not a number!");
        return;
    }
    // create a client to mongodb
    var MongoClient = require('mongodb').MongoClient;

    // make client connect to mongo service
    const dbClient = await MongoClient.connect(url);
    if (!dbClient) {
        console.log("failed to connect to mongodb!\nCheck your connection string: " + process.env.MONGODB_URI)
        return;
    }
    var db = null;
    try {
        db = dbClient.db(dbName);
        // db pointing to newdb
        console.log("Switched to " + db.databaseName + " database");

    } catch (err) {
        dbClient.close();
        console.log(err);
        return;
    }
    var count = 0;
    var lastKnownChange = new Date().toISOString();
    try {
        
        //fetch last entry in omnipodstash
        let doc = await db.collection("omnipodstash")
            .find({ Type: Typ }, { projection: { _id: 0 } })
            .sort({ $natural: -1 }) //bottomsup
            .limit(1)
            .next();
        if (doc != null) {
            if (!resetdb) {
                count = doc.Count;
                lastKnownChange = doc.LastKnownChange;
            }
            console.log('count: ' + count);
            console.log('lastKnownChange: ' + lastKnownChange);
        }

        var operation = "Manual Add";
        if (resetdb) {
            operation = "Manual SetCount";
        }

        //create new db-object
        var dbEntity = {
            date: new Date().toISOString(),
            diff: Number(nrToAdd),
            Count: parseInt(count) + parseInt(nrToAdd),
            LastKnownChange: lastKnownChange,
            Operation: operation,
            Type: Typ,
            Source: source
        };
        //update omnipodstash with latest: 
        await db.collection("omnipodstash").insertOne(dbEntity);

        console.log("1 document inserted:");
        console.log(dbEntity);

    } catch (err) {
        console.log(err);
    } finally {
        // close the connection to db when you are done with it
        dbClient.close();
    }
};

async function getCount(Typ) {
    var url = process.env.MONGODB_URI;
    console.log("get" + Typ + "Count");
    const dbName = url.split("?")[0].split("/")[3];
    // create a client to mongodb
    var MongoClient = require('mongodb').MongoClient;

    // make client connect to mongo service
    const dbClient = await MongoClient.connect(url);
    if (!dbClient) {
        console.log("failed to connect to mongodb!\nCheck your connection string: " + process.env.MONGODB_URI)
        return;
    }
    var db = null;
    try {
        db = dbClient.db(dbName, );
        // db pointing to newdb
        //console.log("Switched to " + db.databaseName + " database");

    } catch (err) {
        dbClient.close();
        console.log(err);
        return;
    }
    var count = "-";
    try {
        //fetch last entry in omnipodstash
        let doc = await db.collection("omnipodstash")
            .find({ Type: Typ }, { projection: { _id: 0 } })
            .sort({ $natural: -1 }) //bottomsup
            .limit(1)
            .next();
        if(!doc){
            await db.createCollection("omnipodstash");
        }else{
            count = doc ? doc.Count : "-";
        }
        console.log('count: ' + count);

    } catch (err) {
        console.log(err);
    } finally {
        // close the connection to db when you are done with it
        dbClient.close();
    }

    return count;
};

async function getLastActions(Typ, nrOfLogs) {
    var url = process.env.MONGODB_URI;
    console.log("get" + Typ + " lastLogs nrOfLogs: " + nrOfLogs);
    const dbName = url.split("?")[0].split("/")[3];
    // create a client to mongodb
    var MongoClient = require('mongodb').MongoClient;

    // make client connect to mongo service
    const dbClient = await MongoClient.connect(url);
    if (!dbClient) {
        console.log("failed to connect to mongodb!\nCheck your connection string: " + process.env.MONGODB_URI)
        return;
    }
    var db = null;
    try {
        db = dbClient.db(dbName);
        // db pointing to newdb
        //console.log("Switched to " + db.databaseName + " database");

    } catch (err) {
        dbClient.close();
        console.log(err);
        return;
    }
    var returnArray = [];
    try {
        //fetch last entry in omnipodstash
        returnArray = await db.collection("omnipodstash")
            .find({ Type: Typ }, { projection: { _id:0 } })
            .sort({ $natural: -1 }) //bottomsup
            .limit(Number(nrOfLogs))
            .toArray();

        //console.log("returnArray:");
        //console.log(returnArray);

    } catch (err) {
        console.log(err);
    } finally {
        // close the connection to db when you are done with it
        dbClient.close();
    }

    return returnArray;
};

async function resetCount(Typ) {
    var url = process.env.MONGODB_URI;
    console.log("resetting db counter to 0");
    const dbName = url.split("?")[0].split("/")[3];
    // create a client to mongodb
    var MongoClient = require('mongodb').MongoClient;

    // make client connect to mongo service
    const dbClient = await MongoClient.connect(url);
    if (!dbClient) {
        console.log("failed to connect to mongodb!\nCheck your connection string: " + process.env.MONGODB_URI)
        return;
    }
    var db = null;
    try {
        db = dbClient.db(dbName);
        // db pointing to newdb
        console.log("Switched to " + db.databaseName + " database");

    } catch (err) {
        dbClient.close();
        console.log(err);
        return;
    }
    try {

        //create new db-object
        var dbEntity = {
            date: new Date().toISOString(),
            diff: 0,
            Count: 0,
            LastKnownChange: new Date().toISOString(),
            Operation: "Api Reset",
            Type: Typ,
            Source: "reset"
        };

        //update omnipodstash with latest: 
        await db.collection("omnipodstash").insertOne(dbEntity);

        console.log("1 document inserted:");
        console.log(dbEntity);

    } catch (err) {
        console.log(err);
    } finally {
        // close the connection to db when you are done with it
        dbClient.close();
    }
};
module.exports = { updatedb, getCount, getLastActions, resetCount }
const emailHelper = require("./emailHelper.js");

async function checkState(Typ) {
    // we create 'users' collection in newdb database
    var url = process.env.MONGODB_URI;
    const dbName = url.split("?")[0].split("/")[3];
    // create a client to mongodb
    var MongoClient = require('mongodb').MongoClient;

    // make client connect to mongo service
    const dbClient = await MongoClient.connect(url);
    if (!dbClient) {
        console.log("failed to connect to mongodb!\nCheck your connection string: " + process.env.MONGODB_URI);
        return;
    }
    var db = null;
    try {
        db = dbClient.db(dbName);
        // db pointing to newdb
        console.log("Switched to " + db.databaseName + " database");
        // create 'users' collection in newdb database
        await db.createCollection("omnipodstash");

    } catch (err) {
        if (err.message == 'Collection already exists. NS: nightscout.omnipodstash') {
            console.log("omnipodstash exists!")
        }
        else {
            dbClient.close();
            console.log(err);
            return;
        }
    }
    var count = 0;
    var lastKnownChange = null;
    try {
        //fetch last entry in omnipodstash
        let doc = await db.collection("omnipodstash")
            .find({ Type: Typ }, { projection: { _id: 0 } })
            .sort({ $natural: -1 }) //bottomsup
            .limit(1)
            .next();

        if (doc != null) {
            count = doc.Count;
            lastKnownChange = doc.LastKnownChange;
            console.log('count: ' + count);
            console.log('lastKnownChange: ' + lastKnownChange);
        }
        var eType = "Sensor Change";
        var typeLimit = process.env.SENSORLIMIT  || 3;
        if (Typ == "pod") {
            eType = "Insulin Change";
            typeLimit = process.env.PODLIMIT  || 3;
        } else if (Typ == "insulin") {
            eType = null; //TODO vad göra här?
            typeLimit = process.env.INSULINLIMIT || 3;
        }
        if (lastKnownChange != null) {
            var newUsedcount = 0;
            if (Typ != "insulin") {
                //fetch nr of new changes: 
                let docTreatments = await db.collection("treatments")
                    .aggregate([
                        {
                            "$match": {
                                "created_at": {
                                    "$gt": lastKnownChange,
                                    "$lt": new Date().toISOString() //found a logged "Sensor Change" with year 2106 which always logged as new used
                                },
                                "eventType": eType
                            }
                        },
                        {
                            "$group": { //group to only count one sensor change/day! 
                                "_id": {
                                    'year': { '$year': { $dateFromString: { dateString: "$created_at" } } },
                                    'month': { '$month': { $dateFromString: { dateString: "$created_at" } } },
                                    'day': { '$dayOfMonth': { $dateFromString: { dateString: "$created_at" } } },
                                },
                                "count": { "$sum": 1 }
                            }
                            // "$group": {
                            //     "_id": "$eventType",
                            //     "count": { "$sum": 1 }
                            // }
                        },
                        {
                            "$count": "totalCount"
                        }
                    ])
                    .next();


                if (docTreatments != null) {
                    newUsedcount = Number(docTreatments.totalCount);
                }
                console.log("newUsed" + Typ + ":" + newUsedcount);

            }

            let typeCount = count - newUsedcount;

            if (typeCount < typeLimit) {
                //TODO notify user (email, telegram...? )
                emailHelper.sendEmail(typeCount, Typ);
                //give it some time before exit...
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
            if (newUsedcount == 0) {
                dbClient.close();
                return;
            }
            //fetch date of last used: 
            let docLastUsedSensor = await db.collection("treatments")
                .find({ eventType: eType }, { projection: { created_at: 1 } })
                .sort({ $natural: -1 })
                .limit(1)
                .next();

            let lastChange = docLastUsedSensor.created_at;
            //create new db-object
            var dbEntity = {
                date: new Date().toISOString(),
                diff: Number(-newUsedcount),
                Count: typeCount,
                LastKnownChange: lastChange,
                Operation: "Scheduled Task " + Typ,
                Type: Typ,
                Source: 'scheduled'
            };

            //update omnipodstash with latest: 
            await db.collection("omnipodstash").insertOne(dbEntity);

            console.log("1 document inserted:");
            console.log(dbEntity);

        } else {
            //first time = omnipodstash is empty.
            //update with latest sensor and zero stash:

            var dbEntity = {
                date: new Date().toISOString(),
                diff: 0,
                Count: 0,
                LastKnownChange: new Date().toISOString(),
                Operation: "Scheduled Task " + Typ,
                Type: Typ,
                Source: 'scheduled'
            };
            //update db: 
            await db.collection("omnipodstash").insertOne(dbEntity);
            console.log("1 document inserted:");
            sendEmail(0, Typ);
            //give it some time before exit...
            await new Promise(resolve => setTimeout(resolve, 5000));
            // close the connection to db when you are done with it
        }


    } catch (err) {
        console.log(err);
    } finally {
        // close the connection to db when you are done with it
        dbClient.close();
        return;
    }
}
module.exports = { checkState }
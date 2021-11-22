'use strict';
// Load the AWS SDK for Node.js
let AWS = require('aws-sdk');
// Create DynamoDB document client
let docClient = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });
// get our reference to table from environment variables
const TableName = process.env.TABLE_NAME


module.exports.logItemChanges = async(event) => {

    console.log("Trigger of LOGGER PULLED");
    console.log(event);

    return {
        statusCode: 200,
        body: JSON.stringify({
                message: 'Trigger was pulled, DB Item changed!',
                input: event,
            },
            null,
            2
        ),
    };
};

module.exports.getItemFromDB = async(event) => {

    let anyTypeID;
    let typeOfID;
    let integerID;
    // also here better not test for !event.key1 as this is true if 0
    if (!event || isNaN(event.key1) || isNaN(parseFloat(event.key1))) {
        return {
            statusCode: 400,
        };
    }
    typeOfID = typeof event.key1;
    anyTypeID = event.key1;

    if (typeOfID === "number") {
        integerID = anyTypeID;
    }
    if ((typeOfID === 'string')) {
        if (!isNaN(anyTypeID) && !isNaN(parseFloat(anyTypeID))) {
            integerID = parseInt(anyTypeID, 10)
        } else {
            return {
                statusCode: 400,
            };
        }
    }

    var params = {
        TableName: TableName,
        Key: {
            'ID': integerID
        }
    };

    let result = await docClient.get(params, function(err, data) {
        // this means err probobly on "server" occured, no error if not found!!!
        if (err) {
            console.log("Error", err);
            return {
                statusCode: 500,
                body: err,
            };
        } else {
            // if item was found it is in data.Item, otherwise data.Item is empty
            if (data.Item) {
                return data;
            } else {
                // this happes if ressource was not found on DB
                return null;
            }
        }
    }).promise();


    if (result.Item === undefined) {
        return {
            statusCode: 404,
        };
    }

    const response = {
        statusCode: 200,
        body: result,
    };
    return response;
};


module.exports.writeToDB = async(event) => {


    let anyTypeID;
    let typeOfID;
    let integerID;

    // better not test for !event.key1 as this returns also true if 0!!!!
    if (!event ||  isNaN(event.key1) || isNaN(parseFloat(event.key1)) || !event.key2 || !event.key3 ) {
        return {
            statusCode: 400,
        };
    }
    // TODO should wrong inputs for key2 and 3 be parsed/defaultet or just 400?


    typeOfID = typeof event.key1;
    anyTypeID = event.key1;

    if (typeOfID === "number") {
        integerID = anyTypeID;
    }
    if ((typeOfID === 'string')) {
        if (!isNaN(anyTypeID) && !isNaN(parseFloat(anyTypeID))) {
            integerID = parseInt(anyTypeID, 10)
        } else {
            return {
                statusCode: 400,
            };
        }
    }

    // check if an iten can be found under given id
    // then we can put or post or restrict updates
    let res = await this.getItemFromDB(event);

    // if id not already in db, just post the new item
    if (res.statusCode === 404) {
        console.log("Item was not found in DB")
        //  just put id from event in integerID and post direct
        var params = {
            TableName: TableName,
            Item: {
                'ID': integerID,
                'Name': event.key2,
                'Surname': event.key3,
            }
        };
        let result = await docClient.put(params, function(err, data) {
            if (err) {
                console.log("Error", err);
            } else {
                console.log("Success", data);
            }
        }).promise();
        // TODO access data/result
        return {
            statusCode: 200,
            body: JSON.stringify({
                    message: 'User was not already in DB with given ID! User was posted',
                    input: event,
                    output: result
                },
                null,
                2
            ),
        };
    }
    console.log("Item was found in DB")

    let querriedID = res.body.Item.ID;
    let querriedName = res.body.Item.Name;
    let querriedSurname = res.body.Item.Surname;

    console.log("querriedID is " + querriedID + " and typed in id is " + event.key1)

    // check could be omitted if 404 not returned item was found and ids are equal
    if (querriedID === event.key1) {
        // if id is the same put would update
        // we could put a 4 key for the user to decide if put/post - keywords are update/new
        if (event.key4 === null || event.key4 === undefined || event.key4 === "update") {
            // default
            console.log("Item will be updated")
            integerID = event.key1;
        }

        if (event.key4 === "new") {
            let idTaken = true;
            console.log("Item will be put with new ID")
            let i = querriedID;
            // querry for next possible free id:
            while (idTaken === true) {
                var params = {
                    TableName: TableName,
                    KeyConditionExpression: 'ID = :ID',
                    ExpressionAttributeValues: {
                        ':ID': i, // look from the wanted ID onward and increment
                    },
                    ScanIndexForward: false
                };

                let query = await docClient.query(params, function(err, data) {
                    if (err) {
                        console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
                    } else {
                        console.log("Query succeeded." + data);
                        return data;
                    }
                }).promise();

                if (query.Count === 0) {
                    idTaken = false;
                    integerID = i;
                }
                i = i + 1;
                console.log("At end i is: " + i)
            }
        }
    }
    // ready the params with the correct ID
    var params = {
        TableName: TableName,
        Item: {
            'ID': integerID,
            'Name': event.key2,
            'Surname': event.key3,
        }
    };
    let result = await docClient.put(params, function(err, data) {
        if (err) {
            console.log("Error", err);
        } else {
            console.log("Success", data);
        }
    }).promise();
    // TODO access data/result and/or send actual ID!!!
    return {
        statusCode: 200,
        body: JSON.stringify({
                message: 'Your function executed successfully! User was posted with new id ' + integerID,
                input: event,
                output: result
            },
            null,
            2
        ),
    };
};
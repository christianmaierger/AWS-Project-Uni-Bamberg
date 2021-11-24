'use strict';
// Load the AWS SDK for Node.js
let AWS = require('aws-sdk');
// Create DynamoDB document client
let docClient = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });

var lambda = new AWS.Lambda({
    region: 'eu-central-1' //change to your region
});
// get our reference to table from environment variables
const TableName = process.env.TABLE_NAME
const GetFunction = process.env.Get_Function


module.exports.logItemChanges = async(event) => {

    console.log("Trigger of LOGGER PULLED as an User was added or changed: ");
    console.log(event);
};

function validateInput(event, typeOfID, anyTypeID, integerID) {
    // also here better not test for !event.key1 as this is true if 0
    if (!event || isNaN(event.key1) || isNaN(parseFloat(event.key1))) {
        return;
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
            return;
        }
    }
    return integerID;
}

module.exports.getItemFromDB = async(event) => {

    let anyTypeID;
    let typeOfID;
    let integerID;

    integerID = validateInput(event, typeOfID, anyTypeID, integerID);

if (integerID=== undefined) {
        return {
            statusCode: 400,
        };
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
    // TODO should wrong inputs for key2 and 3 be parsed/defaultet or just 400?
    integerID = validateInput(event, typeOfID, anyTypeID, integerID);

    if (integerID === undefined|| !event.key2 || !event.key3) {
        return {
            statusCode: 400,
        };
    }

    // check if an iten can be found under given id
    // then we can put or post or restrict updates
    // todo hardcoded function name
    let res = await lambda.invoke({
        FunctionName: GetFunction,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify(event, null, 2) // pass params
    }, function(error, data) {
        if (error) {
            console.log('error', error);
        } else {
            console.log(data.Payload);
            return data;
        }
    }).promise();

    console.log("The result as Promise from the Callback of the Invokation is " + res.Payload);
    res = JSON.parse(res.Payload);
    console.log("The result as Promise from the Callback of the Invokation is " + res);

    let message = "";

    // if id not already in db, just post the new item
    if (res.statusCode === 404) {
        console.log("Item was not found in DB")
        message= "Item was not found in DB and was posted"
        //  just put id from event in integerID and post direct
    }
    if (event.key4 === null || event.key4 === undefined || event.key4 === "update") {
        // default
        console.log("Item was found in DB and will be updated")
        message= "Item was found in DB and will be updated"
    }
    if (event.key4 === "new") {
        let idTaken = true;
        console.log("Item will be put with new ID")
        let i = integerID;
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
                message = "As given ID was already taken, Item was posted with next free ID: " + integerID;
            }
            i = i + 1;
            console.log("At end i is: " + i)
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

    return {
        statusCode: 200,
        body: JSON.stringify({
                message: message,
                input: event,
                output: res
            },
            null,
            2
        ),
    };
};
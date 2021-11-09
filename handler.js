'use strict';
// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Create DynamoDB document client
var docClient = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });
// get our reference to table from environment variables
const TableName = process.env.TABLE_NAME


module.exports.hello = async(event) => {
    return {
        statusCode: 200,
        body: JSON.stringify({
                message: 'Go Serverless v2.0! Your function executed successfully!',
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
    if (!event || event.key1 === undefined || event.key1 === null || isNaN(event.key1) || isNaN(parseFloat(event.key1))) {
        const response = {
            statusCode: 400,
        };
        return response;
    }
    typeOfID = typeof event.key1;
    anyTypeID = event.key1;

    if (typeof event.key1 === "number") {
        integerID = anyTypeID;
    }
    if ((typeOfID === 'string')) {
        if (!isNaN(anyTypeID) && !isNaN(parseFloat(anyTypeID))) {
            integerID = parseInt(anyTypeID, 10)
        } else {
            const response = {
                statusCode: 400,
            };
            return response;
        }
    }

    var params = {
        TableName: TableName,
        Key: {
            'ID': integerID,
            'Name': event.key2
        }
    };

    let result = await docClient.get(params, function(err, data) {
        // this means err probobly on "server" occured, no error if not found!!!
        if (err) {
            console.log("Error", err);
            const response = {
                statusCode: 500,
                body: err,
            };
            return response;
        } else {
            // if item was found it is in data.Item, otherwise data.Item is empty
            if (data.Item) {
                console.log("data should have a value: " + data.Item);
                return data;
            } else {
                console.log("data should be empty " + data);
                // this happes if ressource was not found on DB
                return null;
            }
        }
    }).promise();

    let i = 0;
    for (let attr in result.Item) {
        console.log("Attr" + i++ + "= " + attr);
    }
    console.log("Result is " + result);
    console.log("Result.Item is " + result.Item);

    if (result.Item === undefined) {
        const response = {
            statusCode: 404,
        };
        return response;
    }

    const response = {
        statusCode: 200,
        body: result,
    };
    console.log("This is the response body " + response.body);
    return response;
};


module.exports.writeToDB = async(event) => {

    // check if an iten can be found under given id
    // then we can put or post or restrict updates
    let res = this.getItemFromDB();


    var params = {
        TableName: TableName,
        Item: {
            'ID': event.body.key1,
            'Name': event.body.key2,
            'Surname': event.body.Key3,
        }
    };

    docClient.put(params, function(err, data) {
        if (err) {
            console.log("Error", err);
        } else {
            console.log("Success", data);
        }
    });

    return {
        statusCode: 200,
        body: JSON.stringify({
                message: 'Go Serverless v2.0! Your function executed successfully!',
                input: event,
            },
            null,
            2
        ),
    };
};
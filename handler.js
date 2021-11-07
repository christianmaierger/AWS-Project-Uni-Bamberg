'use strict';
// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Create DynamoDB document client
var docClient = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });

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

    let id;
    // if no id was given, or null or no event in general was recieved or another format
    // than a number was given 400 is returned as this is most likely a client side error
    if (!event || event.key1 === undefined || event.key1 === null || !(typeof event.key1 === "number")) {
        const response = {
            statusCode: 400,
        };
        return response;
    } else {
        id = event.key1;
    }

    var params = {
        TableName: 'MyTable',
        Key: { 'ID': id }
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
                console.log("data should have a value: " + data);
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

    if (result.item === undefined) {
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
        TableName: 'MyTable',
        Item: {
            'Key': VALUE,
            'ATTRIBUTE_1': 'STRING_VALUE',
            'ATTRIBUTE_2': VALUE_2
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
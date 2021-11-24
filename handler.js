'use strict';
// Load the AWS SDK for Node.js
const AWS = require('aws-sdk');
// Create DynamoDB document client
const docClient = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});

const lambda = new AWS.Lambda({
    region: 'eu-central-1' //change to your region
});
// get our reference to table from environment variables
const TableName = process.env.Table_Name;
const GetFunction = process.env.Get_Function;


module.exports.logItemChanges = async (event) => {

    console.log("Trigger of LOGGER PULLED as an User was added or changed: ");
    console.log(event);
};

function wrapResponse(statusCode, data) {
    return {
        statusCode: statusCode,
        body: data
    };
}

function wrapParams(key, data, tableName = TableName) {
    let params = {TableName: tableName};
    params[key] = data;
    return params;
}

function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

function validateInput(event, integerID) {
    let anyTypeID;
    let typeOfID;
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
            integerID = parseInt(anyTypeID, 10);
        } else {
            return;
        }
    }
    return integerID;
}

module.exports.getItemFromDB = async (event) => {


    let integerID;

    integerID = validateInput(event, integerID);

    if (integerID === undefined) {
        return wrapResponse(400, {message: "Bad Request: ID missing or in false format"});
    }
    const params = wrapParams("Key", { email: event.email });

    try {
        let response = await docClient.get(params).promise();
        if (response && isEmpty(response)) {
            return wrapResponse(404, {message: "No entry matched the given parameters."});
        }
        return wrapResponse(200, response);
    } catch (error) {
        return wrapResponse(error.statusCode, {message: error.message});
    }
};


module.exports.create = async (event) => {

    let integerID;
    integerID = validateInput(event, integerID);

    if (integerID === undefined) {
        return wrapResponse(400, {message: "Bad Request: ID missing or in false format"});
    }
    // check if an iten can be found under given id
    // then we can put or post or restrict updates
    try {
        const response = await lambda.invoke({
            FunctionName: GetFunction,
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify(event, null, 2) // pass params
        }).promise();
        let payload = JSON.parse(response.Payload);
        if (payload.statusCode === 200) {
            return wrapResponse(400, {message: "Entry with given ID already exists"});
        }
    } catch (error) {
        return wrapResponse(400, {message: "There was a Problem checking the Database"});
    }

    let params = wrapParams("Item", event);
    try {
        await docClient.put(params).promise();
        return wrapResponse(200, {message: "Creation of entry successful"});
    } catch (error) {
        return wrapResponse(error.statusCode, {message: error.message});
    }
};
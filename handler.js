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

function validateEmail(email) {
    var validationRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

    if (email && typeof email === 'string' && email.match(validationRegex)) {
        return true;
    } else {
        return false;
    }
}


module.exports.create = async (event) => {

    if(!validateEmail(event.email)) {
        return wrapResponse(400, {message: "Bad Request: Not a valid email-adress"});
    }
    try {
       const response = await lambda.invoke({
            FunctionName: GetFunction,
            InvocationType: 'RequestResponse', // is default
            Payload: JSON.stringify(event, null, 2) // pass params
        }).promise();
        let payload = JSON.parse(response.Payload);
        if (payload.statusCode === 200) {
            return wrapResponse(405, {message: "Entry with given ID already exists, please use update to overide an existing entry"});
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

module.exports.read = async (event) => {

    if(!validateEmail(event.email)) {
        return wrapResponse(400, {message: "Bad Request: Not a valid email-adress"});
    }

    const params = wrapParams("Key", { email: event.email, name: event.name });

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

module.exports.update = async (event) => {

    if(!validateEmail(event.email)) {
        return wrapResponse(400, {message: "Bad Request: Not a valid email-adress"});
    }
    // check if an item can be found under given id
    try {
       const response = await lambda.invoke({
            FunctionName: GetFunction,
            InvocationType: 'RequestResponse', // is default
            Payload: JSON.stringify(event, null, 2) // pass params
        }).promise();
        let payload = JSON.parse(response.Payload);
        if (payload.statusCode === 404) {
            //No Item found -> cant update it
            return wrapResponse(404, {message: "There is no entry to be updated"});
        }
    } catch (error) {
        return wrapResponse(400, {message: "There was a Problem checking the Database"});
    }

    let params = wrapParams("Item", event);
    try {
        await docClient.put(params).promise();
        return wrapResponse(200, {message: "Entry updated successfully"});
    } catch (error) {
        return wrapResponse(error.statusCode, {message: error.message});
    }
};

module.exports.delete = async (event) => {

    if(!validateEmail(event.email)) {
        return wrapResponse(400, {message: "Bad Request: Not a valid email-adress"});
    }

    try {
        const response = await lambda.invoke({
             FunctionName: GetFunction,
             InvocationType: 'RequestResponse', // is default
             Payload: JSON.stringify(event, null, 2) // pass params
         }).promise();
         let payload = JSON.parse(response.Payload);
         if (payload.statusCode === 404) {
             //No Item found -> cant delete it
             return wrapResponse(404, {message: "There is no entry to be deleted"});
         }
     } catch (error) {
         return wrapResponse(400, {message: "There was a Problem checking the Database"});
     }
 
     let params = wrapParams("Key", event);
     try {
         await docClient.delete(params).promise();
         return wrapResponse(200, {message: "Entry deleted successfully"});
     } catch (error) {
         return wrapResponse(error.statusCode, {message: error.message});
     }
};
// Load the AWS SDK for Node.js
const AWS = require("aws-sdk");
// Create DynamoDB document client
const docClient = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10" });

const lambda = new AWS.Lambda({
    region: "eu-central-1",
});

function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

function validateEmail(email) {
    const validationRegex =
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

    if (email && typeof email === "string" && email.match(validationRegex)) {
        return true;
    } else {
        return false;
    }
}

function wrapResponse(statusCode, data) {
    return {
        statusCode: statusCode,
        body: data,
    };
}

function wrapParams(key, data, tableName = TableName) {
    let params = { TableName: tableName };
    params[key] = data;
    return params;
}

async function isAlreadyExisting(email, name, surname) {
    const item = { email, name, surname };

    try {
        const response = await lambda
            .invoke({
                FunctionName: GetFunction,
                InvocationType: "RequestResponse", // is default
                Payload: JSON.stringify(item, null, 2), // pass params
            })
            .promise();
        const payload = JSON.parse(response.Payload);

        if (payload.statusCode === 200) {
            return true;
        }
    } catch (error) {
        throw "dberror";
    }
}

// get our reference to table from environment variables
const TableName = process.env.Table_Name;
const GetFunction = process.env.Get_Function;

module.exports = {
    docClient,
    lambda,
    isEmpty,
    validateEmail,
    wrapResponse,
    wrapParams,
    isAlreadyExisting,
    TableName,
    GetFunction,
};

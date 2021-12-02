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

function isMailValid(email) {
    const validationRegex =
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

    if (email && typeof email === "string" && email.match(validationRegex)) {
        return true;
    } else {
        return false;
    }
}

function validateEmail(email) {
    if (!isMailValid(email)) {
        throw errorType.badmail;
    }
}

const errorType = {
    badmail: "badmail",
    idnotexists: "idnotexists",
    dberror: "dberror",
    idexists: "idexists",
};

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

async function isAlreadyExisting(email, name) {
    const item = { email, name };

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
        } else {
            return false;
        }
    } catch (error) {
        throw errorType.dberror;
    }
}

async function validateItemExists(email, name) {
    if (!(await isAlreadyExisting(email, name))) {
        throw errorType.idnotexists;
    }
}

async function validateItemNotExists(email, name) {
    if (await isAlreadyExisting(email, name)) {
        throw errorType.idexists;
    }
}

function handleError(err) {
    switch (err) {
        case errorType.badmail:
            return wrapResponse(400, {
                message: "Bad Request: Not a valid email-adress",
            });

        case errorType.idnotexists:
            return wrapResponse(404, {
                message: "There is no entry for the given data",
            });

        case errorType.dberror:
            return wrapResponse(400, {
                message: "There was a Problem checking the Database",
            });

        case errorType.idexists:
            return wrapResponse(405, {
                message:
                    "Entry with given ID already exists, please use update to overide an existing entry",
            });

        default:
            return wrapResponse(405, {
                message: "Unknown error thrown: " + err,
            });
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
    handleError,
    TableName,
    GetFunction,
    errorType,
    validateItemExists,
    validateItemNotExists,
};

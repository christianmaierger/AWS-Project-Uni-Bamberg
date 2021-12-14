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

async function isAlreadyExisting(email, birthday) {
    // todo distinguish bastetable and sgl checking for items
    const item = { email: email, birthday: birthday };

    try {
        const response = await lambda
            .invoke({
                FunctionName: GetFunction,
                InvocationType: "RequestResponse", // is default
                Payload: JSON.stringify(item, null, 2), // pass params
            })
            .promise();
        const payload = JSON.parse(response.Payload);

        return (payload.statusCode === 200);
    } catch (error) {
        throw errorType.dberror;
    }
}

function  createPrioFromBirthday(birthday) {
    let prio;
    // todo ISO like 2000-01-02 is of the utmost significance!!!!
    //todo refactor this function to shared.js when done debugging/testing
    // perhaps try to parse otehr formats to YYYY-MM-DD or enforce this type

    let today = new Date();
    console.log("now is: " + today);
    console.log("today is: " + today);
    let birthDate = new Date( birthday);
    console.log("birthday is: " + birthday);

    let age = today.getFullYear() - birthDate.getFullYear();
    console.log("age is: " + age);
    let m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    if(age< 40) {
        prio=3;
    }
    if(age>= 40 && age <60) {
        prio=2;
    }
    // todo max age
    if(age>= 60 && age<120) {
        prio=1;
    }
    if (age >=120) {
        throw errorType.badBirthday
    }
    console.log(prio)
    return prio;
}

const errorType = {
    badEmail: "badEmail",
    badBirthday: "badBirthday",
    badPlz: "badPlz",
    idnotexists: "idnotexists",
    dberror: "dberror",
    idexists: "idexists",
    badGender: "badGender",
    badPrio: "badPrio",
};

function handleError(err) {
    switch (err) {
        case errorType.badEmail:
            return wrapResponse(400, {
                message: "Bad Request: Email is not valid",
            });
        case errorType.badBirthday:
            return wrapResponse(400, {
                message: "Bad Request: Birthday is not valid, must be - seperated ISO String in format: YYYY-MM-DD",
            });
        case errorType.badPlz:
            return wrapResponse(400, {
                message: "Bad Request: PLZ is not valid",
            });
        case errorType.badGender:
            return wrapResponse(400, {
                message: "Bad Request: Gender is not valid",
            });
        case errorType.badPrio:
            return wrapResponse(400, {
                message: "Bad Request: Prio is not valid",
            });
        case errorType.idnotexists:
            return wrapResponse(404, {
                message: "There is no entry for the given data",
            });

        case errorType.dberror:
            return wrapResponse(500, {
                message: "There was a Problem checking the Database",
            });

        case errorType.idexists:
            return wrapResponse(405, {
                message:
                    "Entry with given ID already exists, please use update to overide an existing entry",
            });
            // todo really 405 method not allowed as default?
        default:
            return wrapResponse(405, {
                message: "Unknown error thrown: " + err,
            });
    }
}

// get our reference to table from environment variables
const TableName = process.env.Table_Name;
const GetFunction = process.env.Get_Function;
const GSIName = process.env.GSI_Name;

module.exports = {
    docClient,
    lambda,
    isEmpty,
    wrapResponse,
    wrapParams,
    handleError,
    TableName,
    GSIName,
    GetFunction,
    errorType,
    isAlreadyExisting,
    createPrioFromBirthday
};

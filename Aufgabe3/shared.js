// Load the AWS SDK for Node.js
const AWS = require("aws-sdk");
const crypto = require("crypto");
const ses = new AWS.SES({region: "eu-central-1"});
// Create DynamoDB document client
const docClient = new AWS.DynamoDB.DocumentClient({apiVersion: "2012-08-10"});

const lambda = new AWS.Lambda({
    region: "eu-central-1",
});

function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}


function wrapResponse(statusCode, data) {
    return {
        isBase64Encoded: false,
        statusCode: statusCode,
        body: JSON.stringify(data),
    };
}

function wrapParams(key, data, tableName = TableName) {
    let params = {TableName: tableName};
    params[key] = data;
    return params;
}

function wrapDeleteParams(itemAttributes, item, tableName = TableName) {
    let deleteExpression = 'remove';

    for (let attribute of itemAttributes) {
        if (attribute !== 'email' && attribute !== 'birthday') {
            deleteExpression += ` ${attribute},`;
        }
    }

    deleteExpression = deleteExpression.slice(0, -1);

    const email = item.email;
    const birthday = item.birthday;

    let params = wrapParams('Key', {email, birthday}, tableName);
    params.UpdateExpression = deleteExpression;
    params.ReturnValues = 'UPDATED_NEW';

    return params;
}

function wrapUpdateParams(item, tableName = TableName) {
    const itemKeys = Object.keys(item);

    let updateExpression = 'set';
    let expressionAttributeValues = {};

    let counter = 0;

    for (let key of itemKeys) {
        if (key !== 'email' && key !== 'birthday') {
            const placeHolderVariable = `:${String.fromCharCode(counter + 97)}`;

            updateExpression += ` ${key} = ${placeHolderVariable},`;
            expressionAttributeValues[placeHolderVariable] = item[key];
            counter++;
        }
    }

    updateExpression = updateExpression.slice(0, -1);

    const email = item.email;
    const birthday = item.birthday;

    let params = wrapParams('Key', {email, birthday}, tableName);
    params.UpdateExpression = updateExpression;
    params.ExpressionAttributeValues = expressionAttributeValues;
    params.ReturnValues = 'UPDATED_NEW';

    return params;
}

async function isAlreadyExisting(email, birthday) {
    const item = {item: {email: email, birthday: birthday}};

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

function createPrioFromBirthday(birthday) {
    let prio;

    let today = new Date();
    let birthDate = new Date(birthday);

    let age = today.getFullYear() - birthDate.getFullYear();
    let m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    if (age < 18) {
        prio = -1;
    }
    if (age >= 18 && age < 40) {
        prio = 3;
    }
    if (age >= 40 && age < 60) {
        prio = 2;
    }
    if (age >= 60 && age < 140) {
        prio = 1;
    }
    if (age >= 140) {
        throw errorType.badBirthday
    }
    return prio;
}

function createPriority(birthday, system_relevance, pre_diseases) {
    let prio = createPrioFromBirthday(birthday);
    if (system_relevance === true || pre_diseases === true) {
        if (prio > 2) {
            prio = 2;
        }
    }
    return prio;
}

function hashPassword(clear_password) {
    return crypto
        .createHash("sha256")
        .update(clear_password)
        .digest("base64");
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
    badName: "badName",
    badPassword: "badPassword",
    badPreDiseases: "badPreDiseases",
    badSystemRelevance: "badSystemRelevance",
    notAllNecessaryInformation: "notAllNecessaryInformation",
    badDate: "badVaccinationDate",
    badInput: "badInput"
};

function handleError(err) {
    switch (err) {
        case errorType.badEmail:
            return wrapResponse(400, {
                message: "Bad Request: Email is not valid.",
            });
        case errorType.badBirthday:
            return wrapResponse(400, {
                message: "Bad Request: Birthday is not valid, must be - seperated ISO String in format: YYYY-MM-DD",
            });
        case errorType.badPlz:
            return wrapResponse(400, {
                message: "Bad Request: PLZ is invalid.",
            });
        case errorType.badGender:
            return wrapResponse(400, {
                message: "Bad Request: Gender is invalid",
            });
        case errorType.badPrio:
            return wrapResponse(400, {
                message: "Bad Request: Priority is invalid",
            });
        case errorType.idnotexists:
            return wrapResponse(404, {
                message: "There is no entry for the given data.",
            });

        case errorType.dberror:
            return wrapResponse(500, {
                message: "There was a problem checking the database.",
            });

        case errorType.idexists:
            return wrapResponse(405, {
                message:
                    "Entry with given ID already exists, please use update to override an existing entry.",
            });

        case errorType.badName:
            return wrapResponse(400, {
                message:
                    "Name is not formatted correctly.",
            });

        case errorType.badInput:
            return wrapResponse(400, {
                message:
                    "Input is not formatted correctly.",
            });

        case errorType.badSystemRelevance:
            return wrapResponse(400, {
                message:
                    "System Relevance is not formatted correctly.",
            });
        case errorType.badPreDiseases:
            return wrapResponse(400, {
                message:
                    "Pre Diseases is not formatted correctly.",
            });
        case errorType.badPassword:
            return wrapResponse(400, {
                message:
                    "Password is not formatted correctly. Please use at least 8 characters, at least one number and one " +
                    "special character out of the following: @$!%*#?&??%&|+-_=/*()\"'"
            });
        case errorType.badDate:
            return wrapResponse(400, {
                message:
                    "Vaccination Date was not formatted correctly or is in past"
            });
        case errorType.notAllNecessaryInformation:
            return wrapResponse(400, {
                message:
                    "Not all necessary information is provided. Please ensure that pre_diseases and system_relevance is listed.",
            });
        default:
            return wrapResponse(418, {
                message: "Unknown error thrown: " + err,
            });
    }
}

function checkAndFormatName(item) {
    if (item.name) {
        item.surname = item.name.surname;
        item.lastname = item.name.lastname;
        delete item.name
    }
}

// get our reference to table from environment variables
const TableName = process.env.Table_Name;
const AppointmentTableName = process.env.Appointment_Table_Name;
const GetFunction = process.env.Get_Function;
const AssignVaccinationSlotsFunction = process.env.Assign_Vaccination_Slots_Function;
const GSIName = process.env.GSI_Name;
const TokenIndexName = process.env.Token_Index_Name;

module.exports = {
    ses,
    docClient,
    lambda,
    isEmpty,
    wrapResponse,
    wrapParams,
    wrapUpdateParams,
    wrapDeleteParams,
    AssignVaccinationSlotsFunction,
    TokenIndexName,
    handleError,
    TableName,
    GSIName,
    GetFunction,
    errorType,
    isAlreadyExisting,
    createPriority,
    hashPassword,
    checkAndFormatName,
    AppointmentTableName
};

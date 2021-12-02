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

function isPlzValid(plz) {
    const validationRegex =
        /^[0-9]*$/;
    if (plz && typeof plz === "string" && plz.match(validationRegex) && plz.length===5) {
        return true;
    } else {
        return false;
    }
}

function isBirthdayValid(birthday) {
   // todo validition is fine, but perhaps when string is in form YYYYMMDD - should be appended as delimeter or make form without - invalid
    // this powerfull regex validates a date String with or without - in form YYYY-MM-DD also validates only valid numbers like day only up to 31
//    const validationRegex = /^([0-9]{4})-?(1[0-2]|0[1-9])-?(3[01]|0[1-9]|[12][0-9])$/
    const validationRegex = /^([0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])$/
    if (birthday && birthday.match(validationRegex)) {
        return true;
    } else {
        return false;
    }
    return true;
}

function isGenderValid(gender) {
    // todo more refined validation and perhaps allow no gender
    if ((gender && (gender === "m" || gender === "w" || gender === "d")) || !gender) {
        return true;
    } else {
        return false;
    }
}

function isPrioValid(prio) {
    if (prio === 1 || prio ===2 || prio === 3) {
        return true;
    } else {
        return false;
    }
}


function validateEmail(email) {
    if (!isMailValid(email)) {
        console.log("mail invalid")
        throw errorType.badEmail;
    }
}

function validatePlz(plz) {
    if (!isPlzValid(plz)) {
        console.log("plz invalid")
        throw errorType.badPlz;
    }
}

function validateBirthday(birthday) {
    if (!isBirthdayValid(birthday)) {
        throw errorType.badBirthday;
    }
}

function validateGender(gender) {
    if (!isGenderValid(gender)) {
        throw errorType.badGender;
    }
}

function validatePrio(gender) {
    if (!isPrioValid(gender)) {
        throw errorType.badGender;
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

        if (payload.statusCode === 200) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        throw errorType.dberror;
    }
}

async function validateItemExists(email, birthday) {
    if (!(await isAlreadyExisting(email, birthday))) {
        throw errorType.idnotexists;
    }
    return true;
}

async function validateItemNotExists(email, birthday) {
    if (await isAlreadyExisting(email, birthday)) {
        throw errorType.idexists;
    }
    return true;
}

function  createPrioFromBirthday(birthday) {
    let prio;
    // todo ISO like 2000-01-02 is of the utmost significance!!!!
    //todo refactor this function to shared.js when done debugging/testing
    // perhaps try to parse otehr formats to YYYY-MM-DD or enforce this type

    let today = new Date();
    let now = Date.now()
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
    validateEmail,
    validatePlz,
    validateBirthday,
    validateGender,
    validatePrio,
    wrapResponse,
    wrapParams,
    handleError,
    TableName,
    GSIName,
    GetFunction,
    errorType,
    validateItemExists,
    validateItemNotExists,
    createPrioFromBirthday
};

'use strict';

// get shared functions and variables
const {
    docClient,
    wrapResponse,
    wrapParams,
    handleError,
    errorType,
    hashPassword,
    createPriority,
    checkAndFormatName
} = require('../shared');

// Load the AWS SDK for Node.js
const AWS = require("aws-sdk");
const crypto = require("crypto");
// Create DynamoDB document client

const GetFunction = process.env.Get_Function;

const lambda = new AWS.Lambda({
    region: "eu-central-1",
});

const {
    validateEmail,
    validatePlz,
    validateBirthday,
    validateGender,
    validateItemNotExists,
    validateName, validatePreDisease, validateSystemRelevance, validatePassword, validateItem,
} = require('../validator');

async function putItemToDatabase(item) {
    const params = wrapParams('Item', item);

    try {
        await docClient.put(params).promise();
    } catch (error) {
        throw errorType.dberror;
    }
}


async function createItem(item) {
    /*  validateEmail(item.email);
      validatePlz(item.plz);
      validateGender(item.gender);
      validateBirthday(item.birthday);
      validateName(item.name);
      validatePreDisease(item.pre_diseases)
      validateSystemRelevance(item.system_relevance);
      validatePassword(item.password);*/

    //todo if name is object change it to new format
    checkAndFormatName(item);

    // todo, könnte man doch direkt mit der Funktion machen?
    validateItem(item)

    //todo validieren ob pre-disease und system relevance vorhanden sind?
    if (item.system_relevance == undefined || item.pre_diseases == undefined) {
        throw errorType.notAllNecessaryInformation;
    }

    if (item.token !== undefined) {
        delete item.token;
    }
    item.password = hashPassword(item.password);

    item.prio = createPriority(item.birthday, item.system_relevance, item.pre_diseases);

    await validateItemNotExists(item.email, item.birthday);

    return await putItemToDatabase(item);
}

module.exports.create = async (event) => {
    const item = JSON.parse(event.body).item;
    try {
        let res =  await createItem(item);
        console.log(res)
        return wrapResponse(201, {message: 'Creation of entry successful'});
    } catch (err) {
        console.log(err)
        return handleError(err);
    }
};
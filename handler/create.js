"use strict";

// get shared functions and variables
const {
    docClient,
    validateEmail,
    wrapResponse,
    wrapParams,
    handleError,
    isAlreadyExisting,
    errorType,
} = require("../shared");

async function putItemToDatabase(email, name, surname) {
    const item = { email, name, surname };

    const params = wrapParams("Item", item);

    try {
        await docClient.put(params).promise();
    } catch (error) {
        throw errorType.dberror;
    }
}

async function createItem(email, name, surname) {
    if (!validateEmail(email)) {
        throw errorType.badmail;
    }

    if (await isAlreadyExisting(email, name)) {
        throw errorType.idexists;
    }

    return await putItemToDatabase(email, name, surname);
}

module.exports.create = async (event) => {
    const email = event.email;
    const name = event.name;
    const surname = event.surname;

    try {
        await createItem(email, name, surname);
        return wrapResponse(200, { message: "Creation of entry successful" });
    } catch (err) {
        return handleError(err);
    }
};

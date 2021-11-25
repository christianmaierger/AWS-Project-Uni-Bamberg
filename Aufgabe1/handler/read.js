"use strict";

// get shared functions and variables
const {
    docClient,
    validateEmail,
    wrapParams,
    wrapResponse,
    errorType,
    handleError,
    isEmpty,
} = require("../shared");

// validates that an item exists (will be used by many most of the other functions two)
async function validateItemExists(email, name) {
    const params = wrapParams("Key", { email: email, name: name });
    try {
        const response = await docClient.get(params).promise();
        if (response && isEmpty(response)) {
            throw errorType.idnotexists;
        }
    } catch (error) {
        if (error == errorType.idnotexists) {
            throw errorType.idnotexists;
        }
        throw errorType.dberror;
    }
}

async function getItem(email, name) {
    validateEmail(email);

    await validateItemExists(email, name);

    const params = wrapParams("Key", { email: email, name: name });
    try {
        const response = await docClient.get(params).promise();
        return response;
    } catch (error) {
        throw errorType.dberror;
    }
}

module.exports.read = async (event) => {
    const email = event.email;
    const name = event.name;

    try {
        const response = await getItem(email, name);
        return wrapResponse(200, response);
    } catch (err) {
        return handleError(err);
    }
};

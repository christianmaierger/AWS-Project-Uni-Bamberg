"use strict";

// get shared functions and variables
const {
    docClient,
    validateEmail,
    wrapParams,
    wrapResponse,
    isAlreadyExisting,
    errorType,
    handleError,
} = require("../shared");

async function getItem(email, name) {
    if (!validateEmail(email)) {
        throw errorType.badmail;
    }

    if (!isAlreadyExisting(email, name)) {
        throw errorType.idnotexists;
    }

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

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

async function getItem(email, name) {
    validateEmail(email);

    const params = wrapParams("Key", { email: email, name: name });
    try {
        const response = await docClient.get(params).promise();

        if (isEmpty(response)) {
            throw errorType.idnotexists;
        }

        return response;
    } catch (error) {
        if (error == errorType.idnotexists) {
            throw errorType.idnotexists;
        }

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

"use strict";

// get shared functions and variables
const {
    docClient,
    validateEmail,
    wrapResponse,
    wrapParams,
    isAlreadyExisting,
    handleError,
    errorType,
} = require("../shared");

async function updateItem(email, name, surname) {
    if (!validateEmail(email)) {
        throw errorType.badmail;
    }

    // check if an item can be found under given id
    if (!(await isAlreadyExisting(email, name))) {
        throw errorType.idnotexists;
    }

    const item = { email, name, surname };
    const params = wrapParams("Item", item);
    try {
        await docClient.put(params).promise();
    } catch (error) {
        throw errorType.dberror;
    }
}

module.exports.update = async (event) => {
    const email = event.email;
    const name = event.name;
    const surname = event.surname;

    try {
        await updateItem(email, name, surname);
        return wrapResponse(200, { message: "Entry updated successfully" });
    } catch (err) {
        return handleError(err);
    }
};

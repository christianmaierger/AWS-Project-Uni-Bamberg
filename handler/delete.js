"use strict";

// get shared functions and variables
const {
    docClient,
    validateEmail,
    wrapResponse,
    wrapParams,
    handleError,
    errorType,
    isAlreadyExisting,
} = require("../shared");

async function deleteItem(email, name) {
    if (!validateEmail(email)) {
        throw errorType.badmail;
    }

    if (!(await isAlreadyExisting(email, name))) {
        throw errorType.idnotexists;
    }

    const item = { email, name };
    const params = wrapParams("Key", item);

    try {
        await docClient.delete(params).promise();
    } catch (error) {
        throw errorType.dberror;
    }
}

module.exports.delete = async (event) => {
    const email = event.email;
    const name = event.name;

    try {
        await deleteItem(email, name);
        return wrapResponse(200, { message: "Entry deleted successfully" });
    } catch (err) {
        return handleError(err);
    }
};

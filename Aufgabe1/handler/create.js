"use strict";

// get shared functions and variables
const {
    docClient,
    validateEmail,
    wrapResponse,
    wrapParams,
    handleError,
    errorType,
    validateItemNotExists,
} = require("../shared");

async function putItemToDatabase(item) {
    const params = wrapParams("Item", item);

    try {
        await docClient.put(params).promise();
    } catch (error) {
        throw errorType.dberror;
    }
}

async function createItem(item) {
    validateEmail(item.email);

    await validateItemNotExists(item.email, item.name);

    return await putItemToDatabase(item);
}

module.exports.create = async (event) => {
    try {
        await createItem(event);
        return wrapResponse(200, { message: "Creation of entry successful" });
    } catch (err) {
        return handleError(err);
    }
};

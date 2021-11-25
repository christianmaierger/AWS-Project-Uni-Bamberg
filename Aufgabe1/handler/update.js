"use strict";

// get shared functions and variables
const {
    docClient,
    validateEmail,
    wrapResponse,
    wrapParams,
    handleError,
    errorType,
    validateItemExists,
} = require("../shared");

async function updateItem(item) {
    const email = item.email;
    const name = item.name;
    validateEmail(email);

    // check if an item can be found under given id
    await validateItemExists(email, name);

    const params = wrapParams("Item", item);
    try {
        await docClient.put(params).promise();
    } catch (error) {
        throw errorType.dberror;
    }
}

module.exports.update = async (event) => {
    try {
        await updateItem(event);
        return wrapResponse(200, { message: "Entry updated successfully" });
    } catch (err) {
        return handleError(err);
    }
};

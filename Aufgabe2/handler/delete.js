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
    validateBirthday,
} = require("../shared");

async function deleteItem(email, birthday) {
    validateEmail(email);
    validateBirthday(item.birthday)

    await validateItemExists(email, birthday);

    const item = { email, name: birthday };
    const params = wrapParams("Key", item);

    try {
        await docClient.delete(params).promise();
    } catch (error) {
        throw errorType.dberror;
    }
}

module.exports.delete = async (event) => {
    const email = event.email;
    const birthday = event.birthday;

    try {
        await deleteItem(email, birthday);
        return wrapResponse(200, { message: "Entry deleted successfully" });
    } catch (err) {
        return handleError(err);
    }
};

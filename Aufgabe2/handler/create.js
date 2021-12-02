"use strict";

// get shared functions and variables
const {
    docClient,
    validateEmail,
    validatePlz,
    validateBirthday,
    validateGender,
    wrapResponse,
    wrapParams,
    handleError,
    errorType,
    validateItemNotExists,
    createPrioFromBirthday,
} = require("../shared");

async function putItemToDatabase(item) {
    const params = wrapParams("Item", item);

    try {
        await docClient.put(params).promise();
    } catch (error) {
        // todo not always errors checking db, was also thrown when one request param was bad, like string for bday
        throw errorType.dberror;
    }
}

async function createItem(item) {
    // todo some validation or work with items.values()
    validateEmail(item.email);
    validatePlz(item.plz);
    validateGender(item.gender);
    validateBirthday(item.birthday)

    const prio = createPrioFromBirthday(item.birthday);
    item.prio=prio;

    await validateItemNotExists(item.email, item.birthday);

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
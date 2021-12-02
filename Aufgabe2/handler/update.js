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
    validatePlz,
    validateBirthday,
    validateGender,
    createPrioFromBirthday,
} = require("../shared");

async function updateItem(item) {
    const email = item.email;
    const birthday = item.birthday;
    // possibly not necessary as update should be done automatically
    validateBirthday(birthday)
    // check if an item can be found under given id
    validateEmail(item.email);
    validatePlz(item.plz);
    validateGender(item.gender);

    await validateItemExists(email, birthday);
    // new prio is created

    const prio = createPrioFromBirthday(item.birthday);
    item.prio=prio;

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

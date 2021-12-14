"use strict";

// get shared functions and variables
const {
    docClient,
    wrapResponse,
    wrapParams,
    handleError,
    errorType,
    createPrioFromBirthday,
} = require("../shared");

const {
    validateEmail,
    validateItemExists,
    validateBirthday,
  } = require('../validator');

async function updatePrio(item) {
    const email = item.email;
    const birthday = item.birthday;
    // possibly not necessary as update should be done automatically
    validateEmail(email)
    validateBirthday(birthday)
    // check if an item can be found under given id
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

module.exports.updatePrio = async (event) => {
    try {
        await updatePrio(event);
        return wrapResponse(200, { message: "Prio for user updated successfully" });
    } catch (err) {
        return handleError(err);
    }
};
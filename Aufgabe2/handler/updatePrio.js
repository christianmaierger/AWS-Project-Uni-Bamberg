"use strict";

// TODO write local invokes
// get shared functions and variables
const {
    docClient,
    wrapResponse,
    wrapParams,
    handleError,
    errorType,
    createPrioFromBirthday, wrapUpdateParams,
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
    item.prio = createPrioFromBirthday(item.birthday);

    //const params = wrapParams("Key", item);
    const params = wrapUpdateParams(item);
    console.log(params);
    try {
        await docClient.update(params).promise();
    } catch (error) {
        console.log(error);
        throw errorType.dberror;
    }
}

module.exports.updatePrio = async (event) => {
    try {
        await updatePrio(event.item);
        return wrapResponse(200, {message: "Prio for user updated successfully"});
    } catch (err) {
        return handleError(err);
    }
};
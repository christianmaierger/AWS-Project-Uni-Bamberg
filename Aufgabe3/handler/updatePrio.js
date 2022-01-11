"use strict";

// get shared functions and variables
const {
    docClient,
    wrapResponse,
    handleError,
    errorType,
    createPrioFromBirthday, wrapUpdateParams,
} = require("../shared");

async function updatePrio(item) {
    const updateItemBundle = {};
    updateItemBundle.email = item.email;
    updateItemBundle.birthday = item.birthday;
    updateItemBundle.prio = createPrioFromBirthday(item.birthday);

    const params = wrapUpdateParams(updateItemBundle);
    try {
        await docClient.update(params).promise();
    } catch (error) {
        throw errorType.dberror;
    }
}

module.exports.updatePrio = async (event) => {
    try {
        const item = JSON.parse(event.requestContext.authorizer.item);
        await updatePrio(item);
        return wrapResponse(200, {message: "Prio for user updated successfully"});
    } catch (err) {
        return handleError(err);
    }
};
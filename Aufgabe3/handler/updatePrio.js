"use strict";

// get shared functions and variables
const {
    docClient,
    wrapResponse,
    handleError,
    errorType,
    wrapUpdateParams, createPriority,
} = require("../shared");

async function updatePriority(item) {
    const updateItemBundle = {};
    updateItemBundle.email = item.email;
    updateItemBundle.birthday = item.birthday;
    updateItemBundle.prio = createPriority(item.birthday, item.system_relevance, item.pre_diseases);

    const params = wrapUpdateParams(updateItemBundle);
    try {
        await docClient.update(params).promise();
    } catch (error) {
        console.log(error);
        throw errorType.dberror;
    }
}

module.exports.updatePrio = async (event) => {
    console.log(event);
    try {
        const item = JSON.parse(event.requestContext.authorizer.item);
        await updatePriority(item);
        return wrapResponse(200, {message: "Priority for user updated successfully."});
    } catch (err) {
        console.log(err);
        return handleError(err);
    }
};
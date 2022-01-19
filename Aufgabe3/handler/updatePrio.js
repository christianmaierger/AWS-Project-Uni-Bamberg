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

    if (updateItemBundle.prio==item.prio) {
        return { code: 200, message: "Priority for user not updated - No Change necessary."}
    }

    const params = wrapUpdateParams(updateItemBundle);
    try {
        await docClient.update(params).promise();
    } catch (error) {
        console.log(error);
        throw errorType.dberror;
    }
    return { code: 200, message: "Priority for user updated successfully."}
}

module.exports.updatePrio = async (event) => {
    try {
        const item = JSON.parse(event.requestContext.authorizer.item);
        let res = await updatePriority(item);

        return wrapResponse(res.code, {message: res.message});
    } catch (err) {
        console.log(err);
        return handleError(err);
    }
};
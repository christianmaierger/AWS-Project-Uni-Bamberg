'use strict';

// get shared functions and variables
const {
    docClient,
    wrapResponse,
    handleError,
    errorType,
    createPrioFromBirthday, wrapUpdateParams, hashPassword,
} = require('../shared');

const {
    validateItem, validatePassword,
} = require('../validator');

function hasAllNeededNecessaryAttributes(itemChanges, item) {
    const necessaryAttributes = ["system_relevance", "pre_diseases"];

    const itemChangesKeys = Object.keys(itemChanges);
    const itemKeys = Object.keys(item);

    let result = true;

    necessaryAttributes.forEach(attribute => {
        if (!itemChangesKeys.includes(attribute) && !itemKeys.includes(attribute)) {
            result = false;
        }
    });

    return result;
}

async function updateItem(itemChanges, item) {
    if (!hasAllNeededNecessaryAttributes(itemChanges, item)) {
        throw errorType.notAllNecessaryInformation;
    }

    const updateItemBundle = {};
    updateItemBundle.email = item.email;
    updateItemBundle.birthday = item.birthday;

    delete itemChanges.email;
    delete itemChanges.birthday;
    delete itemChanges.token;

    if (Object.keys(itemChanges).length === 0) {
        return;
    }

    for (const key in itemChanges) {
        const value = itemChanges[key];
        if (key === "password") {
            validatePassword(value);
            itemChanges[key] = hashPassword(value);
        }
        updateItemBundle[key] = value;
    }

    updateItemBundle.prio = createPrioFromBirthday(item.birthday);

    await validateItem(updateItemBundle);

    const params = wrapUpdateParams(updateItemBundle);
    try {
        await docClient.update(params).promise();
    } catch (error) {
        throw errorType.dberror;
    }
}

module.exports.update = async (event) => {
    try {
        const item = JSON.parse(event.requestContext.authorizer.item);
        const itemChanges = JSON.parse(event.body).item;

        await updateItem(itemChanges, item);
        return wrapResponse(200, {message: 'Entry updated successfully'});
    } catch (err) {
        return handleError(err);
    }
};
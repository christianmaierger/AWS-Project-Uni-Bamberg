'use strict';

// get shared functions and variables
const {
    docClient,
    wrapResponse,
    wrapParams,
    handleError,
    errorType,
    createPrioFromBirthday, wrapUpdateParams,
} = require('../shared');

const {
    validateItemExists,
    validateItem,
} = require('../validator');

async function updateItem(item) {
    validateItem(item);

    const email = item.email;
    const birthday = item.birthday;

    await validateItemExists(email, birthday);

    // new prio is created
    item.prio = createPrioFromBirthday(birthday);

    const params = wrapUpdateParams(item);
    try {
        await docClient.update(params).promise();
    } catch (error) {
        throw errorType.dberror;
    }
}

module.exports.update = async (event) => {
    try {
        await updateItem(event.item);
        return wrapResponse(200, {message: 'Entry updated successfully'});
    } catch (err) {
        return handleError(err);
    }
};

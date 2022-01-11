'use strict';

// get shared functions and variables
const {
    docClient,
    wrapResponse,
    wrapParams,
    handleError,
    errorType,
    createPrioFromBirthday, hashPassword,
} = require('../shared');

const {
    validateEmail,
    validatePlz,
    validateBirthday,
    validateGender,
    validateItemNotExists,
    validateName, validatePreDisease, validateSystemRelevance, validatePassword,
} = require('../validator');

async function putItemToDatabase(item) {
    const params = wrapParams('Item', item);

    try {
        await docClient.put(params).promise();
    } catch (error) {
        throw errorType.dberror;
    }
}

async function createItem(item) {
    validateEmail(item.email);
    validatePlz(item.plz);
    validateGender(item.gender);
    validateBirthday(item.birthday);
    validateName(item.name);
    validatePreDisease(item.pre_diseases)
    validateSystemRelevance(item.system_relevance);
    validatePassword(item.password);

    if (item.token !== undefined) {
        delete item.token;
    }
    item.password = hashPassword(item.password);

    item.prio = createPrioFromBirthday(item.birthday);

    await validateItemNotExists(item.email, item.birthday);

    return await putItemToDatabase(item);
}

module.exports.create = async (event) => {
    const item = JSON.parse(event.body).item;
    try {
        await createItem(item);
        return wrapResponse(200, {message: 'Creation of entry successful'});
    } catch (err) {
        return handleError(err);
    }
};

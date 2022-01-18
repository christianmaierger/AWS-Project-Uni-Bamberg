'use strict';

// get shared functions and variables
const {
    docClient,
    wrapResponse,
    wrapParams,
    handleError,
    errorType,
    hashPassword, createPriority,
} = require('../shared');

const {
    validateEmail,
    validatePlz,
    validateBirthday,
    validateGender,
    validateItemNotExists,
    validateName, validatePreDisease, validateSystemRelevance, validatePassword, validateItem,
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
  /*  validateEmail(item.email);
    validatePlz(item.plz);
    validateGender(item.gender);
    validateBirthday(item.birthday);
    validateName(item.name);
    validatePreDisease(item.pre_diseases)
    validateSystemRelevance(item.system_relevance);
    validatePassword(item.password);*/
    // todo, könnte man doch direkt mit der Funktion machen?
    validateItem(item)

    if (item.token !== undefined) {
        delete item.token;
    }
    item.password = hashPassword(item.password);

    item.prio = createPriority(item.birthday, item.system_relevance, item.pre_diseases);

    await validateItemNotExists(item.email, item.birthday);

    return await putItemToDatabase(item);
}

module.exports.create = async (event) => {
    const item = JSON.parse(event.body).item;
    try {
        await createItem(item);
        return wrapResponse(201, {message: 'Creation of entry successful'});
    } catch (err) {
        return handleError(err);
    }
};

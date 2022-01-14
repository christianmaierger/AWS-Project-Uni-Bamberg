'use strict';

// get shared functions and variables
const {
    docClient,
    wrapResponse,
    wrapParams,
    handleError,
    errorType,
    createPrioFromBirthday,
    isIllOrRelevant
} = require('../shared');

const {
    validateEmail,
    validatePlz,
    validateBirthday,
    validateGender,
    validateItemNotExists,
    validateName,
    validateprevIllness,
    validateSystemRelevant,
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
    validateprevIllness(item.illness);
    validateSystemRelevant(item.relevance)

    const illOrRelevant = isIllOrRelevant(item.illness, item.relevance);
    item.prio = createPrioFromBirthday(item.birthday, illOrRelevant);

    await validateItemNotExists(item.email, item.birthday);

    return await putItemToDatabase(item);
}

module.exports.create = async (event) => {
    try {
        await createItem(event.item);
        return wrapResponse(200, {message: 'Creation of entry successful'});
    } catch (err) {
        return handleError(err);
    }
};

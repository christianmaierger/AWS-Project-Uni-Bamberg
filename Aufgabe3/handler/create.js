'use strict';
const crypto = require("crypto");

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
    validatePassword
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
    let email;
    let birthday;

    console.log("item is " + item)


    /*
    if (event.requestContext) {
        // for http api gateway calls
        let user = JSON.parse(event.requestContext.authorizer.user)
        email = user.email;
        birthday = user.birthday;
        // invoked by create to establish item does not exist
    } else {
        email = event.item.email;
        birthday = event.item.birthday;
    }
*/

    validateEmail(item.email);
    validatePlz(item.plz);
    validateGender(item.gender);
    validateBirthday(item.birthday);
    validateName(item.name);
    validateprevIllness(item.illness);
    validateSystemRelevant(item.relevance)
    validatePassword(item.pw)

    let pw = item.pw;
    var hash = 0;
    for (var i = 0; i < pw.length; i++) {
        var char = pw.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    item.secret = hash

    const illOrRelevant = isIllOrRelevant(item.illness, item.relevance);
    item.prio = createPrioFromBirthday(item.birthday, illOrRelevant);

    await validateItemNotExists(item.email, item.birthday);

    return await putItemToDatabase(item);
}

module.exports.create = async (event) => {

    console.log("event body is " + event.body)


    let item;
    if (event.body) {
        let bod = JSON.parse(event.body)
        item= bod.item;
        console.log(typeof item)
        console.log("item from body is " + item)
    } else {
        item= event.item;
    }


    try {
        await createItem(item);
        let res = {message: 'Creation of entry successful'};
        return wrapResponse(200, res );
    } catch (err) {
        console.log(err)
        return handleError(err);
    }
};

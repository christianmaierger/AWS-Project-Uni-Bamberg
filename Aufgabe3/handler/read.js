'use strict';

// get shared functions and variables
const {
    wrapResponse,
    handleError, wrapParams, docClient, isEmpty, errorType,
} = require('../shared');
const {validateEmail, validateBirthday} = require("../validator");

async function getItem(email, birthday) {
    validateEmail(email);
    validateBirthday(birthday);

    const params = wrapParams('Key', {email: email, birthday: birthday});
    try {
        const response = await docClient.get(params).promise();

        if (isEmpty(response)) {
            throw errorType.idnotexists;
        }
        return response;
    } catch (error) {
        if (error == errorType.idnotexists) {
            throw errorType.idnotexists;
        }
        throw errorType.dberror;
    }
}

module.exports.read = async (event) => {
    let item;
    let reuestFromAuthorizer;
    if (event.requestContext && event.requestContext.authorizer && event.requestContext.authorizer.item) {
        item = JSON.parse(event.requestContext.authorizer.item);
        reuestFromAuthorizer=true;
    } else if (event.item){
        reuestFromAuthorizer=false;
        item = event.item
    }
    try {
        if (!reuestFromAuthorizer) {
            item = await getItem(item.email, item.birthday);
        }
        return wrapResponse(200, item);
    } catch (err) {
        return handleError(err);
    }
};
"use strict";

// get shared functions and variables
const {
    docClient,
    validateEmail,
    validateBirthday,
    wrapParams,
    wrapResponse,
    errorType,
    handleError,
    isEmpty,

    
} = require("../shared");

async function getItem(email, birthday) {
    validateEmail(email);
    validateBirthday(birthday)

    const params = wrapParams("Key", { email: email, birthday: birthday });
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
    const email = event.email;
    const birthday = event.birthday;

    try {
        const response = await getItem(email, birthday);
        return wrapResponse(200, response);
    } catch (err) {
        return handleError(err);
    }
};

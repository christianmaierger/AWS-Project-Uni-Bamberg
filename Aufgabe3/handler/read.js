'use strict';

// get shared functions and variables
const {
    docClient,
    wrapParams,
    wrapResponse,
    errorType,
    handleError,
    isEmpty,
} = require('../shared');

const {validateEmail, validateBirthday} = require('../validator');

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
    let email;
    let birthday;
    if (event.requestContext) {
        let user = JSON.parse(event.requestContext.authorizer.user)
        email = user.email;
        birthday = user.birthday;
        console.log(typeof birthday)
        console.log(birthday)
        console.log(typeof email)
        console.log(email)
    } else {
        email = event.item.email;
        birthday = event.item.birthday;
    }

    try {
        console.log("Response will be tried");
        const response = await getItem(email, birthday);
        console.log("Response was successfull " + response);
        console.log(typeof response);
        for (var r in response.item) {
            console.log("x is " + r)
        }
        console.log(JSON.stringify(response))

        let res = JSON.stringify(response)
        return wrapResponse(200, res);
    } catch (err) {
        console.log(err)
        return handleError(err);
    }
};



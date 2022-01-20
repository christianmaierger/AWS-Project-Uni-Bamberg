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


module.exports.addVaccinationDates = async (event) => {
    try {
        console.log(res)
        return wrapResponse(201, {message: 'Hello'});
    } catch (err) {
        console.log(err)
        return handleError(err);
    }
};
'use strict';

// get shared functions and variables
const {
    docClient,
    wrapResponse,
    wrapParams,
    handleError,
    errorType,
    hashPassword, 
    createPriority,
    AppointmentTableName
} = require('../shared');

async function putItemToDatabase(item) {
    const params = wrapParams('Item', item, AppointmentTableName);

    try {
        await docClient.put(params).promise();
    } catch (error) {
        throw errorType.dberror;
    }
}



module.exports.addVaccinationDates = async (event) => {
    try {
        console.log(res)
        return wrapResponse(201, {message: 'Hello'});
    } catch (err) {
        console.log(err)
        return handleError(err);
    }
};
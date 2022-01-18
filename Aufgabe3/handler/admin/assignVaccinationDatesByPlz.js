'use strict';

// get shared functions and variables
const {
    docClient,
    wrapResponse,
    errorType,
    handleError,
    TableName,
    GSIName, isEmpty,
} = require('../../shared');

const {validatePlz} = require('../../validator');
const {createPriority, wrapUpdateParams} = require("../../shared");

async function getUsersByPriority(priority, plz, n) {
    validatePlz(plz);

    if (n <= 0) {
        return [];
    }

    let response;
    try {
        // TODO only people without date should be retrieved
        response = await docClient
            .query({
                TableName: TableName,
                IndexName: GSIName,
                KeyConditionExpression: 'plz = :plz', // KeyConditionExpression using indexed attributes
                ExpressionAttributeValues: {// <----- ExpressionAttributeValues using indexed attributes
                    ':plz': plz,
                    ':prio': priority,
                },
                ScanIndexForward: true, // this determines if sorted ascending or descending by range key
                FilterExpression: 'prio = :prio',
            })
            .promise();
    } catch (error) {
        console.log(error);
        if (error === errorType.idnotexists) {
            throw errorType.idnotexists;
        }
        throw errorType.dberror;
    }

    let resultList = response.Items;
    console.log(resultList);
    if (resultList.length > n) {
        return resultList.splice(0, n);
    }

    return resultList;
}

async function assignDatesToPriorityAndGetAvailable(priority, plz, date, vaccinationsToAssign) {
    const promises = [];
    // https://stackoverflow.com/questions/42229149/how-to-update-multiple-items-in-a-dynamodb-table-at-once
    const users = await getUsersByPriority(priority, plz, vaccinationsToAssign);

    if (users.length === 0) {
        return {message: `0 users found.`, vaccinationsAssigned: 0, vaccinationsTooMuch: vaccinationsToAssign};
    }

    for (const user of users) {
        const updateItemBundle = {};
        updateItemBundle.email = user.email;
        updateItemBundle.birthday = user.birthday;
        updateItemBundle.vaccinationDate = date;

        const params = wrapUpdateParams(updateItemBundle);
        promises.push(docClient.update(params).promise());
        // TODO notify users
    }

    await Promise.all(promises).catch(() => {
        throw errorType.dberror;
    });

    const vaccinationsAssigned = vaccinationsToAssign - users.length;
    const vaccinationsTooMuch = vaccinationsToAssign - vaccinationsAssigned;

    return {
        message: `${users.length} vaccination slots assigned successfully.`,
        vaccinationsAssigned: vaccinationsAssigned,
        vaccinationsTooMuch: vaccinationsTooMuch
    };
}

module.exports.assignVaccinationDatesByPlz = async (event) => {
    const body = JSON.parse(event.body);
    const {plz, date, n} = body;

    // TODO add validation

    try {
        let vaccinationsTooMuch = n;
        for (let i = 1; i <= 3; i++) {
            if (vaccinationsTooMuch === 0) {
                break;
            }
            vaccinationsTooMuch = (await assignDatesToPriorityAndGetAvailable(i, plz, date, vaccinationsTooMuch)).vaccinationsTooMuch;
        }
        const response = {
            message: "Success",
            vaccinationsAssigned: n - vaccinationsTooMuch,
            vaccinationsTooMuch: vaccinationsTooMuch
        };
        if (isEmpty(response)) {
            return wrapResponse(404, 'Query did not return any user.');
        }
        return wrapResponse(200, response);
    } catch (err) {
        return handleError(err);
    }
};

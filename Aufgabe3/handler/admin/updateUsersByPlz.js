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

async function getUsers(plz, n) {
    validatePlz(plz);

    if (n <= 0) {
        return [];
    }

    let response;
    try {
        response = await docClient
            .query({
                TableName: TableName,
                IndexName: GSIName,
                KeyConditionExpression: 'plz = :plz', // KeyConditionExpression using indexed attributes
                ExpressionAttributeValues: {// <----- ExpressionAttributeValues using indexed attributes
                    ':plz': plz,
                },
                ScanIndexForward: true, // this determines if sorted ascending or descending by range key
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

async function updateUsers(plz, n) {
    const promises = [];
    // https://stackoverflow.com/questions/42229149/how-to-update-multiple-items-in-a-dynamodb-table-at-once
    const users = await getUsers(plz, n);

    if (users.length === 0) {
        return [];
    }

    for (const user of users) {
        const updateItemBundle = {};
        updateItemBundle.email = user.email;
        updateItemBundle.birthday = user.birthday;
        updateItemBundle.prio = createPriority(user.birthday, user.system_relevance, user.pre_diseases);

        const params = wrapUpdateParams(updateItemBundle);
        promises.push(docClient.update(params).promise());
    }

    await Promise.all(promises).catch(() => {
        throw errorType.dberror;
    });

    return {message: `${users.length} users updated successfully.`};
}

module.exports.updateUsersByPlz = async (event) => {
    const body = JSON.parse(event.body);
    const {plz, n} = body;

    // TODO add validation

    try {
        const response = await updateUsers(plz, n);
        if (isEmpty(response)) {
            return wrapResponse(404, 'Query did not return any user.');
        }
        return wrapResponse(200, response);
    } catch (err) {
        return handleError(err);
    }
};

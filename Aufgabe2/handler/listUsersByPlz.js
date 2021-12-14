'use strict';

// get shared functions and variables
const {
    docClient,
    wrapResponse,
    errorType,
    handleError,
    TableName,
    GSIName, isEmpty,
} = require('../shared');

const {validatePlz, validatePrio} = require('../validator');

async function getUsers(item, n) {
    const {plz, priority} = item;

    validatePlz(plz);
    validatePrio(priority);
    if (n === 0) {
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
                    ':prio': priority,
                },
                ScanIndexForward: true, // this detirmines if sorted ascending or descending by range key
                FilterExpression: 'prio = :prio',
            })
            .promise();
    } catch (error) {
        if (error === errorType.idnotexists) {
            throw errorType.idnotexists;
        }
        throw errorType.dberror;
    }

    let resultList = response.Items;
    if (resultList.length > n) {
        return resultList.splice(0, n);
    }

    return resultList;
}

module.exports.listUsersByPlz = async (event) => {
    const plz = event.item.plz;
    const priority = event.item.prio;
    const n = event.n;
    const item = {plz, priority};

    try {
        const response = await getUsers(item, n);
        if (isEmpty(response)) {
            return wrapResponse(404, 'Query did not return any user.');
        }
        return wrapResponse(200, response);
    } catch (err) {
        return handleError(err);
    }
};

'use strict';

// get shared functions and variables
// TODO write local lambda function invokes
const {
    docClient,
    wrapResponse,
    errorType,
    handleError,
    TableName,
    GSIName,
} = require('../shared');

const {validateBirthday, validatePlz, validatePrio} = require('../validator');

async function getUsers(plz, birthday, prio, n) {
    validatePlz(plz);
    validateBirthday(birthday);

    let response;
    try {
        response = await docClient
            .query({
                TableName: TableName,
                IndexName: GSIName,
                KeyConditionExpression: 'plz = :plz', // KeyConditionExpression using indexed attributes
                ExpressionAttributeValues: {
                    // <----- ExpressionAttributeValues using indexed attributes
                    ':plz': plz,
                    //  ':birthday': " 1990-01-01",
                    ':prio': prio,
                },
                ScanIndexForward: true, // this detirmines if sorted ascending or descending by range key
                FilterExpression: 'prio = :prio',
            })
            .promise();
    } catch (error) {
        console.log(error);
        if (error == errorType.idnotexists) {
            throw errorType.idnotexists;
        }
        throw errorType.dberror;
    }
    let resList = [];
    console.log('Die gesamte Rückgabe ist ' + response.Items);
    console.log('n ist ' + n);

    for (let i = 0; i < n; i++) {
        let elem = response.Items[i];
        resList.push(elem);
    }
    console.log(resList);
    return resList;
}

module.exports.listUsersByPlz = async (event) => {
    const plz = event.item.plz;
    const birthday = event.item.birthday;
    const prio = event.item.prio;
    const n = event.n;

    validateBirthday(birthday);
    validatePlz(plz);
    validatePrio(prio);

    try {
        const response = await getUsers(plz, birthday, prio, n);
        console.log('response ist ' + response);
        if (response.isEmpty()) {
            return wrapResponse(404, 'Query did not return any User');
        }
        return wrapResponse(200, response);
    } catch (err) {
        console.log(err);
        return handleError(err);
    }
};

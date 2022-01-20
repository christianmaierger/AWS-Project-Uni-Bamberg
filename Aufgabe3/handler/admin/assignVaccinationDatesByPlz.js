'use strict';


// get shared functions and variables
const {
    docClient,
    wrapResponse,
    errorType,
    handleError,
    TableName,
    GSIName,
    isEmpty,
    wrapUpdateParams, AppointmentTableName, wrapParams
} = require('../../shared');

const {validatePlz, validateVaccinationDate} = require('../../validator');

const {sendMail} = require("./shared");

async function getUsersByPriority(priority, plz, n) {

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
                    ':prio': priority,
                },
                ScanIndexForward: true, // this determines if sorted ascending or descending by range key
                FilterExpression: 'prio = :prio AND attribute_not_exists(vaccinationDate)'
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
    console.log("Jetzt kommt result list")
    console.log(resultList);
    if (resultList.length > n) {
        return resultList.splice(0, n);
    }

    return resultList;
}

async function putItemToDatabase(item) {
    const params = wrapParams('Item', item, AppointmentTableName);

    try {
        await docClient.put(params).promise();
    } catch (error) {
        console.log(error);
        throw errorType.dberror;
    }
}

async function deleteItemFromDatabase(item) {
    const params = wrapParams('Key', item, AppointmentTableName);

    try {
        await docClient.delete(params).promise();
    } catch (error) {
        console.log(error);
        throw errorType.dberror;
    }
}

async function assignDatesToPriorityAndGetAvailable(priority, plz, date, vaccinationsToAssign) {
    const promises = [];
    // https://stackoverflow.com/questions/42229149/how-to-update-multiple-items-in-a-dynamodb-table-at-once
    const users = await getUsersByPriority(priority, plz, vaccinationsToAssign);
    console.log("Length of users is " + users.length)
    console.log("Users sind:")
    console.log(users)

    if (users.length === 0) {
        return {message: `0 users found.`, vaccinationsAssigned: 0, vaccinationsLeftOver: vaccinationsToAssign};
    }

    for (const user of users) {
        console.log("user is " + JSON.stringify(user));
        const updateItemBundle = {};
        updateItemBundle.email = user.email;
        updateItemBundle.birthday = user.birthday;
        updateItemBundle.vaccinationDate = date;

        const params = wrapUpdateParams(updateItemBundle);
        promises.push(docClient.update(params).promise());

        await sendMail(user, date).catch(err => console.log("Mail Error:", err));
    }

    await Promise.all(promises).catch((err) => {
        console.log(err);
        throw errorType.dberror;
    });

    const vaccinationsAssigned = users.length;
    const vaccinationsLeftOver = vaccinationsToAssign - users.length;

    if (vaccinationsLeftOver === 0) {
        const item = {date: date, plz: plz};
        await deleteItemFromDatabase(item);
    } else {
        const item = {date: date, plz: plz, vaccinationsLeftOver: vaccinationsLeftOver};
        await putItemToDatabase(item);
    }

    return {
        message: `${users.length} vaccination slots assigned successfully.`,
        vaccinationsAssigned: vaccinationsAssigned,
        vaccinationsLeftOver: vaccinationsLeftOver
    };
}


module.exports.assignVaccinationDatesByPlz = async (event) => {
    console.log(event);
    const body = event.body;

    let plz, date, n;
    if (typeof body === "string") {
        plz = JSON.parse(body).plz;
        date = JSON.parse(body).date;
        n = JSON.parse(body).n;
    } else {
        plz = body.plz;
        date = body.date;
        n = body.n;
    }

    console.log(plz, date, n);

    try {
        validatePlz(plz);
        validateVaccinationDate(date);

        let vaccinationsLeftOver = n;
        for (let i = 1; i <= 3; i++) {
            if (vaccinationsLeftOver === 0) {
                break;
            }
            vaccinationsLeftOver = (await assignDatesToPriorityAndGetAvailable(i, plz, date, vaccinationsLeftOver)).vaccinationsLeftOver;
        }
        const response = {
            message: "Success",
            vaccinationsAssigned: n - vaccinationsLeftOver,
            vaccinationsLeftOver: vaccinationsLeftOver
        };
        if (isEmpty(response)) {
            return wrapResponse(404, {message: 'Query did not return any user.'});
        }
        return wrapResponse(200, response);
    } catch (err) {
        console.log(err)
        return handleError(err);
    }
};


'use strict';


// get shared functions and variables
const {
    docClient,
    ses,
    wrapResponse,
    errorType,
    handleError,
    TableName,
    GSIName,
    isEmpty,
    wrapUpdateParams,
    AppointmentTableName, lambda
} = require('../../shared');

const {validatePlz, validateVaccinationDate} = require('../../validator');

const {
    sendMail
} = require("./shared");


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

async function getApproachingAppointments(n) {
    if (n <= 0) {
        return [];
    }

}

async function getAvailable(date) {
    let response;
    try {
        response = await docClient
            .query({
                TableName: AppointmentTableName,
                KeyConditionExpression: 'date = :date', // KeyConditionExpression using indexed attributes
                ExpressionAttributeValues: {// <----- ExpressionAttributeValues using indexed attributes
                    ':date': date,
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

    return response.Items;
}

async function assignDatesToPriorityAndGetAvailable(date) {
    const availableVaccinationSlots = await getAvailable(date);

    for (const slot of availableVaccinationSlots) {
        const plz = slot.plz;
        let vaccinationsLeftOver = slot.vaccinationsLeftOver;

        for (let i = 1; i <= 3; i++) {
            if (vaccinationsLeftOver === 0) {
                break;
            }

            try {
                const response = await lambda
                    .invoke({
                        FunctionName: "assignVaccinationDates",
                        InvocationType: "RequestResponse", // is default
                        Payload: JSON.stringify({
                            event: {
                                body: {
                                    plz: plz,
                                    date: date,
                                    n: vaccinationsLeftOver
                                }
                            }
                        }, null, 2), // pass params
                    })
                    .promise();
                console.log(response);
            } catch (error) {
                throw errorType.dberror;
            }

            vaccinationsLeftOver = (await assignDatesToPriorityAndGetAvailable(i, plz, date, vaccinationsLeftOver)).vaccinationsLeftOver;
        }
    }

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
        console.log("user is " + user)
        const updateItemBundle = {};
        updateItemBundle.email = user.email;
        updateItemBundle.birthday = user.birthday;
        updateItemBundle.vaccinationDate = date;

        const params = wrapUpdateParams(updateItemBundle);
        promises.push(docClient.update(params).promise());

        sendMail(user, date);
    }

    await Promise.all(promises).catch((err) => {
        console.log(err)
        throw errorType.dberror;
    });

    const vaccinationsAssigned = users.length;
    const vaccinationsLeftOver = vaccinationsToAssign - users.length;

    return {
        message: `${users.length} vaccination slots assigned successfully.`,
        vaccinationsAssigned: vaccinationsAssigned,
        vaccinationsLeftOver: vaccinationsLeftOver
    };
}

module.exports.assignOpenVaccinationDatesByPlz = async (event) => {
    const body = event.body;
    let {date} = body;

    try {
        date = JSON.parse(body).date;

        validatePlz(plz)
        validateVaccinationDate(date);
        await assignDatesToPriorityAndGetAvailable(date);

        /*const response = {
            message: "Success",
            vaccinationsAssigned: n - vaccinationsLeftOver,
            vaccinationsLeftOver: vaccinationsLeftOver
        };
        if (isEmpty(response)) {
            return wrapResponse(404, {message: 'Query did not return any user.'});
        }*/
        return wrapResponse(200, response);
    } catch (err) {
        console.log(err)
        return handleError(err);
    }
};


'use strict';


// get shared functions and variables
const {
    docClient,
    wrapResponse,
    errorType,
    handleError,
    AppointmentTableName, lambda
} = require('../../shared');

const {isVaccinationDateValid, validateVaccinationDate} = require('../../validator');


async function getApproachingAppointments(n) {
    if (n <= 0) {
        return [];
    }

}

async function getAvailable() {
    const params = {
        TableName: AppointmentTableName
    }
    let response;
    try {
        response = await docClient.scan(params).promise();
    } catch (error) {
        console.log(error);
        if (error === errorType.idnotexists) {
            throw errorType.idnotexists;
        }
        throw errorType.dberror;
    }

    return response.Items;
}

async function assignDatesToPriorityAndGetAvailable() {
    const availableVaccinationSlots = await getAvailable();

    for (const slot of availableVaccinationSlots) {
        const plz = slot.plz;
        const date = slot.date;

        if (isVaccinationDateValid(date)) {
            continue;
        }

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
                            body: {
                                plz: plz,
                                date: date,
                                n: vaccinationsLeftOver
                            }

                        }, null, 2), // pass params
                    })
                    .promise();
                console.log(response);
            } catch (error) {
                throw errorType.dberror;
            }

            //vaccinationsLeftOver = (await assignDatesToPriorityAndGetAvailable(i, plz, date, vaccinationsLeftOver)).vaccinationsLeftOver;
        }
    }

    /*
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
    };*/
}

module.exports.assignOpenVaccinationDatesByPlz = async (event) => {
    try {
        await assignDatesToPriorityAndGetAvailable();

        /*const response = {
            message: "Success",
            vaccinationsAssigned: n - vaccinationsLeftOver,
            vaccinationsLeftOver: vaccinationsLeftOver
        };
        if (isEmpty(response)) {
            return wrapResponse(404, {message: 'Query did not return any user.'});
        }*/
        const response = {message: "Hallo"};
        return wrapResponse(200, response);
    } catch (err) {
        console.log(err)
        return handleError(err);
    }
};


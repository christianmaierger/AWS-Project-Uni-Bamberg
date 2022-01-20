'use strict';


// get shared functions and variables
const {
    docClient,
    wrapResponse,
    errorType,
    handleError,
    AppointmentTableName, lambda, AssignVaccinationSlotsFunction, wrapParams
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

    console.log(response);

    return response.Items;
}

async function assignDatesToPriorityAndGetAvailable() {
    const slots = await getAvailable();
    console.log(slots);

    for (const slot of slots) {
        console.log(slot);
        const plz = slot.plz;
        const date = slot.date;

        if (!isVaccinationDateValid(date)) {
            console.log("Is invalid");
            continue;
        }

        let vaccinationsLeftOver = slot.availableVaccinationSlots;
        console.log("VaccinationsLeftOver", vaccinationsLeftOver);

        if (vaccinationsLeftOver === 0) {
            continue;
        }

        try {
            console.log(plz, date, vaccinationsLeftOver);
            const response = await lambda
                .invoke({
                    FunctionName: AssignVaccinationSlotsFunction,
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
            console.log(error);
            throw errorType.dberror;
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


'use strict';


// get shared functions and variables
const {
    docClient,
    wrapResponse,
    errorType,
    handleError,
    AppointmentTableName, lambda, AssignVaccinationSlotsFunction
} = require('../../shared');

const {isVaccinationDateValid} = require('../../validator');


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
}

module.exports.assignOpenVaccinationDatesByPlz = async (event) => {
    try {
        await assignDatesToPriorityAndGetAvailable();

        return wrapResponse(200, {message: "Open vaccination dates assigned correctly."});
    } catch (err) {
        console.log(err)
        return handleError(err);
    }
};


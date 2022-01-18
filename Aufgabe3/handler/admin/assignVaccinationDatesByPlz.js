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
    wrapUpdateParams
} = require('../../shared');

const {validatePlz, validateVaccinationDate} = require('../../validator');





async function sendMail (user, date) {
    try {
        let adress = user.email
        var params = {
            Destination: {
                ToAddresses: [adress],
            },
            Message: {
                Body: {
                    Html: {
                        Charset: "UTF-8",
                        Data:
                            "<html><body><h3>Guten Tag " + user.fullname.surname + " " + user.fullname.lastname + "  ,</h3>" +
                            "<p> wir freuen uns Ihnen hiermit einen Termin anbieten zu können am: </p>" +
                            "<div style='color:darkblue'>" + date + "</div> " +
                            "<br> <p>Bleiben Sie gesund und beste Grüße </p> <p>Ihr Impfteam Bayern</p>  " +
                            "</body></html>" },
                },

                Subject: {  Data: "Ihr Impftermim am " + date },
            },
            Source: adress,
        };
        return ses.sendEmail(params).promise()
    } catch (err) {
        console.log(err)
        handleError(err)
    }
};

async function getUsersByPriority(priority, plz, n) {

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
        console.log("user is " + user)
        const updateItemBundle = {};
        updateItemBundle.email = user.email;
        updateItemBundle.birthday = user.birthday;
        updateItemBundle.vaccinationDate = date;

        const params = wrapUpdateParams(updateItemBundle);
        promises.push(docClient.update(params).promise());
        // TODO notify users

        sendMail(user, date)
    }

    await Promise.all(promises).catch((err) => {
        console.log(err)
        throw errorType.dberror;
    });

    // const vaccinationsAssigned = vaccinationsToAssign - users.length;
    // const vaccinationsLeftOver = vaccinationsToAssign - vaccinationsAssigned;

    const vaccinationsAssigned = users.length;
    const vaccinationsLeftOver = vaccinationsToAssign - users.length;

    return {
        message: `${users.length} vaccination slots assigned successfully.`,
        vaccinationsAssigned: vaccinationsAssigned,
        vaccinationsLeftOver: vaccinationsLeftOver
    };
}

module.exports.assignVaccinationDatesByPlz = async (event) => {
    const body = event.body
    let {plz, date, n} = body;

    try {
        plz =JSON.parse(body).plz
        date =JSON.parse(body).date
        n =JSON.parse(body).n
        // TODO add validation
        validatePlz(plz)
        validateVaccinationDate(date)
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
            return wrapResponse(404, 'Query did not return any user.');
        }
        return wrapResponse(200, response);
    } catch (err) {
        console.log(err)
        return handleError(err);
    }
};


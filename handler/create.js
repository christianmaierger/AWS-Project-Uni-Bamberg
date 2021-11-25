"use strict";

// get shared functions and variables
const {
    docClient,
    validateEmail,
    wrapResponse,
    wrapParams,
    isAlreadyExisting,
} = require("../shared");

async function putItemToDatabase(email, name, surname) {
    const item = { email, name, surname };

    const params = wrapParams("Item", item);

    try {
        await docClient.put(params).promise();
        return wrapResponse(200, { message: "Creation of entry successful" });
    } catch (error) {
        return wrapResponse(error.statusCode, { message: error.message });
    }
}

async function createItem(email, name, surname) {
    if (!validateEmail(email)) {
        throw "badmail";
    }

    if (await isAlreadyExisting(email, name, surname)) {
        throw "idexists";
    }

    return await putItemToDatabase(email, name, surname);
}

function handleError(err) {
    switch (err) {
        case "badmail":
            return wrapResponse(400, {
                message: "Bad Request: Not a valid email-adress",
            });
        case "idexists":
            return wrapResponse(405, {
                message:
                    "Entry with given ID already exists, please use update to overide an existing entry",
            });
        case "dberror":
            return wrapResponse(400, {
                message: "There was a Problem checking the Database",
            });
    }
}

module.exports.create = async (event) => {
    const email = event.email;
    const name = event.name;
    const surname = event.surname;

    try {
        return await createItem(email, name, surname);
    } catch (err) {
        return handleError(err);
    }
};

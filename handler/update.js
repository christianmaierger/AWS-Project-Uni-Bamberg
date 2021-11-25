"use strict";

// get shared functions and variables
const {
    docClient,
    validateEmail,
    wrapResponse,
    wrapParams,
    isAlreadyExisting,
} = require("../shared");

async function updateItem(email, name, surname) {
    if (!validateEmail(email)) {
        throw "badmail";
    }

    // check if an item can be found under given id
    if (!(await isAlreadyExisting(email, name, surname))) {
        throw "idnotexists";
    }

    const item = { email, name, surname };
    const params = wrapParams("Item", item);
    try {
        await docClient.put(params).promise();
        return wrapResponse(200, { message: "Entry updated successfully" });
    } catch (error) {
        return wrapResponse(error.statusCode, { message: error.message });
    }
}

module.exports.update = async (event) => {
    const email = event.email;
    const name = event.name;
    const surname = event.surname;

    try {
        return await updateItem(email, name, surname);
    } catch (err) {
        switch (err) {
            case "badmail":
                return wrapResponse(400, {
                    message: "Bad Request: Not a valid email-adress",
                });
            case "idnotexists":
                return wrapResponse(404, {
                    message: "There is no entry to be updated",
                });
        }
    }
};

"use strict";

// get shared functions and variables
const {
    docClient,
    isEmpty,
    validateEmail,
    wrapParams,
    wrapResponse,
} = require("../shared");

async function getItem(email, name) {
    if (!validateEmail(email)) {
        throw "badmail";
    }

    const params = wrapParams("Key", { email: email, name: name });

    try {
        const response = await docClient.get(params).promise();
        if (response && isEmpty(response)) {
            return wrapResponse(404, {
                message: "No entry matched the given parameters.",
            });
        }
        return wrapResponse(200, response);
    } catch (error) {
        return wrapResponse(error.statusCode, { message: error.message });
    }
}

module.exports.read = async (event) => {
    const email = event.email;
    const name = event.name;

    try {
        return await getItem(email, name);
    } catch (err) {
        switch (err) {
            case "badmail":
                return wrapResponse(400, {
                    message: "Bad Request: Not a valid email-adress",
                });
        }
    }
};

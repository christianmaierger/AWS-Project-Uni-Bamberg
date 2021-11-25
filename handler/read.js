"use strict";

// get shared functions and variables
const {
    docClient,
    isEmpty,
    validateEmail,
    wrapParams,
    wrapResponse,
} = require("../shared");

module.exports.read = async (event) => {
    if (!validateEmail(event.email)) {
        return wrapResponse(400, {
            message: "Bad Request: Not a valid email-adress",
        });
    }

    const params = wrapParams("Key", { email: event.email, name: event.name });

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
};

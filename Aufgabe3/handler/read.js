'use strict';

// get shared functions and variables
const {
    wrapResponse,
    handleError,
} = require('../shared');

module.exports.read = async (event) => {
    const item = JSON.parse(event.requestContext.authorizer.item);

    try {
        return wrapResponse(200, item);
    } catch (err) {
        return handleError(err);
    }
};
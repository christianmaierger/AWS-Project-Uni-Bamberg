'use strict';

// get shared functions and variables
const {
    docClient,
    wrapResponse,
    wrapParams,
    handleError,
    errorType,
} = require('../shared');

async function deleteItem(email, birthday) {
    const item = {email, birthday};
    const params = wrapParams('Key', item);

    try {
        await docClient.delete(params).promise();
    } catch (error) {
        throw errorType.dberror;
    }
}

module.exports.delete = async (event) => {
    try {
        const item = JSON.parse(event.requestContext.authorizer.item);

        await deleteItem(item.email, item.birthday);
        return wrapResponse(200, {message: 'Entry deleted successfully'});
    } catch (err) {
        return handleError(err);
    }
};

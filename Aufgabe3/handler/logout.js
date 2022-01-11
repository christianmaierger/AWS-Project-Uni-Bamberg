const {wrapResponse, docClient, errorType, wrapDeleteParams} = require("../shared");

async function removeTokenFromDb(item) {
    const params = wrapDeleteParams(["loginToken"], item);
    try {
        await docClient.update(params).promise();
    } catch (error) {
        throw errorType.dberror;
    }
}

module.exports.logout = async (event) => {
    const item = JSON.parse(event.requestContext.authorizer.item);

    await removeTokenFromDb(item);

    return wrapResponse(200, {
        message: "Logout successful.",
    });
};
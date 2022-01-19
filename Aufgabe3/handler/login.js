const {wrapResponse} = require("../shared");

module.exports.login = async (event) => {
    console.log(event);
    const token = event.requestContext.authorizer.token;
    return wrapResponse(200, {
        message: "Login successful.",
        token: token
    });
};
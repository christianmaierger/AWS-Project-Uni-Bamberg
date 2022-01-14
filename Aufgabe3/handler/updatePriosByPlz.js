"use strict";

// get shared functions and variables
const {
    docClient,
    wrapResponse,
    handleError,
    errorType,
    createPrioFromBirthday,
    wrapUpdateParams,
    isIllOrRelevant,
    TableName,
    GSIName
} = require("../shared");

const {
    validatePlz,
} = require('../validator');

async function updatePriosByPlz(item) {
    const plz = item.plz;
    validatePlz(plz);

    let response;
    try {
        response = await docClient
            .query({
                TableName: TableName,
                IndexName: GSIName,
                KeyConditionExpression: 'plz = :plz', // KeyConditionExpression using indexed attributes
                ExpressionAttributeValues: {// <----- ExpressionAttributeValues using indexed attributes
                    ':plz': plz,
                },
                ScanIndexForward: true, // this determines if sorted ascending or descending by range key
            })
            .promise();
    } catch (error) {
        console.log(error)
        if (error === errorType.idnotexists) {
            throw errorType.idnotexists;
        }
        throw errorType.dberror;
    }

    let resultList = response.Items;
    let objList = [] ;



//todo resultListtodo method will potentially run very long, look for iac way to set long timeout

    for (var prop of resultList) {
        let str = JSON.stringify(prop)
        let obj = JSON.parse(str)
        // as name is a reservered keyword for danymo db it needs to be deleted from update params
        delete obj.name;

        // todo what if there is no illness or relevance yet?? ok, then its just false update done the old way
        console.log(obj);
        let illOrRelevant;

        illOrRelevant = isIllOrRelevant(obj.illness, obj.relevance);

        console.log("ill or rel is : " + illOrRelevant);
        obj.prio = createPrioFromBirthday(obj.birthday, illOrRelevant);
        console.log("prio is: " + obj.prio);

        const params = wrapUpdateParams(obj);
        try {
            await docClient.update(params).promise();
        } catch (error) {
            console.log(error)
            throw errorType.dberror;
        }
    }

}

module.exports.updatePriosByPlz = async (event) => {
    try {
        await updatePriosByPlz(event.item);
        return wrapResponse(200, {message: "Prio for user updated successfully"});
    } catch (err) {
        return handleError(err);
    }
};
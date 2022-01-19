'use strict';

// get shared functions and variables
const {
    docClient,
    wrapResponse,
    handleError,
    errorType,
    wrapUpdateParams, hashPassword, createPriority,
} = require('../shared');

const {
    validateItem, validatePassword,
} = require('../validator');

function hasAllNeededNecessaryAttributes(itemChanges, item) {
    const necessaryAttributes = ["system_relevance", "pre_diseases"];

    const itemChangesKeys = Object.keys(itemChanges);
    const itemKeys = Object.keys(item);

    let result = true;

    necessaryAttributes.forEach(attribute => {
        if (!itemChangesKeys.includes(attribute) && !itemKeys.includes(attribute)) {
            result = false;
        }
    });

    return result;
}

async function updateItem(itemChanges, item) {
    if (!hasAllNeededNecessaryAttributes(itemChanges, item)) {
        throw errorType.notAllNecessaryInformation;
    }

    console.log(itemChanges)
    console.log(item)

    /** let noChanges=true;
     for (const key in itemChanges) {
        const value = itemChanges[key];
        if (value != item[key] && (key != "birthday" && key != "password" && key != "email")) {
            console.log("value ist: " + value + " value von item ist " + item[key] + "key sind " + key)
            if (typeof value == "object" && typeof item[key] == "object") {
                console.log("both objects")
                for (var key2 in value) {
                    console.log(value[key2])

                    let val = value[key2];
                    let val2= item[key]
                    console.log(val2[key2])
                    if (val != val2[key2]) {
                        console.log(val + val2[key2] )
                        noChanges=false;
                    }
                }
            }
            if (typeof value != "object") {
                console.log("different and no obj")
                noChanges=false;
            }
        }
    }
     console.log(noChanges)
     **/
    const updateItemBundle = {};
    updateItemBundle.email = item.email;
    updateItemBundle.birthday = item.birthday;

    // validation würde ich vorziehen, können ja aufhören, wenn Unsinn in der Änderung ist? und pw würde ich da mit machen
    // der Konsistenz wegen

    await validateItem(itemChanges);

    delete itemChanges.email;
    delete itemChanges.birthday;
    delete itemChanges.token;


    // added response to let user know nothing was changed, because only bday/mail/token given or the same attributes
    if (Object.keys(itemChanges).length === 0 /**|| noChanges == true**/) {
        return wrapResponse(400, {message: 'No changed values given - No update made.'});
    }


    // important do not use name as key, update expression will fail, for example use fullname but also not full-name
    for (const key in itemChanges) {
        const value = itemChanges[key];
        if (key === "password") {
            validatePassword(value);
            itemChanges[key] = hashPassword(value);
        }
        updateItemBundle[key] = value;
    }

    updateItemBundle.prio = createPriority(item.birthday, item.system_relevance, item.pre_diseases);

    const params = wrapUpdateParams(updateItemBundle);
    try {
        await docClient.update(params).promise();
        return wrapResponse(200, {message: 'Entry updated successfully'});
    } catch (error) {
        throw errorType.dberror;
    }
}

module.exports.update = async (event) => {
    try {
        const item = JSON.parse(event.requestContext.authorizer.item);

        let itemChanges;
        if (event.body) {
            itemChanges = JSON.parse(event.body).item;
        } else {
            return wrapResponse(400, {message: 'No changed values given - No update made'});
        }

        let response = await updateItem(itemChanges, item);
        return wrapResponse(response.statusCode, JSON.parse(response.body));
    } catch (err) {
        return handleError(err);
    }
};

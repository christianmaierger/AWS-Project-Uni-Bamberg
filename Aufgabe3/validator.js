const {isAlreadyExisting, errorType} = require('./shared');

function isMailValid(email) {
    const validationRegex =
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

    return email && typeof email === 'string' && email.match(validationRegex);
}

function isPlzValid(plz) {
    const validationRegex = /^[0-9]*$/;
    return (
        plz &&
        typeof plz === 'string' &&
        plz.match(validationRegex) &&
        plz.length === 5
    );
}

function isBirthdayValid(birthday) {
    // this powerful regex validates a date String with or without - in form YYYY-MM-DD also validates only valid numbers like day only up to 31
    const validationRegex =
        /^([0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])$/;
    return birthday && birthday.match(validationRegex)
}

function isGenderValid(gender) {
    return gender && (gender === 'm' || gender === 'w' || gender === 'd');
}

function isPrioValid(prio) {
    return (prio === 1 || prio === 2 || prio === 3 || prio === -1);
}

function isSystemRelevanceValid(system_relevance) {
    return system_relevance !== undefined;
}

function isPreDiseaseValid(pre_disease) {
    return pre_disease !== undefined;
}

function isValidPassword(password) {
    return password !== undefined && password.length >= 8;
}

function validateEmail(email) {
    if (!isMailValid(email)) {
        throw errorType.badEmail;
    }
}

function validatePlz(plz) {
    if (!isPlzValid(plz)) {
        throw errorType.badPlz;
    }
}

function validateBirthday(birthday) {
    if (!isBirthdayValid(birthday)) {
        throw errorType.badBirthday;
    }
}

function validateGender(gender) {
    if (!isGenderValid(gender)) {
        throw errorType.badGender;
    }
}

function validatePrio(prio) {
    if (!isPrioValid(prio)) {
        throw errorType.badPrio;
    }
}

function validateSystemRelevance(system_relevance) {
    if (!isSystemRelevanceValid(system_relevance)) {
        throw errorType.badSystemRelevance;
    }
}

function validatePreDisease(pre_disease) {
    if (!isPreDiseaseValid(pre_disease)) {
        throw errorType.badPreDiseases;
    }
}

function validatePassword(password) {
    if (!isValidPassword(password)) {
        throw errorType.badPassword;
    }
}

function validateName(name) {
    if (!name || name === {}) {
        throw errorType.badName;
    }

    const regex = /^([a-zA-Z]+\s)*[a-zA-Z]+$/;
    const surname = name.surname;
    const lastname = name.lastname;

    if (!surname || !lastname) {
        throw errorType.badName;
    }

    if (!surname.match(regex) || !lastname.match(regex)) {
        throw errorType.badName;
    }
}

function validateItem(item) {
    validateEmail(item.email);
    validateBirthday(item.birthday);

    for (let key of Object.keys(item)) {
        const element = item[key];
        switch (key) {
            case "plz":
                validatePlz(element);
                break;
            case "name":
                validateName(element);
                break;
            case "gender":
                validateGender(element);
                break;
            case "prio":
                validatePrio(element);
                break;
            case "system_relevance":
                validateSystemRelevance(element);
                break;
            case "pre_diseases":
                validatePreDisease(element);
                break;
        }
    }
}

async function validateItemExists(email, birthday) {
    if (!(await isAlreadyExisting(email, birthday))) {
        throw errorType.idnotexists;
    }
    return true;
}

async function validateItemNotExists(email, birthday) {
    if (await isAlreadyExisting(email, birthday)) {
        throw errorType.idexists;
    }
    return true;
}

function validateAttributesNotUndefined(object, ...attributes) {
    if (object === undefined) {
        throw errorType.badInput;
    }
    if (typeof object !== "object") {
        throw errorType.badInput;
    }
    for (const attribute of attributes) {
        if (object[attribute] === undefined) {
            throw errorType.badInput;
        }
    }
}

module.exports = {
    validateEmail,
    validatePlz,
    validateBirthday,
    validateGender,
    validatePrio,
    validateSystemRelevance,
    validatePreDisease,
    validatePassword,
    validateName,
    validateAttributesNotUndefined,
    validateItemExists,
    validateItemNotExists,
    validateItem
};

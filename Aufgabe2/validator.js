const { isAlreadyExisting, errorType } = require('./shared');

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
  // todo validition is fine, but perhaps when string is in form YYYYMMDD - should be appended as delimeter or make form without - invalid
  // this powerfull regex validates a date String with or without - in form YYYY-MM-DD also validates only valid numbers like day only up to 31
  //    const validationRegex = /^([0-9]{4})-?(1[0-2]|0[1-9])-?(3[01]|0[1-9]|[12][0-9])$/
  const validationRegex =
    /^([0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])$/;
  return birthday && birthday.match(validationRegex)
}

function isGenderValid(gender) {
  // TODO more refined validation and perhaps allow no gender
  return (
    (gender && (gender === 'm' || gender === 'w' || gender === 'd')) ||
    !gender
  );
}

function isPrioValid(prio) {
  return (prio === 1 || prio === 2 || prio === 3);
}

function validateEmail(email) {
  if (!isMailValid(email)) {
    console.log('mail invalid');
    throw errorType.badEmail;
  }
}

function validatePlz(plz) {
  if (!isPlzValid(plz)) {
    console.log('plz invalid');
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

function validatePrio(gender) {
  if (!isPrioValid(gender)) {
    throw errorType.badGender;
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

module.exports = {
  isMailValid,
  isPlzValid,
  isBirthdayValid,
  isGenderValid,
  isPrioValid,
  validateEmail,
  validatePlz,
  validateBirthday,
  validateGender,
  validatePrio,
  validateItemExists,
  validateItemNotExists,
};

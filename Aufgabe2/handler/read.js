'use strict';

// get shared functions and variables
const {
  docClient,
  wrapParams,
  wrapResponse,
  errorType,
  handleError,
  isEmpty,
} = require('../shared');

const { validateEmail, validateBirthday } = require('../validator');

async function getItem(email, birthday) {
  validateEmail(email);
  validateBirthday(birthday);

  const params = wrapParams('Key', { email: email, birthday: birthday });
  try {
    const response = await docClient.get(params).promise();

    if (isEmpty(response)) {
      throw errorType.idnotexists;
    }
    return response;
  } catch (error) {
    if (error == errorType.idnotexists) {
      throw errorType.idnotexists;
    }
    throw errorType.dberror;
  }
}

module.exports.read = async (event) => {
  const email = event.item.email;
  const birthday = event.item.birthday;

  try {
    const response = await getItem(email, birthday);
    return wrapResponse(200, response);
  } catch (err) {
    return handleError(err);
  }
};

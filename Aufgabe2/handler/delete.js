'use strict';

// get shared functions and variables
const {
  docClient,
  wrapResponse,
  wrapParams,
  handleError,
  errorType,
} = require('../shared');

const {
  validateEmail,
  validateItemExists,
  validateBirthday,
} = require('../validator');

async function deleteItem(email, birthday) {
  validateEmail(email);
  validateBirthday(birthday);

  await validateItemExists(email, birthday);

  const item = { email, birthday };
  const params = wrapParams('Key', item);

  try {
    await docClient.delete(params).promise();
  } catch (error) {
    console.log(error);
    throw errorType.dberror;
  }
}

module.exports.delete = async (event) => {
  const email = event.email;
  const birthday = event.birthday;

  try {
    await deleteItem(email, birthday);
    return wrapResponse(200, { message: 'Entry deleted successfully' });
  } catch (err) {
    return handleError(err);
  }
};

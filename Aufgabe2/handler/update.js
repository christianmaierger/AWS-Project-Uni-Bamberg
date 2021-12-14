'use strict';

// get shared functions and variables
const {
  docClient,
  wrapResponse,
  wrapParams,
  handleError,
  errorType,
  createPrioFromBirthday,
} = require('../shared');

const {
  validateEmail,
  validateItemExists,
  validatePlz,
  validateBirthday,
  validateGender,
} = require('../validator');

async function updateItem(item) {
  const email = item.email;
  const birthday = item.birthday;
  // possibly not necessary as update should be done automatically
  validateBirthday(birthday);
  // check if an item can be found under given id
  validateEmail(item.email);
  validatePlz(item.plz);
  validateGender(item.gender);

  await validateItemExists(email, birthday);
  // new prio is created

  item.prio = createPrioFromBirthday(item.birthday);

  const params = wrapParams('Item', item);
  try {
    await docClient.put(params).promise();
  } catch (error) {
    throw errorType.dberror;
  }
}

module.exports.update = async (event) => {
  try {
    await updateItem(event);
    return wrapResponse(200, { message: 'Entry updated successfully' });
  } catch (err) {
    return handleError(err);
  }
};

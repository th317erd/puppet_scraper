const Nife              = require('nife');
const { HTTPErrors }    = require('mythix');
const { hashUserToken } = require('../utils');

const {
  HTTPUnauthorizedError,
  HTTPInternalServerError,
} = HTTPErrors;

async function authMiddleware(request, response, next) {
  var application = request.mythixApplication;
  var salt        = application.getConfigValue('salt', '');
  var authHeader  = request.headers['authorization'];

  if (Nife.isEmpty(authHeader))
    throw new HTTPUnauthorizedError();

  authHeader = ('' + authHeader).trim();

  var token;
  authHeader.replace(/^Token ([0-9a-f-]{36})$/, (m, authToken) => {
    token = authToken;
  });

  if (!token)
    throw new HTTPUnauthorizedError();

  const User  = application.getModel('User');
  var hash    = hashUserToken(salt, token);

  try {
    user = await User.first({
      authToken: hash,
    });

    if (!user || user.authToken !== hash)
      throw new HTTPUnauthorizedError();

    request.user = user;

    next();
  } catch (error) {
    if (!(error instanceof HTTPUnauthorizedError)) {
      application.getLogger().error(error);
      throw new HTTPInternalServerError(null, error.message);
    } else {
      throw error;
    }
  }
}

module.exports = {
  authMiddleware,
};

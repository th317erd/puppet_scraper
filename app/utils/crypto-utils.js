const { CryptoUtils } = require('mythix');

function hashUserToken(salt, token) {
  return CryptoUtils.SHA256(`${salt}${token}`);
}

module.exports = {
  randomBytes:  CryptoUtils.randomBytes,
  randomHash:   CryptoUtils.randomHash,
  SHA256:       CryptoUtils.SHA256,
  SHA512:       CryptoUtils.SHA512,
  hashUserToken,
};

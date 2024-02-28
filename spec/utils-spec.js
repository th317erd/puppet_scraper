const Utils = require('../app/utils');

describe('SHA256', function() {
  it('should be able to hash input', function() {
    expect(Utils.SHA256('test')).toEqual('9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08');
    expect(Utils.SHA256('')).toEqual('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });
});

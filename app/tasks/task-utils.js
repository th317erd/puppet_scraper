// How long until we retry the webhook callback
const RETRY_COUNT_NEXT_TIMES_MINUTES = [
  0.5000, // First retry, try again in 30 seconds
  2.0000, // Second retry, try again in 2 minutes
  5.0000, // Third retry, try again in 5 minutes
  15.000, // Fourth retry, try again in 15 minutes
  30.000, // Fifth retry, try again in 30 minutes
  120.00, // Sixth retry, try again in 2 hours
  240.00, // Seventh retry, try again in 4 hours
  720.00, // Eighth retry, try again in 12 hours
  960.00, // Ninth retry, try again in 16 hours
  1440.0, // Tenth retry, try again in 24 hours
];

function getNextRetryAt(retryCount) {
  var minutes       = RETRY_COUNT_NEXT_TIMES_MINUTES[retryCount || 0] || 1440;
  var seconds       = 60 * minutes;
  var milliseconds  = 1000 * seconds;

  return Date.now() + milliseconds;
}

module.exports = {
  RETRY_COUNT_NEXT_TIMES_MINUTES,
  getNextRetryAt,
};

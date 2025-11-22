// Truncate string to specified length
function truncate(str, maxLength = 50) {
  if (typeof str !== 'string') {
    throw new TypeError('Expected a string');
  }

  if (str.length <= maxLength) {
    return str;
  }

  return str.slice(0, maxLength - 3) + '...';
}

export default truncate;

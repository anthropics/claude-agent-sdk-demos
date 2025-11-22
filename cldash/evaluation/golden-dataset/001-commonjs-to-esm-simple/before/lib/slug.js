// Convert string to URL-friendly slug
const truncate = require('./truncate');

function slug(str, maxLength = 50) {
  if (typeof str !== 'string') {
    throw new TypeError('Expected a string');
  }

  const slugified = str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return truncate(slugified, maxLength);
}

module.exports = slug;

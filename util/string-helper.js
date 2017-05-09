var regexCatch   = /([^A-Za-z0-9 \-\'\:\/\(\)\[\]])/gi;
var regexReplace = ' ';

function superTrim(str) {
  return str.trim().replace(regexCatch, regexReplace);
}

module.exports = {
  superTrim: superTrim
};

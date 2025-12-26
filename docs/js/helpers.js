/*!
* Sanitize and encode all HTML in a user-submitted string
* (c) 2018 Chris Ferdinandi, MIT License, https://gomakethings.com
* @param  {String} str  The user-submitted string
* @return {String} str  The sanitized string
*/
var sanitizeHTML = function (str) {
    var temp = document.createElement('div');
    temp.textContent = str;

    return temp.innerHTML;
};


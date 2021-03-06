var rp = require('request-promise');
var cheerio = require('cheerio');
var fs = require('fs');
// var log = function (msg: string, path: string) {
//     console.log(msg)
//     path = path + '/smoke_screen_log.txt'
// }
var ROOT_PREFIX = 'https://www.';
var ROOT_CHANGE_INTERVAL = 10; // How often we change which root url we're using
var Browser = /** @class */ (function () {
    function Browser() {
        var _this = this;
        this.rootURLs = ['infowars.com', 'slate.com', 'reddit.com'];
        this.rootURLIdx = 0;
        this.urlIncrementCount = 0;
        this.options = {
            uri: this.nextURL,
            transform: function (body) {
                return cheerio.load(body);
            }
        };
        this.selectNextURL = function (toVisit) {
            return new Promise(function (resolve) {
                if (toVisit) {
                    _this.nextURL = toVisit;
                }
                else {
                    _this.urlIncrementCount += 1;
                    if ((_this.urlIncrementCount % ROOT_CHANGE_INTERVAL) == 0) {
                        _this.rootURLIdx = (_this.rootURLIdx + 1) % _this.rootURLs.length;
                        _this.path = ROOT_PREFIX + _this.rootURLs[_this.rootURLIdx];
                        console.log("Incrementing root url to " + _this.path);
                        _this.nextURL = _this.path;
                    }
                    toVisit = _this.nextURL;
                }
                console.log('visiting ' + _this.nextURL);
                _this.options.uri = _this.nextURL;
                rp(_this.options)
                    .then(function ($) {
                    var urlToVisit = _this.path; // default to base URL
                    var links = $('a');
                    if (links.length == 0) {
                        // no links, just visit the same root url
                        console.log("No links found on page.");
                    }
                    else {
                        // Try to find a non-email, non-download link 5 times
                        for (var index = 0; index < 5; index++) {
                            var randomIdx = Math.floor(Math.random() * $(links).length);
                            // We only want to navigate to URLs within the original root domain
                            var href = $(links)[randomIdx].attribs.href;
                            var re = /(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;
                            var isEmail = re.test(href);
                            // todo: determine if link is download
                            // from https://stackoverflow.com/questions/37383600/detect-if-link-is-a-download-in-javascript-jquery
                            // $.get(href, function (response, status, xhr) {
                            //     if (xhr.getResponseHeader("content-type").indexOf("text") > -1)
                            //     {
                            //         // Text based stuff.
                            //     }
                            //     else
                            //     {
                            //       // Download based stuff. (eg., application/pdf, etc.)
                            //     }
                            // });
                            if (isEmail) {
                                // do nothing, try again or break out and stay on the same page
                            }
                            else if (href.includes(_this.rootURLs[_this.rootURLIdx])) {
                                urlToVisit = href;
                                break;
                            }
                            else if (!href.includes('http')) {
                                urlToVisit = _this.path + href;
                                break;
                            }
                        }
                    }
                    _this.nextURL = urlToVisit;
                    // console.log('returning with val ' + this.nextURL)
                    resolve(_this.nextURL);
                })
                    .catch(function (err) {
                    console.log('Error accessing page, reverting to root path.');
                    _this.nextURL = _this.path;
                    resolve(_this.path);
                });
            });
        };
        this.path = ROOT_PREFIX + this.rootURLs[this.rootURLIdx];
        this.nextURL = this.path;
    }
    return Browser;
}());
export { Browser };

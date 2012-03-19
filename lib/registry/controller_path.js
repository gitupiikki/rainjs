"use strict";

var path = require('path');
var fs = require('fs');

/**
 * Rewrites the client controller to an absolute path.
 *
 * @param {Object} componentConfig the meta.json information
 */
function configure(componentConfig) {
    if (!componentConfig.views) {
        return;
    }

    for (var viewId in componentConfig.views) {
        var viewObj = componentConfig.views[viewId];
        var fullControllerPath = (viewObj.controller && viewObj.controller.client) ?
                                  viewObj.controller.client : null;
        if (fullControllerPath) {
            fullControllerPath = '/' + componentConfig.id + '/' +
                                 componentConfig.version + '/js/' + fullControllerPath;
            viewObj.controller.client = fullControllerPath;
        }
    }
}

module.exports = {
    name: "Controller Path Plugin",
    configure: configure
};
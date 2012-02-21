
"use strict";

var mod_util = require('./util');

/**
 * Checks if an user is allowed to access a resource.
 *
 * @param {Object} securityContext the security context
 * @param {Array} permissions the permissions required to access a resource
 * @param {Array} the dynamic conditions to execute
 * @returns {Boolean} the result of the authorization checks
 */
function authorize(securityContext, permissions, dynamicConditions) {
    if (!mod_util.isArray(permissions)) {
        throw new Error('precondition failed: permissions key is not an array.');
    }

    if (!mod_util.isArray(dynamicConditions)) {
        throw new Error('precondition failed: dynamicConditions key is not an array.');
    }

    if (!securityContext.user) {
        // The current user isn't authenticated.
        return permissions.length === 0 && dynamicConditions.length === 0;
    }

    return checkPermissions(securityContext, permissions) &&
        checkDynamicConditions(securityContext, dynamicConditions);
}

/**
 * Checks if an user has the permissions to access the resource.
 *
 * @param {Object} securityContext the security context
 * @param {Array} permissions the permissions required to access a resource
 * @returns {Boolean} the result of the permissions check
 */
function checkPermissions(securityContext, permissions) {
    var userPermissions = securityContext.user.permissions || [];

    for (var i = 0, len1 = permissions.length; i < len1; i++) {
        var permission = permissions[i]; 
        var hasPermission = false;

        for (var j = 0, len2 = userPermissions.length; j < len2; j++) {
            if (userPermissions[j] === permission) {
                hasPermission = true;
                break;
            }
        }

        if (!hasPermission) {
            return false;
        }
    }

    return true;
}

/**
 * Checks if the dynamic conditions are passing.
 *
 * @param {Object} securityContext the security context
 * @param {Array} dynamicConditions the dynamic conditions to execute
 * @returns {Boolean} the result of the dynamic conditions check
 */
function checkDynamicConditions(securityContext, dynamicConditions) {
    for (var i = 0, len = dynamicConditions.length; i < len; i++) {
        var isAuthorized = dynamicConditions[i](securityContext);
        if (!isAuthorized) {
            return false;
        }
    }

    return true;
}

module.exports = {
    authorize: authorize
};
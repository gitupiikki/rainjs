define([
    'core-components/promised-io/promise'
], function(Promise) {

    /**
     * Handler for asynchroniously rendering components in rain. This is achived by sending each component
     * individually to the client as soon as it's available as a JSONP call to the renderer. This way the user
     * gets a more responsive experience, since every comonent gets rendered as soon as it's available, thus
     * giving quicker visual feedback to the user.
     *
     * @class a ClientRenderer instance
     * @name ClientRenderer
     * @constructor
     */
    function ClientRenderer() {
        this.uniqueWrapperId = 0;
        this.requireConfig = {
            "debug": true,
            "baseUrl": "/components",
            "paths": {
                "core-components": "core-components/htdocs/js"
            }
        };
    }

    /**
     * Requests a component from the server that will be rendered as soon as it is available.
     *
     * @param {Object} options
     */
    ClientRenderer.prototype.loadComponent = function(options) {
        if (!options.selector) {
            throw "Selector is required";
        }

        options.wrapperId = this.createTemporaryWrapper(options.selector);

        $.ajax({
            url: '/components/client_renderer/controller/serverside.js',
            dataType: 'json',
            data: options,
            xhrFields: {
                onprogress : onProgress
            }
        });
    };

    /**
     * React to fragments of data sent from the server
     *
     * @param {Object} the progress object recived from the onprogress event
     * @private
     */
    function onProgress(progress){
        eval(progress.currentTarget.responseText);
    }

    /**
     * Create a wrapper in which the response will be placed
     *
     * @param {String} selector a jQuery selector for the element after which to append the wrapper
     */
    ClientRenderer.prototype.createTemporaryWrapper = function(selector) {
        var uWrapperId = "wrapperid-" + this.uniqueWrapperId++;
        $(selector).after('<div data-instanceid="' + uWrapperId + '"></div>');

        return uWrapperId;
    };

    /**
     * Render a component recived via JSONP.
     *
     * @param {Object} component the component to be rendered
     */
    ClientRenderer.prototype.renderComponent = function(component) {
        console.log("renderComponent");
        registerComponent(this, component).then(function(cmp) {
            insertComponent(this, component);
        });
    };

    /**
     * Inserts the component in the page.
     *
     * @param {ClientRenderer} self the class instance
     * @param {Object} component the component to be rendered
     */
    function insertComponent(self, component) {
        $('[data-instanceid=' + component.wrapperId + ']').replaceWith(component.html);
        var head = $('head');
        var cssRessources = "";
        for ( var i = 0, l = component.css.length; i < l; i++) {
            cssRessources += component.css[i] + '&';
        }
        head.append('<link rel="stylesheet" href="/resources?files=' + cssRessources + '" type="text/css" />');
        require([
             "core-components/raintime/raintime"
         ], function(Raintime) {
            var Controller = Raintime.ComponentController;
            Controller.postRender(component.domId);
         });
    }

    /**
     * Register a component with the framework
     *
     * @param {ClientRenderer} self the class instance
     * @param {Object} component the component to be registered
     */
    function registerComponent(self, component) {
        var defer = new Promise.defer();

        var componentId = component.moduleId.split('-')[0];
        this.requireConfig.paths[componentId] = componentId + '/htdocs/js';

        require(this.requireConfig);
        require([
            "core-components/raintime/raintime"
        ], function(Raintime) {
            var Registry = Raintime.ComponentRegistry;
            var Controller = Raintime.ComponentController;
            var cmp = Registry.register({
                "domId": component.domId,
                "instanceId": component.instanceId,
                "moduleId": component.moduleId,
                "staticId": component.staticId,
                "clientcontroller": component.controller
            });

            Controller.preRender(component.domId);
            defer.resolve(cmp);
        });

        return defer.promise;
    }

    window.clientRenderer = new ClientRenderer();

    return window.clientRenderer;
});
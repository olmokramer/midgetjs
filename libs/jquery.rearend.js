(function($) {
    "use strict";

    $.fn.rearend = function(options) {

        var self = this;
        var collections = [];

        $.fn.rearend.settings = $.extend({}, $.fn.rearend.defaults, options);

        var Application = Backbone.Router.extend({
            routes: parseBackboneRoutesFromRoutes($.fn.rearend.settings.routes) || {}
        });
        new Application();
        Backbone.history.start();

        function ajaxLoad(url, callback) {
            $.ajax({
                url: url,
                success: function(data) {
                    callback(data);
                }
            })
        }

        function navigate(route) {

            ajaxLoad("./templates/" + route + ".html", function(templateData) {

                $(self).html(templateData);

                var templatesLoaded = false,
                    dataLoaded = false;

                loadTemplates(function() {
                    templatesLoaded = true;
                    if (dataLoaded === true)
                        fetchData();
                });

                loadData(function() {
                    dataLoaded = true;
                    if (templatesLoaded === true)
                        fetchData();
                })

            });

        }

        function parseBackboneRoutesFromRoutes(routes) {
            var returnObj = {};
            for(var i in routes) {
                returnObj["!/" + routes[i]] = _.partial(navigate, routes[i]);
            }
            return returnObj;
        }

        function fetchData() {
            $('require').empty();
            $('require').each(function(i, elem) {
                if (!$(elem).attr("collection"))
                    return $(elem).html($(elem).data("rearend-content"));
                var collection = collections[$(this).attr("collection")];
                for (var i in collection) {
                    fetchPartial($(this), collection[i]);
                }
            });
        }

        function fetchPartial(container, object) {
            var partialContent = $("<span>" + $(container).data("rearend-content") + "</span>");
            var placeholders = $(partialContent).find("[data-rearend-value]");
            $(placeholders).each(function() {
                $(this).html(object[$(this).data("rearend-value")]);
            })
            $(container).append(partialContent);
            $(container).removeAttr("data-rearend-content");
        }

        function loadTemplates(callback) {
            var numTemplates = $('require').length,
                numTemplatesLoaded = 0;
            if (numTemplates === 0)
                return callback();
            $('require').each(function(i, elem) {
                ajaxLoad("./templates/" + $(this).attr("src") + ".html", function(data) {
                    numTemplatesLoaded++;
                    $(elem).attr("data-rearend-content", data);
                    if (numTemplatesLoaded === numTemplates)
                        return callback();
                })
            })
        }

        function loadData(callback) {

            var collectionNames = _.unique(_.map($('[collection]'), function(item) {
                return $(item).attr("collection");
            }));
            var numCollections = collectionNames.length,
                numCollectionsLoaded = 0;
            if (numCollections === 0)
                return callback();

            _.map(collectionNames, function(collName) {
                ajaxLoad("./data/" + collName + ".json", function(data) {
                    numCollectionsLoaded++;
                    collections[collName] = data;
                    if (numCollectionsLoaded === numCollections)
                        return callback();
                })
            });

        }

    };

    $.fn.rearend.defaults = {};

}(jQuery));
        (function (vaApp, $, undefined) {
            $.model = new kendo.observable({
                // Migration Tracker
                _spMigrationTrackerItem: "/sites/spomigrations/_api/web/lists/getbytitle('MigrationTracker')/items",
                _spMigrationTrackerItemArgs: '?$select=Title,DestinationSiteCollectionUrl&$top=10&$orderby=Modified%20desc',
                migrationTrackerListUrl: () => {
                    return $.model._siteUrl + $.model._spMigrationTrackerItem + + $.model._spMigrationTrackerItemArgs;
                }
            });

            $.init = () => {
                $.dsMigrationTracker = new kendo.data.DataSource({
                    transport: {
                        read: (options) => {
                            Lib.readData((response) => {
                                options.success(response);
                            }, $.model.migrationTrackerListUrl());
                        }
                    },
                    pageSize: 25,
                    error: (e) => {
                        alert('There was a problem reading the data from SharePoint, see the JavaScript console for more details.');
                        console.log(e);
                    }
                });
            }

            $.render = () => {
                $('#grid').kendoGrid({
                    dataSource: $.dsMigrationTracker,

                    // options
                    columnMenu:  true,
                    filterable: true,
                    pageable: { pageSizes: true },
                    reorderable: true,
                    resizable: true,
                    scrollable: true,
                    sortable: true,
                    toolbar: [ 'search' ],

                    columns: [
                        { field: 'Title', title: 'Old SharePoint Web Address', width: 300 },
                        { field: 'DestinationSiteCollectionUrl.Url', title: 'New SharePoint Web Address', width: 300 }
                    ]
                });

            }

            // internal Ajax CRUD functions
            Lib = {
                readData: function (callback,url) {
                    $.ajax({
                        url: url,
                        dataType: 'json',
                        type: 'GET',
                        async: true,
                        headers: {
                            'Accept': 'application/json;odata=nometadata',
                            'Content-Type': 'application/json;odata=nometadata'
                        },
                        success: function (data) {
                            callback(data.value);
                        },
                        error: function (xhr) {
                            callback(xhr);
                        }
                    })
                },
                createData: function (callback, args, url) {
                    Utils.getDigest();
                    delete args.data['Id'];
                    $.ajax({
                        url: url,
                        method: 'POST',
                        data: JSON.stringify(Utils.cleanseModel(args.data)),
                        headers: {
                            'Accept': 'application/json;odata=nometadata',
                            'Content-Type': 'application/json;odata=nometadata',
                            'X-RequestDigest': vaApp.model.digest,
                            'X-HTTP-Method': 'POST'
                        },
                        success: function (data, status, xhr) {
                            callback(data);
                        },
                        error: function (xhr, status, error) {
                            console.log(xhr, status, error);
                            args.error({});
                        }
                    });
                },
                updateData: function (args, url) {
                    Utils.getDigest();
                    $.ajax({
                        url: url + '(' + args.data.Id + ')',
                        method: 'PATCH',
                        data: JSON.stringify(Utils.cleanseModel(args.data)),
                        headers: {
                            'Accept': 'application/json;odata=nometadata',
                            'Content-Type': 'application/json;odata=nometadata',
                            'X-RequestDigest': vaApp.model.digest,
                            'IF-MATCH': '*',
                            'X-HTTP-Method': 'PATCH'
                        },
                        success: function (data, status, xhr) {
                            args.success({});
                        },
                        error: function (xhr, status, error) {
                            console.log(xhr, status, error);
                            args.error({});
                        }
                    });
                },
                deleteData: function (args, url) {
                    Utils.getDigest();
                    $.ajax({  
                        url: url + '(' + args.data.Id + ')',
                        method: "POST",  
                        headers: {  
                            'Accept': 'application/json;odata=nometadata',
                            'Content-Type': 'application/json;odata=nometadata',
                            'X-RequestDigest': vaApp.model.digest,
                            'IF-MATCH': '*',
                            'X-HTTP-Method': 'DELETE'
                        },  
                        success: function (data, status, xhr) {
                            args.success({});
                        },
                        error: function (xhr, status, error) {
                            console.log(xhr, status, error);
                            args.error({});
                        }
                    });
                }
            }

            // internal utility functions
            Utils = {
                showMessage: (title, message) => {
                    var displayMessage = $('#_message').data('kendoWindow');
                    displayMessage.title(title);
                    displayMessage.content(message);
                    displayMessage.open();
                },
                getDigest: () => {
                    $.ajax({
                        url:  vaApp.model._siteUrl + '/_api/contextinfo',
                        dataType: 'json',
                        type: 'POST',
                        async: true,
                        headers: {
                            'Accept': 'application/json;odata=verbose',
                            'Content-Type': 'application/json;odata=verbose'
                        },
                        success: function (response) {
                            vaApp.model.set('digest', response.d.GetContextWebInformation.FormDigestValue);
                        },
                        error: function (xhr) {
                            Utils.showMessage('Error: Digest Request Failure','There was a communication error with SharePoint obtaining the request digest needed for POST operations. See the console log for more details...');
                            console.log(xhr);
                        }
                    });
                },
                cleanseModel: (model) => {
                    delete model['__kendo_devtools_id'];
                    delete model['__metadata'];
                    delete model['Created'];
                    delete model['Modified'];
                    delete model['metadataLastUpdated'];
                    delete model['Editor'];
                    delete model['value'];
                    console.log(model);
                    return model;
                }
            }
        } (window.vaApp = window.vaApp = window.$ || {}, jQuery));

        // when document ready
        $( () => {
            $.init();
            $.render();
        });

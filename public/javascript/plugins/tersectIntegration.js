//$(document).data('instanceName',$('h1')[0].childNodes[0].nodeValue);
var configGenoverse=document.getElementById("configGenoverse").getAttribute('data');
configGenoverse = JSON.parse(configGenoverse);
var instance_id = configGenoverse._id;
var instance_name = configGenoverse.name;
Genoverse.Plugins.tersectIntegration = function () {

    this.controls.push({
        icon: '<h4>T</h4>',
        'class': 'gv-tersect-integration',
        name: 'Use Tersect Functionalities.',
        action: function (browser) {
            //adding libraries
            $('head').append('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/noty@3.2.0-beta/lib/noty.css">');
            $('head').append('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/noty@3.2.0-beta/lib/themes/light.css">');
            $('head').append('<script src="javascript/lib/d3.v5.min.js" charset="utf-8"></script>');
            $('head').append('<script src="https://cdn.jsdelivr.net/npm/noty@3.2.0-beta/lib/noty.min.js"></script>');
            $('head').append('<script src="javascript/lib/venn.js"></script>');
            // Resetting variables
            var tersectButton = this;
            var tersectIndexMenu = false;
            var tersectFileMenu = false;
            var indexGenerationMenu = false;
            var queryMenu = false;
            // If the control panel search button has already been clicked, it will close the search menu
            if ($(tersectButton).hasClass('gv-active')) {
                $('.gv-menu.gv-tersect-integration-menu .gv-close').trigger('click');
                $('.gv-menu.gv-tersect-integration-file-menu .gv-close').trigger('click');
                $(tersectButton).removeClass('gv-active');
            } else {
                // otherwise it will open the search menu
                var tersectMenu = $(this).data('tersectMenu');
                if (tersectMenu) {
                    tersectMenu.show();
                } else {
                    tersectMenu = makeTersectMenu().attr("id", "tersectMenu");
                    $('#tsi-file').on('click', function () {
                        tersectIndexMenu = $(this).data("tersectIndexMenu");
                        //console.log("index menu object:" + tersectIndexMenu);
                        if (tersectIndexMenu) {
                            tersectIndexMenu.show();
                        } else {
                            tersectIndexMenu = makeTersectIndexMenu().attr("id", "tersectIndexMenu");
                            $('#tsi-locate-index', tersectIndexMenu).on('click', function () {
                                tersectFileMenu = $(this).data("tersectFileMenu");
                                if (tersectFileMenu) {
                                    tersectFileMenu.show();
                                } else {
                                    tersectFileMenu = makeTersectFileMenu().attr("id", "tersectFileMenu");
                                    $('#tsi-locate-index', tersectIndexMenu).on('click', indexPopulator("#tersectIndexMenu .gv-tersect-list tbody", "/index/tersectUpload", "#queryMenu .gv-tersect-list tbody", "/index/tersectQueries"))

                                    $(this).data("tersectFileMenu", tersectFileMenu);
                                }
                            });
                            $('#generate-new-button', tersectIndexMenu).on('click', function () {
                                indexGenerationMenu = $(this).data("indexGenerationMenu");
                                if (indexGenerationMenu) {
                                    indexGenerationMenu.show();
                                } else {
                                    indexGenerationMenu = makeIndexGenerationMenu().attr("id", "indexGenerationMenu");

                                    $(this).data("indexGenerationMenu", indexGenerationMenu);
                                }
                            });

                            $(this).data("tersectIndexMenu", tersectIndexMenu);
                            var queryMenu = $("body").data('queryMenu');
                            if (!queryMenu) {
                                queryMenu = makeQueryMenu().attr("id", "queryMenu").hide();
                                $("body").data("queryMenu", queryMenu);

                            }
                        }
                    });
                    $('#saved-queries').on('click', function () {
                        var queryMenu = $("body").data('queryMenu');

                        if (queryMenu) {
                            queryMenu.show();
                        } else {
                            queryMenu = makeQueryMenu().attr("id", "queryMenu");
                            $("body").data("queryMenu", queryMenu);

                        }

                    });

                    $('.gv-close', tersectMenu).on('click', function () {
                        $(tersectButton).removeClass('gv-active');
                    });

                }
                $(tersectButton).addClass('gv-active');
                // Use off() to devalidate any handlers added by spamming the tersect button.
                $(this).data('tersectMenu', tersectMenu);
            }

            //makeMenu function declarations.
            function makeTersectMenu() {
                var tersectMenu = browser.makeMenu({
                    'Tersect Plugin': '',
                    '</br><button class="btn btn-default btn-block" id="tsi-file">Select TSI File <i class="fa fa-folder-open"></i></button> \
                        <div id="gv-tersect-gui-container" class="panel panel-default"><div class="panel-heading"><h4 class="panel-title">Samples in TSI</h4></div></br> \
                        <div id="gv-tersect-tab-container"> <span id="countA" class="wild btn btn-primary"><span></span>  <i class="count-close fa fa-times-circle"></i></span> <span id="countB" class="wild btn btn-primary"><span></span>  <i class="count-close fa fa-times-circle"></i></span> <span id="countC" class="wild btn btn-primary"><span></span>  <i class="count-close fa fa-times-circle"></i></span> <button class="btn btn-primary btn-sm" id="addCircle"><i class="fa fa-plus"></i></button></div></br></br>\
                        <input type="text" id="searchBox" placeholder="Search for samples..."/></br></br> \
                        <table id="genomeTable"></table>\
                        <div class="panel-footer"><button class="btn btn-default btn-sm" id="clearSample">Clear Samples <i class="fa fa-eraser"></i></button></div></div> \
                        </div><div class="panel panel-default" id="setnotation"> <div class="panel-heading"><h5 class="panel-title">Set notation</h5> </div><div class="panel-body"><div id="onLeft"><span id="notation" class="badge"></span> </div><div id="onRight"><button class="btn btn-default btn-xs" id="clearOperations">Clear Operations <i class="fa fa-eraser"></i></button></div></div></div>\
                        <div><input type="text" placeholder="File Name" id="filepath" />&nbsp;<input type="number" placeholder="Threshold" min="1" max="3" id="gv-tersect-threshold"/>&nbsp;<button class="btn btn-primary" id="submit">Submit Query <i class="fa fa-download"></i></button>\
                        <div id="tooltipdiv">\
                            <table id="sampleA" class="venntooltip">\
                            <tbody>\
                                <tr>\
                                <th><button class="btn btn-primary" id="hideA">Samples in A <i class="fa fa-times-circle"></i></button></th>\
                                </tr>\
                                </tbody>\
                            </table>\
                            <table id="sampleB" class="venntooltip">\
                            <tbody>\
                                <tr>\
                                <th><button class="btn btn-primary" id="hideB">Samples in B <i class="fa fa-times-circle"></i></button></th>\
                                </tr>\
                                </tbody>\
                            </table>\
                            <table id="sampleC" class="venntooltip">\
                            <tbody>\
                                <tr>\
                                <th><button class="btn btn-primary" id="hideC">Samples in C <i class="fa fa-times-circle"></i></button></th>\
                                </tr>\
                                </tbody>\
                            </table>\ </div>': '<div id="venn"></div><div id="venncontrols" class="panel panel-default"><div class="panel-heading"><h5 class="panel-title">Full Command</h5></div><div class="panel-body">  <span style="display:inline-block; width: 15px;"></span> <span id="gv-tersect-advancedInput" class="badge" ></span>&nbsp;&nbsp;</div></div></br></br>\
                            <div id="query"><span style="display:inline-block; width: 20px;"></span><button class="btn btn-default btn-block" id="saved-queries">Saved Queries <i class="fa fa-folder-open"></i></button></div></div>',

                }).addClass('gv-tersect-integration-menu');
                vennInit();

                return tersectMenu;
            }

            function makeTersectIndexMenu() {
                var indexMenu = browser.makeMenu({
                    '<div>Choose Tersect Index File:</div>': '',
                    '<table class="gv-tersect-integration-text gv-tersect-list"><thead><tr><td>Name</td><td>&emsp;&emsp;&emsp;</td></tr></thead><tbody></tbody></table>': '',
                    '<button class="btn btn-primary btn-block" id="tsi-refresh">Refresh List <i class="fa fa-retweet"></i></button>': '',
                    '<button class="btn btn-primary btn-block" id="tsi-locate-index">Locate TSI Index <i class="fa fa-arrow-circle-right"></i></button>': '',
                    '<button class="btn btn-primary btn-block" id="generate-new-button">Generate New Index <i class="fa fa-arrow-circle-right"></i></button>': '',

                }).addClass('gv-tersect-integration-file-menu');
                $('#tsi-refresh', indexMenu).on('click', function () { indexPopulator("#tersectIndexMenu .gv-tersect-list tbody", "/index/tersectUpload", "#queryMenu .gv-tersect-list tbody", "/index/tersectQueries") })
                $('#tsi-refresh', indexMenu).click();
                return indexMenu;
            }

            function makeIndexGenerationMenu() {
                var generationMenu = browser.makeMenu({
                    '<div>Generate A New Tersect Index File:</div>': '',
                    '<div class="gv-tersect-dropzone"><a id="select-vcf">Select</a> Or Drop Files Here</div><input class="gv-tersect-integration-input gv-tersect-file-input" type="file" id="vcf-file-chooser" name="vcf file chooser" multiple> \
                    <input type=text placeholder="Name New Index:" class="entryname"></input><br> \
                    <a class="remove">remove</a>': '',
                    '': '',
                    '<button class="btn btn-primary btn-block" id="submit-new-button">Generate New Index <i class="fa fa-arrow-circle-right"></i></button>': ''
                }).addClass('gv-tersect-integration-file-menu');
                vcfUploader(generationMenu, '#submit-new-button', "#vcf-file-chooser", "#select-vcf", "vcf", "/index/vcfUpload/new");
                return generationMenu;
            }

            function makeTersectFileMenu() {
                var fileMenu = browser.makeMenu({
                    '<div>Choose Tersect Index Files:</div>': '',
                    '<div id="names" class="gv-tersect-integration-text">Select Local TSI File</div>': '',
                    '<input class="gv-tersect-integration-input gv-tersect-file-input" type="file" id="local-file-chooser" name="local file chooser" multiple><div class="progressbar-border"> <div id="local-file-progress" class="progressbar-fill"></div></div>': '',
                    '<button id="tsi-submit-local" class="btn btn-primary btn-block"><a id="tsi-submit-local-text" class="gv-tersect-integration-text">Submit File <i class="fa fa-upload"></i></a></button>': '',
                }).addClass('gv-tersect-integration-file-menu');
                $('#tsi-submit-local', fileMenu).on('click', function () { fileUploader(fileMenu, "#tsi-submit-local-text", "#local-file-progress", "#local-file-chooser", "tsi", "/index/tersectUpload/new") });
                return fileMenu;
            }


            function makeQueryMenu() {
                var queryMenu = browser.makeMenu({
                    '<div>Choose Query VCF</div>': '',
                    '<span class="gv-tersect-integration-span" id="query-refresh"><a class="gv-tersect-integration-text">Refresh List <i class="fa fa-arrow-circle-right"></i></a></span>': '',
                    '<table class="gv-tersect-integration-text gv-tersect-list"><thead><tr><td>File Name</td><td>Command</td></tr></thead><tbody></tbody></table>': '',
                    '<button class="btn btn-primary" id="add-tracks">Add tracks to Instance <i class="fa fa-arrow-circle-right"></i></button>': '<label for="gv-tersect-query-vcf">VCF Track:</label>&nbsp;<input type="checkbox" id="gv-tersect-query-vcf">&emsp;<label for="gv-tersect-query-density">Density Track: </label>&nbsp;<input type="checkbox" id="gv-tersect-query-density">',
                    '<button class="btn btn-danger" id="purge-queries">Purge Query DB <i class="fa fa-arrow-circle-right"></i></button>': ''
                }).addClass('gv-tersect-integration-file-menu');
                $('#query-refresh').on('click', function () {
                    if ($(document).data('query-id')) {
                        queryPopulator('#queryMenu .gv-tersect-list tbody', $(document).data('query-id'), '/index/tersectQueries');
                    }
                });
                $('#purge-queries').on('click', function(){
                    flag = confirm("This will delete all entries associated with this instance. Do you wish to continue?");
                    if (flag == true) {$.ajax({
                        type: 'DELETE',
                        url: '/index/delete-query-vcfs/'+instance_id,
                        success: function (data) {
                            new Noty({
                                type: 'success',
                                layout: 'topRight',
                                text: "All Items Deleted!",
                                timeout: '4000',
                                theme: 'light',
                            }).show();
                            $('#query-refresh').click();
                        },
                        error: function (xhr) {
                            console.error(xhr);
                            new Noty({
                                type: 'error',
                                layout: 'topRight',
                                text: `${xhr.status}: ${xhr.responseText} `,
                                timeout: '4000',
                                theme: 'light',
                            }).show();
                        }
                    })}
                });
                return queryMenu;
            }
        }
    });
};
function setScrollBar() {
    $('#pos').css({ "height": "500px" });
    $('#names').css({ "height": "500px" });
    $('#pos').css({ "overflow-y": "scroll" });
    $('#names').css({ "overflow-y": "hidden" });
    $('#pos').on('scroll', function () {
        $('#names').scrollTop($(this).scrollTop());
    });
}


function removeScrollBar() {
    $('#pos').css({ "height": "auto" });
    $('#names').css({ "height": "auto" });
    $('#pos').css({ "overflow-y": "hidden" });
    $('#names').css({ "overflow-y": "hidden" });
}


function fileUploader(parent, submit_link_text, progress_bar, chooser, extension, url) {
    $(chooser, parent).click();

    var flag = true;
    $(chooser).off().on('change', function () {
        var files = $(chooser, parent).get(0).files;

        if (files.length > 0) {
            $(submit_link_text, parent).text('Submit 0%');
            $(progress_bar, parent).width("0%");
            var formData = new FormData();
            formData.append("instanceName", instance_name);
            formData.append("instanceID", instance_id);
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                // add the files to formData object for the data payload
                const name = file.name;
                const lastDot = name.lastIndexOf('.');

                const fileName = name.substring(0, lastDot);
                const ext = name.substring(lastDot + 1);

                if (ext !== extension) {
                    alert("file extension is wrong.");
                    flag = false;
                }
                formData.append('uploads[]', file, file.name);
            }
        }
        if (flag == true) {
            $.ajax({
                url: url,
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function (data) {
                    console.log('upload successful!\n' + Date.now());

                },
                xhr: function () {
                    // create an XMLHttpRequest
                    var xhr = new XMLHttpRequest();
                    // listen to the 'progress' event
                    xhr.upload.addEventListener('progress', function (evt) {
                        if (evt.lengthComputable) {
                            // calculate the percentage of upload completed
                            var percentComplete = evt.loaded / evt.total;
                            percentComplete = parseInt(percentComplete * 100);
                            //
                            $(submit_link_text, parent).text('Submit ' + percentComplete + '%');
                            $(progress_bar, parent).width(percentComplete + '%');
                            // once the upload reaches 100%, set the progress bar text to done
                            if (percentComplete === 100) {
                                $(submit_link_text, parent).text('Submission Complete');
                            }
                        }
                    }, false);
                    return xhr;
                },
                error: function (xhr) {
                    xhr.abort();
                    new Noty({
                        type: 'error',
                        layout: 'topRight',
                        text: `${xhr.status}: ${xhr.responseText} `,
                        timeout: '4000',
                        theme: 'light',
                    }).show();
                }
            });
        }
        $(chooser).val("");
    });
}

function indexPopulator(index_list, url, query_list, query_url) {
    console.log("event fired successfully!");
    $(index_list).empty();
    $.ajax({
        type: 'POST',
        data: { instanceName: instance_name, instanceID: instance_id },
        url: url,
        success: function (data) {
            console.log("latest value" + this);
            $.each(data, function () {
                $(index_list).append('<tr data-id="' + this._id + '"><td><a class="gv-tersect-index-name">' + this.name + '</a></td><td><a class="gv-tersect-index-delete">delete</a></td></tr>');
            });


            $(index_list).parent().off().on('click', '.gv-tersect-index-delete', function () {
                console.log("delete event fired at: " + Date.now());
                let flag = confirm("Are you sure you want to permanently delete that Index file?")
                if(flag == true) {
                    $.ajax({
                        type: 'DELETE',
                        url: url + "/" + $(this).parent().parent().data("id"),
                        success: function (data) {
                            new Noty({
                                type: 'success',
                                layout: 'topRight',
                                text: "Index Deleted!",
                                timeout: '2000',
                                theme: 'light',
                            }).show();
                            indexPopulator(index_list, url, query_list, query_url);
                        },
                        error: function (xhr) {
                            new Noty({
                                type: 'error',
                                layout: 'topRight',
                                text: `${xhr.status}: ${xhr.responseText} `,
                                timeout: '4000',
                                theme: 'light',
                            }).show();
                        }
                    })
                }
            });
            $(index_list).parent().on('click', '.gv-tersect-index-name', function () { indexGetter(index_list, $(this).parent().parent().data('id'), url) });
            $(index_list).parent().on('click', '.gv-tersect-index-name', function () { $(document).data('query-id', $(this).parent().parent().data('id')) });
            $(index_list).parent().on('click', '.gv-tersect-index-name', function () { queryPopulator(query_list, $(this).parent().parent().data('id'), query_url) })
        },
        dataType: "json"
    });
}

var idsForTracks = [];
var vcfFlag = false;
var densityFlag = false;

function queryPopulator(query_list, id, query_url) {
    $(query_list).empty();
    $.ajax({
        type: 'POST',
        data: { idToGet: id },
        url: query_url,
        success: function (data) {
            $.each(data, function () {
                $(query_list).append('<tr data-id="' + this._id + '"><td class="gv-tersect-query-row"><a class="gv-tersect-query-name">' + this.name + '</a></td><td class="CellWithComment"><span class="CellComment">' + decodeURIComponent(this.command) + '</span><span>' + decodeURIComponent(this.command) + '</span></td><td><a class="gv-tersect-query-edit">Edit</a></td><td><a class="gv-tersect-query-download">Download</a></td><td><a class="gv-tersect-query-delete">delete</a></td></tr>');
            });


            $(query_list).parent().off().on('click', '.gv-tersect-query-row', function () {
                if ($(this).hasClass("active")) {
                    $(this).removeClass("active");
                    $(this).css("border", "none");
                    var index = idsForTracks.indexOf($(this).parent().data('id'));
                    if (index !== -1) idsForTracks.splice(index, 1);
                } else {
                    $(this).addClass("active");
                    $(this).css("border", "5px solid white");
                    idsForTracks.push($(this).parent().data('id'));
                }
            });
            $(query_list).parent().on('click', '.gv-tersect-query-delete', function () {
                let flag = confirm("Are you sure you want to permanently delete that query file?");
                if (flag == true){
                    console.log("delete event fired at: " + Date.now());
                    $.ajax({
                        type: 'DELETE',
                        url: query_url + "/" + $(this).parent().parent().data("id"),
                        success: function (data) {
                            new Noty({
                                type: 'success',
                                layout: 'topRight',
                                text: "Item Deleted!",
                                timeout: '2000',
                                theme: 'light',
                            }).show();
                            queryPopulator(query_list, id, query_url);
                            idsForTracks = []
                        },
                        error: function (xhr) {
                            new Noty({
                                type: 'error',
                                layout: 'topRight',
                                text: `${xhr.status}: ${xhr.responseText} `,
                                timeout: '4000',
                                theme: 'light',
                            }).show();
                        }
                    })
                }
            });
            $(query_list).parent().on('click', '.gv-tersect-query-edit', function () {
                console.log("edit event fired at: " + Date.now());
                $.ajax({
                    type: 'POST',
                    url: query_url + "/" + $(this).parent().parent().data("id") + "/edit",
                    success: function (data) {
                        console.log(data)
                        loadFromTemplate(data)
                    },
                    error: function (xhr) {
                        new Noty({
                            type: 'error',
                            layout: 'topRight',
                            text: `${xhr.status}: ${xhr.responseText} `,
                            timeout: '4000',
                            theme: 'light',
                        }).show();
                    }
                })
            });

            //had to use this method to overcome the limitations on downloading via AJAX.
            $(query_list).parent().on('click', '.gv-tersect-query-download', function () {
                var form = $('<form>', { action: query_url + "/" + $(this).parent().parent().data("id") + "/download", method: 'POST' });
                $(document.body).append(form);
                form.submit();
            });

            $("#gv-tersect-query-vcf").off().on('click', function () {
                if ($(this).prop('checked') == true) {
                    vcfFlag = 1;
                } else {
                    vcfFlag = 0;
                }
            });

            $("#gv-tersect-query-density").off().on('click', function () {
                if ($(this).prop('checked') == true) {
                    densityFlag = 1;
                } else {
                    densityFlag = 0;
                }
            });

            $('#add-tracks').off().on('click', function () {
                if (idsForTracks && (vcfFlag || densityFlag)) {
                    $.ajax({
                        url: query_url + '/newTracks',
                        type: 'POST',
                        data: { idsForTracks: idsForTracks, instanceName: instance_name, instanceID: instance_id, vcfFlag: vcfFlag, densityFlag: densityFlag },
                        success: function (data) {
                            $('a', query_list).css('border', 'none');
                            location.reload(true)
                        },
                        error: function (xhr) {
                            new Noty({
                                type: 'error',
                                layout: 'topRight',
                                text: `${xhr.status}: ${xhr.responseText} `,
                                timeout: '4000',
                                theme: 'light',
                            }).show();
                        }
                    })
                } else {
                    alert("Select Both Query VCFs and track types.")
                }

            })
            //$(index_list).parent().on('click','.gv-tersect-index-name',function(){indexGetter(index_list,$(this).parent().parent().data("id"),url)});
        },
        dataType: "json"
    });
}

function vcfUploader(parent, submit_link, chooser, chooser_link, extension, url) {
    var formData = new FormData();
    formData.append("instanceName", instance_name);
    formData.append("instanceID", instance_id);
    $(document).data("vcfFormData", formData);
    console.log(JSON.stringify($(document).data("vcfFormData"), null, 4));

    $(chooser_link, parent).on('click', function () {
        $(chooser, parent).click();
        $(chooser, parent).off().on('change', function () {
            var files = $(chooser, parent).get(0).files;

            if (files.length > 0) {
                handleFileUpload(parent, "vcfFormData", files, extension);
                if ($(".gv-tersect-dropzone .statusbar", parent)[0]) {
                    $(".remove",parent).show();
                    $(".entryname",parent).show();
                }
            }
            $(chooser, parent).val("");
        });
    });

    $(".remove", parent).on("click", function () {
        $(".statusbar", parent).empty();
        formData = new FormData();
        formData.append("instanceName", instance_name);
        formData.append("instanceID", instance_id);
        $(document).data("vcfFormData", formData);
        $(".entryname", parent).empty().hide();
        $(".remove", parent).hide();
    });

    $(parent).on('dragenter', function (e) {
        e.stopPropagation();
        e.preventDefault();
        $(this).css('border', '2px solid #0B85A1');
    });
    $(parent).on('dragover', function (e) {
        e.stopPropagation();
        e.preventDefault();
    });
    $(parent).on('drop', function (e) {
        $(this).css('border', '2px dotted #0B85A1');
        e.preventDefault();
        var files = e.originalEvent.dataTransfer.files;

        //We need to send dropped files to Server
        handleFileUpload(parent, "vcfFormData", files, extension);
        if ($(".gv-tersect-dropzone .statusbar", parent)[0]) {
            $(".remove",parent).show();
            $(".entryname",parent).show();
        }
    });
    $(document).on('dragenter', function (e) {
        e.stopPropagation();
        e.preventDefault();
    });
    $(document).on('dragover', function (e) {
        e.stopPropagation();
        e.preventDefault();
        obj.css('border', '2px dotted #0B85A1');
    });
    $(document).on('drop', function (e) {
        e.stopPropagation();
        e.preventDefault();
    });

    $(submit_link).on('click', function () {
        var vcfFormData = $(document).data('vcfFormData');
        if ($(".statusbar", parent)[0]) {
            // if($("entryname",parent).val()) {
            var newName = $(".entryname", parent).val();
            newName = newName.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
            // }
            if (newName) {
                $('<div class="progressbar-border"> <div class="progressbar-fill"></div></div>').insertAfter($(submit_link, parent));

                vcfFormData.append('newName', newName);
                $.ajax({
                    url: url,
                    type: 'POST',
                    data: vcfFormData,
                    processData: false,
                    contentType: false,
                    success: function (data) {
                        console.log('vcf upload successful!\n' + Date.now());
                        $(".statusbar", parent).empty();
                        formData = new FormData();
                        formData.append("instanceName", instance_name);
                        formData.append("instanceID", instance_id);
                        $(document).data("vcfFormData", formData);
                        $(".progressbar-border", parent).remove();
                        $(".remove", parent).hide();
                        $(".entryname",parent).hide();

                    },
                    xhr: function () {
                        // create an XMLHttpRequest
                        var xhr = new XMLHttpRequest();
                        // listen to the 'progress' event
                        xhr.upload.addEventListener('progress', function (evt) {
                            if (evt.lengthComputable) {
                                // calculate the percentage of upload completed
                                var percentComplete = evt.loaded / evt.total;
                                percentComplete = parseInt(percentComplete * 100);
                                //
                                $("a", submit_link).text('Submit ' + percentComplete + '%');
                                $(".progressbar-fill", parent).width(percentComplete + '%');
                                // once the upload reaches 100%, set the progress bar text to done
                                if (percentComplete === 100) {
                                    $("a", submit_link).text('Submission Complete');
                                }
                            }
                        }, false);
                        return xhr;
                    },
                    error: function (xhr) {
                        xhr.abort();
                        new Noty({
                            type: 'error',
                            layout: 'topRight',
                            text: 'You need to be logged in to complete that action',
                            timeout: '4000',
                            theme: 'light',
                        }).show();
                        $(".progressbar-border", parent).remove();
                        $(".remove", parent).hide();
                        $(".entryname",parent).hide();
                    }
                });
            }
        }
    });



}



function handleFileUpload(parent, form_data, files, extension) {
    formData = $(document).data(form_data);

    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        if (!(file.name.endsWith("." + extension) || file.name.endsWith("." + extension + ".gz"))) {
            alert("a file in that selection has the wrong extension");
            break;
        };
        formData.append('uploads[]', file, file.name);

        var status = new createStatusbar(parent); //Using this we can set progress.
        status.setFileNameSize(file.name, file.size);

    }

    $(this).data(form_data, formData);

}


function createStatusbar(parent) {

    this.statusbar = $("<div class='statusbar'></div>");
    this.filename = $("<span class='filename'></span>").appendTo(this.statusbar);
    this.size = $("<span class='filesize'></span>").appendTo(this.statusbar);
    $(".gv-tersect-dropzone", parent).append(this.statusbar);

    this.setFileNameSize = function (name, size) {
        var sizeStr = "";
        var sizeKB = size / 1024;
        if (parseInt(sizeKB) > 1024) {
            var sizeMB = sizeKB / 1024;
            sizeStr = sizeMB.toFixed(2) + " MB";
        }
        else {
            sizeStr = sizeKB.toFixed(2) + " KB";
        }

        this.filename.html(name);
        this.size.html(sizeStr);
    };

}

function indexGetter(parent, idToGet, url) {
    $.post(url + "/view", { "tsifile": idToGet }, function (data) {
        operations.idToGet = idToGet;
        var samples = data.samples;
        console.log(samples)
        $('#genomeTable').empty();
        $('#genomeTable').append('<tr>');
        for (i = 0; i < samples.length; i++) {
            $('<td>' + samples[i] + '</td>').attr({ id: [i], class: 'samples' }).appendTo('#genomeTable').draggable({
                opacity: 0.5,
                helper: "clone",
                //make sure cursor is out of the way so that mouseover event for venn can fire properly
                cursorAt: { left: -2, top: -2 },
                // Register what we're dragging with the drop manager
                start: function (event) {
                    DragDrop.dragged = event.target;
                },
                drag: function (event) {
                    var goodPos = DragDrop.placement();
                    //change tooltip depending on location of cursor
                    div.style('cursor', function () {
                        return (goodPos) ? 'copy' : 'no-drop';
                    });
                    //if location is outside of venn or in intersect do not disable drag and return sample to table
                    $(event.target).draggable('option', 'revert', (goodPos) ? false : true);
                    $(event.target).draggable('option', 'disabled', (goodPos) ? true : false);
                },
                stop: function (event) {
                    var goodPos = DragDrop.placement();
                    if (goodPos) {
                        new Noty({
                            type: 'success',
                            layout: 'topRight',
                            text: DragDrop.dragged.innerText + ' has been dropped in: ' + DragDrop.droppable,
                            timeout: '4000',
                            theme: 'light',
                        }).show();
                        DragDrop.add();

                    } else {
                        new Noty({
                            type: 'warning',
                            layout: 'topRight',
                            text: DragDrop.dragged.innerText + " cannot be dropped here!",
                            timeout: '5000',
                            theme: 'light',
                            closeWith: ['click'],
                        }).show();


                    }
                    div.style('cursor', 'pointer');

                }
            })

        };
        $('#genomeTable').append(`</tr>`);
        //case sensitive search for samples (only matches from the beginning of samples)
        $("#searchBox").off().on("keyup", function () {
            wildcardgroup = $(this).val();
            $("#genomeTable td").filter(function () {
                $(this).toggle($(this).text().indexOf(wildcardgroup) == 0)
            });
        });

    });
}

// function indexGetter(parent, idToGet, url) {
//     $.ajax({
//         url: url + "/view",
//         type: 'POST',
//         data: { "tsifile": idToGet },
//         processData: false,
//         contentType: false,
//         success: function (data) {
//             operations.idToGet = idToGet;
//             var samples = data.samples;
//             console.log(samples)
//             $('#genomeTable').empty();
//             $('#genomeTable').append('<tr>');
//             for (i = 0; i < samples.length; i++) {
//                 $('<td>' + samples[i] + '</td>').attr({ id: [i], class: 'samples' }).appendTo('#genomeTable').draggable({
//                     opacity: 0.5,
//                     helper: "clone",
//                     //make sure cursor is out of the way so that mouseover event for venn can fire properly
//                     cursorAt: { left: -2, top: -2 },
//                     // Register what we're dragging with the drop manager
//                     start: function (event) {
//                         DragDrop.dragged = event.target;
//                     },
//                     drag: function (event) {
//                         var goodPos = DragDrop.placement();
//                         //change tooltip depending on location of cursor
//                         div.style('cursor', function () {
//                             return (goodPos) ? 'copy' : 'no-drop';
//                         });
//                         //if location is outside of venn or in intersect do not disable drag and return sample to table
//                         $(event.target).draggable('option', 'revert', (goodPos) ? false : true);
//                         $(event.target).draggable('option', 'disabled', (goodPos) ? true : false);
//                     },
//                     stop: function (event) {
//                         var goodPos = DragDrop.placement();
//                         if (goodPos) {
//                             new Noty({
//                                 type: 'success',
//                                 layout: 'topRight',
//                                 text: DragDrop.dragged.innerText + ' has been dropped in: ' + DragDrop.droppable,
//                                 timeout: '4000',
//                                 theme: 'light',
//                             }).show();
//                             DragDrop.add();
//
//                         } else {
//                             new Noty({
//                                 type: 'warning',
//                                 layout: 'topRight',
//                                 text: DragDrop.dragged.innerText + " cannot be dropped here!",
//                                 timeout: '5000',
//                                 theme: 'light',
//                                 closeWith: ['click'],
//                             }).show();
//
//
//                         }
//                         div.style('cursor', 'pointer');
//
//                     }
//                 })
//
//             };
//             $('#genomeTable').append(`</tr>`);
//             //case sensitive search for samples (only matches from the beginning of samples)
//             $("#searchBox").off().on("keyup", function () {
//                 wildcardgroup = $(this).val();
//                 $("#genomeTable td").filter(function () {
//                     $(this).toggle($(this).text().indexOf(wildcardgroup) == 0)
//                 });
//             });
//
//         },
//         statusCode: {
//             413: function (xhr) {
//                 new Noty({
//                     type: 'error',
//                     layout: 'topRight',
//                     text: "Error with TSI retrieval: corrupt file..",
//                     timeout: '4000',
//                     theme: 'light',
//                 }).show();
//             }
//         },
//         error: function (xhr, status, error) {
//             xhr.abort();
//             new Noty({
//                 type: 'error',
//                 layout: 'topRight',
//                 text: "Error Uploading. You Must be logged in.",
//                 timeout: '4000',
//                 theme: 'light',
//             }).show();
//         }
//     });
// }

////////////////////////////////////////////////////////////////////////////////////////////
//
// Tersect GUI from this point onward
//
//
////////////////////////////////////////////////////////////////////////////////////////////

var area = [];
var filesetA = []; //sent with request object for construction of query
var filesetB = []; //sent with request object for construction of query
var filesetC = []; //sent with request object for construction of query
var wildcardgroup;
var wildcardID = [];
var operations = {};
var command;
var sampleCountA = 0;
var sampleCountB = 0;
var sampleCountC = 0;
const circles = ['A', 'B', 'C'];
var groupNum;
var change;

var chart;
var div;

var tooltipA;
var tooltipB;
var tooltipC;



//sets for making venn diagram
var sets = [{ sets: ['A'], size: 12 }];


/**allows mouseover event to fire during drag and drop and not after
 * also adds sample being dragged to its respective tooltip and fileset array */
var DragDrop = {
    dragged: null,
    droppable: null,
    placement: function () {
        if (this.droppable == null || this.droppable.length > 1) return false;
        return true;
    },
    add: function () {
        if (this.droppable[0] == 'A') {
            $('#sampleA > tbody:last-child').append(`<tr><td id="table${this.dragged.id}"><button class="tableButton btn btn-default" id="A${this.dragged.id}">${this.dragged.innerText}<i class="fa fa-trash"></i></button></td></tr>`);
            filesetA.push(this.dragged.innerText);
            sampleCountA++;
            $("#countA span").text("A: " + sampleCountA);

        } else if (this.droppable[0] == 'B') {
            $('#sampleB > tbody:last-child').append(`<tr><td id="table${this.dragged.id}"><button class="tableButton btn btn-default" id="B${this.dragged.id}">${this.dragged.innerText}<i class="fa fa-trash"></i></button></td></tr>`);
            filesetB.push(this.dragged.innerText);
            sampleCountB++;
            $("#countB span").text("B: " + sampleCountB);
        } else if (this.droppable[0] == 'C') {
            $('#sampleC > tbody:last-child').append(`<tr><td id="table${this.dragged.id}"><button class="tableButton btn btn-default" id="C${this.dragged.id}">${this.dragged.innerText}<i class="fa fa-trash"></i></button></td></tr>`);
            filesetC.push(this.dragged.innerText);
            sampleCountC++;
            $("#countC span").text("C: " + sampleCountC);
        }

    }
};

function vennInit() {


    $("#countB, #countC").hide();

    $("#countA span").text("A: " + sampleCountA);
    $("#countB span").text("B: " + sampleCountB);
    $("#countC span").text("C: " + sampleCountC);

    chart = venn.VennDiagram();
    div = d3.select("#venn");

    //sets for making venn diagram
    sets = [{ sets: ['A'], size: 12 }];
    //draw venn
    div.datum(sets).call(chart
        .width(300)
        .height(300)
    );
    //customise venn diagram
    customiseVenn();

    //make tooltips for files
    tooltipA = d3.select("#sampleA");
    tooltipB = d3.select("#sampleB");
    tooltipC = d3.select("#sampleC");

    //event listener to add circle to page, set from vennInit() init function.
    $('#addCircle').click(function () {
        if (newCircles().length != 0) {

            var newCircle = newCircles()[0];
            var setLength = sets.length;

            //could change to for each
            for (i = 0; i < setLength; i++) {
                var intersectSize = sets[i].size / 3;
                var newSet = [...sets[i].sets]
                newSet.push(newCircle);
                var newFullSet = { sets: newSet, size: intersectSize }
                sets.push(newFullSet);
            }
            sets.push({ sets: [newCircle], size: 12 });
            //debug for sets
            // console.log("sets:" +JSON.stringify(sets))
            var disp = circlesDisplayed();
            if (disp.length == 3){
                $("#addCircle").hide();
            }
            disp.forEach(function (elem) {
                $("#count" + elem).show();
                $("#sample" + elem).hide();
            });
            redraw();
        } else {
            new Noty({
                type: 'error',
                layout: 'center',
                text: `No more circles can be added!`,
                timeout: '2000',
                theme: 'light',
                closeWith: ['click'],
            }).show();
        }
    });
    $('.gv-tersect-integration-menu i.count-close').on("click", function(e){
        e.stopImmediatePropagation();
        e.preventDefault();
        var delCircle = $(this).parent().children("span").text().charAt(0);
        var currentCircles = circlesDisplayed();
        if (currentCircles.length >= 2) {
            $("#addCircle").show();
            if (currentCircles.find(circle => circle == delCircle)) {

                for (i = 0; i < sets.length; i++) {
                    if (sets[i].sets.find(set => set == delCircle)) {
                        sets.splice(i, 1);
                        i--;

                    }

                }
                $("#count" + delCircle).hide();
                redraw();
            } else {
                new Noty({
                    type: 'error',
                    layout: 'center',
                    text: `Circle does not exist!`,
                    timeout: '2000',
                    theme: 'light',
                    closeWith: ['click'],
                }).show();
            }
        } else {
            new Noty({
                type: 'error',
                layout: 'center',
                text: 'Cannot remove all circles!',
                timeout: '2000',
                theme: 'light',
                closeWith: ['click'],
            }).show();
        }
        return false;
    });

    //action listeners for venn
    div.selectAll('g')
        .on('mouseover', function (d, i) {
            DragDrop.droppable = d.sets;
        })

        .on('mouseout', function (d, i) {
            DragDrop.droppable = null;

        })

        .on('contextmenu', function (d, i) {
            d3.event.preventDefault();
            $('#sampleA').show();
            tooltipA.transition().duration(400).style("opacity", .9);
            tooltipA.style("left", (d3.event.pageX - 250) + "px")
                .style("top", (d3.event.pageY - 100) + "px");

        })

        .on('click', function (d, i) {
            d3.select(this).select("text").style("font-weight", "100")
                .style("font-size", "36px");
            getNotation();
            commandParse(command,"#gv-tersect-advancedInput");
            area.push(d.sets);
        });

    $('.wild').click(function () {
        var selection = $(this);
        function notDuplicate() {
            if ($(".venntooltip td").length !== 0) {
                var check = [];
                $(".venntooltip").find("tr").find("td").each(function () {
                    var add = $(this).attr("id").substr(5).split(',')
                    check = check.concat(add)

                })
                var curr = [];
                $("#genomeTable").find("td:visible").each(function () {
                    var add = $(this).attr("id")
                    curr = curr.concat(add)

                })
                if (check.some(elem => curr.includes(elem))) {
                    return false;
                } else {
                    return true;
                }

            } else {
                return true;
            }
        }
        if (wildcardgroup !== undefined && notDuplicate()) {
            var group = wildcardgroup ;

            if (selection.attr("id") == "countA") {
                addSample(group, filesetA);
                sampleCountA = sampleCountA + groupNum;
                $("#countA span").text("A: " + sampleCountA);
            } else if (selection.attr("id") == "countB") {
                addSample(group, filesetB);
                sampleCountB = sampleCountB + groupNum;
                $("#countB span").text("B: " + sampleCountB);
            } else if (selection.attr("id") == "countC") {
                addSample(group, filesetC);
                sampleCountC = sampleCountC + groupNum;
                $("#countC span").text("C: " + sampleCountC);
            }
        } else {

            new Noty({
                type: 'error',
                layout: 'center',
                text: "Please enter a valid wildcard pattern to find samples",
                theme: 'light',
                closeWith: ['button'],
            }).show();

        }

    });



    //remove sample if close button is clicked in tooltip
    $("#tooltipdiv").on('click', '.tableButton', function () {
        var ID = (this.id).substr(1);
        var tableID = `[id="table${ID}"]`;
        //remove from filesets
        var samp = $(tableID).text();
        console.log(samp);
        var indexA = filesetA.indexOf((this.hasAttribute('data-wildcard'))?[samp]:samp);
        var indexB = filesetB.indexOf((this.hasAttribute('data-wildcard'))?[samp]:samp);
        var indexC = filesetC.indexOf((this.hasAttribute('data-wildcard'))?[samp]:samp);
        if (indexA !== -1) filesetA.splice(indexA, 1);
        if (indexB !== -1) filesetB.splice(indexB, 1);
        if (indexC !== -1) filesetC.splice(indexC, 1);
        //remove from table
        $(tableID).remove();

        if (ID.includes(',')) {

            var arrID = ID.split(',');
            for (let i = 0; i < arrID.length; i++) {
                //make sample draggable
                $('#' + arrID[i]).draggable('option', 'disabled', false);
            }
            //decrement count
            if (this.id.charAt(0) == "A") {
                sampleCountA = sampleCountA - arrID.length;
                $("#countA span").text("A: " + sampleCountA);
            } else if (this.id.charAt(0) == "B") {
                sampleCountB = sampleCountB - arrID.length;
                $("#countB span").text("B: " + sampleCountB);
            } else {
                sampleCountC = sampleCountC - arrID.length;
                $("#countC span").text("C: " + sampleCountC);
            }
        } else {
            //make sample draggable
            $('#' + ID).draggable('option', 'disabled', false);
            //decrement count
            if (this.id.charAt(0) == "A") {
                sampleCountA--;
                $("#countA span").text("A: " + sampleCountA);
            } else if (this.id.charAt(0) == "B") {
                sampleCountB--;
                $("#countB span").text("B: " + sampleCountB);
            } else {
                sampleCountC--;
                $("#countC span").text("C: " + sampleCountC);
            }
        }
    });

    $(".venntooltip button").on('click', function () {
        if (this.id == "hideA") {
            $('#sampleA').hide();
        } else if (this.id == "hideB") {
            $('#sampleB').hide();
        } else if (this.id == "hideC") {
            $('#sampleC').hide();
        }
    });



    $('#clearSample').click(resetSamples);

    $('#clearOperations').click(resetVenn);


    $("#submit").click(function () {
        var files = circlesDisplayed();
        function hasSamples() {
            for (var x = 0; x < files.length; x++) {
                if (files[x] == "A") {
                    return filesetA.length;
                } else if (files[x] == "B") {
                    return filesetB.length;
                } else if (files[x] == "C") {
                    return filesetC.length;
                }
            }
        }
        getNotation();

        if (command && $("#filepath").val() && hasSamples()) {



            operations.setA = filesetA;
            operations.setB = filesetB;
            operations.setC = filesetC;

            operations.command = command;
            operations.instanceName = instance_name;
            operations.instanceID = instance_id;
            operations.threshold = $("#gv-tersect-threshold").val();
            //check file name ends with vcf
            if ($("#filepath").val().endsWith(".vcf")) {
                operations.filepath = $("#filepath").val();
            } else {
                operations.filepath = $("#filepath").val() + ".vcf";
            }



            $.post("/index/tersectQueries/generate", operations, function (data) {
                var loc = data.location;


                new Noty({
                    type: 'success',
                    layout: 'center',
                    text: " Virtual Genome VCF file downloaded to: " + loc,
                    //timeout: '5000',
                    theme: 'light',
                    closeWith: ['button'],
                }).show();


                queryPopulator('#queryMenu .gv-tersect-list tbody', operations.idToGet, '/index/tersectQueries')
            });
            //if conditions were not fulfilled, display warnings
        } else {
            if (!command) {
                new Noty({
                    type: 'error',
                    layout: 'center',
                    text: "Please select an area of the Venn Diagram!",
                    theme: 'light',
                    closeWith: ['button'],
                }).show();
            }
            if (!$("#filepath").val()) {
                new Noty({
                    type: 'error',
                    layout: 'center',
                    text: "Please give a file name for VCF download!",
                    theme: 'light',
                    closeWith: ['button'],
                }).show();
            }
            if (!hasSamples()) {

                files.forEach(function (elem) {
                    if (elem == "A") {
                        if (filesetA.length == 0) {
                            new Noty({
                                type: 'error',
                                layout: 'center',
                                text: "Please add samples to circle A!",
                                theme: 'light',
                                closeWith: ['button'],
                            }).show();
                        }
                    } else if (elem == "B") {
                        if (filesetB.length == 0) {
                            new Noty({
                                type: 'error',
                                layout: 'center',
                                text: "Please add samples to circle B!",
                                theme: 'light',
                                closeWith: ['button'],
                            }).show();
                        }
                    } else if (elem == "C") {
                        if (filesetC.length == 0) {
                            new Noty({
                                type: 'error',
                                layout: 'center',
                                text: "Please add samples to circle C!",
                                theme: 'light',
                                closeWith: ['button'],
                            }).show();
                        }
                    }
                })
            }
        }
    });
};
//resets venn to original appearance
function resetVenn() {
    area = [];

    customiseVenn()
}

function resetSamples() {
    filesetA = [];
    filesetB = [];
    filesetC = [];
    sampleCountA = 0;
    sampleCountB = 0;
    sampleCountC = 0;
    $("#countA span").text("A: " + sampleCountA);
    $("#countB span").text("B: " + sampleCountB);
    $("#countC span").text("C: " + sampleCountC);
    $('#genomeTable td').draggable('option', 'disabled', false);
    $('.venntooltip tbody tr:nth-child(n+2)').remove();

}

//function to add sample group to fileset array and tooltip
function addSample(input, fset, reload) {
    //var input_2 = typeof input == "object" ? input.join() : input;
    reload == true ? fset.push(input) : fset.push([input]);
    var set;
    if (fset == filesetA) {
        set = 'A';
    } else if (fset == filesetB) {
        set = 'B';
    } else {
        set = 'C';
    }
    new Noty({
        type: 'success',
        layout: 'topRight',
        text: input + ' has been added to: ' + set,
        timeout: '1500',
        theme: 'light',
    }).show();

    let wildcardHTMLTag = ""

    if(typeof input === 'string' && reload === true) {
        $("#genomeTable td").filter(function () {

            if ($(this).text() == input) {
                //disable drag on matching samples
                $(this).draggable('option', 'disabled', true);
                wildcardID.push(this.id);
            }
        });
    } else {
        input = (typeof input === 'object') ? input.join():input;
        wildcardHTMLTag = "data-wildcard";
        $("#genomeTable td").filter(function () {
            if ($(this).text().indexOf(input) == 0) {
                //disable drag on matching samples
                $(this).draggable('option', 'disabled', true);
                wildcardID.push(this.id);
            }
        });
    }

    //number of samples in wildcard
    //groupNum = $('#genomeTable td:visible').length;
    groupNum = wildcardID.length;
    $('#sample' + set + ' > tbody:last-child').append(`<tr><td id="table${wildcardID}"><button class="tableButton btn btn-default" id="${set + wildcardID}" name="${groupNum}" ${wildcardHTMLTag}>${input}<i class="fa fa-trash"></i></button></td></tr>`);
    wildcardID = [];

}



function customiseVenn() {
    var colours = ["#D81B60", "#1E88E5", "#FFC107"];
    d3.selectAll("#venn .venn-circle path")
        .style("fill", function (d, i) { return colours[i]; })
        .style("fill-opacity", .7)
        .style("stroke", "none");

    d3.selectAll("#venn .venn-intersection path")
        .style("fill-opacity", 0)

    d3.select("[data-venn-sets=A_B_C]").select("path")
        .style("stroke", "");

    d3.selectAll("#venn .venn-circle text")
        .style("fill", "#fff")
        .style("font-size", "24")
        .style("font-weight", "200");
    getNotation();
    commandParse(command,"#gv-tersect-advancedInput");

}

//returns array of circles not displayed
function newCircles() {
    var newCircles = [...circles];
    var currentCircles = circlesDisplayed();
    currentCircles.forEach(function (elem) {
        newCircles = newCircles.filter(circ => circ != elem)
    });
    return newCircles;
}

function circlesDisplayed() {
    var displayed = [];
    sets.forEach(function (elem) {
        if (elem.sets.length == 1) {
            displayed.push(elem.sets);

        }
    });
    return displayed;
}


function getIntersect() {
    var intCircle = [];
    d3.selectAll(".venn-intersection").each(function (d, i) {
        var sel = d3.select(this).attr("data-venn-sets");
        var selArray = sel.replace(/_/g, ",").split(",");
        //if intersection is already highlighted, ignore
        if (!area.some(elem => elem.join().includes(selArray) && elem.length == selArray.length)) {
            var item = "[data-venn-sets=" + sel + "]"
            intCircle.push(item);
        }
    })

    //keeps the entire intersect green/selected if it has already been selected
    if (intCircle.length < 4) {
        intCircle = intCircle.filter(elem => !elem.includes("A_B_C"));
        if (area.some(elem => elem.length == 2)) {
            d3.select("[data-venn-sets=A_B_C]").select("path")
                .style("fill", area.some(elem => elem.length == 3) ? "#fff" : "#004D40")
                .style("fill-opacity", 1)
        }
    }

    return intCircle;
}

//draws venn again
function redraw() {
    var div = d3.select("#venn");
    if (circlesDisplayed().length > 1) {
        div.datum(sets).call(chart
            .width(400)
            .height(400)
        );
    } else {
        div.datum(sets).call(chart
            .width(300)
            .height(300)
        );
    }

    resetVenn();

    div.selectAll('g')
        .on('mouseover', function (d, i) {
            venn.sortAreas(div, d);

            if (d.sets.length > 1 && !area.some(elem => elem.join().includes(d.sets) && elem.length == d.sets.length)) {
                d3.select(this).select("path")
                    .style("fill", "#004D40")
                    .style("fill-opacity", 1);

            } else if (!area.includes(d.sets)) {
                d3.select(this).select("text")
                    .style("font-size", "36px");

                var int = getIntersect();
                int = int.filter(elem => elem.includes(d.sets));
                int.forEach(function (elem) {
                    d3.select(elem).select("path")
                        .style("fill-opacity", .9)
                        .style("fill", "#fff")
                });
            }
            DragDrop.droppable = d.sets;
        })

        // Clear the target from the DragDrop on mouseOut.
        .on('mouseout', function (d, i) {
            DragDrop.droppable = null;
            if (d.sets.length > 1 && !area.some(elem => elem.join().includes(d.sets) && elem.length == d.sets.length)) {
                d3.select(this).select("path")
                    .style("fill-opacity", 0);

            } else if (!area.includes(d.sets)) {
                d3.select(this).select("text")
                    .style("font-size", "24px");

                var int = getIntersect();
                //filter for intersections that are part of the circle
                int = int.filter(elem => elem.includes(d.sets));
                int.forEach(function (elem) {
                    d3.select(elem).select("path")
                        .style("fill-opacity", 0)
                });
            }

        })

        .on('contextmenu', function (d, i) {
            d3.event.preventDefault();
            if (d.sets.length == 1) {
                if (d.sets[0] == 'A') {
                    $('#sampleA').show();
                    tooltipA.transition().duration(400).style("opacity", .9);
                    tooltipA.style("left", (d3.event.pageX - 250) + "px")
                        .style("top", (d3.event.pageY - 100) + "px");
                } else if (d.sets[0] == 'B') {
                    $('#sampleB').show();
                    tooltipB.transition().duration(400).style("opacity", .9);
                    tooltipB.style("left", (d3.event.pageX - 250) + "px")
                        .style("top", (d3.event.pageY - 100) + "px");
                } else if (d.sets[0] == 'C') {
                    $('#sampleC').show();
                    tooltipC.transition().duration(400).style("opacity", .9);
                    tooltipC.style("left", (d3.event.pageX - 250) + "px")
                        .style("top", (d3.event.pageY - 100) + "px");
                }
            }
        })

        .on('click', function (d, i) {

            var selection = d3.select(this);


            if (!area.includes(d.sets)) {
                area.push(d.sets);

                //to remove middle if intersect is already selected
                if ((area.some(elem => elem.length == 2) && d.sets.length == 3)) {

                    d3.select(this).select("path")
                        .style("fill", "#fff")
                        .style("fill-opacity", 1)
                    //remove middle if intersect is selected
                } else if (area.some(elem => elem.length == 3) && d.sets.length == 2) {

                    d3.select("[data-venn-sets=A_B_C]").select("path")
                        .style("fill", "#fff")
                        .style("fill-opacity", 1)
                } else {
                    selection.select("text")
                        .style("fill", "#004D40")
                        .style("font-size", "46px");
                    //remove highlight from intersects
                    if (d.sets.length == 1) {
                        var int = getIntersect();
                        //is this line necessary?
                        int = int.filter(elem => elem.includes(d.sets));
                        int.forEach(function (elem) {
                            d3.select(elem).select("path")
                                .style("fill-opacity", 0)
                        });
                    }
                }
            } else {

                //remove set from array if clicked again
                area = area.filter(function (elem) {
                    if (elem.length == d.sets.length) {
                        return !elem.join().includes(d.sets);
                    } else {
                        return elem;
                    }
                });
                //remove highlight from centre intersect if other intersect is deselected
                if (area.some(elem => elem.length == 3) && !area.some(elem => elem.length == 2)) {
                    d3.select("[data-venn-sets=A_B_C]").select("path")
                        .style("fill", "#004D40")
                }
                //restore colour and font size
                selection.select("path")
                    .style("fill-opacity", d.sets.length == 1 ? .7 : 0)
                selection.select("text")
                    .style("fill", "#fff")
                    .style("font-size", "24px");
                var setName = d.sets.toString().replace(/,/g, " &cap; ");
                new Noty({
                    type: 'success',
                    layout: 'topRight',
                    text: setName + ' has been deselected. ',
                    timeout: '2000',
                    theme: 'light',
                }).show();
            }
            getNotation();
            commandParse(command,"#gv-tersect-advancedInput");
        });
}

function getNotation() {
    var circleD = circlesDisplayed();
    var areaL = area.length;
    var single = area.filter(elem => elem.length == 1);
    var double = area.filter(elem => elem.length == 2);
    switch (circleD.length) {
        case 0:
            $('#notation').html("&empty;");
            command = null;
            break;
        case 1:
            //single circle
            $('#notation').html(circleD[0][0]);
            command = circleD[0][0];
            break;
        case 2:
            //2 set circle
            switch (areaL) {
                case 0:
                    $('#notation').html("&empty;");
                    command = null;
                    break;
                case 1:
                    switch (area[0].length) {
                        case 1:
                            var other = circleD.filter(elem => elem !== area[0]);
                            $('#notation').html(area[0] + " &minus; " + other[0]);
                            command = area[0][0] + "\\" + other[0];
                            break;
                        case 2:
                            $("#notation").html(area[0][0] + " &cap; " + area[0][1]);
                            command = area[0][0] + " & " + area[0][1];
                            break;
                    }
                    break;
                case 2:
                    switch (area.every(elem => elem.length == 1)) {
                        case true:
                            $("#notation").html(area[0][0] + " &#8710; " + area[1][0]);
                            command = area[0][0] + " ^ " + area[1][0];
                            break;
                        case false:
                            $("#notation").html(single[0][0]);
                            command = single[0][0];
                            break;
                    }
                    break;
                case 3:
                    $("#notation").html(single[0][0] + " &cup; " + single[1][0]);
                    command = single[0][0] + " | " + single[1][0];
                    break;
            }
            break;
        case 3:
            //3 set circle
            var intersect = [['A', 'B'], ['A', 'C'], ['B', 'C']];
            switch (areaL) {
                case 0:
                    $('#notation').html("&empty;");
                    command = null;
                    break;
                case 1:
                    switch (area[0].length) {
                        case 1:
                            var other = circleD.filter(elem => elem !== area[0]);
                            $('#notation').html(area[0] + " &minus; " + other[0] + " &minus; " + other[1]);
                            command = area[0][0] + " \\ " + other[0] + " \\ " + other[1]
                            break;
                        case 2:
                            $('#notation').html(area[0][0] + " &cap; " + area[0][1]);
                            command = area[0][0] + " & " + area[0][1];
                            break;
                        case 3:
                            $('#notation').html(circleD[0] + " &cap; " + circleD[1] + " &cap; " + circleD[2]);
                            command = circleD[0] + " & " + circleD[1] + " & " + circleD[2];
                            break;
                    }
                    break;
                case 2:
                    switch (area.every(elem => elem.length == 1)) {
                        case true:
                            //W2
                            var other = circleD.filter(elem => !area.join().includes(elem));
                            $('#notation').html("(" + area[0] + " &#8710; " + area[1] + ") &minus; " + other[0]);
                            command = "(" + area[0][0] + " ^ " + area[1][0] + ") \\ " + other[0];
                            break;
                        case false:
                            switch (area.every(elem => elem.length == 1 || elem.length == 3)) {
                                case true:
                                    //WY
                                    var other = circleD.filter(elem => !single.join().includes(elem));
                                    $('#notation').html("(" + single[0] + " &minus; " + other[0] + " &minus; " + other[1] + ") &cup; ("
                                        + circleD[0] + " & " + circleD[1] + " & " + circleD[2] + ")");
                                    command = "(" + single[0][0] + " \\ " + other[0] + " \\ " + other[1] + ") | ("
                                        + circleD[0] + " & " + circleD[1] + " & " + circleD[2] + ")";
                                    break;
                                case false:
                                    switch (area.every(elem => elem.length == 2)) {
                                        case true:
                                            //X2
                                            var common = area[0].filter(elem => area[1].includes(elem));
                                            var other = circleD.filter(elem => !common.includes(elem));
                                            $('#notation').html("(" + other[0] + " &cup; " + other[1] + ") &cap; " + common[0]);
                                            command = "(" + other[0] + " | " + other[1] + ") & " + common[0][0];
                                            break;
                                        case false:
                                            switch (area.every(elem => elem.length == 2 || elem.length == 3)) {
                                                case true:
                                                    //Z
                                                    var int = area.filter(elem => elem.length == 2);
                                                    var uns = circleD.filter(elem => !int.join().includes(elem));
                                                    $('#notation').html("(" + int[0][0] + " &cap; " + int[0][1] + ") &minus; " + uns[0]);
                                                    command = "(" + int[0][0] + " & " + int[0][1] + ") \\ " + uns[0];
                                                    break;
                                                case false:
                                                    //WX
                                                    switch (double.join().includes(single)) {
                                                        case true:
                                                            var uns = circleD.filter(elem => !double.join().includes(elem));
                                                            $('#notation').html("(" + single[0] + " &minus; " + uns[0] + ") &cup; (" + double[0][0] + " &cap; " + double[0][1] + ")");
                                                            command = "(" + single[0][0] + " \\ " + uns[0] + ") | (" + double[0][0] + " & " + double[0][1] + ")";
                                                            break;
                                                        case false:
                                                            $('#notation').html("(" + single[0] + " &minus; " + double[0][0] + " &minus; " + double[0][1] + ") &cup; (" + double[0][0] + " &cap; " + double[0][1] + ")");
                                                            command = "(" + single[0][0] + " \\ " + double[0][0] + " \\ " + double[0][1] + ") | (" + double[0][0] + " & " + double[0][1] + ")";
                                                            break;
                                                    }
                                                    break;
                                            }
                                            break;
                                    }
                                    break;
                            }
                            break;
                    }
                    break;
                case 3:
                    switch (area.every(elem => elem.length == 1)) {
                        case true:
                            //W3
                            $('#notation').html(area[0] + " &#8710; " + area[1] + " &#8710; " + area[2]);
                            command = area[0][0] + " ^ " + area[1][0] + " ^ " + area[2][0];
                            break;
                        case false:
                            switch (area.every(elem => elem.length == 2)) {
                                case true:
                                    //X3
                                    $('#notation').html("(" + area[0][0] + " &cap; " + area[0][1] + ") &cup; (" + area[1][0] + " &cap; " + area[1][1] + ") &cup; ("
                                        + area[2][0] + " &cap; " + area[2][1] + ")");
                                    command = "(" + area[0][0] + " & " + area[0][1] + ") | (" + area[1][0] + " & " + area[1][1] + ") | ("
                                        + area[2][0] + " & " + area[2][1] + ")";
                                    break;
                                case false:
                                    switch (area.every(elem => elem.length == 1 || elem.length == 3)) {
                                        case true:
                                            //W2Y
                                            var other = circleD.filter(elem => !single.join().includes(elem));
                                            $('#notation').html("( (" + single[0][0] + " &#8710; " + single[1][0] + ") &minus; " + other[0]
                                                + " ) &cup; (" + circleD[0] + " &cap; " + circleD[1] + " &cap; " + circleD[2] + ")");
                                            command = "( (" + single[0][0] + " ^ " + single[1][0] + ") \\ " + other[0]
                                                + " ) | (" + circleD[0] + " & " + circleD[1] + " & " + circleD[2] + ")";
                                            break;
                                        case false:
                                            switch (area.every(elem => elem.length == 2 || elem.length == 3)) {
                                                case true:
                                                    //Z2
                                                    $('#notation').html("(" + double[0][0] + " &cap; " + double[0][1] + ") &#8710; (" + double[1][0] +
                                                        " &cap; " + double[1][1] + ")");
                                                    command = "(" + double[0][0] + " & " + double[0][1] + ") ^ (" + double[1][0] +
                                                        " & " + double[1][1] + ")";
                                                    break;
                                                case false:
                                                    switch (area.filter(elem => elem.length == 1).length) {
                                                        case 1:
                                                            switch (area.some(elem => elem.length == 3)) {
                                                                case true:
                                                                    //WZ
                                                                    switch (double.join().includes(single)) {

                                                                        case true:
                                                                            var uns = circleD.filter(elem => !double.join().includes(elem));
                                                                            $('#notation').html(single[0] + " &minus; " + uns[0]);
                                                                            command = single[0][0] + " \\ " + uns[0]
                                                                            break;
                                                                        case false:
                                                                            $('#notation').html("(" + single[0] + " &minus; " + double[0][0] + " &minus; " + double[0][1] +
                                                                                ") &cup; ( (" + double[0][0] + " &cap; " + double[0][1] + ") &minus; " + single[0] + ")");
                                                                            command = "(" + single[0][0] + " \\ " + double[0][0] + " \\ " + double[0][1] +
                                                                                ") | ( (" + double[0][0] + " & " + double[0][1] + ") \\ " + single[0][0] + ")";
                                                                            break;

                                                                    }
                                                                    break;
                                                                case false:
                                                                    //WX2
                                                                    switch (double.every(elem => elem.join().includes(single))) {
                                                                        case true:
                                                                            $('#notation').html(single[0]);
                                                                            command = single[0][0];
                                                                            break;
                                                                        case false:
                                                                            var unq = double.filter(elem => !elem.join().includes(single));
                                                                            var non = double.filter(elem => elem.join().includes(single));
                                                                            var uni = circleD.filter(elem => !non.join().includes(elem));
                                                                            $('#notation').html("(" + single[0] + " &minus; " + uni[0] + ") &cup; (" +
                                                                                unq[0][0] + " &cap; " + unq[0][1] + ")");
                                                                            command = "(" + single[0][0] + " \\ " + uni[0] + ") | (" +
                                                                                unq[0][0] + " & " + unq[0][1] + ")"
                                                                            break;
                                                                    }

                                                                    break;
                                                            }
                                                            break;
                                                        case 2:
                                                            //W2X
                                                            var uns = circleD.filter(elem => !single2.join().includes(elem));
                                                            $('#notation').html("( (" + single[0] + " &#8710; " + single[1] + ") &minus; " +
                                                                uns[0] + ") &cup; (" + double[0][0] + " &cap; " + double[0][1] + ")");
                                                            command = "( (" + single[0][0] + " ^ " + single[1][0] + ") \\" +
                                                                uns[0] + ") | (" + double[0][0] + " & " + double[0][1] + ")";
                                                            break;

                                                    }
                                            }
                                            break;
                                    }
                                    break;
                            }
                            break;
                    }
                    break;
                case 4:
                    switch (area.some(elem => elem.length == 2)) {
                        case true:
                            switch (area.some(elem => elem.length == 3)) {
                                case true:
                                    switch (double.length) {
                                        case 1:
                                            //W2Z
                                            var uns = circleD.filter(elem => !single.join().includes(elem));
                                            switch (single.every(elem => double.join().includes(elem))) {
                                                case true:
                                                    $('#notation').html("(" + single[0] + " &cup; " + single[1] + ") &minus; " + uns[0]);
                                                    command = "(" + single[0][0] + " | " + single[1][0] + ") \\ " + uns[0];

                                                    break;
                                                case false:
                                                    var s1 = single.filter(elem => double.join().includes(elem));
                                                    var s2 = single.filter(elem => !double.join().includes(elem));
                                                    $('#notation').html(s1[0] + " &#8710; (" + s2[0] + " &minus; " + uns[0] + ")");
                                                    command = s1[0][0] + " ^ (" + s2[0][0] + " \\ " + uns[0] + ")"
                                                    break;
                                            }

                                            break;
                                        case 2:
                                            //WZ2
                                            switch (double.every(elem => elem.join().includes(single[0]))) {
                                                case true:
                                                    $('#notation').html(single[0] + " &minus; (" + circleD[0] + " &cap; " + circleD[1] + " &cap; " + circleD[2] + ")");
                                                    command = single[0][0] + " \\ (" + circleD[0] + " & " + circleD[1] + " & " + circleD[2] + ")";
                                                    break;
                                                case false:
                                                    var unec = double.filter(elem => !elem.join().includes(single));
                                                    var other = intersect.filter(elem => !double.join().includes(elem));
                                                    $('#notation').html("(" + single[0] + " &cup; (" + unec[0][0] + " &cap; " + unec[0][1] + ")  ) &minus; (" + other[0][0] + " &cap; " + other[0][1] + ")");
                                                    command = "(" + single[0][0] + " | (" + unec[0][0] + " & " + unec[0][1] + ")  ) \\ (" + other[0][0] + " & " + other[0][1] + ")";
                                                    break;
                                            }
                                            break;
                                        case 3:
                                            //Z3
                                            $('#notation').html("(" + double[0][0] + " &cap; " + double[0][1] + ") &#8710; (" + double[1][0] + " &cap; " + double[1][1] +
                                                ") &#8710; (" + double[2][0] + " &cap; " + double[2][1] + ")");
                                            command = "(" + double[0][0] + " & " + double[0][1] + ") ^ (" + double[1][0] + " & " + double[1][1] +
                                                ") ^ (" + double[2][0] + " & " + double[2][1] + ")";
                                            //command = $('#notation').html().replace(/&cup;/g, "|").replace(/&cap;/g, "&").replace(/&minus;/g, "\\").replace(/&#8710;/g, "^");
                                            break;
                                    }
                                    break;
                                case false:
                                    switch (double.length) {
                                        case 1:
                                            //W3X
                                            $('#notation').html("(" + circleD[0] + " &#8710; " + circleD[1] + " &#8710; " + circleD[2] +
                                                ") &cup; (" + double[0][0] + " &cap; " + double[0][1] + ")");
                                            command = "(" + circleD[0] + " ^ " + circleD[1] + " ^ " + circleD[2] +
                                                ") | (" + double[0][0] + " & " + double[0][1] + ")";
                                            break;
                                        case 2:
                                            //W2X2
                                            switch (single.some(elem => double[0].join().includes(elem) && double[1].join().includes(elem))) {
                                                case true:
                                                    var uns = circleD.filter(elem => !single.join().includes(elem));
                                                    var s1 = single.filter(elem => !double[0].join().includes(elem) || !double[1].join().includes(elem));
                                                    var s2 = single.filter(elem => !s1.includes(elem));
                                                    $('#notation').html("(" + s1[0] + " &minus; " + uns[0] + ") &cup; " + s2[0]);
                                                    command = "(" + s1[0][0] + " \\ " + uns[0] + ") | " + s2[0][0];
                                                    break;
                                                case false:
                                                    $('#notation').html("(" + single[0] + " &#8710; " + single[1] + ") &cup; (" + double[0][0] + " &cap; " + double[0][1] + ")");
                                                    command = "(" + single[0][0] + " ^ " + single[1][0] + ") | (" + double[0][0] + " & " + double[0][1] + ")";
                                                    break;
                                            }

                                            break;
                                        case 3:
                                            //WX3
                                            var unq = double.filter(elem => !elem.join().includes(single));
                                            $('#notation').html(single[0] + " &cup; (" + unq[0][0] + " &cap; " + unq[0][1] + ")");
                                            command = single[0][0] + " | (" + unq[0][0] + " & " + unq[0][1] + ")";
                                            break;
                                    }
                                    break;
                            }
                            break;
                        case false:
                            //W3Y
                            $('#notation').html("(" + circleD[0] + " &#8710; " + circleD[1] + " &#8710; " + circleD[2] +
                                ") &cup; (" + circleD[0] + " &cap; " + circleD[1] + " &cap; " + circleD[2] +
                                ")");
                            command = "(" + circleD[0] + " ^ " + circleD[1] + " ^ " + circleD[2] +
                                ") | (" + circleD[0] + " & " + circleD[1] + " & " + circleD[2] +
                                ")"
                            break;
                    }
                    break;
                case 5:
                    switch (area.some(elem => elem.length == 3)) {
                        case true:
                            switch (double.length) {
                                case 1:
                                    //W3Z
                                    var other = circleD.filter(elem => !double.join().includes(elem));
                                    $('#notation').html("(" + double[0][0] + " &cup; " + double[0][1] + ") &#8710; " + other[0]);
                                    command = "(" + double[0][0] + " | " + double[0][1] + ") ^ " + other[0];
                                    break;
                                case 2:
                                    //W2Z2
                                    switch (single.some(elem => double[0].join().includes(elem) && double[1].join().includes(elem))) {
                                        case true:
                                            var unq = intersect.filter(elem => !double.join().includes(elem));
                                            $('#notation').html("(" + single[0] + " &cup; " + single[1] + ") &minus; (" + unq[0][0] + " &cap; " + unq[0][1] + ")");
                                            command = "(" + single[0][0] + " | " + single[1][0] + ") \\ (" + unq[0][0] + " & " + unq[0][1] + ")";
                                            break;
                                        case false:
                                            $('#notation').html(single[0] + " &#8710; " + single[1]);
                                            command = single[0][0] + " ^ " + single[1][0];
                                            break;
                                    }
                                    break;
                                case 3:
                                    //WZ3
                                    var others = double.filter(elem => !elem.join().includes(single));
                                    $('#notation').html("(" + single[0] + " &cup;  (" + others[0][0] + " &cap; " + others[0][1] + ") ) &minus; (" + circleD[0] + " &cap; " + circleD[1] + " &cap; " + circleD[2] +
                                        ")");
                                    command = "(" + single[0][0] + " |  (" + others[0][0] + " & " + others[0][1] + ") ) \\ (" + circleD[0] + " & " + circleD[1] + " & " + circleD[2] +
                                        ")";
                                    //  $('#notation').append("(" + single[0] + " &minus;  (" + others[0][0] + " &cap; " + others[0][1] + ") ) &cup; ( (" + others[0][0] + " &cap; " + others[0][1] + ") &minus; " + single[0] +
                                    //    ")");
                                    break;
                            }
                            break;
                        case false:
                            switch (area.filter(elem => elem.length == 2).length) {
                                case 2:
                                    //W3X2
                                    var other = intersect.filter(elem => !double.join().includes(elem));
                                    var singCirc = circleD.filter(elem => !other.join().includes(elem));
                                    $('#notation').html("(" + other[0][0] + " &#8710; " + other[0][1] + ") &cup; " + singCirc[0]);
                                    command = "(" + other[0][0] + " ^ " + other[0][1] + ") | " + singCirc[0];
                                    break;
                                case 3:
                                    //W2X3
                                    $('#notation').html(single[0] + " &cup; " + single[1]);
                                    command = single[0][0] + " | " + single[1][0];
                                    break;
                            }
                            break;
                    }
                    break;
                case 6:
                    switch (area.some(elem => elem.length == 3)) {
                        case true:
                            switch (area.filter(elem => elem.length == 2).length) {
                                case 2:
                                    //WW3Z2
                                    var other = intersect.filter(elem => !double.join().includes(elem));
                                    $('#notation').html("(" + circleD[0] + " &cup; " + circleD[1] + " &cup; " + circleD[2] +
                                        ") &minus; (" + other[0][0] + " &cap; " + other[0][1] + ")");
                                    command = "(" + circleD[0] + " | " + circleD[1] + " | " + circleD[2] +
                                        ") \\ (" + other[0][0] + " & " + other[0][1] + ")";
                                    break;
                                case 3:
                                    //W2Z3
                                    $('#notation').html("(" + single[0] + " &cup; " + single[1] + ") &minus; (" + circleD[0] +
                                        " &cap; " + circleD[1] + " &cap; " + circleD[2] + ")");
                                    command = "(" + single[0][0] + " | " + single[1][0] + ") \\ (" + circleD[0] +
                                        " & " + circleD[1] + " & " + circleD[2] + ")";
                                    break;
                            }
                            break;
                        case false:
                            //W3X3
                            $('#notation').html(circleD[0] + " &cup; " + circleD[1] + " &cup; " + circleD[2]);
                            command = circleD[0] + " |" + circleD[1] + " | " + circleD[2];
                            break;
                    }

                    break;
                case 7:
                    //W3Z3
                    $('#notation').html("(" + circleD[0] + " &cup; " + circleD[1] + " &cup; " + circleD[2] +
                        ") &minus; (" + circleD[0] + " &cap; " + circleD[1] + " &cap; " + circleD[2] +
                        ")");
                    command = "(" + circleD[0] + " | " + circleD[1] + " | " + circleD[2] +
                        ") \\ (" + circleD[0] + " & " + circleD[1] + " & " + circleD[2] +
                        ")";
                    break;

            }
            break;
    }
}

function commandParse(command,html_id){
    if(command != null) {
        var mapObj = {
            A: "u" +"('" + filesetA.map(function(x){
                if(typeof x == 'object'){
                    return `(${x[0]})*`
                } else {
                    return x
                }
            }).join("','") + "')",
            B: "u" +"('" + filesetB.map(function(x){
                if(typeof x == 'object'){
                    return `(${x[0]})*`
                } else {
                    return x
                }
            }).join("','") + "')",
            C: "u" +"('" + filesetC.map(function(x){
                if(typeof x == 'object'){
                    return `(${x[0]})*`
                } else {
                    return x
                }
            }).join("','") + "')",
        };
        var fullCommand = command.replace(/A|B|C/g, function (matched) {
            return mapObj[matched];
        });
        console.log(fullCommand)
    }
    $(html_id).text(fullCommand)
}

function loadFromTemplate(setArray){
    resetSamples();
    resetVenn();
    for(var sample of setArray[0]){
        addSample(sample,filesetA,true);
        sampleCountA = sampleCountA + groupNum;
        $("#countA span").text("A: " + sampleCountA);
    }
    for(var sample of setArray[1]){
        addSample(sample,filesetB,true);
        sampleCountB = sampleCountB + groupNum;
        $("#countB span").text("B: " + sampleCountB);
    }
    for(var sample of setArray[2]){
        addSample(sample,filesetC,true);
        sampleCountC = sampleCountC + groupNum;
        $("#countC span").text("C: " + sampleCountC);
    }
}

Genoverse.Plugins.tersectIntegration.requires = 'controlPanel';

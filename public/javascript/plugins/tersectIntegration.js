Genoverse.Plugins.tersectIntegration = function () {
    this.controls.push({
        icon: '<i class="fa fa-override"></i>',
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
                    tersectMenu = makeTersectMenu();
                    $('#tsi-file').on('click', function () {
                        tersectIndexMenu = $(this).data("tersectIndexMenu");
                        console.log("index menu is worth:" + tersectIndexMenu);
                        if(tersectIndexMenu){
                            tersectIndexMenu.show();

                        } else {
                            tersectIndexMenu = makeTersectIndexMenu().attr("id","tersectIndexMenu");
                            //$('#tsi-locate-index',tersectIndexMenu).on('click',indexPopulator('/index/tersectUpload'));
                            $('#tsi-locate-index',tersectIndexMenu).on('click',function () {
                                tersectFileMenu = $(this).data("tersectFileMenu");
                                if(tersectFileMenu){
                                    tersectFileMenu.show();
                                } else {
                                    tersectFileMenu = makeTersectFileMenu().attr("id","tersectFileMenu");
                                    $('#tsi-locate-index',tersectIndexMenu).on('click',indexPopulator(".gv-tersect-index-list tbody","/index/tersectUpload"))

                                    $(this).data("tersectFileMenu",tersectFileMenu);
                                }
                            });
                            $('#generate-new-button',tersectIndexMenu).on('click',function () {
                                indexGenerationMenu = $(this).data("indexGenerationMenu");
                                if(indexGenerationMenu){
                                    indexGenerationMenu.show();
                                } else {
                                    indexGenerationMenu = makeIndexGenerationMenu().attr("id","indexGenerationMenu");

                                    $(this).data("indexGenerationMenu", indexGenerationMenu);
                                }
                            });

                            $(this).data("tersectIndexMenu",tersectIndexMenu);
                        }
                    });
                    $('#saved-queries').on('click', function () {
                        //$(".gv-tersect-integration-file-menu").remove();
                        //tersectFileMenu = makeTersectFileMenu();
                        if(queryMenu){
                            queryMenu.show();
                        } else {
                            queryMenu = makeQueryMenu();
                        }

                    });
                    $('#save-query').on('click', function () {
                        $("#save-status").removeClass("fa-arrow-circle-right");
                        $("#save-status").addClass("fa-spin fa-spinner");
                        setTimeout(function(){
                            $("#save-status").removeClass("fa-spin fa-spinner");
                            $("#save-status").addClass("fa-arrow-circle-right")
                        },3000)
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
                    'Tersect: File Selection:': '',
                    '<span><a class="gv-tersect-integration-text gv-tersect-integration-input gv-tersect-integration-select-button" id="tsi-file">TSI File <i class="fa fa-arrow-circle-right"></i></a></span></br> \
                        <input type="text" id="searchBox" placeholder="Search for samples..."><span style="display:inline-block; width: 5px;"></span><button id="wildbutton" type="submit">Add Group</button> \
                        <label for="A">File set A</label><input type="radio" name="fileset" id="A" value="File A"><span style="display:inline-block; width: 5px;"></span><label for="B">File set B</label><input type="radio" name="fileset" id="B" value="File B"> \
                        <div id="gv-tersect-gui-container"><table id="genomeTable"></table></div> \
                        <div><span class="gv-tersect-integration-span" id="clearFile"><a class="gv-tersect-integration-text ">Clear Files <i class="fa fa-arrow-circle-right"></i></a></span> <span class="gv-tersect-integration-span" id="clearOperations"><a class="gv-tersect-integration-text">Clear Operations <i class="fa fa-arrow-circle-right"></i></a></span></div> \
                        <div><span class="gv-tersect-integration-span" id="save-query"><a class="gv-tersect-integration-text ">Save Query <i id="save-status" class="fa fa-arrow-circle-right"></i></a></span> <span class="gv-tersect-integration-span" id="saved-queries"><a class="gv-tersect-integration-text">Saved Queries <i class="fa fa-arrow-circle-right"></i></a></span></div> \
                        <div><input type="text" id="filepath" />&nbsp;&nbsp;<span><a class="gv-tersect-integration-text" id="submit">Submit <i class="fa fa-arrow-circle-right"></i></a></span></div>\
                        <div id="tooltipdiv">\
                            <table id="sampleA" class="venntooltip">\
                                <tr>\
                                    <th><button id="hideA">&times;</button> Samples in A </th>\
                                </tr>\
                            <tr id="hereA"></tr>\
                            </table>\
                            <table id="sampleB" class="venntooltip">\
                                <tr>\
                                    <th><button id="hideB">&times;</button> Samples in B</th>\
                                </tr>\
                            <tr id="hereB"></tr></table> </div>':'<div id="venn"></div>',

                }).addClass('gv-tersect-integration-menu');
                vennInit();

                return tersectMenu;
            }

            function makeTersectIndexMenu() {
                var indexMenu = browser.makeMenu({
                    '<div>Choose Tersect Index File:</div>':'',
                    '<table class="gv-tersect-integration-text gv-tersect-index-list"><thead><tr><td>Name</td><td>Instance</td><td>Local?</td><td>&emsp;&emsp;&emsp;</td></tr></thead><tbody></tbody></table>':'',
                    '<span class="gv-tersect-integration-span" id="tsi-locate-index"><a class="gv-tersect-integration-text">Locate TSI Index <i class="fa fa-arrow-circle-right"></i></a></span>':'',
                    '<span class="gv-tersect-integration-span" id="generate-new-button"><a class="gv-tersect-integration-text">Generate New Index <i class="fa fa-arrow-circle-right"></i></a></span>':''
                }).addClass('gv-tersect-integration-file-menu');
                return indexMenu;
            }

            function makeIndexGenerationMenu() {
                var generationMenu = browser.makeMenu({
                    '<div>Generate A New Tersect Index File:</div>':'',
                    '<div class="gv-tersect-dropzone"><a id="select-vcf">Select</a> Or Drop Files Here</div><input class="gv-tersect-integration-input gv-tersect-file-input" type="file" id="vcf-file-chooser" name="vcf file chooser" multiple>':'',
                    '':'',
                    '<span class="gv-tersect-integration-span" id="submit-new-button"><a class="gv-tersect-integration-text">Generate New Index <i class="fa fa-arrow-circle-right"></i></a></span>':''
                }).addClass('gv-tersect-integration-file-menu');
                vcfUploader(generationMenu,'#submit-new-button',"#vcf-file-chooser","#select-vcf","vcf","/index/vcfUpload")
                return generationMenu;
            }

            function makeTersectFileMenu() {
                var fileMenu = browser.makeMenu({
                    '<div>Choose Tersect Index Files:</div>':'',
                    '<div id="names" class="gv-tersect-integration-text">Local File Selection Here</div>':'<div class="gv-tersect-integration-text">Remote File Selection Here</div> <div class="gv-tersect-integration-text">(FTP etc.)</div>',
                    '<input class="gv-tersect-integration-input gv-tersect-file-input" type="file" id="local-file-chooser" name="local file chooser" multiple><div class="progressbar-border"> <div id="local-file-progress" class="progressbar-fill"></div></div>':'<input class="gv-tersect-integration-input" type="file" id="remote-file-chooser" name="remote file chooser" multiple>',
                    '<span id="tsi-submit-local" class="gv-tersect-integration-span"><a id="tsi-submit-local-text" class="gv-tersect-integration-text">Submit <i class="fa fa-arrow-circle-right"></i></a></span>':'<span class="gv-tersect-integration-span" id="tsi-submit-remote"><a class="gv-tersect-integration-text">Submit <i class="fa fa-arrow-circle-right"></i></a></span>',
                    '<span class="gv-tersect-integration-span" id="generate-new-button"><a class="gv-tersect-integration-text">Generate New Index <i class="fa fa-arrow-circle-right"></i></a></span>':''
                }).addClass('gv-tersect-integration-file-menu');
                $('#tsi-submit-local',fileMenu).on('click',function(){fileUploader(fileMenu,"#tsi-submit-local-text","#local-file-progress","#local-file-chooser","tsi", ".gv-tersect-index-list tbody","/index/tersectUpload/new")});
                return fileMenu;
            }


            function makeQueryMenu() {
                var geneMenu = browser.makeMenu({
                    '<div>Choose Query</div>':'',
                    '<div id="names" class="gv-tersect-integration-text">Demo</div><div>Query List Here</div>':'',
                }).addClass('gv-tersect-integration-file-menu');
                console.log("FileRunAgain");
                return geneMenu;
            }



        }});
};
function setScrollBar() {
    $('#pos').css({"height": "500px"});
    $('#names').css({"height": "500px"});
    $('#pos').css({"overflow-y": "scroll"});
    $('#names').css({"overflow-y": "hidden"});
    $('#pos').on('scroll', function () {
        $('#names').scrollTop($(this).scrollTop());
    });
}


function removeScrollBar() {
    $('#pos').css({"height": "auto"});
    $('#names').css({"height": "auto"});
    $('#pos').css({"overflow-y": "hidden"});
    $('#names').css({"overflow-y": "hidden"});
}


function fileUploader(parent,submit_link_text,progress_bar,chooser,extension,index_list,url) {
    $(chooser,parent).click();

    var flag = true;
    $(chooser).off().on('change', function() {
        var files = $(chooser,parent).get(0).files;

        if (files.length > 0) {
            $(submit_link_text,parent).text('Submit 0%');
            $(progress_bar,parent).width("0%");
            var formData = new FormData();
            formData.append("instanceName",$('h1')[0].childNodes[0].nodeValue);
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                // add the files to formData object for the data payload
                const name = file.name;
                const lastDot = name.lastIndexOf('.');

                const fileName = name.substring(0, lastDot);
                const ext = name.substring(lastDot + 1);

                if (ext !== extension) {
                    alert("file extension is wrong.")
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
                    indexPopulator(index_list,url);

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
                            $(submit_link_text,parent).text('Submit ' + percentComplete + '%');
                            $(progress_bar,parent).width(percentComplete+'%');
                            // once the upload reaches 100%, set the progress bar text to done
                            if (percentComplete === 100) {
                                $(submit_link_text,parent).text('Submission Complete');
                            }
                        }
                    }, false);
                    return xhr;
                },
                error: function (xhr, status, error) {
                    xhr.abort();
                    alert(xhr.responseText);
                }
            });
        }
        $(chooser).val("");
    });
}

function indexPopulator(index_list,url){
    console.log("event fired successfully!");
    $(index_list).empty();
    $.ajax({
        type: 'GET',
        url: url,
        success: function(data){
            console.log("latest value"+this);
            $.each(data, function(){
                $(index_list).append('<tr data-id="'+this._id+'"><td><a class="gv-tersect-index-name">'+this.name+'</a></td><td><span>'+this.instance+'</span></td><td><span>'+this.local+'</span></td><td><a class="gv-tersect-index-delete">delete</a></td></tr>');
            });


            $(index_list).parent().off().on('click','.gv-tersect-index-delete',function(){indexDeleter(index_list,$(this).parent().parent().data("id"),url)});
            $(index_list).parent().on('click','.gv-tersect-index-name',function(){indexGetter(index_list,$(this).parent().parent().data("id"),url)});
        },
        dataType: "json"
    });
}

function indexDeleter(index_list,deletion_id,url){
    console.log("delete event fired at: "+Date.now());
    $.ajax({
        type: 'DELETE',
        url: url + "/" + deletion_id,
        success: function(data){
            alert("Item Deleted!");
            indexPopulator(index_list,url);
        },
        error: function(err){
            console.error(err);
        }
    })
}

function vcfUploader(parent,submit_link,chooser,chooser_link,extension,url){
    var formData = new FormData();
    formData.append("instanceName", $('h1')[0].childNodes[0].nodeValue);

    $(document).data("vcfFormData",formData);
    console.log(JSON.stringify($(document).data("vcfFormData"),null,4));

    $(chooser_link,parent).on('click', function(){
        $(chooser,parent).click();
        $(chooser, parent).off().on('change', function() {
            var files = $(chooser, parent).get(0).files;

            if (files.length > 0) {
                handleFileUpload(parent,"vcfFormData",files,extension);
                if($(".gv-tersect-dropzone .statusbar",parent)[0] && !$(".remove",parent)[0]){
                    $("<a class='remove'>remove</a>").insertAfter($(".gv-tersect-dropzone",parent));
                    if(!$(".entryname",parent)[0]) {
                        $("<input type=text placeholder='Name New Index:' class='entryname'></input><br>").insertAfter($(".gv-tersect-dropzone", parent));
                    }
                    $(".remove", parent).on("click", function(){
                        $(".statusbar",parent).empty();
                        formData = new FormData();
                        $(document).data("vcfFormData",formData);
                        $(".entryname",parent).remove();
                        $(".remove", parent).remove();
                    })
                }
            }
            $(chooser,parent).val("");

        });
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
        handleFileUpload(parent,"vcfFormData",files,extension);
        if($(".gv-tersect-dropzone .statusbar",parent)[0] && !$(".remove",parent)[0]){
            $("<a class='remove'>remove</a>").insertAfter($(".gv-tersect-dropzone",parent));
            if(!$(".entryname",parent)[0]) {
                $("<br><input type=text character_set='ISO-8859-1' placeholder='Name New Index:' class='entryname'></input>").insertAfter($(".gv-tersect-dropzone", parent));
            }
            $(".remove", parent).on("click", function(){
                $(".statusbar",parent).empty();
                formData = new FormData();
                $(document).data("vcfFormData",formData);
                $(".entryname",parent).remove();
                $(".remove", parent).remove();
            })
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

    $(submit_link).on('click', function(){
        var vcfFormData = $(document).data('vcfFormData');
        if ($(".statusbar", parent)[0]) {
            // if($("entryname",parent).val()) {
                var newName = $(".entryname",parent).val()
                newName = newName.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"")
            // }
            if(newName) {
                $('<div class="progressbar-border"> <div class="progressbar-fill"></div></div>').insertAfter($(submit_link,parent));

                vcfFormData.append('newName',newName);
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
                        $(document).data("vcfFormData", formData);
                        $(".progressbar-border", parent).remove();
                        $(".remove", parent).remove();

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
                    error: function (xhr, status, error) {
                        xhr.abort();
                        alert(xhr.responseText);
                    }
                });
            }
        }
    });



}



function handleFileUpload(parent,form_data,files,extension){
    formData = $(document).data(form_data);

    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        if (!(file.name.endsWith("."+extension)||file.name.endsWith("."+extension+".gz"))) {
            alert("a file in that selection has the wrong extension");
            break;
        };
        formData.append('uploads[]', file, file.name);

        var status = new createStatusbar(parent); //Using this we can set progress.
        status.setFileNameSize(file.name,file.size);

    }

    $(this).data(form_data,formData);

}


function createStatusbar(parent) {

    this.statusbar = $("<div class='statusbar'></div>");
    this.filename = $("<span class='filename'></span>").appendTo(this.statusbar);
    this.size = $("<span class='filesize'></span>").appendTo(this.statusbar);
    $(".gv-tersect-dropzone",parent).append(this.statusbar);

    this.setFileNameSize = function(name,size) {
        var sizeStr="";
        var sizeKB = size/1024;
        if(parseInt(sizeKB) > 1024)
        {
            var sizeMB = sizeKB/1024;
            sizeStr = sizeMB.toFixed(2)+" MB";
        }
        else
        {
            sizeStr = sizeKB.toFixed(2)+" KB";
        }

        this.filename.html(name);
        this.size.html(sizeStr);
    };

}

function indexGetter(parent, idToGet, url){
    $.post(url+"/view", { "tsifile": idToGet }, function (data) {
        operations.idToGet = idToGet;
        let samples = data.samples;
        $('#genomeTable').append('<tr>');
        for (i = 0; i < samples.length; i++) {
            $('<td>' + samples[i] + '</td>').attr({ id: [i], class: 'samples' }).appendTo('#genomeTable').draggable({
                opacity: 0.5,
                helper: "clone",
                //make sure cursor is out of the way so that mouseover event for venn can fire properly
                cursorAt: { left: -2, top: -2 },
                // Register what we're dragging with the drop manager
                start: function (event) {
                    DragDropManager.dragged = event.target;
                },
                drag: function (event) {
                    let goodPos = DragDropManager.placement();
                    //change tooltip depending on location of cursor
                    div.style('cursor', function () {
                        return (goodPos) ? 'copy' : 'no-drop';
                    });
                    //if location is outside of venn or in intersect do not disable drag and return sample to table
                    $(event.target).draggable('option', 'revert', (goodPos) ? false : true);
                    $(event.target).draggable('option', 'disabled', (goodPos) ? true : false);
                },
                stop: function (event) {
                    let goodPos = DragDropManager.placement();
                    if (goodPos) {
                        new Noty({
                            type: 'success',
                            layout: 'topRight',
                            text: DragDropManager.dragged.innerText + ' has been dropped in: ' + DragDropManager.droppable,
                            timeout: '4000',
                            theme: 'light',
                        }).show();
                        DragDropManager.add();

                    } else {
                        new Noty({
                            type: 'warning',
                            layout: 'topRight',
                            text: DragDropManager.dragged.innerText + " cannot be dropped here!",
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

////////////////////////////////////////////////////////////////////////////////////////////
//
// Tersect GUI from this point onward. Not properly integrated into the program as of yet.
//
//
////////////////////////////////////////////////////////////////////////////////////////////

var area = [];
var filesetA = [];
var filesetB = [];
var wildcardgroup;
var operand;
var reverse;
var wildcardID = [];
var operations = {};


var chart;
var div;

var tooltipA;
var tooltipB;

//sets for making venn diagram
var sets = [{ sets: ['A'], size: 12 },
    { sets: ['B'], size: 12 },
    { sets: ['A', 'B'], size: 3 },];



/**allows mouseover event to fire during drag and drop and not after
 * also adds sample being dragged to its respective tooltip and fileset array */
var DragDropManager = {
    dragged: null,
    droppable: null,
    placement: function () {
        if (JSON.stringify(this.droppable) == JSON.stringify(["A", "B"]) || this.droppable == null) return false;
        return true;
    },
    add: function () {
        if (this.droppable[0] == 'A') {
            $('#hereA').append(`<td id="table${this.dragged.id}">${this.dragged.innerText}<button class="tableButton" id="b${this.dragged.id}">&times;</button></td>`);
            filesetA.push(`'` + this.dragged.innerText + `'`);
        } else if (this.droppable[0] == 'B') {
            $('#hereB').append(`<td id="table${this.dragged.id}">${this.dragged.innerText}<button class="tableButton" id="b${this.dragged.id}">&times;</button></td>`);
            filesetB.push(`'` + this.dragged.innerText + `'`);
        }

    }
}

function vennInit(){
    chart = venn.VennDiagram();
    div = d3.select("#venn");

//sets for making venn diagram
    sets = [{ sets: ['A'], size: 12 },
        { sets: ['B'], size: 12 },
        { sets: ['A', 'B'], size: 3 },];
//draw venn
    div.datum(sets).call(chart
        .width(450)
        .height(450)
    );
//customise venn diagram
    div.selectAll("path")
        .style("stroke-opacity", 0)
        .style("stroke", "#fff")
        .style("stroke-width", 3);
    d3.select("[data-venn-sets=A]").select("path").style("fill", "#004D40");
    d3.select("[data-venn-sets=A]").select("path").style("fill-opacity",0.55 );
    d3.select("[data-venn-sets=A]").select("text").style("fill","#000000" );
    d3.select("[data-venn-sets=B]").select("text").style("fill","#000000" );
//make tooltips for files
    tooltipA = d3.select("#sampleA")
    tooltipB = d3.select("#sampleB")

//action listeners for venn
    div.selectAll('g')
        .on('mouseover', function (d, i) {
            //brings smallest area to top
            venn.sortAreas(div, d);
            DragDropManager.droppable = d.sets;
        })

        // Clear the target from the DragDropManager on mouseOut.
        .on('mouseout', function (d, i) {
            DragDropManager.droppable = null;

        })

        .on('contextmenu', function (d, i) {
            d3.event.preventDefault();
            if (d.sets.length == 1) {
                if (d.sets[0] == 'A') {
                    $('#sampleA').show();
                    tooltipA.transition().duration(400).style("opacity", .9);
                    tooltipA.style("left", d3.event.pageX + "px")
                        .style("top", d3.event.pageY + "px");
                } else if (d.sets[0] == 'B') {
                    $('#sampleB').show();
                    tooltipB.transition().duration(400).style("opacity", .9);
                    tooltipB.style("left", d3.event.pageX + "px")
                        .style("top", d3.event.pageY + "px");
                }
            }
        })

        .on('click', function (d, i) {
            //checks that set clicked has not already been clicked
            function compareArr(elem) {
                var lenElem = elem.length;
                //equating .join checks if the contents of array are the same (given the length is the same)
                if (lenElem == d.sets.length && (elem.join(' ') == d.sets.join(' '))) {
                    return false
                } else {
                    return true;
                }
            }
            if (area.every(compareArr)) {
                area.push(d.sets);

                var selection = d3.select(this).transition().duration(400);
                if (d.sets.length > 1) {
                    selection.select("path")
                        .style("stroke", "#ffffff")
                        .style("stroke-width", 10)
                        .style("fill-opacity", d.sets.length == 1 ? .4 : .1)
                        .style("stroke-opacity", 1);
                } else {
                    selection.select("text").style("font-weight", "100")
                        .style("font-size", "36px");
                }

            } else {
                resetVenn();
                alert("Incorrect input! \n Please select the right options.");
            }
        });

    $('#wildbutton').click(function () {
        if (wildcardgroup !== undefined) {
            let group = wildcardgroup + '*';
            if ($("fileset").prop("checked", true)) {
                let radButton = $('input[name=fileset]:checked').val();
                if (radButton == 'File A') {
                    addSample(group, filesetA)
                }
                else if (radButton == 'File B') {
                    addSample(group, filesetB);
                }

            } else {
                alert("Please select a radio button!");
            }

        }
    });

//remove sample if close button is clicked in tooltip
    $("#tooltipdiv").on('click', '.tableButton', function () {
        let ID = (this.id).substr(1);
        let tableID = `[id="table${ID}"]`;
        //remove from filesets
        let samp = $(tableID).text().slice(0, -1);
        filesetA = filesetA.filter(item => item != "'" + samp + "'");
        filesetB = filesetB.filter(item => item != "'" + samp + "'");
        //remove from table
        $(tableID).remove();

        if (ID.includes(',')) {

            let arrID = ID.split(',');
            for (i = 0; i < arrID.length; i++) {
                $('#' + arrID[i]).draggable('option', 'disabled', false);
            }
        } else {

            $('#' + ID).draggable('option', 'disabled', false);

        }
    });

    $("#tooltipdiv").on('click', '#hideA', function () {
        $('#sampleA').hide();
    });
    $("#tooltipdiv").on('click', '#hideB', function () {
        $('#sampleB').hide();
    });


    $('#clearFile').click(function () {
        filesetA = [];
        filesetB = [];
        $('#genomeTable td').draggable('option', 'disabled', false);
        $('.venntooltip td').remove();

    });

    $('#clearOperations').click(resetVenn);


    $("#submit").click(function () {
        if (filesetA.length > 0 && filesetB.length > 0 && area.length > 0 && $("#filepath").val()) {


            switch (area.length) {
                case 1:
                    findOperand(area[0]);
                    break;
                case 2:
                    switch (area.every(elem => elem.length == 1)) {
                        case true:
                            operand = "^";
                            reverse = "no";
                            break;
                        case false:
                            switch (area.some(unionAB)) {
                                case true:
                                    operand = "none";
                                    reverse = "no";
                                    break;
                                case false:
                                    operand = "none";
                                    reverse = "yes";
                            }
                            break;
                    }
                    break;
                case 3:
                    operand = "|";
                    reverse = "no";
                    break;
            }


            operations.operation = JSON.stringify(operand);
            operations.setA = JSON.stringify(filesetA);
            operations.setB = JSON.stringify(filesetB);
            operations.reverse = reverse;
            //check file name ends with vcf
            if ($("#filepath").val().endsWith(".vcf")) {
                operations.filepath = $("#filepath").val();
            } else {
                operations.filepath = $("#filepath").val() + ".vcf";
            }




            $.post("/index/generate", operations, function (data) {
                let loc = data.location;

                new Noty({
                    type: 'success',
                    layout: 'center',
                    text: " Virtual Genome VCF file downloaded to: " + loc,
                    //timeout: '5000',
                    theme: 'light',
                    closeWith: ['click'],
                }).show();

            });
//if conditions were not fulfiled, display warnings
        } else {
            if (area.length == 0) {
                new Noty({
                    type: 'error',
                    layout: 'center',
                    text: "Please select an area of the Venn Diagram!",
                    //timeout: '5000',
                    theme: 'light',
                    closeWith: ['click'],
                }).show();
            }
            if (!$("#filepath").val()) {
                new Noty({
                    type: 'error',
                    layout: 'center',
                    text: "Please give a file name for VCF download!",
                    //timeout: '5000',
                    theme: 'light',
                    closeWith: ['click'],
                }).show();
            }
            if (filesetA.length == 0) {
                new Noty({
                    type: 'error',
                    layout: 'center',
                    text: "Please add samples to circle A!",
                    //timeout: '5000',
                    theme: 'light',
                    closeWith: ['click'],
                }).show();
            }
            if (filesetB.length == 0) {
                new Noty({
                    type: 'error',
                    layout: 'center',
                    text: "Please add samples to circle B!",
                    //timeout: '5000',
                    theme: 'light',
                    closeWith: ['click'],
                }).show();
            }
        }

        resetVenn();
        operations={};
        filesetA = [];
        filesetB = [];
        $('#genomeTable td').draggable('option', 'disabled', false);
        $('.venntooltip td').remove();
        $("#filepath").val("")
    });
};
//resets venn to original appearance
function resetVenn() {
    area = [];
    var all = d3.selectAll('g');
    all.select("path")
        .style("stroke-width", 3)
        .style("stroke-opacity", 0)
        .each(function (d) {
            var selection = d3.select(this).transition();
            selection.style("fill-opacity", d.sets.length == 1 ? .25 : .0);
        });
    all.select("text").style("font-weight", "100")
        .style("font-size", "16px");
}


//function to add sample group to fileset array and tooltip
function addSample(input, fset) {
    fset.push(`'` + input + `'`);
    var set;
    if (fset == filesetA) {
        set = 'A';
    } else if (fset == filesetB) {
        set = 'B';
    }
    new Noty({
        type: 'success',
        layout: 'topRight',
        text: input + ' has been added to: ' + set,
        timeout: '4000',
        theme: 'light',
    }).show();

    $("#genomeTable td").filter(function () {
        if ($(this).text().indexOf(wildcardgroup) == 0) {
            $(this).draggable('option', 'disabled', true);
            wildcardID.push(this.id);

        }
    });
    $('#here' + set).append(`<td id="table${wildcardID}">${input}<button class="tableButton" id="b${wildcardID}">&times;</button></td>`);
    wildcardID = [];

}




//need to improve and update method of sending tersect operation
function findOperand(input) {
    switch (input.length) {
        case 1:
            switch (input[0]) {
                case 'A':
                    operand = "\\";
                    reverse = "no";
                    break;
                case 'B':
                    operand = "\\";
                    reverse = "yes";
                    break;
            }
            break;
        case 2:
            operand = "amp";
            reverse = "no";
            break;
    }
}

function unionAB(elem) {
    if (elem.length == 1 && elem[0] == 'A') return true;
    return false;
}





Genoverse.Plugins.tersectIntegration.requires = 'controlPanel';
Genoverse.Plugins.tersectIntegration = function () {
    this.controls.push({
        icon: '<i class="fa fa-override"></i>',
        'class': 'gv-tersect-integration',
        name: 'Use Tersect Functionalities.',
        action: function (browser) {
            // Resetting variables
            var tersectButton = this;
            var tersectFileMenu = false;
            var queryMenu = false;
            // If the control panel search button has already been clicked, it will close the search menu
            if ($(tersectButton).hasClass('gv-active')) {
                $('.gv-menu.gv-tersect-integration-menu .gv-close').trigger('click');
                $(tersectButton).removeClass('gv-active');
            } else {
                // otherwise it will open the search menu
                var tersectMenu = $(this).data('tersectMenu');
                if (tersectMenu) {
                    tersectMenu.show();
                } else {
                    tersectMenu = makeTersectMenu();
                }
                $(tersectButton).addClass('gv-active');
                // Use off() to devalidate any handlers added by spamming the tersect button.

                $('#tsi-file').off().on('click', function () {
                    //$(".gv-tersect-integration-file-menu").remove();
                    //tersectFileMenu = makeTersectFileMenu();
                    if(tersectFileMenu){
                        tersectFileMenu.show();
                    } else {
                        tersectFileMenu = makeTersectFileMenu();
                    }


                });

                $('#saved-queries').off().on('click', function () {
                    //$(".gv-tersect-integration-file-menu").remove();
                    //tersectFileMenu = makeTersectFileMenu();
                    if(queryMenu){
                        queryMenu.show();
                    } else {
                        queryMenu = makeQueryMenu();
                    }


                });

                $('#save-query').off().on('click', function () {
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

                $(this).data('tersectMenu', tersectMenu);
            }

            //makeMenu function declarations.
            function makeTersectMenu() {
                var tersectMenu = browser.makeMenu({
                    'Tersect: File Selection:': '',
                    '<span><a class="gv-tersect-integration-text gv-tersect-integration-input gv-tersect-integration-select-button" id="tsi-file">TSI File <i class="fa fa-arrow-circle-right"></i></a></span></br>':'',
                    '<div><span>Space For Operations</span></div><div><span>Space For Operations</span></div><div><span>Space For Operations</span></div>':'<div><span>Space For Operations</span></div><div><span>Space For Operations</span></div><div><span>Space For Operations</span></div>',
                    '<div><span class="gv-tersect-integration-span" id="save-query"><a class="gv-tersect-integration-text ">Save Query <i id="save-status" class="fa fa-arrow-circle-right"></i></a></span> <span class="gv-tersect-integration-span" id="saved-queries"><a class="gv-tersect-integration-text">Saved Queries <i class="fa fa-arrow-circle-right"></i></a></span></div>': '<span><a class="gv-tersect-integration-text gv-tersect-integration-submit-button" id="submit-query">Submit <i class="fa fa-arrow-circle-right"></i></a></span>',

                }).addClass('gv-tersect-integration-menu');
                return tersectMenu;
            }


            function makeTersectFileMenu() {
                var geneMenu = browser.makeMenu({
                    '<div>Choose Tersect Index Files:</div>':'',
                    '<div id="names" class="gv-tersect-integration-text">Local File Selection Here</div>':'<div class="gv-tersect-integration-text">Remote File Selection Here</div> <div class="gv-tersect-integration-text">(FTP etc.)</div>',
                    '<input class="gv-tersect-integration-input" type="file" id="local-file-chooser" name="local file chooser" multiple>':'<input class="gv-tersect-integration-input" type="file" id="remote-file-chooser" name="remote file chooser" multiple>',
                    '<span class="gv-tersect-integration-span" id="tsi-submit-local"><a class="gv-tersect-integration-text">Submit <i class="fa fa-arrow-circle-right"></i></a></span>':'<span class="gv-tersect-integration-span" id="tsi-submit-remote"><a class="gv-tersect-integration-text">Submit <i class="fa fa-arrow-circle-right"></i></a></span>',
                    '<span class="gv-tersect-integration-span" id="generate-new-button"><a class="gv-tersect-integration-text">Generate New Index <i class="fa fa-arrow-circle-right"></i></a></span>':''
                }).addClass('gv-tersect-integration-file-menu');
                console.log("FileRunAgain");
                return geneMenu;
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

Genoverse.Plugins.tersectIntegration.requires = 'controlPanel';
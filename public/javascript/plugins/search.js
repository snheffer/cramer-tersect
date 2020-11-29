Genoverse.Plugins.search = function () {
    this.controls.push({
        icon: '<i class="fa fa-search"></i>',
        'class': 'gv-search',
        name: 'Search by position or gene',
        action: function (browser) {
            // Resetting variables
            var searchButton = this;
            var start = 0;
            var end = 0;
            var gene = '';
            var featuresENS = [];
            var featuresGFF = [];
            var ensIds = false;
            var ensNames = false;
            var gffname = false;
            var gffid = false;
            // If the control panel search button has already been clicked, it will close the search menu
            if ($(searchButton).hasClass('gv-active')) {
                $('.gv-menu.gv-search-menu .gv-close').trigger('click');
                $(this).removeClass('gv-active');
            } else {
                // otherwise it will open the search menu
                var searchMenu = $(this).data('searchMenu');
                if (searchMenu) {
                    searchMenu.show();
                } else {
                    searchMenu = makeSearchMenu();
                }
                $(searchButton).addClass('gv-active');
                console.log("Added at: "+Date.now());

                // When gene-search button is clicked, set new position and search genes
                $('.gv-gene-search-button', searchMenu).on('click', function () {
                    console.log("Added at: "+Date.now());

                    start = Number($('#start-search').val());
                    end = Number($('#end-search').val());
                    gene = $('#gene-name').val();
                    // If start and end undefined, set them to search the whole chromosome
                    if (start == 0 && end == 0 && gene != '') {
                        start = 1;
                        end = browser.chromosomeSize;
                    }

                    if (start < end) {
                        $('#start-search').css({'background-color': "white"});
                        $('#end-search').css({'background-color': "white"});
                        browser.moveTo(browser.chr, start, end, true);
                        $('.gv-menu.gv-search-menu .gv-close').trigger('click');

                        ensIds = $(".gv-ens-ids-search").is(':checked');
                        ensNames = $(".gv-ens-names-search").is(':checked');
                        gffname = $(".gv-gffnames-search").is(':checked');
                        gffid = $(".gv-gffids-search").is(':checked');
                        if (gene != '' && (ensIds || ensNames || gffname || gffid)) {

                            window.setTimeout(function () {
                                var [matchingGenes,matchingPos] = getMatchingGenes(ensIds, ensNames, gffid, gffname);
                                var geneMenu = $(this).data('geneMenu');
                                if (geneMenu) {
                                    geneMenu.css("display", "none");
                                } else {
                                    geneMenu = makeGeneMenu();
                                }
                                $('.gv-gene-menu').draggable();
                                // Get gene names and positions
                                var geneNames = $('.gv-gene-names', geneMenu).data({
                                    listGenes: function () {
                                        if (matchingGenes.length > 0) {
                                            for (var i = 0; i < matchingGenes.length; i++) {
                                                $('<div>')
                                                        .append('<li data-id="' + i + '">' + matchingGenes[i] + '</li>')
                                                        .appendTo(geneNames);
                                            }
                                        } else {
                                            $('<div>')
                                                    .append('<li>' + 'No matching genes' + '</li>')
                                                    .appendTo(geneNames);
                                        }
                                    }});
                                var genePositions = $('.gv-gene-positions', geneMenu).data({
                                    listPositions: function () {
                                        for (var i = 0; i < matchingGenes.length; i++) {
                                            $('<div>')
                                                    .append('<span> ' + matchingPos[i] + '</span>')
                                                    .appendTo(genePositions);
                                        }
                                    }});
                                // Set the data in the menu
                                geneNames.empty();
                                genePositions.empty();
                                geneNames.data('listGenes')();
                                genePositions.data('listPositions')();
                                window.setTimeout(function () {
                                    geneMenu.show();
                                }, 100);
                                // Set the scrollbar and selection of gene menu
                                if (matchingGenes.length > 30) {
                                    setScrollBar();
                                } else {
                                    removeScrollBar();
                                }
                                $("li").css({"cursor": "pointer"});
                                $('li', geneMenu).click(function () {
                                    var index = $(this).data('id');
                                    var positions = matchingPos[index].split(' - ');
                                    browser.moveTo(browser.chr, positions[0], positions[1], true);
                                });
                                $(this).data('geneMenu', geneMenu);
                            }, 500);
                        }
                    } else {
                        $('#start-search').css({'background-color': "rgba(255,0,51,0.6)"});
                        $('#end-search').css({'background-color': "rgba(255,0,51,0.6)"});
                    }
                });
                $('.gv-close', searchMenu).on('click', function () {
                    $(searchButton).removeClass('gv-active');
                });
                $(this).data('searchMenu', searchMenu);
            }


            function makeSearchMenu() {
                var searchMenu = browser.makeMenu({
                    'Search inputs:': 'Search settings:',
                    '<input class="gv-search-input" id="start-search" placeholder="Start position">': '<div class="gv-settings"> GFF gene IDs: <input class="gv-checkbox gv-gffids-search" type="checkbox"></div>',
                    '<input class="gv-search-input" id="end-search" placeholder="End position">': '<div class="gv-settings">GFF gene names: <input class="gv-checkbox gv-gffnames-search" type="checkbox"></div>',
                    '<input class="gv-search-input" id="gene-name" placeholder="Gene name/ID">': '<div class="gv-settings">Ensembl gene IDs: <input class="gv-checkbox gv-ens-ids-search" type="checkbox"></div>',
                    '<div class="gv-search-text">Search: <div class="gv-gene-search-button gv-menu-button fa fa-arrow-circle-right"></div></div>': '<div class="gv-settings">Ensembl gene names: <input class="gv-checkbox gv-ens-names-search" type="checkbox"></div>'
                }).addClass('gv-search-menu');
                return searchMenu;
            }


            function makeGeneMenu() {
                var geneMenu = browser.makeMenu({
                    'Gene Name:': 'Position:',
                    '<div id="names" class="gv-gene-names"></div>': '<div id="pos" class="gv-gene-positions"></div>'
                }).addClass('gv-gene-menu');
                return geneMenu;
            }


            function getMatchingGenes(ensIds, ensNames, gffids, gffnames) {
                let matchGenes = [];
                let matchPos = [];
                console.log(gffids);
                console.log(gffnames);
                for (var i = 0; i < browser.tracks.length; i++) {
                    if ((ensNames || ensIds) && browser.tracks[i].id == "genes") { // for ensembl track
                        featuresENS = browser.tracks[i].model.findFeatures(browser.chr, start, end);
                        for (var j = 0; j < featuresENS.length; j++) {
                            if(ensNames && featuresENS[j].hasOwnProperty('external_name')){
                                if (featuresENS[j].external_name.includes(gene.toUpperCase()) || featuresENS[j].external_name.includes(gene.toLowerCase()) || featuresENS[j].external_name.includes(gene)) {
                                    matchGenes.push(featuresENS[j].external_name);
                                    matchPos.push(featuresENS[j].start + ' - ' + featuresENS[j].end);
                                }
                            }
                            if(ensIds && featuresENS[j].hasOwnProperty('id')){
                                if (featuresENS[j].id.includes(gene.toUpperCase()) || featuresENS[j].id.includes(gene.toLowerCase()) || featuresENS[j].external_name.includes(gene)) {
                                    matchGenes.push(featuresENS[j].id);
                                    matchPos.push(featuresENS[j].start + ' - ' + featuresENS[j].end);
                                }
                            }
                        }
                    }
                    if ((gffids || gffnames) && browser.tracks[i].id === "gff") { // for gff track
                        featuresGFF = browser.tracks[i].model.findFeatures(browser.chr, start, end);
                        for (var j = 0; j < featuresGFF.length; j++) {
                            if (gffids && featuresGFF[j].hasOwnProperty('id')){
                                if (featuresGFF[j].id.includes(gene.toUpperCase()) || featuresGFF[j].id.includes(gene.toLowerCase()) || featuresGFF[j].id.includes(gene)) {
                                    matchGenes.push(featuresGFF[j].id);
                                    matchPos.push(featuresGFF[j].start + ' - ' + featuresGFF[j].end);
                                }
                            }
                            if (gffnames && featuresGFF[j].hasOwnProperty('name')){
                                if (featuresGFF[j].name.includes(gene.toUpperCase()) || featuresGFF[j].name.includes(gene.toLowerCase()) || featuresGFF[j].name.includes(gene)) {
                                    matchGenes.push(featuresGFF[j].name);
                                    matchPos.push(featuresGFF[j].start + ' - ' + featuresGFF[j].end);
                                }
                            }
                        }
                    }
                }
                return [matchGenes,matchPos]
            }
        }
    });
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

Genoverse.Plugins.search.requires = 'controlPanel';
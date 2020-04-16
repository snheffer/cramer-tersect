var area = [];
var filesetA = [];
var filesetB = [];
var wildcardgroup;
var operand;
var reverse;
var wildcardID = [];

var chart = venn.VennDiagram();
var div = d3.select("#venn");

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



//draw venn
div.datum(sets).call(chart
    .width(600)
    .height(600)
);

//customise venn diagram
div.selectAll("path")
    .style("stroke-opacity", 0)
    .style("stroke", "#fff")
    .style("stroke-width", 3);

//make tooltips for files
var tooltipA = d3.select("#sampleA")
var tooltipB = d3.select("#sampleB")

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



//get samples from tsi file
$.post('/', { "tsifile": "tomato.tsi" }, function (data) {
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
});


//case sensitive search for samples (only matches from the beginning of samples)
$("#searchBox").on("keyup", function () {
    wildcardgroup = $(this).val();
    $("#genomeTable td").filter(function () {
        $(this).toggle($(this).text().indexOf(wildcardgroup) == 0)
    });
});


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


$("#submit").click(function () {
    var files = circlesDisplayed();
    if (filesetA.length > 0 && filesetB.length > 0 && area.length > 0 && $("#filepath").val()) {

        var operations = {};

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




        $.post("/generate", operations, function (data) {
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
    filesetA = [];
    filesetB = [];
    $('#genomeTable td').draggable('option', 'disabled', false);
    $('.venntooltip td').remove();
    $("#filepath").val("")
});


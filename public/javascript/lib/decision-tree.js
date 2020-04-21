    function getNotation() {
        var circleD = circlesDisplayed();
        var areaL = area.length;
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
                                var single = area.filter(elem => elem.length == 1);
                                $("#notation").html(single[0][0]);
                                command = single[0][0];
                                break;
                        }
                        break;
                    case 3:
                        var single = area.filter(elem => elem.length == 1);
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
                                        var single = area.filter(elem => elem.length == 1);
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
                                                        var single = area.filter(elem => elem.length == 1);
                                                        var double = area.filter(elem => elem.length == 2);
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
                                                var single = area.filter(elem => elem.length == 1);
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
                                                        var double = area.filter(elem => elem.length == 2);
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
                                                                        var single = area.filter(elem => elem.length == 1);
                                                                        var double = area.filter(elem => elem.length == 2);
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
                                                                        var singles = area.filter(elem => elem.length == 1);
                                                                        var doubles = area.filter(elem => elem.length == 2);
                                                                        switch (doubles.every(elem => elem.join().includes(singles))) {
                                                                            case true:
                                                                                $('#notation').html(singles[0]);
                                                                                command = singles[0][0];
                                                                                //console.log(command);
                                                                                break;
                                                                            case false:
                                                                                var unq = doubles.filter(elem => !elem.join().includes(singles));
                                                                                var non = doubles.filter(elem => elem.join().includes(singles));
                                                                                var uni = circleD.filter(elem => !non.join().includes(elem));
                                                                                $('#notation').html("(" + singles[0] + " &minus; " + uni[0] + ") &cup; (" +
                                                                                    unq[0][0] + " &cap; " + unq[0][1] + ")");
                                                                                command = "(" + singles[0][0] + " \\ " + uni[0] + ") | (" +
                                                                                    unq[0][0] + " & " + unq[0][1] + ")"
                                                                                break;
                                                                        }

                                                                        break;
                                                                }
                                                                break;
                                                            case 2:
                                                                //W2X
                                                                var single2 = area.filter(elem => elem.length == 1);
                                                                var uns = circleD.filter(elem => !single2.join().includes(elem));
                                                                var double2 = area.filter(elem => elem.length == 2);
                                                                $('#notation').html("( (" + single2[0] + " &#8710; " + single2[1] + ") &minus; " +
                                                                    uns[0] + ") &cup; (" + double2[0][0] + " &cap; " + double2[0][1] + ")");
                                                                command = "( (" + single2[0][0] + " ^ " + single2[1][0] + ") \\" +
                                                                    uns[0] + ") | (" + double2[0][0] + " & " + double2[0][1] + ")";
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
                                var double = area.filter(elem => elem.length == 2);
                                var single = area.filter(elem => elem.length == 1);
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
                                var double = area.filter(elem => elem.length == 2);
                                var single = area.filter(elem => elem.length == 1);
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
                                        var double = area.filter(elem => elem.length == 2);
                                        var other = intersect.filter(elem => !double.join().includes(elem));
                                        var singCirc = circleD.filter(elem => !other.join().includes(elem));
                                        $('#notation').html("(" + other[0][0] + " &#8710; " + other[0][1] + ") &cup; " + singCirc[0]);
                                        command = "(" + other[0][0] + " ^ " + other[0][1] + ") | " + singCirc[0];
                                        break;
                                    case 3:
                                        //W2X3
                                        var single = area.filter(elem => elem.length == 1);
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
                                var double = area.filter(elem => elem.length == 2);
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
                                        var single = area.filter(elem => elem.length == 1);
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
    function circlesDisplayed() {
        var displayed = [];
        sets.forEach(function (elem) {
            if (elem.sets.length == 1) {
                displayed.push(elem.sets);

            }
        });
        return displayed;
    }

Genoverse.Track.Model.SNPDensity = Genoverse.Track.Model.Graph.Bar.extend({
    dataType: 'text',
    binSize: 1000000,
    binSize_id: '',


    getData: function (chr, start, end) {
        var deferred = $.Deferred();

        return this.base.apply(this, arguments);

        return deferred;
    },

    parseData: function (text, chr, s, e) {
        var lines = text.split('\n');
        var features = [];
        var temp_binsize = 0
        console.error("Binsize Before Calculation: " + this.binSize);
        //console.log(`SNPDensity Data Log: ${JSON.stringify(this, getCircularReplacer())}`)
        if ($('#genoverse').data('master_binSize') && $('#genoverse').data('master_binSize') >= Math.ceil((e-s)/10)){
            temp_binsize = $('#genoverse').data('master_binSize');
        }
        if ($('#genoverse').data('binSize_'+this.binSize_id) && $('#genoverse').data('binSize_'+this.binSize_id) >= Math.ceil((e-s)/10)){
            temp_binsize = $('#genoverse').data('binSize_'+this.binSize_id);
        }
        console.log(`Grabbed ID :  ${this.binSize_id}`);
        console.error("Temp Binsize After Calculation: " + temp_binsize);

        var binSize = temp_binsize ? temp_binsize : (this.binSize == -1 ? (Math.ceil((e-s)/10)) : this.binSize) ;

        //var binSize = this.binSize;
        console.log(`Start:${s} End:${e}`)
        console.error(binSize);

        for (var j = s; j < e; j+= binSize/1000) {
                    features.push({
                        chr: chr,
                        start: j,
                        end: j + binSize/1000,
                        height: 0
                    });
                }
                
        for (var i = 0; i < lines.length; i++) {

            if (!lines[i].length || lines[i].indexOf('#') === 0) {
                continue;
            }

            var fields = lines[i].split('\t');

            if (fields.length < 5) {
                continue;
            }

            if (fields[0] == chr || fields[0] == 'chr' + chr) {
                
                
                var start = parseInt(fields[1], 10);
                var alleles = fields[4].split(',');
                
                alleles.unshift(fields[3]);

                var height = alleles.length;

                features.push({
                    chr: chr,
                    start: start - (binSize/2),
                    end: start + (binSize/2),
                    height: height
                });
            }
        }
        return this.base.call(this, features, chr, s, e);
    }
});





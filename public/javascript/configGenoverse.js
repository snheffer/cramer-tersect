var object = document.getElementById("configGenoverse").getAttribute('data');
var data = JSON.parse(object);
var plugins = [];
var plugin;

for (var i in data.plugins) {
    plugin = data.plugins[i];
    if (plugin.checked) {
        plugins.push(plugin.id);
    }
}

var trackConfig = [];
var tracksLength = data.tracks.length;
for (var i = 0; i < tracksLength; i++) {
    currentTrack = data.tracks[i];
    if (currentTrack.checked) {
        for (var j in currentTrack.trackChildren) {
            trackConfig.push(eval(currentTrack.trackChildren[j].data));
        }
    }
}

console.log(trackConfig);

new Genoverse({
    container: '#genoverse',
    genome: data.genome.name,
    chr: data.chr,
    start: data.start,
    end: data.end,
    plugins: plugins,
    tracks:
            trackConfig
//            [
//                Genoverse.Track.Scalebar,
//                Genoverse.Track.GeneExpression.extend({
//                    model: Genoverse.Track.Model.GeneExpression.extend({
//                        url: "http://138.250.31.99:2800/index/request?chr=__CHR__&start=__START__&end=__END__&type=tabix",
//                        urlParams: {file: 'ftp://138.250.31.77/Public/GenoVerse_GP_Testing/RSEM/ITAG2.4_gene_models_sorted.gff.gz'},
//                        urlRsem: "http://138.250.31.99:2800/index/request?chr=__CHR__&start=__START__&end=__END__&type=rsem",
//                        urlParamsRsem: {file: "ftp://138.250.31.77/Public/GenoVerse_GP_Testing/BrT-Leaf1-a.genes.results"}
//                    })
//                })
//                Genoverse.Track.File.BAM.extend({
//                    model: Genoverse.Track.Model.File.ftpBAM.extend({
//                        url: "http://138.250.31.99:4000/index/request?chr=__CHR__&start=__START__&end=__END__&type=bam",
//                        urlParams: {file: 'ftp://138.250.31.77/Public/GenoVerse_GP_Testing/FDR/genomesorted.bam'}
//                    }),
//                    threshold: 1000000,
//                    name: 'BAM<br/>Models'
//                })
//6820032-6824128 16000-17000
//                Genoverse.Track.File.ftpBIGWIG.extend({
//                    model: Genoverse.Track.Model.File.ftpBIGWIG.extend({
//                        url: "http://138.250.31.99:2500/index/request?chr=__CHR__&start=__START__&end=__END__&type=bigwig",
//                        urlParams: {file: 'ftp://138.250.31.77/Public/GenoVerse_GP_Testing/FDR/genome1x.bw'},
//                        largeFile: true
//                    }),
//                    name: 'BIGWIG<br/>Graphs'
//                })
//                Genoverse.Track.extend({
//                    name: "Fasta",
//                    controller: Genoverse.Track.Controller.Sequence,
//                    view: Genoverse.Track.View.Sequence,
//                    model: Genoverse.Track.Model.Sequence.extend({
//                        url: "ftp://ftp.ensemblorg.ebi.ac.uk/pub/current_fasta/homo_sapiens/dna/Homo_sapiens.GRCh38.dna.chromosome.MT.fa.gz"
//                    }),
//                    10000: false,
//                    resizable: "auto"
//                })
//                Genoverse.Track.extend({
//                    name: 'Sequence',
//                    100000: false,
//                    resizable: 'auto',
//                    controller: Genoverse.Track.Controller.Sequence,
//                    view: Genoverse.Track.View.Sequence,
//                    model: Genoverse.Track.Model.Sequence.extend({
//                        url: "http://localhost:4000/index/request?chr=__CHR__&start=__START__&end=__END__&type=faidx",
//                        urlParams: {file: "ftp://138.250.31.77/Public/TomatoReference/SL2.50/Sol.2.50.fasta.gz"}
//                    })
//                }),
//                Genoverse.Track.File.GFF.extend({
//                    model: Genoverse.Track.Model.File.GFF.extend({
//                        url: "http://localhost:4000/index/request?chr=__CHR__&start=__START__&end=__END__&type=tabix",
//                        urlParams: {file: "ftp://138.250.31.77/Public/Genoverse/reference/SL3.0/ITAG3.10_gene_models.gff.gz"}
//                    }),
//                    name: 'Gene<br/>Models',
//                })
//            ]
});
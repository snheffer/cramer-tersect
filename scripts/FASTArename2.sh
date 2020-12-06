#!/usr/bin/python
import sys, getopt,subprocess, os
os.path.dirname(os.path.realpath(__file__))



def main(argv):
    inputfile = ''
    lookupfile = ''
    outputfile = ''
    genomefile = False
    try:
        opts, args = getopt.getopt(argv, "hgl:i:o:", ["lookupfile=", "ifile=", "ofile="])
    except getopt.GetoptError:
        print('test.py -i <inputfile> -o <outputfile> -g Generate Genoverse Genome File in Output Directory -l <tab-separated lookup file ("oldname"\t"newname")>')
        sys.exit(2)
    for opt, arg in opts:
        if opt == '-h':
            print('test.py -i <inputfile> -o <outputfile>')
            sys.exit()
        elif opt in ("-i", "--ifile"):
            inputfile = arg
        elif opt in ("-o", "--ofile"):
            outputfile = arg
        elif opt in ("-l", "--lookupfile"):
            lookupfile = arg
        elif opt == "-g":
            genomefile = True
    print('Input file is ', inputfile)
    print('Output file is ', outputfile)
    print(opts)
    if inputfile == '' or outputfile == '' or lookupfile == '':
        print("Error: Parameters Missing")
        print('test.py -i <inputfile> -o <outputfile> -g Generate Genoverse Genome File in Output Directory -l <tab-separated lookup file ("oldname"\t"newname")>')
        sys.exit(2)
    lookuptable = {}
    try:
        with open(lookupfile, "r") as l:
            rows = (line.split('\t') for line in l)
            print(row for row in rows)
            lookuptable = {row[0]: row[1:][0] for row in rows}
            print(lookuptable)
        i = open(inputfile, "r");
        o = open(outputfile,"w");
        if genomefile:
            g = open("".join(outputfile.split("/")[:-1]).join(inputfile.split("/")[-1].split(".")[:-1])+".js", "w")
            g.write('Genoverse.Genomes.{} = {{\n'.format("".join(inputfile.split("/")[-1].split(".")[:-1])))
            counter = 0
            currentalias = ""
            for line in i:
                line_stripped = line.rstrip()
                if line_stripped in lookuptable:
                    if currentalias != "":
                        g.write('''
"{newName}" : {{
    "alias":"{alias}",
    "size": {size},
    "bands": [
        {{
            "start": 1,
            "end": {size}
        }}
    ]
}},'''.format(newName=lookuptable[currentalias][1:].rstrip(), alias=currentalias, size=counter))
                    currentalias = line_stripped
                    counter = 0
                    o.write(lookuptable[line_stripped])
                else:
                    o.write(line)
                    counter = counter + len(line_stripped)
            g.write('''
"{newName}" : {{
    "alias":"{alias}",
    "size": {size},
    "bands": [
        {{
            "start": 1,
            "end": {size}
        }}
    ]
    }},
}}'''.format(newName=lookuptable[currentalias][1:].rstrip(), alias=currentalias, size=counter))

        else:
            for line in i:
                line_stripped = line.rstrip()
                if line_stripped in lookuptable:

                    o.write(lookuptable[line_stripped]);
                else:
                    o.write(line)

        o.close()
        subprocess.Popen('samtools faidx "{outputfile}"'.format(outputfile=outputfile), shell=True)

    except Exception as e: print("error",e)





if __name__ == "__main__":
    main(sys.argv[1:])

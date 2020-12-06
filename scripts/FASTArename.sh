#! /bin/bash

print_usage(){
    printf " <tab-separated LookupFile -- oldnames\tnewnames> <FASTA File>"
}

while getopts 'h' flag; do 
    case "${flag}" in

        h) print_usage
           exit 1 ;;
        *) print_usage
           exit 1 ;;
    esac
done

if [[ "$1" && "$2" ]]
    then
    	echo "Replacing..."

	    awk '
		BEGIN { FS="\t";OFS="\t" }
		NR==FNR {a[$1] = $2; next }
		$0 in a{printf a[$0]"\n"; next}
		1
		' ${1} ${2} > "${2}_cramer.fasta"
	
	echo "Finished Replacing."
fi





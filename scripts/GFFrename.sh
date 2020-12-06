#! /bin/bash

print_usage(){
    printf "<LookupFile> <Target File>"
}

firstver="temp_${2}"
cramerver="cramer_${2}"


if [[ "$1" && "$2" ]]
	then
		bedtools sort -i $2 > ${firstver}
		
fi

if [[ "$1" ]]
    then
    	echo "Replacing..."
	    awk '
		BEGIN { FS="\t";OFS="\t" }
		NR==FNR { a[$1] = $2; next }
		$1 in a { $1 = a[$1] }
		1
		' ${1} ${firstver} > ${cramerver}
		echo "Finished Replacing."
		echo "Zipping output..."
		bgzip --threads=3 ${cramerver}
		echo "Finished Zipping output."
		echo "Indexing with tabix"
		tabix -p gff "${cramerver}.gz"
fi





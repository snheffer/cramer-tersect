#! /bin/bash

print_usage(){
    printf "Usage: [-z] - Unzip/Rezip VCF files <Tab-separated LookupFile - oldnames\tnewnames> <Target Directory>"
}

while getopts 'z' flag; do 
    case "${flag}" in
        z) zip_flag=true
           shift  ;;
        h) print_usage
           exit 1 ;;
        *) print_usage
           exit 1 ;;
    esac
done

if [[ "$1" && "$2" ]]
    then
        if [ "$zip_flag" == true ]
            then
                echo "Unzipping..."
                echo ${2}
        	gunzip -r ${2}
        	echo "Finished Unzipping."
        fi
        
fi


if [[ "$1" && "$2" ]]
    then
    	echo "Replacing..."
	for vcf in ${2}/*.vcf; do
	    awk '
		BEGIN { FS="\t";OFS="\t" }
		NR==FNR { a[$1] = $2; next }
		$1 in a { $1 = a[$1]+"\t" }
		1
		' ${1} $vcf > "${vcf}_cramer.vcf"
	done
	echo "Finished Replacing."
fi

if [[ "$1" && "$2" ]]
    then
	if [ "$zip_flag" == true ]
	    then
		echo "Zipping output..."
		for vcf in ${2}/*.vcf; do
			bgzip --threads=3 ${vcf}
		done
		echo "Finished Zipping output."
	fi
fi



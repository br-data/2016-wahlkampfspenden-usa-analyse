#!/bin/bash
while IFS='' read -r line || [[ -n "$line" ]]; do
    sleep $(( ( RANDOM % 1 )  + 1  ))
    echo "$line"
done < "$1"

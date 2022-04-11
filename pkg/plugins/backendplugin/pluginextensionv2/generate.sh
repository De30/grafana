#!/bin/bash

# To compile all protobuf files in this repository, run
# "make protobuf" at the top-level.

set -eu

#DST_DIR=../genproto/pluginv2

SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ] ; do SOURCE="$(readlink "$SOURCE")"; done
DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"

cd "$DIR"

protoc -I ./ rendererv2.proto --go_out=./ --go-grpc_out=./ --go-grpc_opt=require_unimplemented_servers=false
protoc -I ./ objectstore.proto --go_out=./ --go-grpc_out=./ --go-grpc_opt=require_unimplemented_servers=false

#!/bin/bash
# On windows run manually

npx proto-loader-gen-types --grpcLib=@grpc/grpc-js --outDir=proto/ proto/random.proto

protoc ./proto/random.proto --js_out=import_style=commonjs:./client/src --grpc-web_out=import_style=typescript,mode=grpcwebtext:./client/src
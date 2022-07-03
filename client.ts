import path from 'path'
import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import { ProtoGrpcType } from './proto/random'

const PORT = 8082
const PROTO_FILE = './proto/random.proto'

const packageDef = protoLoader.loadSync(path.resolve(__dirname, PROTO_FILE))
const grpcObj = grpc.loadPackageDefinition(packageDef) as unknown as ProtoGrpcType

const client = new grpcObj.randomPackage.Random(`0.0.0.0:${PORT}`, grpc.credentials.createInsecure())

const deadline = new Date()

deadline.setSeconds(deadline.getSeconds() + 5)
client.waitForReady(deadline, err => {
  if (err) return console.log(err)
  onClientReady()
})

function onClientReady() {
  client.PingPong({ message: 'Ping' }, (res, err) => {
    if (err) return console.error(err)
    console.log(res)
  })
}

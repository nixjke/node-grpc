import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import path from 'path'
import { ProtoGrpcType } from './proto/random'
import { listUsers, addUser } from './data'
import { User } from './proto/randomPackage/User'
import { Status } from './proto/randomPackage/Status'

const PORT = 9090
const PROTO_FILE = './proto/random.proto'

const packageDef = protoLoader.loadSync(path.resolve(__dirname, PROTO_FILE))
const grpcObj = grpc.loadPackageDefinition(packageDef) as unknown as ProtoGrpcType
const randomPackage = grpcObj.randomPackage

function main() {
  const server = getServer()

  server.bindAsync(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) return console.log(err)
    console.log(`Your server as started on port: ${port}`)
    server.start()
  })
}

// const callObjByUsername = new Map<string, grpc.ServerDuplexStream<ChatRequest, ChatResponse>>()

function getServer() {
  const server = new grpc.Server()
  server.addService(randomPackage.ChatService.service, {
    ChatInitiate: (call, callback) => {
      const sessionName = call.request.name || ''
      const avatar = call.request.avatarUrl || ''
      if (!sessionName || !avatar) callback(new Error('Name and avatar required'))

      listUsers((err, users) => {
        if (err) return callback(err)
        const dbUser = users.find(u => u.name?.toLowerCase() === sessionName)
        if (!dbUser) {
          const user: User = {
            id: Math.floor(Math.random() * 10000),
            status: Status.ONLINE,
            name: sessionName,
            avatar: avatar,
          }
          addUser(user, err => {
            if (err) return callback(err)
            return callback(null, { id: user.id })
          })
        }

        if (dbUser?.status === Status.ONLINE) {
          return callback(new Error('User exist and is online'))
        }

        dbUser!.status = Status.ONLINE
      })

      callback(null, { id: Math.floor(Math.random() * 10000) })
    },
  })

  return server
}

main()

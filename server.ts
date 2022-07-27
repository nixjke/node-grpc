import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import path from 'path'
import { ProtoGrpcType } from './proto/random'
import { listUsers, addUser, updateUser, getUser, addMessageToRoom, listMessagesInRoom } from './data'
import { User } from './proto/randomPackage/User'
import { Status } from './proto/randomPackage/Status'
import { ChatServiceHandlers } from './proto/randomPackage/ChatService'
import { StreamMessage } from './proto/randomPackage/StreamMessage'
import { StreamRequest, StreamRequest__Output } from './proto/randomPackage/StreamRequest'
import { UserStreamResponse } from './proto/randomPackage/UserStreamResponse'

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

const callObjByUserId = new Map<number, grpc.ServerWritableStream<StreamRequest__Output, StreamMessage>>()
const messageStreamByUserId = new Map<number, grpc.ServerWritableStream<StreamRequest__Output, StreamMessage>>()

function getServer() {
  const server = new grpc.Server()
  server.addService(randomPackage.ChatService.service, {
    ChatInitiate: (call: any, callback: any) => {
      const sessionName = call.request.name || ''
      const avatar = call.request.avatarUrl || ''
      if (!sessionName || !avatar) callback(new Error('Name and avatar required'))

      listUsers((err, users) => {
        if (err) return callback(err)
        const dbUser = users.find(u => u.name?.toLowerCase() === sessionName)
        if (dbUser === undefined) {
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
        } else {
          console.log(dbUser)
          if (dbUser.status === Status.ONLINE) {
            console.log('error')
            callback(new Error('User exist and is online'))
            return
          }

          dbUser.status = Status.ONLINE
          updateUser(dbUser!, err => {
            if (err) return callback(err)

            return callback(null, { id: dbUser.id })
          })
        }
      })
    },
    SendMessage: (call, callback) => {
      const { id = -1, message = '' } = call.request
      if (!id || !message) return callback(new Error('IDK WHO YOU ARE'))

      getUser(id, (err, user) => {
        if (err) return callback(err)
        const msg: StreamMessage = {
          userId: user.id!,
          message: message,
          userAvatar: user.avatar!,
        }
        addMessageToRoom(msg, err => callback(err))
      })
    },

    ChatStream: call => {
      const { id = -1 } = call.request
      if (!id) return call.end()
      getUser(id, (err, user) => {
        if (err) return call.end()
        listMessagesInRoom((err, msgs) => {
          if (err) call.end()
          for (const msg of msgs) {
            call.write(msg)
          }
          messageStreamByUserId.set(user.id!, call)
        })
        call.on('cancelled', () => {
          user.status = Status.OFFLINE
          updateUser(user, err => {
            if (err) console.error(err)
            messageStreamByUserId.set(user.id!, call)
          })
        })
      })
    },
    UserStream: call => {
      const { id = -1 } = call.request
      if (!id) return call.end()
      getUser(id, (err, user) => {
        if (err) return call.end()
        listUsers((err, users) => {
          if (err) call.end()
          call.write({ users: users })
          messageStreamByUserId.set(user.id!, call)
        })
      })
    },
  } as ChatServiceHandlers)

  return server
}

main()

import redis from 'redis'
import { User } from './proto/randomPackage/User'

const client = redis.createClient()

client.on('error', console.error)
client.on('connect', console.log)

const REDIST_KEYS = {
  broadcastRoom: 'room:0:messages',
  users: 'users',
}

type ErrCB<T> = (err: Error | null, data: T) => void

export const addUser = (user: User, fn?: ErrCB<number>) => {
  client.rpush(REDIST_KEYS.users, JSON.stringify(user), fn)
}

export const listUsers = (fn: ErrCB<Array<User>>) => {
  client.lrange(REDIST_KEYS.users, 0, -1, (err, rows) => {
    if (err) return fn(err, [])
    const users: Array<User> = []
    for (const row of rows) {
      const user = JSON.parse(row) as User
      users.push(user)
    }
    fn(err, users)
  })
}

export const updateUser = (user: User, fn: ErrCB<unknown>) => {
  listUsers((err, users) => {
    if (err) return fn(err, null)
    const i = users.findIndex(u => u.id === user.id)
    if (i === -1) return fn(new Error('User was not found'), null)
    client.lset(REDIST_KEYS.users, i, JSON.stringify(user), fn)
  })
}

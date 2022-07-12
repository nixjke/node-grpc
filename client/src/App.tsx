import React from 'react'
import logo from './logo.svg'
import './App.css'

import { InitiateRequest } from './proto/random_pb'
import { ChatServiceClient } from './proto/RandomServiceClientPb'

function App() {
  React.useEffect(() => {
    ;(async () => {
      const client = new ChatServiceClient('http://localhost:8080')
      const req = new InitiateRequest()
      req.setName('Sage')
      req.setAvatarUrl('avatar url')

      const respone = await client.chatInitiate(req, {}, function(err, response) {
        if (err) return console.error(err)
        console.log(response)
      })

      console.log(respone)
    })()
  }, [])

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a className="App-link" href="https://reactjs.org" target="_blank" rel="noopener noreferrer">
          Learn React
        </a>
      </header>
    </div>
  )
}

export default App

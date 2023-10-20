import React from 'react'
import ReactDOM from 'react-dom/client'

import './demo.css'
import Message, { IMessageProps } from './Message.tsx'

const messages: IMessageProps[] = [
  {
    source: 'bot',
    content:  {
      text: 'Hello, how can I help you?',
    },
  },
  {
    source: 'user',
    content: {
      text: 'I have a problem with my order',
    },
  },
  {
    source: 'bot',
    content:  {
      text: 'Sorry to here that. That sounds like a perfect time to test multiline message rendering, don\'t you think?',
    },
  },
]

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {messages.map(((message, index) => (<Message key={index} {...message} />)))}
  </React.StrictMode>,
)

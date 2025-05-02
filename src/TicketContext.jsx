// src/TicketContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const TicketContext = createContext()

export function TicketProvider({ children }) {
  const [tickets, setTickets] = useState({ open: [], 'in progress': [], resolved: [] })

  // Load tickets once
  useEffect(() => {
    axios.get('http://localhost:8000/tickets')
      .then(r => {
        const groups = { open: [], 'in progress': [], resolved: [] }
        r.data.forEach(t => groups[t.status.toLowerCase()]?.push(t))
        setTickets(groups)
      })
      .catch(console.error)
  }, [])

  // Create a new ticket
  function createTicket(payload) {
    return axios.post('http://localhost:8000/tickets', payload)
      .then(resp => {
        setTickets(old => ({ ...old, open: [resp.data, ...old.open] }))
        return resp.data
      })
  }

  return (
    <TicketContext.Provider value={{ tickets, createTicket }}>
      {children}
    </TicketContext.Provider>
  )
}

export function useTickets() {
  return useContext(TicketContext)
}

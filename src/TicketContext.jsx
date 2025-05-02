import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const TicketContext = createContext()

export function TicketProvider({ children }) {
  const [tickets, setTickets] = useState({ open: [], 'in progress': [], resolved: [] })
  const [archivedTickets, setArchivedTickets] = useState([])

  useEffect(() => {
    axios.get('http://localhost:8000/tickets')
      .then(r => {
        const groups = { open: [], 'in progress': [], resolved: [] }
        r.data.forEach(t => {
          t.submittedBy = t.submitted_by;
          const key = t.status.toLowerCase()
          if (groups[key]) groups[key].push(t)
        })
        setTickets(groups)
      })
      .catch(console.error)
  }, [])

  function createTicket(payload) {
    return axios
      .post('http://localhost:8000/tickets', payload)
      .then(resp => {
        const t = resp.data
        t.submittedBy = t.submitted_by;
        setTickets(old => ({ ...old, open: [t, ...(old.open || [])] }))
        return t
      })
  }

  return (
    <TicketContext.Provider value={{
      tickets,
      setTickets,
      archivedTickets,
      setArchivedTickets,
      createTicket
    }}>
      {children}
    </TicketContext.Provider>
  )
}

export function useTickets() {
  return useContext(TicketContext)
}

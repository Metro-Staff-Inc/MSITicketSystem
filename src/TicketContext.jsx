import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const TicketContext = createContext()

export function TicketProvider({ children }) {
  const [tickets, setTickets] = useState({ open: [], 'in progress': [], resolved: [] })
  const [archivedTickets, setArchivedTickets] = useState([])

  useEffect(() => {
    // 1️⃣ Who am I? (email + role from localStorage)
    const me   = localStorage.getItem('userEmail');
    const role = localStorage.getItem('role');
  
    // 2️⃣ Build the URL
    const url = role === 'admin'
      // admin sees *all* tickets
      ? 'http://localhost:8000/tickets'
      // others only see their own
      : `http://localhost:8000/tickets?user_email=${encodeURIComponent(me)}`;
  
    console.log('Fetching tickets from:', url);
  
    axios.get(url)
      .then(r => {
        console.log('Got tickets:', r.data.length);
        const groups = { open: [], 'in progress': [], resolved: [] };
        r.data.forEach(t => {
          t.submittedBy = t.submitted_by;
          t.created     = t.created_at;
          t.updated     = t.updated_at;
          const key = t.status.toLowerCase();
          if (groups[key]) groups[key].push(t);
        });
        setTickets(groups);
      })
      .catch(console.error);
  }, []);
  
  
  
  

  function createTicket(payload) {
    return axios
      .post('http://localhost:8000/tickets', payload)
      .then(resp => {
        const t = resp.data
        t.submittedBy = t.submitted_by
        t.created     = t.created_at
        t.updated     = t.updated_at
        setTickets(old => ({ ...old, open: [t, ...(old.open || [])] }))
        return t
      })
  }

  function updateTicket(id, changes) {
    return axios
      .patch(`http://localhost:8000/tickets/${id}`, changes)
      .then(resp => {
        const t = resp.data
        t.submittedBy = t.submitted_by
        t.created     = t.created_at
        t.updated     = t.updated_at

        // replace ticket inside the correct bucket
        setTickets(prev => {
          const buckets = {}
          for (const k of Object.keys(prev)) {
            buckets[k] = prev[k].map(x => x.id === id ? t : x)
          }
          return buckets
        })

        return t
      })
  }

  return (
    <TicketContext.Provider value={{
      tickets,
      setTickets,
      archivedTickets,
      setArchivedTickets,
      createTicket,
      updateTicket,
    }}>
      {children}
    </TicketContext.Provider>
  )
}

export function useTickets() {
  return useContext(TicketContext)
}

import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE = "https://ticketing-api-z0gp.onrender.com";

const TicketContext = createContext()

function fetchMyTickets(setTickets) {
  const me   = localStorage.getItem('userEmail') || '';
  const role = localStorage.getItem('role');
  console.log('fetchMyTickets sees role:', role, 'and userEmail:', me)


    // only admins see everything
    const url = (role === 'admin')
      ? 'https://ticketing-api-z0gp.onrender.com/tickets'
      : `https://ticketing-api-z0gp.onrender.com/tickets?user_email=${encodeURIComponent(me)}`;


  axios.get(url)
    .then(r => {
      const groups = { open: [], 'in progress': [], resolved: [] };
      r.data.forEach(t => {
        t.submittedBy = t.submitted_by;
        t.assignedTo    = t.assigned_to;
        t.created     = t.created_at;
        t.updated     = t.updated_at;
        const key = t.status.toLowerCase();
        if (groups[key]) groups[key].push(t);
      });
      setTickets(groups);
    })
    .catch(console.error);
}


export function TicketProvider({ children }) {
  const [tickets, setTickets] = useState({ open: [], 'in progress': [], resolved: [] })
  const [archivedTickets, setArchivedTickets] = useState([])

  useEffect(() => {
    // 1️⃣ Who am I? (email + role from localStorage)
    const me   = localStorage.getItem('userEmail') || '';
    const role = localStorage.getItem('role');
  
    // 2️⃣ Build the URL
    let url = `${API_BASE}/tickets`;
    if (role !== 'admin' && me) {
      url += `?user_email=${encodeURIComponent(me)}`;
    }


  
    console.log('Fetching tickets from:', url);
  
    axios.get(url)
      .then(r => {
        console.log('Got tickets:', r.data.length);
        const groups = { open: [], 'in progress': [], resolved: [] };
        r.data.forEach(t => {
          t.submittedBy = t.submitted_by;
          t.assignedTo = t.assigned_to;
          t.created     = t.created_at;
          t.updated     = t.updated_at;
          const key = t.status.toLowerCase();
          if (groups[key]) groups[key].push(t);
        });
        setTickets(groups);
      })
      .catch(console.error);
  }, [localStorage.getItem('userEmail')])
  
  
  
  

  function createTicket(payload) {
    return axios
      .post('https://ticketing-api-z0gp.onrender.com/tickets', payload)
      .then(resp => {
        const t = resp.data
        t.submittedBy = t.submitted_by
        t.created     = t.created_at
        t.updated     = t.updated_at
        setTickets(old => ({ ...old, open: [t, ...(old.open || [])] }))
        fetchMyTickets(setTickets);
        return t
      });
  }

  function updateTicket(id, changes) {
    return axios
      .patch(`https://ticketing-api-z0gp.onrender.com/tickets/${id}`, changes)
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
  
        // reload full list after updating
        fetchMyTickets(setTickets)
  
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
      reloadTickets: () => fetchMyTickets(setTickets)   // ← add this line
    }}>
      {children}
    </TicketContext.Provider>
  )

}

export function useTickets() {
  return useContext(TicketContext)
}

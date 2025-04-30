// TicketContext.jsx
import React, { createContext, useContext, useState } from 'react';

const TicketContext = createContext();

export const TicketProvider = ({ children }) => {
  const [tickets, setTickets] = useState([]);
  const [archivedTickets, setArchivedTickets] = useState([]);

  return (
    <TicketContext.Provider value={{
      tickets, setTickets,
      archivedTickets, setArchivedTickets
    }}>
      {children}
    </TicketContext.Provider>
  );
};

export const useTickets = () => useContext(TicketContext);

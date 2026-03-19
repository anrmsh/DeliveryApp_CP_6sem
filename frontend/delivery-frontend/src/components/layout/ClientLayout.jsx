import { createContext, useState } from "react";
import ClientSidebar from "../client/ClientSidebar";
import "../../styles/client/ClientLayout.css";

export const SidebarContext = createContext({ open: true, setOpen: () => {} });

export default function ClientLayout({ children }) {
  const [open, setOpen] = useState(true);

  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      <div className="client-layout">
        <ClientSidebar open={open} setOpen={setOpen} />
        <div
          className="client-content"
          style={{ marginLeft: open ? "260px" : "70px", transition: "margin-left 0.3s" }}
        >
          {children}
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
import { createContext, useState } from "react";
import LogistSidebar from "../LogistSidebar";
import "../../styles/logist/LogistLayout.css";

export const LogistSidebarContext = createContext({ open: true, setOpen: () => {} });

export default function LogistLayout({ children }) {
  const [open, setOpen] = useState(true);

  return (
    <LogistSidebarContext.Provider value={{ open, setOpen }}>
      <div className="lg-layout">
        <LogistSidebar open={open} setOpen={setOpen} />
        <div
          className="lg-content"
          style={{ marginLeft: open ? "260px" : "70px", transition: "margin-left 0.3s" }}
        >
          {children}
        </div>
      </div>
    </LogistSidebarContext.Provider>
  );
}
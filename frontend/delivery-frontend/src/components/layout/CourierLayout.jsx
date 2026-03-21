import { createContext, useState } from "react";
import CourierSidebar from "../../components/courier/CourierSidebar";
import "../../styles/courier/CourierLayout.css";

export const CourierSidebarCtx = createContext({ open: true, setOpen: () => {} });

export default function CourierLayout({ children }) {
  const [open, setOpen] = useState(true);
  return (
    <CourierSidebarCtx.Provider value={{ open, setOpen }}>
      <div className="cl-layout">
        <CourierSidebar open={open} setOpen={setOpen} />
        <div className="cl-content"
          style={{ marginLeft: open ? "260px" : "70px", transition: "margin-left 0.3s" }}>
          {children}
        </div>
      </div>
    </CourierSidebarCtx.Provider>
  );
}
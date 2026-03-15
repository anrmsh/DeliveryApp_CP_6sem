// import Sidebar from "./Sidebar";

// export default function DashboardLayout({ children }) {
//   return (
//     <div className="dashboard">

//       <Sidebar />

//       <main className="content">
//         {children}
//       </main>

//     </div>
//   );
// }
// DashboardLayout.jsx
import { useState } from "react";
import Sidebar from "./Sidebar";

export default function DashboardLayout({ children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="dashboard">
      <Sidebar open={open} toggle={() => setOpen(!open)} />
      <main className={`content ${open ? "sidebar-open" : ""}`}>
        {children}
      </main>
    </div>
  );
}
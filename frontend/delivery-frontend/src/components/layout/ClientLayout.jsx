import ClientSidebar from "../components/client/ClientSidebar";
import "../styles/ClientLayout.css";

export default function ClientLayout({ children }) {
  return (
    <div className="client-layout">
      <ClientSidebar />
      <div className="client-content">{children}</div>
    </div>
  );
}
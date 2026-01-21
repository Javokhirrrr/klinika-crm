import { Outlet } from "react-router-dom";
import Nav from "../components/Nav";

export default function PrivateLayout() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <Nav />
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

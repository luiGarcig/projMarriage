import { Outlet, Link } from "@tanstack/react-router"
import "./style.css"

export default function App() {
  return (
    <>
      <nav className="navbar">
        <span className="navbar-brand">Marillyn & Edir</span>
     </nav>

      <main className="container">
        <Outlet />
      </main>
    </>
  )
}

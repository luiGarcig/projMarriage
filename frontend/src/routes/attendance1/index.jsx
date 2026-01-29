import { useState } from "react"
import "./style.css"
import { createFileRoute, useNavigate } from "@tanstack/react-router"

export const Route = createFileRoute("/attendance1/")({
  component: Attendance1,
})

function Attendance1() {
  const [name, setName] = useState("")

  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()

    if(name.trim() === ""){
      alert("Por favor, preencha pelo menos um nome.")
      return
    }
    console.log(name.trim())

    navigate({ to: "/giftList"})
  }

  return (
    <div className="rsvp-container">
      <h3 className="rsvp-title">Confirme sua Presença</h3>

      <p className="rsvp-instruction">
        Por favor, digite os nomes completos.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nome do Convidado</label>
            <div className="guest-input-group">
              <input
                type="text"
                placeholder={`Nome Completo`}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
        </div>

        <button type="submit" className="btn-confirm">
          Confirmar Tudo
        </button>
      </form>
    </div>
  )
}



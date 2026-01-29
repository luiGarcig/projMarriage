

import { useState } from "react"
import "./style.css"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/attendance3/")({
  component: Attendance3,
})

function Attendance3() {
  const [names, setNames] = useState(["", "", ""])

  const handleNameChange = (index, value) => {
    const updated = [...names]
    updated[index] = value
    setNames(updated)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const validNames = names.filter((name) => name.trim() !== "")

    if (validNames.length === 0) {
      alert("Por favor, preencha pelo menos um nome.")
      return
    }

    console.log(validNames)
  }

  return (
    <div className="rsvp-container">
      <h3 className="rsvp-title">Confirme sua Presença</h3>

      <p className="rsvp-instruction">
        Por favor, digite os nomes completos.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nomes dos Convidados</label>

          {names.map((name, index) => (
            <div key={index} className="guest-input-group">
              <input
                type="text"
                placeholder={`Nome Completo`}
                value={name}
                onChange={(e) =>
                  handleNameChange(index, e.target.value)
                }
              />
            </div>
          ))}
        </div>

        <button type="submit" className="btn-confirm">
          Confirmar Tudo
        </button>
      </form>
    </div>
  )
}



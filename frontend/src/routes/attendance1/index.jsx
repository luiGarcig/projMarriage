import { useState } from "react"
import "./style.css"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { apiPost } from "../../services/api";

export const Route = createFileRoute("/attendance1/")({
  component: Attendance1,
})

function Attendance1() {
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    const cleanName = name.trim();
    if (cleanName === "") {
      alert("Por favor, preencha pelo menos um nome.");
      return;
    }

    try {
      setLoading(true);

      const data = await apiPost("/api/visits", { name: cleanName });
      console.log("visit_id:", data.visit_id);

      localStorage.setItem("visit_id", data.visit_id);
      localStorage.setItem("visit_name", cleanName);

      navigate({ to: "/giftList" });
    } catch (err) {
      console.error(err);
      alert("Não foi possível confirmar agora. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

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
                disabled={loading}
              />
            </div>
        </div>

        <button type="submit" className="btn-confirm" disabled={loading}>
          {loading ? "Enviando..." : "Confirmar Tudo"}
        </button>
      </form>
    </div>
  )
}



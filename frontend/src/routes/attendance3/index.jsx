
import { useState } from "react";
import "./style.css";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { apiPost } from "../../services/api"; // ajuste o caminho se necessário

export const Route = createFileRoute("/attendance3/")({
  component: Attendance3,
});

function Attendance3() {
  const [names, setNames] = useState(["", "", ""]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleNameChange = (index, value) => {
    const updated = [...names];
    updated[index] = value;
    setNames(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validNames = names.map((n) => n.trim()).filter((n) => n !== "");

    if (validNames.length === 0) {
      alert("Por favor, preencha pelo menos um nome.");
      return;
    }

    try {
      setLoading(true);

      // envia todos os convidados
      const results = await Promise.all(
        validNames.map((n) => apiPost("/api/visits", { name: n }))
      );

      const visitIds = results.map((r) => r.visit_id);

      localStorage.setItem("visit_ids", JSON.stringify(visitIds));
      localStorage.setItem("visit_names", JSON.stringify(validNames));

      console.log("visit_ids:", visitIds);

      navigate({ to: "/giftList" });
    } catch (err) {
      console.error(err);
      alert("Erro ao confirmar presença. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rsvp-container">
      <h3 className="rsvp-title">Confirme sua Presença</h3>

      <p className="rsvp-instruction">Por favor, digite os nomes completos.</p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nomes dos Convidados</label>

          {names.map((name, index) => (
            <div key={index} className="guest-input-group">
              <input
                type="text"
                placeholder="Nome Completo"
                value={name}
                disabled={loading}
                onChange={(e) => handleNameChange(index, e.target.value)}
              />
            </div>
          ))}
        </div>

        <button type="submit" className="btn-confirm" disabled={loading}>
          {loading ? "Enviando..." : "Confirmar Tudo"}
        </button>
      </form>
    </div>
  );
}


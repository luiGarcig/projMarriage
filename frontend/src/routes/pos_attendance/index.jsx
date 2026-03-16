
import { useState } from "react";
import "./style.css";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SuccessIcon from "../../assets/success.svg?react";

export const Route = createFileRoute("/pos_attendance/")({
  component: Pos_attendance,
});

function Pos_attendance() {
  const navigate = useNavigate();

  return (
    <div className="rsvp-container">
      <h3 className="rsvp-title">Presença Confirmada</h3>
      <SuccessIcon className="rsvp-imageA" />
      <h4 className="rsvp-text">Os nomes foram confirmados, você será direcionado para escolher o presente de casamento</h4>
      <button type="submit" className="btn-back" onClick={() => navigate({ to: "/giftList" })}>
        OK
      </button>
    </div>
  );
}




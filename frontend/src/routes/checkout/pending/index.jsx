import { useState } from "react";
import "./style.css";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import PendingIcon from "../../../assets/pending.svg?react";

export const Route = createFileRoute("/checkout/pending/")({
  component: Pending,
});

function Pending() {
  const navigate = useNavigate();

  return (
    <div className="rsvp-container">
      <h3 className="rsvp-title">Pagamento sendo validado</h3>
      <PendingIcon className="rsvp-imageP" />
   </div>
 
  );
}



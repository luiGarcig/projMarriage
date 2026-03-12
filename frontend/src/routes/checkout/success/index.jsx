
import { useState } from "react";
import "./style.css";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SuccessIcon from "../../../assets/success.svg?react";

export const Route = createFileRoute("/checkout/success/")({
  component: Success,
});

function Success() {
  const navigate = useNavigate();

  return (
    <div className="rsvp-container">
      <h3 className="rsvp-title">Presença Confirmada</h3>
      <SuccessIcon className="rsvp-imageS" />
      <h4 className="rsvp-text">Deu tudo certo, sua presença esta confirmada e seu presente garantido. Muito obrigado</h4>
   </div>
 
  );
}



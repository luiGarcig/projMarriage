import { createFileRoute } from '@tanstack/react-router'
import "./style.css";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute('/checkout/failure/')({
  component: Failure,
})

function Failure() {

    const navigate = useNavigate();
    
    return (
        <div className="rsvp-container">
            <h3 className="rsvp-title">Pagamento invalido</h3>
            <img src="/failure.svg" className="rsvp-image"/>
            <h4 className="rsvp-text">Por favor, selecione novamente o produto e coloque um pagamento valido</h4>

            <button type="submit" className="btn-back" onClick={() => navigate({ to: "/giftList" })}>
                voltar
            </button>
 
        </div>
    );
}

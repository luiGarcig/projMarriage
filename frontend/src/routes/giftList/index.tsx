import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../../services/api";
import "./style.css";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/giftList/")({
  component: GiftListPage,
});



function GiftListPage() {
  const [gifts, setGifts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingOutGiftId, setCheckingOutGiftId] = useState(null);

  /* ---------------- Pagination helpers ---------------- */

  function formatPriceBRL(value: number) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value / 100);
  }

  function getPageItems(current, total) {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const items = [];
    const left = Math.max(2, current - 1);
    const right = Math.min(total - 1, current + 1);

    items.push(1);

    if (left > 2) items.push("...");

    for (let p = left; p <= right; p++) items.push(p);

    if (right < total - 1) items.push("...");

    items.push(total);
    return items;
  }

  /* ---------------- Data loading ---------------- */

  async function loadGifts(page = 1) {
    setLoading(true);
    try {
      const res = await apiGet(`/api/gifts?page=${page}&limit=20`);
      setGifts(res.data);
      setPagination(res.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGifts(1);
  }, []);

  /* ---------------- Visit helpers ---------------- */

  function getVisitIdFromStorage() {
    const single = localStorage.getItem("visit_id");
    if (single) return single;

    const listRaw = localStorage.getItem("visit_ids");
    if (listRaw) {
      try {
        const arr = JSON.parse(listRaw);
        if (Array.isArray(arr) && arr.length > 0) return arr[0];
      } catch {}
    }

    return null;
  }

  /* ---------------- Checkout ---------------- */

  async function handleCheckout(giftId) {
    const visitId = getVisitIdFromStorage();
    if (!visitId) {
      alert("Não encontrei sua confirmação de presença. Volte e confirme primeiro.");
      return;
    }

    try {
      setCheckingOutGiftId(giftId);

      const res = await apiPost("/api/checkout/create", {
        visit_id: visitId,
        gift_id: giftId,
      });

      if (!res?.init_point) {
        throw new Error("Resposta sem init_point");
      }

      window.location.href = res.init_point;
    } catch (err) {
      console.error(err);
      alert("Erro ao iniciar checkout. Tente novamente.");
    } finally {
      setCheckingOutGiftId(null);
    }
  }

  /* ---------------- Render ---------------- */

  return (
    <div className="giftContainer">
      <h3 className="giftTitle">Escolha o presente</h3>

      {loading && <p>Carregando...</p>}

      <div className="products">
        {gifts.map((gift) => (
          <div key={gift.id} className="productCard">
            <img src={`/images/${gift.image}`} alt={gift.name} />
            <h1>{gift.name}</h1>           
            <h1>{formatPriceBRL(gift.price)}</h1>

            <button
              className="btn-confirm"
              onClick={() => handleCheckout(gift.id)}
              disabled={checkingOutGiftId === gift.id}
            >
              {checkingOutGiftId === gift.id ? "Redirecionando..." : "Comprar"}
            </button>
          </div>
        ))}
      </div>

      {pagination && (
        <div className="paginationWrap">
          <div className="paginationBar">
            <button
              className="pageBtn"
              disabled={!pagination.hasPrev}
              onClick={() => loadGifts(pagination.page - 1)}
            >
              ‹ Anterior
            </button>

            <div className="pageNumbers">
              {getPageItems(pagination.page, pagination.totalPages).map((item, idx) =>
                item === "..." ? (
                  <span key={`dots-${idx}`} className="pageDots">…</span>
                ) : (
                  <button
                    key={item}
                    className={`pageNum ${item === pagination.page ? "active" : ""}`}
                    onClick={() => loadGifts(item)}
                    aria-current={item === pagination.page ? "page" : undefined}
                  >
                    {item}
                  </button>
                )
              )}
            </div>

            <button
              className="pageBtn"
              disabled={!pagination.hasNext}
              onClick={() => loadGifts(pagination.page + 1)}
            >
              Próxima ›
            </button>
          </div>

          <div className="paginationMeta">
            Página <strong>{pagination.page}</strong> de{" "}
            <strong>{pagination.totalPages}</strong>
          </div>
        </div>
      )}
    </div>
  );
}


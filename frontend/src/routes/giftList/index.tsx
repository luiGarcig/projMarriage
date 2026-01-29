import { useState } from 'react'
import "./style.css"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/giftList/")({
  component: GiftListPage,
})

function GiftListPage() {
  return (
    <>
        <div className="rsvp-container">
          <h3 className="rsvp-title">Escolha o presente</h3>

       </div>
    </>
  )
}

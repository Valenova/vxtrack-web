import { db } from "./firebase-config.js";
import { ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const phoneInput = document.getElementById("phoneInput");
const createBtn = document.getElementById("createLinkBtn");
const shareLinkInput = document.getElementById("shareLink");
const copyBtn = document.getElementById("copyBtn");
const waBtn = document.getElementById("waBtn");
const statusText = document.getElementById("statusText");
const topStatus = document.getElementById("topStatus");

let map, marker, polyline;

if (document.getElementById("map") && typeof L !== "undefined") {
  map = L.map("map").setView([-6.2, 106.8166], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap"
  }).addTo(map);
  polyline = L.polyline([], { color: "#38bdf8", weight: 4 }).addTo(map);
}

function makeSessionId() {
  return "vx_" + Math.random().toString(36).substring(2, 9);
}

if (createBtn) {
  createBtn.addEventListener("click", async () => {
    const phone = (phoneInput?.value || "").trim();
    if (!phone) {
      alert("Isi nomor HP dulu.");
      return;
    }

    const sessionId = makeSessionId();
    const baseUrl = window.location.origin + window.location.pathname.replace(/index\.html$/i, "");
    const cleanBase = baseUrl.endsWith("/") ? baseUrl : baseUrl + "/";
    const link = `${cleanBase}share.html?session=${sessionId}`;

    if (shareLinkInput) shareLinkInput.value = link;
    if (topStatus) topStatus.textContent = "Membuat...";

    try {
      await set(ref(db, "sessions/" + sessionId), {
        phone,
        status: "Menunggu Persetujuan",
        createdAt: Date.now()
      });

      if (topStatus) topStatus.textContent = "Aktif";
      if (statusText) {
        statusText.innerHTML = `Target: <b>${phone}</b> | Status: Menunggu Persetujuan`;
      }

      listenSession(sessionId, phone);
    } catch (err) {
      if (topStatus) topStatus.textContent = "Error DB";
      alert("Gagal simpan ke Firebase: " + (err?.message || err));
    }
  });
}

function listenSession(sessionId, phone) {
  onValue(ref(db, "sessions/" + sessionId), (snap) => {
    const data = snap.val();
    if (!data) return;

    if (statusText) {
      statusText.innerHTML = `Target: <b>${phone}</b> | Status: <b>${data.status || "Aktif"}</b>`;
    }

    if (typeof data.lat === "number" && typeof data.lng === "number" && map) {
      const latlng = [data.lat, data.lng];
      if (!marker) {
        marker = L.marker(latlng).addTo(map);
      } else {
        marker.setLatLng(latlng);
      }
      polyline.addLatLng(latlng);
      map.setView(latlng, 16);
    }
  });
}

if (copyBtn && shareLinkInput) {
  copyBtn.addEventListener("click", () => {
    if (!shareLinkInput.value) return;
    navigator.clipboard?.writeText(shareLinkInput.value);
    alert("Tautan disalin.");
  });
}

if (waBtn && shareLinkInput) {
  waBtn.addEventListener("click", () => {
    if (!shareLinkInput.value) return;
    const msg = encodeURIComponent(`Halo, buka tautan berbagi lokasi ini: ${shareLinkInput.value}`);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  });
}

import { db } from "./firebase-config.js";
import { ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const map = L.map("map").setView([-6.2088, 106.8456], 13);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

let marker = null;
const historyPolyline = L.polyline([], { color: "#00d2ff", weight: 4 }).addTo(map);
let previousStatus = null;
let unsubscribeSession = null;

const phoneInput = document.getElementById("phoneInput");
const createLinkBtn = document.getElementById("createLinkBtn");
const linkResult = document.getElementById("linkResult");
const generatedUrl = document.getElementById("generatedUrl");
const copyBtn = document.getElementById("copyBtn");
const waShareBtn = document.getElementById("waShareBtn");
const targetPhoneEl = document.getElementById("targetPhone");
const sessionStatusEl = document.getElementById("sessionStatus");
const lastUpdateEl = document.getElementById("lastUpdate");
const connectionStatusEl = document.getElementById("connectionStatus");

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.style.display = "block";
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.style.display = "none";
  }, 4500);
}

function generateSessionId() {
  return "VX-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

function buildShareUrl(sessionId) {
  const cleanPath = window.location.pathname.endsWith("/")
    ? window.location.pathname
    : window.location.pathname.replace(/[^/]*$/, "");
  return `${window.location.origin}${cleanPath}share.html?id=${sessionId}`;
}

createLinkBtn.addEventListener("click", async () => {
  const rawPhone = phoneInput.value.trim();
  if (!rawPhone) {
    showToast("Masukkan nomor HP terlebih dahulu.");
    phoneInput.focus();
    return;
  }

  createLinkBtn.disabled = true;
  try {
    const sessionId = generateSessionId();
    const sessionRef = ref(db, `sessions/${sessionId}`);

    await set(sessionRef, {
      phoneNumber: rawPhone,
      createdAt: Date.now(),
      status: "waiting"
    });

    const shareLink = buildShareUrl(sessionId);
    generatedUrl.value = shareLink;
    linkResult.style.display = "block";
    targetPhoneEl.textContent = rawPhone;
    lastUpdateEl.textContent = "Update: -";
    previousStatus = "waiting";

    if (marker) {
      map.removeLayer(marker);
      marker = null;
    }
    historyPolyline.setLatLngs([]);

    listenToSession(sessionId);
    showToast(`Tautan VXTRACK dibuat untuk ${rawPhone}`);
  } catch (err) {
    console.error(err);
    showToast("Gagal membuat sesi. Cek konfigurasi Firebase.");
  } finally {
    createLinkBtn.disabled = false;
  }
});

function listenToSession(sessionId) {
  if (typeof unsubscribeSession === "function") {
    unsubscribeSession();
  }

  const sessionRef = ref(db, `sessions/${sessionId}`);
  connectionStatusEl.textContent = "Terhubung";
  connectionStatusEl.className = "badge badge-active";

  unsubscribeSession = onValue(sessionRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    if (previousStatus !== data.status) {
      if (data.status === "active") {
        showToast(`${data.phoneNumber} mulai membagikan lokasi.`);
      } else if (data.status === "stopped") {
        showToast(`${data.phoneNumber} berhenti membagikan lokasi.`);
      }
      previousStatus = data.status;
    }

    if (data.status === "waiting") {
      sessionStatusEl.textContent = "Menunggu Persetujuan";
      sessionStatusEl.className = "badge badge-waiting";
    } else if (data.status === "active") {
      sessionStatusEl.textContent = "Aktif Berbagi";
      sessionStatusEl.className = "badge badge-active";
    } else if (data.status === "stopped") {
      sessionStatusEl.textContent = "Dihentikan Pengguna";
      sessionStatusEl.className = "badge badge-stopped";
    }

    if (data.currentLocation) {
      const { lat, lng, accuracy, updatedAt } = data.currentLocation;
      const latLng = [lat, lng];
      const popupText = `<b>${data.phoneNumber}</b><br>Akurasi: &plusmn;${Math.round(accuracy)} m`;

      if (!marker) {
        marker = L.marker(latLng).addTo(map).bindPopup(popupText).openPopup();
        map.setView(latLng, 16);
      } else {
        marker.setLatLng(latLng);
        marker.setPopupContent(popupText);
        map.panTo(latLng);
      }

      if (updatedAt) {
        lastUpdateEl.textContent = `Update: ${new Date(updatedAt).toLocaleTimeString("id-ID")}`;
      }
    }

    if (data.history) {
      const coords = Object.values(data.history).map((item) => [item.lat, item.lng]);
      historyPolyline.setLatLngs(coords);
    }
  });
}

copyBtn.addEventListener("click", async () => {
  if (!generatedUrl.value) return;
  try {
    await navigator.clipboard.writeText(generatedUrl.value);
    showToast("Tautan berhasil disalin.");
  } catch {
    generatedUrl.select();
    document.execCommand("copy");
    showToast("Tautan disalin.");
  }
});

waShareBtn.addEventListener("click", () => {
  if (!generatedUrl.value) return;
  let phone = phoneInput.value.trim().replace(/[^0-9]/g, "");
  if (phone.startsWith("0")) {
    phone = "62" + phone.substring(1);
  }
  const message = encodeURIComponent(
    `Halo, silakan buka tautan berikut untuk membagikan lokasi Anda secara real-time:\n\n${generatedUrl.value}`
  );
  const waUrl = phone ? `https://wa.me/${phone}?text=${message}` : `https://wa.me/?text=${message}`;
  window.open(waUrl, "_blank", "noopener,noreferrer");
});

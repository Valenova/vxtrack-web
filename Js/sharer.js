// js/sharer.js
import { db } from "./firebase-config.js";
import { ref, update, push, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get("id");

const displaySessionId = document.getElementById("displaySessionId");
const statusMessage = document.getElementById("statusMessage");
const startShareBtn = document.getElementById("startShareBtn");
const stopShareBtn = document.getElementById("stopShareBtn");

let watchId = null;

async function init() {
  if (!sessionId) {
    statusMessage.textContent = "Tautan tidak valid: ID sesi tidak ditemukan.";
    statusMessage.style.color = "#ff3d57";
    startShareBtn.disabled = true;
    return;
  }

  displaySessionId.textContent = sessionId;

  try {
    const snap = await get(ref(db, `sessions/${sessionId}`));
    if (!snap.exists()) {
      statusMessage.textContent = "Sesi tidak ditemukan atau sudah berakhir.";
      statusMessage.style.color = "#ff3d57";
      startShareBtn.disabled = true;
    }
  } catch (err) {
    console.error(err);
    statusMessage.textContent = "Gagal memeriksa sesi. Cek koneksi atau Firebase.";
    statusMessage.style.color = "#ff3d57";
  }
}

init();

startShareBtn.addEventListener("click", () => {
  if (!("geolocation" in navigator)) {
    statusMessage.textContent = "Browser perangkat ini tidak mendukung GPS.";
    statusMessage.style.color = "#ff3d57";
    return;
  }

  startShareBtn.disabled = true;
  statusMessage.style.color = "#00d2ff";
  statusMessage.textContent = "Meminta izin lokasi dari perangkat...";

  watchId = navigator.geolocation.watchPosition(
    async (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      const now = Date.now();

      try {
        await update(ref(db, `sessions/${sessionId}`), {
          status: "active",
          currentLocation: {
            lat: latitude,
            lng: longitude,
            accuracy,
            updatedAt: now
          }
        });

        await push(ref(db, `sessions/${sessionId}/history`), {
          lat: latitude,
          lng: longitude,
          timestamp: now
        });

        statusMessage.textContent = "Lokasi aktif dibagikan secara real-time.";
        statusMessage.style.color = "#00e676";
        startShareBtn.style.display = "none";
        stopShareBtn.style.display = "block";
      } catch (err) {
        console.error(err);
        statusMessage.textContent = "Gagal mengirim lokasi ke database.";
        statusMessage.style.color = "#ff3d57";
      } finally {
        startShareBtn.disabled = false;
      }
    },
    (error) => {
      startShareBtn.disabled = false;
      statusMessage.style.color = "#ff3d57";
      if (error.code === error.PERMISSION_DENIED) {
        statusMessage.textContent = "Izin lokasi ditolak di browser.";
      } else {
        statusMessage.textContent = `Gagal mengambil lokasi: ${error.message}`;
      }
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000
    }
  );
});

stopShareBtn.addEventListener("click", async () => {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }

  try {
    await update(ref(db, `sessions/${sessionId}`), {
      status: "stopped"
    });
  } catch (err) {
    console.error(err);
  }

  statusMessage.textContent = "Berbagi lokasi telah dihentikan.";
  statusMessage.style.color = "#ff3d57";
  stopShareBtn.style.display = "none";
  startShareBtn.style.display = "block";
  startShareBtn.disabled = false;
  startShareBtn.textContent = "Mulai Berbagi Lagi";
});

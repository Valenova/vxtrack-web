const phoneInput = document.getElementById("phoneInput");
const createBtn = document.getElementById("createLinkBtn");
const shareLinkInput = document.getElementById("shareLink");
const copyBtn = document.getElementById("copyBtn");
const waBtn = document.getElementById("waBtn");
const statusText = document.getElementById("statusText");
const topStatus = document.getElementById("topStatus");
const notifBanner = document.getElementById("notifBanner");
const notifText = document.getElementById("notifText");
const notifClose = document.getElementById("notifClose");

function showNotif(msg, type = "success") {
  if (!notifBanner || !notifText) return;
  notifText.textContent = msg;
  notifBanner.className = `notif ${type}`;
}

notifClose?.addEventListener("click", () => {
  notifBanner?.classList.add("hidden");
});

if (document.getElementById("map") && typeof L !== "undefined") {
  const map = L.map("map").setView([-6.2, 106.8166], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap"
  }).addTo(map);
}

createBtn?.addEventListener("click", () => {
  const phone = (phoneInput?.value || "").trim();
  if (!phone) {
    showNotif("Isi nomor HP dulu!", "error");
    return;
  }

  const sessionId = "vx_" + Math.random().toString(36).substring(2, 8);
  const baseDir = window.location.pathname.replace(/[^/]*$/, "");
  const link = `${window.location.origin}${baseDir}share.html?session=${sessionId}`;

  if (shareLinkInput) {
    shareLinkInput.value = link;
  }
  if (topStatus) {
    topStatus.textContent = "Tautan Siap";
  }
  if (statusText) {
    statusText.innerHTML = `Target: <b>${phone}</b> | Status: Menunggu Persetujuan`;
  }

  showNotif("Berhasil! Tautan berhasil dibuat.", "success");
});

copyBtn?.addEventListener("click", async () => {
  if (!shareLinkInput?.value) {
    showNotif("Belum ada tautan untuk disalin.", "error");
    return;
  }
  try {
    await navigator.clipboard.writeText(shareLinkInput.value);
  } catch {
    shareLinkInput.select();
    document.execCommand("copy");
  }
  showNotif("Tautan berhasil disalin!", "success");
});

waBtn?.addEventListener("click", () => {
  if (!shareLinkInput?.value) {
    showNotif("Buat tautan dulu sebelum kirim ke WA.", "error");
    return;
  }
  const text = encodeURIComponent(`Buka tautan ini: ${shareLinkInput.value}`);
  window.open(`https://wa.me/?text=${text}`, "_blank");
});

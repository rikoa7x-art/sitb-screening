// content.js - Listener cadangan jika dipanggil via runtime message
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Ditangani langsung oleh executeScript di popup.js
  return true;
});

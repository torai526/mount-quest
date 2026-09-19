"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const startButton = document.getElementById("startBtn");
  const message = document.getElementById("message");

  if (!startButton || !message) {
    console.error("必要な画面要素が見つかりません。");
    return;
  }

  startButton.addEventListener("click", () => {
    message.textContent = "⚔️ 冒険の準備が整いました！";
  });
});

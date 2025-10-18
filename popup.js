// whenever the popup button is clicked, this code is run

function scanBtn() {
    console.log("button is scannign");
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("scanBtn");
  btn.addEventListener("click", () => {
    console.log("button is scanning");
    scanBtn();
  });
});
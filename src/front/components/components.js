// ----------------------------------------------------
fetch("card.html")
.then(response => {
  return response.text()
})
.then(data => {
  document.querySelector("card").innerHTML = data;
});
// ----------------------------------------------------
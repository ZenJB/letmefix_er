window.onload = () => {
  'use strict';

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
             .register('./sw.js');
  }
}

/** Detetar se o dispositivo não possui uma coneção à internet */
var page_content = '';
const fadeSpeed = 100;
window.addEventListener("load", () => {
  function handleNetworkChange(event) {
    if (navigator.onLine) {
      $("#container").fadeOut(fadeSpeed, ()=>{
        $("#container").html(page_content);
      });
      $("#container").fadeIn();
    } else {
      page_content = document.getElementById('container').innerHTML;
      $("#container").fadeOut(fadeSpeed, ()=>{
        $("#container").html('<img class="title_logo" src="/images/icon-152.png" alt="Logo"><br><p class="login_btn">Sem Internet.</p>');
      });
      $("#container").fadeIn();

    }
  }

  window.addEventListener("online", handleNetworkChange);
  window.addEventListener("offline", handleNetworkChange);
});

/** Forçar o protocolo HTTPS */
if (location.protocol != 'https:')
{
 location.href = 'https:' + window.location.href.substring(window.location.protocol.length);
}

$.ajax({
  url:'/testar_ligacao.html',
  type:'GET',
  success: (data) => {
    console.log("Detetada conecção a internet!");
  },
  error: (jqXHR, textStatus, errorThrown) => {
    console.log(errorThrown);
     console.log("Este dispositivo não possui conecção a internet!");
     page_content = document.getElementById('container').innerHTML;
      $("#container").fadeOut(fadeSpeed, ()=>{
        $("#container").html('<img class="title_logo" src="/images/icon-152.png" alt="Logo"><br><p class="login_btn">Sem Internet.</p>');
      });
      $("#container").fadeIn();
    }
});
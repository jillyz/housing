$('body').on('click', '#Lightbox', hideLightBox);

// 建立
function createLightBox(){
  const el = `<div id="dark"><div id="Lightbox"><img class="img-fluid" /></div></div>`;
  if (!$("#dark").length > 0) {
    $('body').append(el);
  }
  const imgUrl = $(this).attr('src');
  $("#Lightbox img").attr("src", imgUrl);
  $("#dark").fadeIn();
  $("#Lightbox").css('display', 'flex').fadeIn("slow");
  $('body').addClass('overflow-hidden');
}
// 關閉
function hideLightBox(){
  $("#dark").fadeOut();
  $("#Lightbox").fadeOut("slow");
  $('body').removeClass('overflow-hidden');
}
$(function(){
  triggerTooltip();
  
  //頁面滾動隱藏選單
  onScrollDown()
  
  // go to top
  scrollTopToggle('.js-go-top', 0)

  
  // 密碼眼睛切換
  $('.js-password-trigger').click(function(e){
    e.preventDefault();
    $(this).siblings('.js-password-input').toggleClass('on off').attr('type', function () {
        return $(this).hasClass('on') ? 'text' : 'password';
    });
  })



  // Photo light box
  $('.form-comp-upload-img img').click(createLightBox);

})

// 自訂Function =======================================================================
// 頁面滾動隱藏選單
function onScrollDown(){
  var prevScrollpos = window.pageYOffset;
  window.onscroll = function() {
      var currentScrollPos = window.pageYOffset;
      
      if (prevScrollpos > currentScrollPos) {
          $('body').removeClass('scrollDown');
      } else {
          $('body').addClass('scrollDown');
      }
      prevScrollpos = currentScrollPos;
  }
}
// 啟動BS的tooltip
function triggerTooltip(){
  var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
  var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl)
  })
}

// 關閉瀏覽器表單的自動完成
function offAutocomplete(){
  $('form,input,select,textarea').attr("autocomplete", "off");
}

// toggle由父層控制
function toggleChild(){
$('.js-toggle-parent').click(function(e){
  e .preventDefault();     
  $(this).children().toggle();
});
}

// toggle由子層trigger控制
function toggleSibling(){
$('.js-toggle-trigger').click(function(e){
  e .preventDefault(); 
  $(this).parents('.js-toggle-container').children().toggle();
});
}



/* 
  監聽scroll滾到指定高度才出現
  範例1： scrollTopToggle('.js-go-top', 0)
  範例2： scrollTopToggle('.js-box', 100)
*/
function scrollTopToggle(target, scrollTop, speed=200){
  $(window).scroll(function () {
    if ($(window).scrollTop() <= scrollTop) {
      $(target).fadeOut(speed);
    } else {
      $(target).fadeIn(speed);
    }
  });
}

// 修正民國年在modal位置漂移的問題
// 例如：posDatepickerTW('.datepickerTW');
function posDatepickerTW(target){
  $(target).datepickerTW({
    beforeShow: function(input, inst){
        if($(input).parents('.modal').length>0){
            var rect = input.getBoundingClientRect();
            setTimeout(function () {
                inst.dpDiv.css({ top: rect.top + input.offsetHeight });
            }, 0);
        }
    }
  });
}





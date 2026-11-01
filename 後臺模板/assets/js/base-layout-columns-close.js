$(function(){
    // 桌機漢堡
    $(".GSMis-hamburger-desktop").click(function(){
        // 控制wrapper的isClose狀態
        $('.GSMis-wrapper').toggleClass("isClose");        
    })

    // 小於1024自動關閉右側選單
    navResizeState()
    window.onresize = function(){
        navResizeState()
    };

    // 選單collapse event
    $('#GSMis-collapse-menu').on('hide.bs.collapse', function () {
        // 漢堡icon切換
        $(".GSMis-hamburger-mobile > *").toggle();
        $('.GSMis-help-user-name').fadeOut();   
    })
    $('#GSMis-collapse-menu').on('show.bs.collapse', function () {
        // 漢堡icon切換
        $(".GSMis-hamburger-mobile > *").toggle();
        $('.GSMis-help-user-name').fadeIn();
        // Body hidden toggle
        $('body').toggleClass('overflow-hidden');
    }).on('hide.bs.collapse', function(){
        // Body hidden toggle
        $('body').toggleClass('overflow-hidden');
    });

    // 主選單的作用選單給.active
    /* 
        1) 所有祖輩給.active
        2) 所有.active的子輩.children給.childrenOpen
    */
    $('.GSMis-menu .current').parents('li').addClass('active');
    $('.GSMis-menu .active > .children').addClass('childrenOpen');

    // 子選單開闔    
    $(".GSMis-menu .children").click(function(e){
        e.preventDefault();
        $(this).toggleClass('childrenOpen');
        $(this).next().slideToggle();
    }) 
    
    // go to top
     goTop();
    
    //頁面滾動隱藏選單
    //  onScrollDown()
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
// 小於1024自動關閉右側選單
function navResizeState(){
if($(window).width()>=992 && $(window).width()<=1200){
    $('.GSMis-wrapper').addClass("isClose");
}else{
    $('.GSMis-wrapper').removeClass("isClose");
}
}
// Go to top
function goTop(){
    $(window).scroll(function () {
      if ($(window).scrollTop() == "0") {
            $(".GSMis-go-top").fadeOut(200);
        } else {
            $(".GSMis-go-top").fadeIn(200);
        }
    })
}
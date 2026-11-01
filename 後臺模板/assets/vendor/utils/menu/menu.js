
$(function(){
    // Add show class
    $('.js-menu-vertical .active').closest('.sub-menu').closest('li').addClass('show');

    // Menu水平
    if($(window).width() <= 1024){
        $('.js-menu-horizontal .has-children').on('click' ,function(e){
            e.preventDefault();
            subMenuToggle(this);
        })
    }else{
        $('.js-menu-horizontal > li').hover(function(){       
            subMenuToggleHover(this)
        })
    }

    // Menu垂直
    $('.js-menu-vertical .has-children').click(function(e){
        e.preventDefault();
        subMenuToggle(this);
    })

    // 桌機漢堡
    $('.js-menu-hamburger a').click(function(e){
        e.preventDefault();
        $('.js-menu-vertical').toggleClass('isMenuClose isMenuOpen');
    })
})

// Menu垂直 - Sub menu toggle
function subMenuToggle(target){
    $(target).parent().toggleClass('show');
    $(target).next().stop().slideToggle();
}
// Menu水平 - Sub menu toggle
function subMenuToggleHover(target){
    $(target).toggleClass('show');
    $('ul',target).stop().slideToggle();
}




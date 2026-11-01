function slickInit(){
    $(".js-slick").slick({
        infinite: false,
        variableWidth: true,
    });
    handleWindowResize()
    
    // Resize
    window.addEventListener("resize", handleWindowResize);
    
    // Resize
    function handleWindowResize() {
    const total = $('.slick-list').eq(0).find('.slick-slide').length;
    const result = $('.slick-list').eq(0).width() > ($('.js-slick .card').width()+20) * (total) - 20;
        $('.slick-arrow').css('display','block');
        if(result){
            $('.slick-arrow').css('display','none');
        }
    }
}
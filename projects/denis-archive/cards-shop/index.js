let shop = document.getElementById("shop");
let shop1= document.getElementById("shop-1");
let shop2= document.getElementById("shop-2");
let count=0;
let text=document.getElementById("count");
shop.addEventListener("click", function () {
    shop.textContent="Товар оформлен";
    this.style.backgroundColor = "red";
    count++;
    shop.disabled=true;
    text.textContent=`В корзине: ${count} товаров`;
    shop.parentElement.style.backgroundColor="transparent";
});
shop1.addEventListener("click", function () {
    shop1.textContent="Товар оформлен";
    this.style.backgroundColor = "red";
    count++;
    shop1.disabled=true;
    text.textContent=`В корзине: ${count} товаров`;
    shop1.parentElement.style.backgroundColor="transparent";
});
shop2.addEventListener("click", function () {
    shop2.textContent="Товар оформлен";
    this.style.backgroundColor = "red";
    count++;
    shop2.disabled=true;
    text.textContent=`В корзине: ${count} товаров`;
    shop2.parentElement.style.backgroundColor="transparent";
});




const cards = [...document.querySelectorAll('[data-product]')];
const filters = [...document.querySelectorAll('[data-filter]')];
const cart = new Map();
const dialog = document.querySelector('#bag-dialog');
const countNode = document.querySelector('[data-cart-count]');
const itemsNode = document.querySelector('[data-cart-items]');
const emptyNode = document.querySelector('[data-cart-empty]');
const totalNode = document.querySelector('[data-cart-total]');
const shownNode = document.querySelector('[data-visible-count]');
const statusNode = document.querySelector('[data-filter-status]');
const noResults = document.querySelector('[data-no-results]');
const toast = document.querySelector('[data-announcement]');
const names = {all:'Вся выпечка',laminated:'Слойки',bread:'Хлеб',sweet:'Десерты'};
let returnFocus = null;
let toastTimer = 0;
const money = value => `${new Intl.NumberFormat('ru-RU').format(value)} ₽`;
const positionWord = count => {const lastTwo=count%100;const last=count%10;return lastTwo>=11&&lastTwo<=14?'позиций':last===1?'позиция':last>=2&&last<=4?'позиции':'позиций';};

function setFilter(value){
  let visible=0;
  for(const card of cards){const match=value==='all'||card.dataset.category.split(' ').includes(value);card.hidden=!match;if(match)visible++;}
  for(const button of filters){const active=button.dataset.filter===value;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active));}
  shownNode.textContent=String(visible).padStart(2,'0');
  statusNode.textContent=`${names[value]} · ${visible} ${positionWord(visible)}`;
  noResults.hidden=visible!==0;
}

function showToast(message){toast.textContent=message;toast.classList.add('is-visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('is-visible'),1900);}

function renderCart(){
  let count=0,total=0;
  itemsNode.replaceChildren();
  for(const [id,quantity] of cart){
    const card=cards.find(item=>item.dataset.id===id);if(!card||quantity<1)continue;
    const subtotal=Number(card.dataset.price)*quantity;count+=quantity;total+=subtotal;
    const row=document.createElement('div');row.className='bag-row';
    const name=document.createElement('strong');name.textContent=card.dataset.name;
    const price=document.createElement('small');price.textContent=`${money(Number(card.dataset.price))} × ${quantity} · ${money(subtotal)}`;
    const controls=document.createElement('div');controls.className='quantity';controls.setAttribute('aria-label',`Количество: ${card.dataset.name}`);
    for(const [step,label,text] of [[-1,'Уменьшить','−'],[1,'Увеличить','+']]){const button=document.createElement('button');button.type='button';button.dataset.step=String(step);button.dataset.id=id;button.setAttribute('aria-label',`${label} количество: ${card.dataset.name}`);button.textContent=text;controls.append(button);if(step===-1){const qty=document.createElement('span');qty.textContent=String(quantity);controls.append(qty);}}
    row.append(name,price,controls);itemsNode.append(row);
  }
  countNode.textContent=String(count);countNode.setAttribute('aria-label',`Позиций в корзине: ${count}`);totalNode.textContent=money(total);
  emptyNode.hidden=count!==0;itemsNode.hidden=count===0;
}

for(const filter of filters)filter.addEventListener('click',()=>setFilter(filter.dataset.filter));
for(const button of document.querySelectorAll('[data-add]'))button.addEventListener('click',()=>{const card=button.closest('[data-product]');cart.set(card.dataset.id,(cart.get(card.dataset.id)||0)+1);renderCart();showToast(`Добавлено в корзину: ${card.dataset.name}`);});
document.querySelector('[data-open-cart]').addEventListener('click',event=>{returnFocus=event.currentTarget;renderCart();dialog.showModal();document.querySelector('[data-close-cart]').focus();});
document.querySelector('[data-close-cart]').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
dialog.addEventListener('close',()=>returnFocus?.focus());
itemsNode.addEventListener('click',event=>{const button=event.target.closest('[data-step]');if(!button)return;const id=button.dataset.id;const next=(cart.get(id)||0)+Number(button.dataset.step);if(next<1)cart.delete(id);else cart.set(id,next);renderCart();});
renderCart();

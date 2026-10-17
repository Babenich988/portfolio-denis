let input = document.getElementById("text");
let add=document.getElementById("add");
let tasks=[];
let stats=document.getElementById("stats");
let currentFilter="all";
let list=document.getElementById("list");
let a=0;
let searchQuery = "";
let tasksearch = document.getElementById("tasksearch");
let search = document.getElementById("doneSearch");
let saved=localStorage.getItem("tasks");
if (saved)
{
    tasks=JSON.parse(saved);
}
search.addEventListener("click", function(){
    searchQuery = tasksearch.value;
    updateApp();
})
add.addEventListener("click", function () {
    addTask(input.value);
});
function addTask(text){
    tasks.push({
        id: a,
        text: text,
        done: false
    });
    a++;
    input.value = "";
    updateApp();
}
function updateApp(){
    localStorage.setItem("tasks", JSON.stringify(tasks));
    renderTask();
    updateStats(tasks);
}
function updateStats(tasks){
    stats.innerText="";
    let total=0;
    let done=0;
    let not_done=0
    total=tasks.length;
    done=tasks.filter(item=>item.done===true)
    let count_done=done.length;
    not_done=tasks.filter(item=>item.done===false);
    let count_not_done=not_done.length;
    stats.append(`Всего: ${total} | Выполнено: ${count_done} | Осталось: ${count_not_done}`);
}
function renderTask(){
    list.innerHTML="";
    let filteredTasks = tasks;
        if(currentFilter==="active"){
            filteredTasks=tasks.filter(item=>item.done===false)
        }
        if(currentFilter==="done"){
            filteredTasks=tasks.filter(item=>item.done===true)
        }
        if(searchQuery!==""){
            filteredTasks=filteredTasks.filter(task=>task.text.includes(searchQuery))
        }
    for (let task of filteredTasks){
        let div=document.createElement("div");
        div.className="text";
        let del=document.createElement("button");
        del.innerText="Удалить";
        del.dataset.id=task.id;
        del.addEventListener("click", function(){
            const id=Number(this.dataset.id);
            tasks=tasks.filter(item => item.id!=id)
            updateApp();
        })
        let butDone=document.createElement("button");
        butDone.innerText=task.done===false ? "Выполнить" : "Отменить";
        butDone.dataset.id=task.id;
        butDone.addEventListener("click", function(){
            const id=Number(this.dataset.id);
            let found=tasks.find(item => item.id===id)
            found.done=!found.done;
            updateApp();
        });
        div.append(task.text);
        div.append(del);
        div.append(butDone);
        list.append(div);
    }
}
let butAll=document.createElement("button");
butAll.innerText="Все";
    butAll.addEventListener("click", function(){
        currentFilter = "all";
        updateApp();
})
let butActive=document.createElement("button");
butActive.innerText="Активные";
butActive.addEventListener("click", function(){
    currentFilter="active";
    updateApp();
})
let butCurrect=document.createElement("button");
butCurrect.innerText="Выполненные";
butCurrect.addEventListener("click", function(){
    currentFilter="done";
    updateApp();
})
document.body.append(butAll);
document.body.append(butActive);
document.body.append(butCurrect);

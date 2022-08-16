const addBtns = document.querySelectorAll(".add-btn:not(.solid)");
const saveItemBtns = document.querySelectorAll(".solid");
const addItemContainers = document.querySelectorAll(".add-container");
const addItems = document.querySelectorAll(".add-item");
// Item Lists
const listColumns = document.querySelectorAll(".drag-item-list");
const backlogList = document.getElementById("backlog-list");
const progressList = document.getElementById("progress-list");
const completeList = document.getElementById("complete-list");
const onHoldList = document.getElementById("on-hold-list");
const blocksList = document.querySelectorAll(".drag-column");

// Items
let updatedOnLoad = false;

// Initialize Arrays
let backlogListArray = [];
let progressListArray = [];
let completeListArray = [];
let onHoldListArray = [];
let listArrays = [];

// Drag Functionality
let draggedItem;
let currentColumn;
let dragging = false;
let editItem;

//Touch Functionality
let overColumnTouch;
let touchedItem;
let touchtart = false;

// Get Arrays from localStorage if available, set default values if not
function getSavedColumns() {
  if (localStorage.getItem("backlogItems")) {
    backlogListArray = JSON.parse(localStorage.backlogItems);
    progressListArray = JSON.parse(localStorage.progressItems);
    completeListArray = JSON.parse(localStorage.completeItems);
    onHoldListArray = JSON.parse(localStorage.onHoldItems);
  } else {
    backlogListArray = ["Release the course", "Sit back and relax"];
    progressListArray = ["Work on projects", "Listen to music"];
    completeListArray = ["Being cool", "Getting stuff done"];
    onHoldListArray = ["Being uncool"];
  }
}

// Set localStorage Arrays
function updateSavedColumns() {
  listArrays = [
    backlogListArray,
    progressListArray,
    completeListArray,
    onHoldListArray,
  ];
  const arrayNames = ["backlog", "progress", "complete", "onHold"];
  listArrays.forEach((list, i) => {
    localStorage.setItem(`${arrayNames[i]}Items`, JSON.stringify(list));
  });
}

// Create DOM Elements for each list item
function createItemEl(columnEl, column, item, index) {
  // List Item
  const listEl = document.createElement("li");
  listEl.classList.add("drag-item");
  listEl.innerHTML = `<span class='text-item'>${item}</span> <div class='icons'><svg xmlns="http://www.w3.org/2000/svg" class="icon-edit icon-edit-${column}" id='${index}'  onclick='editItemHamndler(event)'fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
  <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
</svg><svg xmlns="http://www.w3.org/2000/svg" class="icon-delete icon-delete-${column}" id='${index}' onclick='deleteItemHamndler(event)'fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
</svg></div>`;
  listEl.draggable = true;
  listEl.setAttribute("ondragstart", "drag(event)");
  listEl.id = index;
  listEl.setAttribute("onfocusout", `updateItem(${index},${column})`);
  columnEl.appendChild(listEl);

  //event listeners for touch functionality
  listEl.addEventListener(
    "touchstart",
    (event) => {
      if (!touchtart) {
        touchtart = true;
        setTimeout(() => {
          if (touchtart) {
            listEl.classList.add("active-touch");
            document.body.style["overflow-y"] = "hidden";
            listEl.addEventListener("touchmove", (event) => {
              touchMoveHandler(event, column, index);
            });
          }
        }, 200);
      }
    },
    { passive: false }
  );
  listEl.addEventListener("touchend", (event) => {
    touchtart = false;
    document.body.style["overflow-y"] = "auto";
    listEl.classList.remove("active-touch");
    touchEndHandler(event, column, index);
    listEl.removeEventListener("touchmove", (event) => {
      touchMoveHandler(event, column, index);
    });
  });
}

// Update Columns in DOM - Reset HTML, Filter Array, Update localStorage
function updateDOM() {
  // Check localStorage once
  if (!updatedOnLoad) {
    getSavedColumns();
  }
  // Backlog Column
  backlogList.textContent = "";
  backlogListArray.forEach((backlogItem, index) => {
    createItemEl(backlogList, 0, backlogItem, index);
  });
  // Progress Column
  progressList.textContent = "";
  progressListArray.forEach((progressItem, index) => {
    createItemEl(progressList, 1, progressItem, index);
  });
  // Complete Column
  completeList.textContent = "";
  completeListArray.forEach((completeItem, index) => {
    createItemEl(completeList, 2, completeItem, index);
  });
  // On Hold Column
  onHoldList.textContent = "";
  onHoldListArray.forEach((onHoldItem, index) => {
    createItemEl(onHoldList, 3, onHoldItem, index);
  });
  // Run getSavedColumns only once, Update Local Storage
  updatedOnLoad = true;
  updateSavedColumns();
}

//Update Item - Delete if nesessary or update Array value
function updateItem(id, column) {
  const selectedArray = listArrays[column];
  const selectedColumnEl = listColumns[column].children;

  if (!dragging) {
    if (selectedColumnEl[id].textContent.length <= 0) {
      selectedArray.splice(id, 1);
    } else {
      selectedArray[id] = selectedColumnEl[id].textContent;
    }
    console.log(selectedArray);

    updateDOM();
  }
}

//Allows arrays to reflect Drag and Dpro items
function rebuildArrays() {
  backlogListArray = [];
  progressListArray = [];
  completeListArray = [];
  onHoldListArray = [];
  for (let i = 0; i < backlogList.children.length; i++) {
    backlogListArray.push(backlogList.children[i].textContent);
  }
  for (let i = 0; i < progressList.children.length; i++) {
    progressListArray.push(progressList.children[i].textContent);
  }
  for (let i = 0; i < completeList.children.length; i++) {
    completeListArray.push(completeList.children[i].textContent);
  }
  for (let i = 0; i < onHoldList.children.length; i++) {
    onHoldListArray.push(onHoldList.children[i].textContent);
  }
  updateDOM();
}

//When Items start Dragging
function drag(e) {
  draggedItem = e.target;
  dragging = true;
}

//Column Allows for Item to Drop
function allowDrop(e, column) {
  e.preventDefault();
  listArrays = [
    backlogListArray,
    progressListArray,
    completeListArray,
    onHoldListArray,
  ];
}

// When Item enteres Culumn Area
function dragEnter(column) {
  listColumns.forEach((column) => column.classList.remove("over"));
  listColumns[column].classList.add("over");
  currentColumn = column;
}

//Dropping Item in Column
function drop(e) {
  e.preventDefault();
  //Remove BackgroundColor/padding
  listColumns.forEach((column) => column.classList.remove("over"));
  //Add item to Column

  const parent = listColumns[currentColumn];
  parent.appendChild(draggedItem);

  //Dragging complete
  dragging = false;
  rebuildArrays();
}

//Add to column List,Reset Textbox

function addToColumn(column) {
  const itemText = addItems[column].textContent;
  if (itemText.length > 0) {
    const selectedArray = listArrays[column];
    selectedArray.push(itemText);
    updateDOM();
  }

  addItems[column].textContent = "";
}

//Show Add Item Input Box
function showInputBox(column) {
  addBtns[column].style.display = "none";
  saveItemBtns[column].style.display = "flex";
  addItemContainers[column].style.display = "flex";
}

//Hide Item Input Box
function hideInputBox(column) {
  addBtns[column].style.display = "flex";
  saveItemBtns[column].style.display = "none";
  addItemContainers[column].style.display = "none";

  addToColumn(column);
}

//delete icon handler
function deleteItemHamndler(e) {
  const classInLetters = e.target
    .closest(".icon-delete")
    .classList[1].split("");
  const column = classInLetters[classInLetters.length - 1];
  const icon = e.target.closest(".icon-delete").id;
  listArrays[column].splice(icon, 1);
  updateDOM();
}

//edit item handler
function editItemHamndler(event) {
  editActive = true;
  const classInLetters = event.target
    .closest(".icon-edit")
    .classList[1].split("");
  const column = classInLetters[classInLetters.length - 1];
  const icon = event.target.closest(".icon-edit").id;
  editItem = event.target.closest(".drag-item");
  console.log(editItem);
  editItem.contentEditable = true;
  editItem.focus();
  event.target.closest(
    ".icons"
  ).innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="icon-submit" onclick='updateItem(${icon},${column})' fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
</svg>`;
}

//Touch Move handler - instead drag on mobile
function touchMoveHandler(e, column, index) {
  e.preventDefault();
  // console.log(event);
  let currentEl = listColumns[column].children[index];
  touchedItem = currentEl;

  // console.log(listColumns[column].children[index]);

  let touch = e.targetTouches[0];
  currentEl.style.position = "absolute";
  // console.log(currentEl);
  currentEl.style.zIndex = "2000";
  currentEl.style.top = `${
    touch.pageY - blocksList[column].offsetTop - currentEl.offsetHeight / 2
  }px`;
  currentEl.style.left = `${
    touch.pageX - blocksList[column].offsetLeft - currentEl.offsetWidth / 2
  }px`;

  listColumns.forEach((item, index) => {
    if (
      currentEl.getBoundingClientRect().right >
        item.getBoundingClientRect().left &&
      currentEl.getBoundingClientRect().top <
        item.getBoundingClientRect().bottom &&
      currentEl.getBoundingClientRect().bottom >
        item.getBoundingClientRect().top &&
      currentEl.getBoundingClientRect().left <
        item.getBoundingClientRect().right
    ) {
      overColumnTouch = index;
      item.classList.add("over");
    } else {
      item.classList.remove("over");
    }
  });
}

//event what happend when element end moving(due to touch )
function touchEndHandler(event, column, index) {
  console.log(overColumnTouch);
  listColumns.forEach((column) => column.classList.remove("over"));
  //Add item to Column
  console.log(listColumns[overColumnTouch]);
  listColumns[overColumnTouch].appendChild(touchedItem);
  overColumnTouch = "";
  rebuildArrays();
}

//On load
updateDOM();

// listColumns.forEach((block) => {
//   block.addEventListener(
//     "touchmove",
//     function (e) {
//       console.log(e.target.closest(".drag-item"));
//     },
//     { passive: true }
//   );
// });

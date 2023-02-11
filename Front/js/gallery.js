const SERVER_URL = 'http://localhost:8080';

document.addEventListener("click", function(e) {
    if(e.target.classList.contains("gallery-item")){
        const src = e.target.getAttribute("src");
        document.querySelector(".modal-img").src = src;
        const myModal = new bootstrap.Modal(document.getElementById('gallery-modal'));
        imageClick(Number.parseInt(e.target.getAttribute('index')));
        myModal.show();
    }
});

let images = [];
let orderBy = 'newest';
const PAGE_SIZE = 4;
let page = 1;
let pageCount;
getPageCount().then(async (count) => {
    pageCount = count;
});
setPage();

// modal label 
var modalTitle = document.getElementById("exampleModalLabel");

async function imageClick(imageIndex){
    await fetch(`${SERVER_URL}/countdownload?id=${images[imageIndex].id}`);
    images[imageIndex].downloads++;
    modalTitle.innerText = `Upload Date: ${images[imageIndex].upload_date}\nImpressions: ${images[imageIndex].downloads}`;
}


// Get the dropdown button and dropdown menu
var dropdownButton = document.getElementById("order-dropdown");
var dropdownMenu = document.querySelector(".dropdown-menu");

// Get the page button
let prevPageBtn = document.getElementById("prev-page");
let nextPageBtn = document.getElementById("next-page");

prevPageBtn.addEventListener("click", function(){
    if(page > 1)
        page--;
    setPage();
});

nextPageBtn.addEventListener("click", function(){
    if(page < pageCount)
        page++;
    setPage();
});

// store the dropdown menu selection state
var dropdownItems = document.querySelectorAll(".dropdown-item");
var selectedOption;
for (var i = 0; i < dropdownItems.length; i++) {
    dropdownItems[i].addEventListener("click", function(event) {
        selectedOption = event.target.textContent.toLowerCase();
        dropdownMenu.classList.remove("show");
        document.getElementById('order-dropdown').innerText = selectedOption;

        orderBy = selectedOption;
        page = 1;
        setPage();
    });
}

// Close the dropdown menu
window.addEventListener("click", function(event) {
    if (!event.target.matches('.dropdown-toggle')) {
        var dropdowns = document.getElementsByClassName("dropdown-menu");
        var i;
        for (i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
});

async function setPage(){
    let response = await fetch(`${SERVER_URL}/images?page=${page}&order=${orderBy}`);
    if(response.status !== 200)
        return;
    let data = await response.json();
    images = data;

    // disaply page info
    document.getElementById('page-label').innerText = `Page ${page} / ${pageCount}`;
    if(page == 1)
        prevPageBtn.disabled = true;
    else
        prevPageBtn.disabled = false;
    if(page == pageCount)
        nextPageBtn.disabled = true;
    else
        nextPageBtn.disabled = false;

    // display images
    let children = document.getElementById('gallery-images').children;
    for(let i = 0; i < images.length; i++){
        children[i].src = `${SERVER_URL}/${images[i].path}`;
        children[i].hidden = false;
    }
    for(let j = images.length; j < PAGE_SIZE; j++){
        children[j].hidden = true;
    }

    
}

async function getPageCount(){
    let response = await fetch(
        `${SERVER_URL}/pagecount`,
    );
    let data = await response.json();
    return data.pages;
}

document.getElementById("btn-print").addEventListener("click", function(){
    let printWindow = window.open();
    printWindow.document.write(`<br><img src = '${document.querySelector(".modal-img").src}' onload="imageload()"/>`);
    const imageload = () => { window.print(); window.close(); }
    printWindow.document.write(`<script>const imageload = ${imageload}</script>`);    
});

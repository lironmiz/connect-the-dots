const SERVER_URL = 'http://localhost:8080';

document.addEventListener("click", function(e) {
    if(e.target.classList.contains("gallery-item")){
        const src = e.target.getAttribute("src");
        document.querySelector(".modal-img").src = src;
        const myModal = new bootstrap.Modal(document.getElementById('gallery-modal'));
        myModal.show();
    }
});

let orderBy = 'newest';
let page = 1;
let pageCount;
getPageCount().then(async (count) => {
    alert(count);
});
setPage();

// Get the dropdown button and dropdown menu
var dropdownButton = document.getElementById("order-dropdown");
var dropdownMenu = document.querySelector(".dropdown-menu");


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
    //fetch(`${SERVER_URL}/images?`)
}

async function getPageCount(){
    let response = await fetch(`${SERVER_URL}/pagecount`);
    let data = response.json();
    return data.pages;
}

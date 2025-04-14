const API_KEY = 'AIzaSyD6VYbgQ2bIREfi0cYCAFNAzY9gJfgDA3c';
const SPREADSHEET_ID = '1kJl_ioUAK1umhl9oCHF8Oo7u698QdngllHuwerOFpIo';
const RANGE = 'format_gallery!A1:T';

let langBtn = false;
let galleryData = [];
let filteredList = [];

//圖片網址載入
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

async function fetchData() {
    try {
        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${RANGE}?key=${API_KEY}`
        );
        const data = await response.json();
        galleryData = data.values.slice(1); // 跳過表頭

        galleryList(galleryData);
        setTimeout(() => {
            filterGallery(); // 套用預設篩選
            const targetPageID = getQueryParam("formatID");
            if (targetPageID) {
                showSideDemo(targetPageID); // 如果有 pageID 參數，就自動打開
            }
        }, 100);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}
function updateFilteredList() {
    filteredList = [...document.querySelectorAll("#adGalleryList li")]
        .filter(li => li.style.display !== 'none')
        .map(li => li.getAttribute("data-id"));
}

function galleryList(data) {
    const listContainer = document.getElementById('adGalleryList');
    listContainer.innerHTML = ''; // 清空內容
    data.forEach(row => {
        const [temptitle, tempsub, pageID, tempsize, filtercategory, prevvid] = row; // 取出需要的欄位

        // 創建 li 元素
        const adList = document.createElement('li');
        adList.className = 'ad-temp';
        if (tempsize) {
            adList.classList.add(...tempsize.split(/\s+/)); // 拆分並加入classList
        }
        if (filtercategory) {
            adList.classList.add(...filtercategory.split(/\s+/)); // 拆分並加入classList
        }
        adList.setAttribute('data-id', pageID);

        // 動態填充內容
        adList.innerHTML = `
                    <div class="ad-info">
                        <h4 class="temptitle">${temptitle}</h4>
                        <h5 class="tempsub">${tempsub}</h5>
                        <i class="demo-icon i-eye">&#xe803;</i>
                    </div>
                    <video muted playsinline class="prevVid" src="${prevvid}"></video>
                `;

        listContainer.appendChild(adList);
        //demoSide
        adList.addEventListener('click', () => {
            showSideDemo(pageID);
        });
        //video autoplay
        const prevVid = document.querySelectorAll('.prevVid');
        const obsever = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const video = entry.target;
                    if (entry.isIntersecting) {
                        video.play();
                    } else {
                        video.pause();
                    }
                });
            },
            {
                threshold: 0.5,
            }
        );
        prevVid.forEach((video) => {
            obsever.observe(video);
        });
    });
}
//click li to open sideDemo
const sd_close = document.querySelector('#d-close');
const sideDemoWindow = document.querySelector('.sideDemo');

function showSideDemo(pageID) {
    const sideDemoWindow = document.querySelector('.sideDemo');
    const demoInfo = document.querySelector('.demoInfo');
    const demoView = document.querySelector('.demoView');
    const iframe = document.querySelector('.demoView iframe');
    const otherImages = document.querySelectorAll('.d-other img');
    //更新網址參數
    history.pushState(null, '', `?formatID=${pageID}`);

    updateFilteredList();
    let currentIndex = filteredList.indexOf(pageID);
    if (currentIndex === -1) return;
    sideDemoWindow.setAttribute('data-id', pageID);

    // use pageID fide other data
    const selectedData = galleryData.find(row => row[2] === pageID);
    if (!selectedData) return;
    const [temptitle, tempsub, , tempsize, , , demoframe, tempdesc, transdesc, mobile, pc, tags, demosize, adspecUrl, STimgA, STframeA, STimgB, STframeB, STimgC, STframeC] = selectedData;
    //tags
    const formatTags = demoInfo.querySelector('.d-tags');
    formatTags.innerHTML = ''; // delet
    if (tags) {
        tags.split('-').forEach(tag => {
            const li = document.createElement('li');
            li.textContent = tag.trim(); // 移除前後空白
            formatTags.appendChild(li);
        });
    }

    sideDemoWindow.classList.add('active');
    iframe.className = '';
    if (tempsize) {
        iframe.classList.add(...tempsize.split(/\s+/));
    }
    demoInfo.querySelector('.temptitle').textContent = temptitle;
    demoInfo.querySelector('.tempsub').textContent = tempsub;
    if (langBtn) {
        demoInfo.querySelector('.tempdesc').textContent = transdesc;
    } else {
        demoInfo.querySelector('.tempdesc').textContent = tempdesc;
    }

    //iframe & imgs
    iframe.src = demoframe || '';

    const imageData = [STimgA, STimgB, STimgC];
    const frameData = [STframeA, STframeB, STframeC];

    otherImages.forEach((img, index) => {
        if (imageData[index]) {
            img.style.display = "block";
            img.src = imageData[index];
            img.onclick = () => {         // click iframe src change
                if (frameData[index]) {
                    iframe.src = frameData[index];
                }
            };
        } else {
            img.style.display = "none";
        }
    });

    //device
    function toggleDeviceVisibility(selector, condition) {
        const element = demoInfo.querySelector(selector);
        if (element) {
            element.style.display = condition === "TRUE" ? "inline-block" : "none";
        }
    }
    toggleDeviceVisibility('.mobile', mobile);
    toggleDeviceVisibility('.pc', pc);

    //size
    demoInfo.querySelector('.d-device p').textContent = demosize;
    //adspec
    const adspec = document.querySelector('.adspec a');
    if (adspecUrl) {
        adspec.href = adspecUrl;
        adspec.parentElement.style.display = "block"; // 顯示
    } else {
        adspec.parentElement.style.display = "none"; // 隱藏
    }


    //Button: next/prev
    document.querySelector("#btn-prev").onclick = () => navigateGallery(-1);
    document.querySelector("#btn-next").onclick = () => navigateGallery(1);

}
sd_close.addEventListener('click', () => {
    sideDemoWindow.classList.toggle('active');
    history.pushState(null, '', window.location.pathname);//清除 pageID
});

//Button: next/prev
function navigateGallery(direction) {
    let currentIndex = filteredList.indexOf(document.querySelector('.sideDemo.active').getAttribute('data-id'));
    console.log(currentIndex);
    if (currentIndex === -1) return;
    let newIndex = currentIndex + direction;
    if (newIndex < 0 || newIndex >= filteredList.length) return;
    let newPageID = filteredList[newIndex];
    console.log("Switching to:", newPageID);
    showSideDemo(newPageID);
}

//Filter
const deviceFilters = document.querySelectorAll(".f-divice i");
const formatSelect = document.querySelector(".f-formatsize select");
const optionButtons = document.querySelectorAll(".filt-option");
const galleryItems = document.querySelectorAll(".adGallery-context li");
// Default
let selectedDevice = "mobile";
let selectedFormat = formatSelect.value;
let selectedOptions = new Set();

deviceFilters.forEach(btn => {
    btn.addEventListener('click', function () {
        deviceFilters.forEach(b => b.classList.remove("active"));
        this.classList.add("active");
        selectedDevice = this.getAttribute("value");
        filterGallery();
    });
});

formatSelect.addEventListener("change", function () {
    selectedFormat = this.value;
    filterGallery();
});

optionButtons.forEach(btn => {
    btn.addEventListener("click", function () {
        if (this.id === "all") {
            optionButtons.forEach(b => b.classList.remove("active"));
            this.classList.add("active");
            selectedOptions.clear();
        } else {
            document.getElementById("all").classList.remove("active");
            if (this.classList.contains("active")) {
                this.classList.remove("active");
                selectedOptions.delete(this.getAttribute("value"));
            } else {
                this.classList.add("active");
                selectedOptions.add(this.getAttribute("value"));
            }
        }
        filterGallery();
    });
});

function filterGallery() {
    const galleryItems = document.querySelectorAll(".adGallery-context li");
    galleryItems.forEach(item => {
        let itemClasses = item.classList;
        let matchesDevice =
            (selectedDevice === "mobile" && itemClasses.contains("mobile")) ||
            (selectedDevice === "pc" && itemClasses.contains("pc")) ||
            (selectedDevice === "alldevice" && itemClasses.contains("mobile") && itemClasses.contains("pc"));

        let matchesFormat = itemClasses.contains(selectedFormat);

        let matchesOptions = selectedOptions.size === 0 || [...selectedOptions].some(opt => itemClasses.contains(opt));

        if (matchesDevice && matchesFormat && matchesOptions) {
            item.style.display = "";
        } else {
            item.style.display = "none";
        }
    });
    updateFilteredList();
}
fetchData(); // API

//mobile filter Window open
const filterBtn = document.querySelector('#i-filter');
const filtMult = document.querySelector('.filt-mult');
const filterClose = document.querySelector('#f-confirm');

filterBtn.addEventListener('click', () => {
    filtMult.classList.toggle('f-off');
    if (filtMult.classList.contains('f-off')) {
        document.body.style.overflow = ''; // start scroll
    } else {
        document.body.style.overflow = 'hidden'; // stop scroll
    }
});
filterClose.addEventListener('click', () => {
    filtMult.classList.add('f-off');
    document.body.style.overflow = ''; // start scroll
});
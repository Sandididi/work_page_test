const main = document.getElementById('mainPage');

// 預設載入頁面（可從 URL 讀 page）
window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page') || 'format';
    loadPage(`pages/${page}.html`);
    const tab = document.getElementById(page);
    if (tab) tab.checked = true;
});

// 載入子頁內容
async function loadPage(pagePath) {
    try {
        const res = await fetch(pagePath);
        const html = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        main.innerHTML = doc.body.innerHTML;

        // 自動載入對應 js
        const scriptPath = pagePath.replace('.html', '.js').replace('pages/', 'static/js/');
        loadScript(scriptPath);

    } catch (err) {
        console.error('載入失敗', err);
        main.innerHTML = `<p style="color:red">無法載入 ${pagePath}</p>`;
    }
}

// 動態引入 JS
function loadScript(src) {
    const exist = document.querySelector(`script[src="${src}"]`);
    if (exist) exist.remove(); // 移除再加，避免重複

    const script = document.createElement('script');
    script.src = src;
    script.type = 'module'; // 若你沒用 module 可移除
    document.body.appendChild(script);
}

// Label 切換（format / showcase）
document.querySelectorAll('input[name="tab"]').forEach((radio) => {
    radio.addEventListener('change', () => {
        const page = radio.id;
        loadPage(`pages/${page}.html`);
        history.pushState({ page }, '', `/${page}`);
    });
});

// 處理 history back/forward
window.addEventListener('popstate', (e) => {
    if (e.state?.page) {
        const page = e.state.page;
        loadPage(`pages/${page}.html`);
        const tab = document.getElementById(page);
        if (tab) tab.checked = true;
    }
});

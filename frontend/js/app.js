var API_BASE = '';
var crawlers = [];

async function loadCrawlers() {
    try {
        var res = await fetch(API_BASE + '/api/crawlers');
        crawlers = await res.json();
        renderCrawlerGrid();
        renderNav();
    } catch (err) { console.error(err); }
}

function renderCrawlerGrid() {
    var grid = document.getElementById('crawler-grid');
    var cats = {};
    for (var i = 0; i < crawlers.length; i++) {
        var c = crawlers[i];
        var cat = c.category || '\u5176\u4ed6';
        if (!cats[cat]) cats[cat] = [];
        cats[cat].push(c);
    }
    var html = '';
    for (var cat in cats) {
        html += '<div class="category-section"><h3 class="category-title">' + cat + '</h3>';
        for (var j = 0; j < cats[cat].length; j++) {
            var c = cats[cat][j];
            html += '<div class="crawler-card" onclick="switchPage(\'' + c.id + '\')"><div class="card-icon">' + c.icon + '</div><div class="card-title">' + c.name + '</div><div class="card-desc">' + c.description + '</div></div>';
        }
        html += '</div>';
    }
    grid.innerHTML = html;
}

function renderNav() {
    var nav = document.getElementById('nav');
    var cats = {};
    for (var i = 0; i < crawlers.length; i++) {
        var c = crawlers[i];
        var cat = c.category || '\u5176\u4ed6';
        if (!cats[cat]) cats[cat] = [];
        cats[cat].push(c);
    }
    for (var cat in cats) {
        nav.insertAdjacentHTML('beforeend', '<details class="nav-cat" open><summary class="nav-category"><span class="cat-arrow">▼</span>' + cat + '</summary><div class="nav-cat-items">');
        for (var j = 0; j < cats[cat].length; j++) {
            var c = cats[cat][j];
            nav.insertAdjacentHTML('beforeend', '<a class="nav-item" data-page="' + c.id + '" onclick="switchPage(\'' + c.id + '\')"><span class="nav-icon">' + c.icon + '</span><span class="nav-label">' + c.name + '</span></a>');
        }
        nav.insertAdjacentHTML('beforeend', '</div></details>');
    }
}

function switchPage(pageId) {
    document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
    document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
    var page = document.getElementById('page-' + pageId);
    var navItem = document.querySelector('.nav-item[data-page="' + pageId + '"]');
    if (page) page.classList.add('active');
    if (navItem) navItem.classList.add('active');
    var c = null;
    for (var i = 0; i < crawlers.length; i++) { if (crawlers[i].id === pageId) { c = crawlers[i]; break; } }
    document.getElementById('page-title').textContent = c ? c.name : (pageId === 'dashboard' ? '\u4e07\u8c61\u5e73\u53f0' : pageId === 'tutorial' ? '\u4f7f\u7528\u6559\u7a0b' : pageId);
    var threeCanvas = document.querySelector('#particles > canvas');
    if (pageId === 'tutorial') {
        if (threeCanvas) threeCanvas.style.display = 'none';
        if (window.__tutorialParticles) window.__tutorialParticles.show();
    } else {
        if (window.__tutorialParticles) window.__tutorialParticles.hide();
        if (threeCanvas) threeCanvas.style.display = 'block';
    }
    if (pageId === 'vip-video') renderPlatformButtons();
    if (pageId === 'today-in-history') loadTodayInHistory();
    if (pageId === 'trending') fetchTrending(trendingPlatform);
    if (pageId === 'movie-info') initMoviePage();
    if (pageId === 'steam-deals') loadSteamTab('specials');
}

function renderPlatformButtons() {
    var container = document.getElementById('platform-buttons');
    var vip = null;
    for (var i = 0; i < crawlers.length; i++) { if (crawlers[i].id === 'vip-video') { vip = crawlers[i]; break; } }
    if (!vip || !vip.platforms) return;
    var html = '';
    for (var i = 0; i < vip.platforms.length; i++) {
        html += '<button class="platform-btn" onclick="openPlatform(\'' + vip.platforms[i].url + '\')">' + vip.platforms[i].name + '</button>';
    }
    container.innerHTML = html;
}

function openPlatform(url) { window.open(url, '_blank'); }

async function playVideo() {
    var url = document.getElementById('video-url').value.trim();
    if (!url) { alert('\u8bf7\u5148\u7c98\u8d34\u89c6\u9891\u94fe\u63a5'); return; }
    try {
        var res = await fetch(API_BASE + '/api/crawlers/vip-video/execute', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ params: { url: url }, token: getToken() }),
        });
        var data = await res.json();
        if (data.vip_required) { showVipPrompt(); }
        else if (data.error) { alert(data.error); }
        else if (data.url) { window.open(data.url, '_blank'); }
    } catch (err) { alert('\u8bf7\u6c42\u5931\u8d25'); }
}

function escHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

window._musicPlaylist = [];
window._musicPlayingIdx = -1;
window._musicAudio = null;

function initMusicAudio() {
    if (window._musicAudio) return;
    var a = document.createElement('audio');
    a.preload = 'auto';
    a.addEventListener('timeupdate', updateProgress);
    a.addEventListener('loadedmetadata', updateProgress);
    a.addEventListener('ended', function() { nextMusic(); });
    a.addEventListener('play', function() { updatePlayBtn(true); });
    a.addEventListener('pause', function() { updatePlayBtn(false); });
    a.addEventListener('error', function() {
        document.getElementById('music-now-title').textContent = '播放失败';
        document.getElementById('music-now-artist').textContent = '该歌曲暂无资源';
        document.getElementById('music-progress-fill').style.width = '0%';
        document.getElementById('music-cur-time').textContent = '0:00';
        updatePlayBtn(false);
    });
    a.volume = 0.7;
    document.body.appendChild(a);
    window._musicAudio = a;
}

function formatTime(sec) {
    if (!sec || isNaN(sec)) return '0:00';
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' + s : s);
}

function updateProgress() {
    var a = window._musicAudio;
    if (!a || !a.duration) return;
    var pct = (a.currentTime / a.duration) * 100;
    document.getElementById('music-progress-fill').style.width = pct + '%';
    document.getElementById('music-cur-time').textContent = formatTime(a.currentTime);
    document.getElementById('music-total-time').textContent = formatTime(a.duration);
}

function updatePlayBtn(playing) {
    var btn = document.getElementById('music-play-btn');
    if (btn) btn.textContent = playing ? '⏸️' : '▶️';
    var cover = document.getElementById('music-cover');
    if (cover) { if (playing) cover.classList.add('playing'); else cover.classList.remove('playing'); }
}

function togglePlay() {
    var a = window._musicAudio;
    if (!a || !a.src || a.src === window.location.href) return;
    if (a.paused) a.play(); else a.pause();
}

function nextMusic() {
    var list = window._musicPlaylist;
    if (!list.length) return;
    var idx = (window._musicPlayingIdx + 1) % list.length;
    playSong(idx);
}

function prevMusic() {
    var list = window._musicPlaylist;
    if (!list.length) return;
    var idx = window._musicPlayingIdx <= 0 ? list.length - 1 : window._musicPlayingIdx - 1;
    playSong(idx);
}

function setVolume(val) {
    var a = window._musicAudio;
    if (a) a.volume = val / 100;
}

function highlightActive() {
    var items = document.querySelectorAll('.music-song-item');
    for (var i = 0; i < items.length; i++) {
        items[i].classList.toggle('active', i === window._musicPlayingIdx);
    }
}

async function playSong(index) {
    initMusicAudio();
    var list = window._musicPlaylist;
    if (!list || index < 0 || index >= list.length) return;
    var song = list[index];
    window._musicPlayingIdx = index;
    highlightActive();

    document.getElementById('music-now-title').textContent = song.name;
    document.getElementById('music-now-artist').textContent = song.artist || '';
    document.getElementById('music-progress-fill').style.width = '0%';
    document.getElementById('music-cur-time').textContent = '0:00';
    document.getElementById('music-total-time').textContent = '0:00';

    var a = window._musicAudio;
    a.pause();
    a.currentTime = 0;

    var audioUrl = song.download_url;
    try {
        var sid = song.download_url.split('/').pop();
        var res = await fetch('/api/proxy/music/' + sid + '/url');
        var data = await res.json();
        if (data.success && data.url) { audioUrl = data.url; }
    } catch(e) {}

    a.src = audioUrl;
    document.getElementById('music-play-btn').textContent = '⏸️';
    a.play().catch(function(){});
}

function renderPlaylist() {
    var container = document.getElementById('music-playlist');
    var list = window._musicPlaylist;
    if (!container) return;
    if (!list.length) {
        container.innerHTML = '<div class="music-empty-state"><div class="music-empty-icon">🎵</div><p>搜索你喜欢的音乐</p></div>';
        return;
    }
    var html = '<div class="music-search-info">共找到 ' + list.length + ' 首歌曲</div>';
    for (var i = 0; i < list.length; i++) {
        var s = list[i];
        html += '<div class="music-song-item" data-idx="' + i + '">' +
            '<span class="music-song-num">' + (i + 1) + '</span>' +
            '<div class="music-song-info"><div class="music-song-name">' + escHtml(s.name) + '</div><div class="music-song-artist">' + escHtml(s.artist || '') + '</div></div>' +
            '<span class="music-song-dur">' + (s.album ? escHtml(s.album) : '') + '</span>' +
            '<a class="music-item-download" href="' + s.download_url + '" target="_blank" onclick="event.stopPropagation()" title="下载">⬇</a>' +
            '</div>';
    }
    container.innerHTML = html;
    var items = container.querySelectorAll('.music-song-item');
    for (var j = 0; j < items.length; j++) {
        items[j].onclick = function() {
            var idx = parseInt(this.getAttribute('data-idx'));
            playSong(idx);
        };
    }
}

async function searchMusic() {
    var keyword = document.getElementById('music-keyword').value.trim();
    if (!keyword) { alert('请输入歌曲名或歌手'); return; }
    var container = document.getElementById('music-playlist');
    container.innerHTML = '<div class="music-loading">🔍 搜索中...</div>';
    try {
        var res = await fetch(API_BASE + '/api/crawlers/vip-music/execute', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ params: { keyword: keyword }, token: getToken() }),
        });
        var data = await res.json();
        if (data.vip_required) { showVipPrompt(); return; }
        if (data.error) { container.innerHTML = '<div class="music-empty-state"><p style="color:#ff6b6b">' + data.error + '</p></div>'; return; }
        window._musicPlaylist = data.songs;
        window._musicPlayingIdx = -1;
        renderPlaylist();
    } catch (err) {
        container.innerHTML = '<div class="music-empty-state"><p style="color:#ff6b6b">请求失败</p></div>';
    }
}

async function startCrawl() {
    var bookId = document.getElementById('novel-slug').value.trim();
    if (!bookId) { alert('\u8bf7\u8f93\u5165\u5c0f\u8bf4ID'); return; }
    var btn = document.querySelector('#page-novel .glow-btn');
    var resultDiv = document.getElementById('novel-result');
    btn.textContent = '\u4e0b\u8f7d\u4e2d...'; btn.disabled = true;
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = '<p style="color:var(--text-secondary)">\u6b63\u5728\u722c\u53d6...</p>';
    try {
        var res = await fetch(API_BASE + '/api/crawlers/novel/execute', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ params: { novel_slug: bookId }, token: getToken() }),
        });
        var data = await res.json();
        if (data.vip_required) { showVipPrompt(); return; }
        if (data.error) { resultDiv.innerHTML = '<p style="color:#ff6b6b">' + data.error + '</p>'; }
        else { resultDiv.innerHTML = '<p style="color:var(--accent);font-size:1.1rem;font-weight:600">\u4e0b\u8f7d\u5b8c\u6210</p><p>\u4e66\u540d\uff1a' + data.book_title + '</p><p>\u603b\u7ae0\u8282\uff1a' + data.total_chapters + '</p><p>\u6210\u529f\uff1a' + data.downloaded + '</p><p>\u5931\u8d25\uff1a' + data.errors + '</p>'; }
    } catch (err) { resultDiv.innerHTML = '<p style="color:#ff6b6b">\u8bf7\u6c42\u5931\u8d25</p>'; }
    btn.textContent = '\u5f00\u59cb\u4e0b\u8f7d'; btn.disabled = false;
}

async function searchPrice() {
    var keyword = document.getElementById('pc-keyword').value.trim();
    if (!keyword) { alert('\u8bf7\u8f93\u5165\u641c\u7d22\u5173\u952e\u8bcd'); return; }
    var btn = document.querySelector('#page-price-compare .glow-btn');
    var resultDiv = document.getElementById('pc-result');
    btn.textContent = '\u641c\u7d22\u4e2d...'; btn.disabled = true;
    resultDiv.innerHTML = '<p style="color:var(--text-secondary)">\u641c\u7d22\u4e2d...</p>';
    try {
        var res = await fetch(API_BASE + '/api/crawlers/price-compare/execute', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ params: { keyword: keyword } }),
        });
        var data = await res.json();
        if (data.error) { resultDiv.innerHTML = '<p style="color:#ff6b6b">' + data.error + '</p>'; }
        else {
            var html = '<p style="color:var(--text-secondary);margin-bottom:0.5rem">\u5171\u627e\u5230 ' + data.total + ' \u6761\u5546\u54c1</p>';
            for (var i = 0; i < data.items.length; i++) {
                var item = data.items[i];
                html += '<a href="' + item.url + '" target="_blank" style="display:flex;gap:0.75rem;padding:0.75rem;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:8px;text-decoration:none;color:var(--text-primary)"><img src="' + item.img + '" style="width:64px;height:64px;border-radius:6px;object-fit:cover" onerror="this.style.display=\'none\'"><div style="flex:1"><div>' + item.title + '</div><div style="color:#ff6b6b;font-weight:700">' + item.price + '</div><span style="color:var(--text-secondary)">' + item.shop + '</span></div></a>';
            }
            resultDiv.innerHTML = html;
        }
    } catch (err) { resultDiv.innerHTML = '<p style="color:#ff6b6b">\u8bf7\u6c42\u5931\u8d25</p>'; }
    btn.textContent = '\u641c\u7d22\u5546\u54c1'; btn.disabled = false;
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }

var chatHistory = [];

function addMessage(role, content) {
    var container = document.getElementById('chat-messages');
    var div = document.createElement('div');
    div.className = 'chat-msg ' + role;
    div.innerHTML = '<div class="chat-avatar">\u{1F464}</div><div class="chat-bubble">' + content + '</div>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

async function sendMessage() {
    var input = document.getElementById('chat-input');
    var text = input.value.trim();
    if (!text) return;
    addMessage('user', text);
    input.value = '';
    chatHistory.push({ role: 'user', content: text });
    var btn = document.getElementById('chat-send-btn');
    btn.textContent = '\u601d\u8003\u4e2d...'; btn.disabled = true;
    try {
        var res = await fetch('/api/crawlers/ai-tools/execute', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ params: { messages: chatHistory }, token: getToken() }),
        });
        var data = await res.json();
        if (data.vip_required) { addMessage('assistant', '该功能仅限VIP用户使用，<a href="#" onclick="openVipPage()" style="color:var(--accent)">前往开通 →</a>'); return; }
        if (data.success) {
            addMessage('assistant', data.result);
            chatHistory.push({ role: 'assistant', content: data.result });
        } else { addMessage('assistant', '\u9519\u8bef: ' + data.error); }
    } catch (err) { addMessage('assistant', '\u8bf7\u6c42\u5931\u8d25'); }
    btn.textContent = '\u53d1\u9001'; btn.disabled = false;
}

var trendingPlatform = 'weibo';

function switchTrending(platform) {
    trendingPlatform = platform;
    document.querySelectorAll('.trending-tab').forEach(function(t) { t.classList.toggle('active', t.dataset.platform === platform); });
    fetchTrending(platform);
}

async function fetchTrending(platform) {
    var resultDiv = document.getElementById('trending-result');
    resultDiv.innerHTML = '<p style="color:var(--text-secondary)">\u52a0\u8f7d\u4e2d...</p>';
    try {
        var res = await fetch(API_BASE + '/api/crawlers/trending/execute', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ params: { platform: platform } }),
        });
        var data = await res.json();
        if (data.error) { resultDiv.innerHTML = '<p style="color:#ff6b6b">' + data.error + '</p>'; }
        else if (data.success) {
            var html = '<p style="color:var(--text-secondary);margin-bottom:0.75rem;font-size:0.85rem">\u5171 ' + data.total + ' \u6761 - <a href="' + data.source_url + '" target="_blank" style="color:var(--accent)">' + data.name + '</a></p><div style="display:flex;flex-direction:column;gap:0.4rem">';
            for (var i = 0; i < data.items.length; i++) {
                var item = data.items[i];
                html += '<a href="' + item.url + '" target="_blank" class="trending-item"><span class="trending-rank' + (i < 3 ? ' top' + (i+1) : '') + '">' + item.rank + '</span><div style="flex:1;min-width:0"><span style="font-size:0.9rem">' + item.title + '</span>' + (item.label ? '<span style="font-size:0.7rem;color:#ff6b6b;border:1px solid #ff6b6b;border-radius:4px;padding:0 0.35rem;margin-left:0.35rem">' + item.label + '</span>' : '') + '</div>' + (item.hot ? '<span style="font-size:0.75rem;color:var(--text-secondary);white-space:nowrap">' + item.hot + '</span>' : '') + '</a>';
            }
            html += '</div>';
            resultDiv.innerHTML = html;
        }
    } catch (err) { resultDiv.innerHTML = '<p style="color:#ff6b6b">\u8bf7\u6c42\u5931\u8d25</p>'; }
}

async function lookupIp() {
    var query = document.getElementById('ip-query').value.trim();
    if (!query) { alert('\u8bf7\u8f93\u5165IP\u5730\u5740\u6216\u57df\u540d'); return; }
    var btn = document.querySelector('#page-ip-lookup .glow-btn');
    var resultDiv = document.getElementById('ip-result');
    btn.textContent = '\u67e5\u8be2\u4e2d...'; btn.disabled = true;
    resultDiv.innerHTML = '<p style="color:var(--text-secondary)">\u67e5\u8be2\u4e2d...</p>';
    try {
        var res = await fetch(API_BASE + '/api/crawlers/ip-lookup/execute', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ params: { query: query } }),
        });
        var data = await res.json();
        if (data.error) { resultDiv.innerHTML = '<p style="color:#ff6b6b">' + data.error + '</p>'; }
        else if (data.success) {
            var dns = data.dns || {}, geo = data.geo || {};
            var html = '<div class="ip-grid"><span class="ip-label">\u67e5\u8be2\u5185\u5bb9</span><span class="ip-value">' + data.query + '</span><span class="ip-label">\u7c7b\u578b</span><span class="ip-value">' + data.type + '</span>';
            if (dns.ip) html += '<span class="ip-label">\u89e3\u6790IP</span><span class="ip-value" style="color:var(--accent)">' + dns.ip + '</span>';
            if (dns.hostname) html += '<span class="ip-label">\u53cd\u5411\u57df\u540d</span><span class="ip-value">' + dns.hostname + '</span>';
            if (geo.country) html += '<span class="ip-label">\u56fd\u5bb6</span><span class="ip-value">' + geo.country + '</span>';
            if (geo.region) html += '<span class="ip-label">\u5730\u533a</span><span class="ip-value">' + geo.region + '</span>';
            if (geo.city) html += '<span class="ip-label">\u57ce\u5e02</span><span class="ip-value">' + geo.city + '</span>';
            if (geo.isp) html += '<span class="ip-label">ISP</span><span class="ip-value">' + geo.isp + '</span>';
            if (geo.lat) html += '<span class="ip-label">\u7ecf\u7eac\u5ea6</span><span class="ip-value">' + geo.lat + ', ' + geo.lon + '</span>';
            html += '</div>';
            resultDiv.innerHTML = html;
        }
    } catch (err) { resultDiv.innerHTML = '<p style="color:#ff6b6b">\u8bf7\u6c42\u5931\u8d25</p>'; }
    btn.textContent = '\u67e5\u8be2'; btn.disabled = false;
}

async function loadTodayInHistory() {
    var resultDiv = document.getElementById('history-result');
    if (!resultDiv) return;
    resultDiv.innerHTML = '<p style="color:var(--text-secondary)">\u52a0\u8f7d\u4e2d...</p>';
    try {
        var res = await fetch(API_BASE + '/api/crawlers/today-in-history/execute', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ params: {} }),
        });
        var data = await res.json();
        if (data.error) { resultDiv.innerHTML = '<p style="color:#ff6b6b">' + data.error + '</p>'; }
        else if (data.success) {
            var html = '<div style="text-align:center;margin-bottom:1.5rem"><p style="font-size:2rem;font-weight:700;background:linear-gradient(135deg,#00d4ff,#7c3aed);-webkit-background-clip:text;-webkit-text-fill-color:transparent">' + data.date + '</p><p style="color:var(--text-secondary)">共 ' + data.total + ' 条历史事件</p></div><div style="display:flex;flex-direction:column;gap:0.6rem">';
            for (var i = 0; i < data.events.length; i++) {
                var e = data.events[i];
                html += '<div class="history-event"><div class="history-year">' + e.year + '</div><div class="history-text">' + e.text + '</div></div>';
            }
            html += '</div>';
            resultDiv.innerHTML = html;
        }
    } catch (err) { resultDiv.innerHTML = '<p style="color:#ff6b6b">\u52a0\u8f7d\u5931\u8d25</p>'; }
}

var _movieTab = 'nowplaying';
function initMoviePage() { _movieTab = 'nowplaying'; loadMovieTab('nowplaying'); }

async function loadMovieTab(tab) {
    _movieTab = tab;
    var resultDiv = document.getElementById('movie-result');
    if (!resultDiv) return;
    resultDiv.innerHTML = '<p style="color:var(--text-secondary)">\u52a0\u8f7d\u4e2d...</p>';
    try {
        var res = await fetch(API_BASE + '/api/crawlers/movie-info/execute', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ params: { tab: tab } }),
        });
        var data = await res.json();
        if (data.error) { resultDiv.innerHTML = '<p style="color:#ff6b6b">' + data.error + '</p>'; }
        else if (data.success) { renderPagedGrid(resultDiv, data.items, 6, function(m) {
            return '<div style="background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:10px;overflow:hidden"><a href="' + m.url + '" target="_blank" style="text-decoration:none;color:var(--text-primary)"><img src="' + m.img + '" style="width:100%;height:220px;object-fit:cover;display:block" onerror="this.style.display=\'none\'"><div style="padding:0.6rem 0.8rem"><div style="font-size:0.85rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + m.title + '</div>' + (m.rating ? '<span style="color:#ffaa00;font-size:0.8rem">\u2b50 ' + m.rating + '</span>' : '<span style="color:var(--text-secondary);font-size:0.75rem">\u6682\u65e0\u8bc4\u5206</span>') + '</div></a></div>';
        }, '<p style="color:var(--text-secondary);margin-bottom:1rem">' + data.name + '</p>'); }
    } catch (err) { resultDiv.innerHTML = '<p style="color:#ff6b6b">\u8bf7\u6c42\u5931\u8d25</p>'; }
}

async function loadSteamTab(tab) {
    var resultDiv = document.getElementById('steam-result');
    if (!resultDiv) return;
    resultDiv.innerHTML = '<p style="color:var(--text-secondary)">\u52a0\u8f7d\u4e2d...</p>';
    try {
        var res = await fetch(API_BASE + '/api/crawlers/steam-deals/execute', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ params: { tab: tab } }),
        });
        var data = await res.json();
        if (data.error) { resultDiv.innerHTML = '<p style="color:#ff6b6b">' + data.error + '</p>'; }
        else if (data.success) { renderPagedList(resultDiv, data.items, 10, function(m) {
            return '<a href="' + m.url + '" target="_blank" style="display:flex;align-items:center;gap:0.75rem;padding:0.5rem 0.75rem;background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:8px;text-decoration:none;color:var(--text-primary)">' + (m.img ? '<img src="' + m.img + '" style="width:184px;height:34px;border-radius:4px;object-fit:cover" onerror="this.style.display=\'none\'">' : '') + '<div style="flex:1;min-width:0"><div style="font-size:0.85rem;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + m.title + '</div></div>' + (m.discount ? '<span style="background:#4c6b22;color:#8dd158;padding:0.15rem 0.4rem;border-radius:3px;font-size:0.75rem;font-weight:700">' + m.discount + '</span>' : '') + '<span style="color:var(--text-secondary);font-size:0.8rem;text-decoration:line-through">' + m.original + '</span>' + '<span style="color:#34c759;font-size:0.9rem;font-weight:600">' + m.final + '</span></a>';
        }, '<p style="color:var(--text-secondary);margin-bottom:1rem">\u5171 ' + data.total + ' \u6b3e \u00b7 ' + data.name + '</p>'); }
    } catch (err) { resultDiv.innerHTML = '<p style="color:#ff6b6b">\u8bf7\u6c42\u5931\u8d25</p>'; }
}

var _pageData = {};
function renderPagedGrid(container, items, perPage, itemRenderer, header) {
    var totalPages = Math.ceil(items.length / perPage);
    var key = container.id || String(Math.random());
    _pageData[key] = { items: items, perPage: perPage, renderer: itemRenderer, totalPages: totalPages, page: 1, header: header || '' };
    _pageData[key].container = container;
    drawPageGrid(key, 1);
}
function renderPagedList(container, items, perPage, itemRenderer, header) {
    var totalPages = Math.ceil(items.length / perPage);
    var key = container.id || String(Math.random());
    _pageData[key] = { items: items, perPage: perPage, renderer: itemRenderer, totalPages: totalPages, page: 1, header: header || '' };
    _pageData[key].container = container;
    drawPageList(key, 1);
}

function drawPageGrid(key, page) {
    var s = _pageData[key];
    if (!s) return;
    s.page = Math.max(1, Math.min(page, s.totalPages));
    var start = (s.page - 1) * s.perPage;
    var end = Math.min(start + s.perPage, s.items.length);
    var html = s.header + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:1rem">';
    for (var i = start; i < end; i++) html += s.renderer(s.items[i]);
    html += '</div>';
    if (s.totalPages > 1) {
        html += '<div style="display:flex;justify-content:center;gap:0.5rem;margin-top:1rem">';
        if (s.page > 1) html += '<button class="glow-btn" style="padding:0.3rem 0.8rem;font-size:0.8rem" onclick="drawPageGrid(\'' + key + '\',' + (s.page - 1) + ')">\u4e0a\u4e00\u9875</button>';
        html += '<span style="color:var(--text-secondary);align-self:center;font-size:0.85rem">' + s.page + '/' + s.totalPages + '</span>';
        if (s.page < s.totalPages) html += '<button class="glow-btn" style="padding:0.3rem 0.8rem;font-size:0.8rem" onclick="drawPageGrid(\'' + key + '\',' + (s.page + 1) + ')">\u4e0b\u4e00\u9875</button>';
        html += '</div>';
    }
    s.container.innerHTML = html;
}

function drawPageList(key, page) {
    var s = _pageData[key];
    if (!s) return;
    s.page = Math.max(1, Math.min(page, s.totalPages));
    var start = (s.page - 1) * s.perPage;
    var end = Math.min(start + s.perPage, s.items.length);
    var html = s.header + '<div style="display:flex;flex-direction:column;gap:0.5rem">';
    for (var i = start; i < end; i++) html += s.renderer(s.items[i]);
    html += '</div>';
    if (s.totalPages > 1) {
        html += '<div style="display:flex;justify-content:center;gap:0.5rem;margin-top:1rem">';
        if (s.page > 1) html += '<button class="glow-btn" style="padding:0.3rem 0.8rem;font-size:0.8rem" onclick="drawPageList(\'' + key + '\',' + (s.page - 1) + ')">\u4e0a\u4e00\u9875</button>';
        html += '<span style="color:var(--text-secondary);align-self:center;font-size:0.85rem">' + s.page + '/' + s.totalPages + '</span>';
        if (s.page < s.totalPages) html += '<button class="glow-btn" style="padding:0.3rem 0.8rem;font-size:0.8rem" onclick="drawPageList(\'' + key + '\',' + (s.page + 1) + ')">\u4e0b\u4e00\u9875</button>';
        html += '</div>';
    }
    s.container.innerHTML = html;
}

function pickName() {
    try {
        var text = document.getElementById('names-input').value.trim();
        if (!text) { alert('请先输入名单'); return; }
        var names = text.split(/[\n,、\s]+/).filter(function(n) { return n.trim(); });
        if (names.length === 0) { alert('未识别到有效姓名'); return; }
        var pickResult = document.getElementById('pick-result');
        if (!pickResult) { console.error('pick-result not found'); return; }
        pickResult.style.display = 'block';
        pickResult.classList.remove('pick-anim');
        var count = 0;
        var interval = setInterval(function() {
            pickResult.textContent = names[Math.floor(Math.random() * names.length)];
            count++;
            if (count >= 15) {
                clearInterval(interval);
                pickResult.textContent = names[Math.floor(Math.random() * names.length)];
                pickResult.classList.add('pick-anim');
            }
        }, 80);
    } catch (e) { console.error(e); alert('点名出错: ' + e.message); }
}

function initNamePicker() {
    var input = document.getElementById('names-input');
    if (!input) return;
    input.addEventListener('input', function() {
        var names = input.value.split(/[\n,、\s]+/).filter(function(n) { return n.trim(); });
        var cntEl = document.getElementById('name-count');
        if (cntEl) cntEl.textContent = names.length ? '已输入 ' + names.length + ' 人' : '';
    });
    var btn = document.querySelector('#page-name-picker .glow-btn');
    if (btn) btn.addEventListener('click', pickName);
}

/* ========== Auth ========== */
var currentAuthTab = 'login';

function showAuthModal() {
    switchAuthTab('login');
    document.getElementById('auth-modal').classList.add('active');
    document.getElementById('auth-username').value = '';
    document.getElementById('auth-password').value = '';
    document.getElementById('auth-confirm').value = '';
    document.getElementById('auth-error').textContent = '';
}

function hideAuthModal() {
    document.getElementById('auth-modal').classList.remove('active');
}

function switchAuthTab(tab) {
    currentAuthTab = tab;
    document.getElementById('tab-login').className = 'modal-tab' + (tab === 'login' ? ' active' : '');
    document.getElementById('tab-register').className = 'modal-tab' + (tab === 'register' ? ' active' : '');
    document.getElementById('confirm-password-group').style.display = tab === 'register' ? 'block' : 'none';
    document.getElementById('auth-submit').textContent = tab === 'login' ? '登录' : '注册';
    document.getElementById('auth-error').textContent = '';
}

async function handleAuth() {
    var username = document.getElementById('auth-username').value.trim();
    var password = document.getElementById('auth-password').value;
    var errorEl = document.getElementById('auth-error');
    if (!username) { errorEl.textContent = '请输入用户名'; return; }
    if (!password) { errorEl.textContent = '请输入密码'; return; }
    if (currentAuthTab === 'register') {
        var pwd2 = document.getElementById('auth-confirm').value;
        if (password !== pwd2) { errorEl.textContent = '两次密码不一致'; return; }
        if (password.length < 6) { errorEl.textContent = '密码至少 6 位'; return; }
    }
    var btn = document.getElementById('auth-submit');
    btn.textContent = '...';
    btn.disabled = true;
    try {
        var res = await fetch('/api/auth/' + currentAuthTab, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username, password: password }),
        });
        var data = await res.json();
        if (!res.ok) {
            errorEl.textContent = data.detail || '操作失败';
        } else {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            hideAuthModal();
            updateUserUI();
        }
    } catch (err) {
        errorEl.textContent = '网络错误';
    }
    btn.textContent = currentAuthTab === 'login' ? '登录' : '注册';
    btn.disabled = false;
}

var AVATARS = ['👤', '😀', '😎', '🤩', '😺', '🐶', '🐱', '🦊', '🐼', '🐨', '🦁', '🐯', '🦄', '🌈', '🌟', '⭐', '🔥', '🎮', '🎸', '🚀', '🌸', '🍀', '💎', '👑'];

function initAvatarPicker() {
    var container = document.getElementById('avatar-options');
    if (!container || container.children.length) return;
    for (var i = 0; i < AVATARS.length; i++) {
        var span = document.createElement('span');
        span.textContent = AVATARS[i];
        span.onclick = function() {
            document.getElementById('profile-avatar').textContent = this.textContent;
            document.getElementById('avatar-picker').classList.remove('show');
        };
        container.appendChild(span);
    }
}

function isVip() {
    var userData = localStorage.getItem('user');
    if (!userData) return false;
    var user = JSON.parse(userData);
    return user.vip_expires && new Date(user.vip_expires) > new Date();
}

function updateUserUI() {
    var token = localStorage.getItem('token');
    var userData = localStorage.getItem('user');
    var userEl = document.getElementById('sidebar-user');
    if (token && userData) {
        var user = JSON.parse(userData);
        var vipBadge = isVip() ? '<span style="font-size:0.6rem;background:linear-gradient(135deg,#7c3aed,#00d4ff);color:#fff;border-radius:6px;padding:0.1rem 0.35rem;margin-left:0.25rem;font-weight:600">VIP</span>' : '';
        userEl.innerHTML = '<span class="user-avatar">' + (user.avatar || '👤') + '</span>'
            + '<span class="user-name">' + user.username + vipBadge + '</span>'
            + '<div class="user-dropdown">'
            + '<button onclick="openProfile()">个人信息</button>'
            + '<button onclick="openVipPage()">VIP 会员</button>'
            + '<button onclick="switchAccount()">切换账号</button>'
            + '<button onclick="logout()" style="color:#ff6b6b">退出登录</button>'
            + '</div>';
        userEl.onclick = function(e) {
            if (e.target.tagName === 'BUTTON') return;
            this.classList.toggle('open');
        };
    } else {
        userEl.innerHTML = '<span class="user-avatar">👤</span>'
            + '<span class="user-name">未登录</span>';
        userEl.onclick = function() { showAuthModal(); };
        userEl.classList.remove('open');
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    updateUserUI();
    switchPage('dashboard');
}

function switchAccount() {
    logout();
    showAuthModal();
}

async function openProfile() {
    var userData = localStorage.getItem('user');
    if (!userData) { showAuthModal(); return; }
    initAvatarPicker();
    var user = JSON.parse(userData);
    document.getElementById('pf-username').value = user.username || '';
    document.getElementById('pf-bio').value = user.bio || '';
    document.getElementById('pf-gender').value = user.gender || '';
    document.getElementById('pf-zodiac').value = user.zodiac || '';
    document.getElementById('pf-birthday').value = user.birthday || '';
    document.getElementById('pf-location').value = user.location || '';
    document.getElementById('profile-avatar').textContent = user.avatar || '👤';
    document.getElementById('profile-error').textContent = '';
    document.getElementById('sidebar-user').classList.remove('open');
    switchPage('profile');
    renderProfileVip();
}

async function renderProfileVip() {
    var token = localStorage.getItem('token');
    var el = document.getElementById('profile-vip-info');
    if (!token || !el) return;
    el.innerHTML = '<span style="color:var(--text-secondary)">加载中...</span>';
    try {
        var res = await fetch('/api/vip/status?token=' + encodeURIComponent(token));
        var data = await res.json();
        if (data.is_vip) {
            var d = new Date(data.expires);
            el.innerHTML = '⭐ VIP 会员 · 有效期至 ' + d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
            el.style.background = 'rgba(124,58,237,0.15)';
            el.style.borderColor = '#7c3aed';
        } else {
            el.innerHTML = '非VIP用户 · <a onclick="openVipPage()" style="color:var(--accent);cursor:pointer;text-decoration:underline">开通VIP →</a>';
            el.style.background = 'rgba(0,212,255,0.05)';
            el.style.borderColor = 'var(--border)';
        }
    } catch(e) {
        el.innerHTML = '<span style="color:var(--text-secondary)">无法获取VIP信息</span>';
    }
}

async function saveProfile() {
    var token = localStorage.getItem('token');
    if (!token) { showAuthModal(); return; }
    var data = {
        token: token,
        avatar: document.getElementById('profile-avatar').textContent,
        bio: document.getElementById('pf-bio').value.trim(),
        gender: document.getElementById('pf-gender').value,
        zodiac: document.getElementById('pf-zodiac').value,
        birthday: document.getElementById('pf-birthday').value,
        location: document.getElementById('pf-location').value.trim(),
    };
    var btn = document.querySelector('.profile-save-btn');
    var errorEl = document.getElementById('profile-error');
    btn.textContent = '保存中...';
    btn.disabled = true;
    try {
        var res = await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        var result = await res.json();
        if (result.success) {
            localStorage.setItem('user', JSON.stringify(result.user));
            updateUserUI();
            errorEl.textContent = '';
            btn.textContent = '已保存 ✓';
            btn.style.background = 'linear-gradient(135deg,#34c759,#00d4ff)';
            setTimeout(function() {
                btn.textContent = '保存';
                btn.style.background = '';
            }, 2000);
        } else {
            errorEl.textContent = result.error || '保存失败';
        }
    } catch (err) {
        errorEl.textContent = '网络错误';
    }
    btn.disabled = false;
}

async function checkAuth() {
    var token = localStorage.getItem('token');
    if (!token) { updateUserUI(); return; }
    try {
        var res = await fetch('/api/auth/me?token=' + encodeURIComponent(token));
        var data = await res.json();
        if (data.success) {
            localStorage.setItem('user', JSON.stringify(data.user));
        } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    } catch (err) {}
    updateUserUI();
}

/* ========== VIP ========== */
function openVipPage() {
    document.getElementById('sidebar-user').classList.remove('open');
    checkVipStatus();
    switchPage('vip');
}

async function checkVipStatus() {
    var token = localStorage.getItem('token');
    var card = document.getElementById('vip-status-card');
    var text = document.getElementById('vip-status-text');
    if (!token) {
        if (card) card.style.display = 'none';
        return;
    }
    try {
        var res = await fetch('/api/vip/status?token=' + encodeURIComponent(token));
        var data = await res.json();
        if (card && data.is_vip) {
            card.style.display = 'block';
            var d = new Date(data.expires);
            text.textContent = 'VIP 有效期至：' + d.toLocaleDateString('zh-CN');
        } else if (card) {
            card.style.display = 'none';
        }
    } catch (err) {
        if (card) card.style.display = 'none';
    }
}

async function createOrder(plan) {
    var token = localStorage.getItem('token');
    if (!token) { showAuthModal(); return; }
    var names = {monthly: '月付', yearly: '年付'};
    var prices = {monthly: 10, yearly: 100};
    if (!confirm('确认开通 ' + names[plan] + ' VIP？\n金额：' + prices[plan] + ' 元\n\n点击确定模拟支付')) return;
    try {
        var res = await fetch('/api/vip/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: token, plan: plan }),
        });
        var data = await res.json();
        if (!res.ok) { alert(data.detail || '创建订单失败'); return; }
        var res2 = await fetch('/api/vip/confirm-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: token, order_id: data.order_id }),
        });
        var data2 = await res2.json();
        if (data2.success) {
            localStorage.setItem('user', JSON.stringify(data2.user));
            updateUserUI();
            checkVipStatus();
            alert('🎉 支付成功！VIP 已开通');
        } else {
            alert(data2.error || '支付失败');
        }
    } catch (err) {
        alert('网络错误');
    }
}

function getToken() {
    return localStorage.getItem('token') || '';
}

/* ========== NetEase Cookie ========== */
async function checkNeteaseCookie() {
    var statusEl = document.getElementById('netease-cookie-status');
    var hintEl = document.getElementById('cookie-hint');
    if (!statusEl) return;
    try {
        var res = await fetch('/api/netease/cookie');
        var data = await res.json();
        if (data.has_cookie) {
            statusEl.textContent = '✅ Cookie已配置';
            statusEl.classList.add('ok');
            if (hintEl) hintEl.style.display = 'none';
        } else {
            statusEl.textContent = '⚠️ 未配置Cookie';
            statusEl.classList.remove('ok');
            if (hintEl) hintEl.style.display = 'flex';
        }
    } catch (err) {
        statusEl.textContent = '❌ 检查失败';
        statusEl.classList.remove('ok');
    }
}

function showCookieConfig() {
    document.getElementById('cookie-modal').classList.add('active');
    fetch('/api/netease/cookie').then(function(r) { return r.json(); }).then(function(data) {
        if (data.has_cookie) {
            document.getElementById('cookie-input').value = '';
        }
    });
}

function hideCookieConfig() {
    document.getElementById('cookie-modal').classList.remove('active');
}

async function saveNeteaseCookie() {
    var cookie = document.getElementById('cookie-input').value.trim();
    if (!cookie) { alert('请输入Cookie'); return; }
    try {
        var res = await fetch('/api/netease/cookie', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cookie: cookie }),
        });
        var data = await res.json();
        if (data.success) {
            alert('Cookie已保存');
            hideCookieConfig();
            checkNeteaseCookie();
        } else {
            alert('保存失败');
        }
    } catch (err) {
        alert('网络错误');
    }
}



function showVipPrompt() {
    if (confirm('该功能仅限VIP用户使用\n\n是否前往开通？')) {
        openVipPage();
    }
}

document.addEventListener('click', function(e) {
    var track = e.target.closest('#music-progress-track');
    if (track && window._musicAudio && window._musicAudio.duration) {
        var rect = track.getBoundingClientRect();
        var pct = (e.clientX - rect.left) / rect.width;
        window._musicAudio.currentTime = pct * window._musicAudio.duration;
    }
});

document.addEventListener('DOMContentLoaded', function() {
    initMusicAudio();
    loadCrawlers();
    checkAuth();
    checkVipStatus();
    setTimeout(checkNeteaseCookie, 500);
    var chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
        });
    }
    var ipInput = document.getElementById('ip-query');
    if (ipInput) {
        ipInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') { e.preventDefault(); lookupIp(); }
        });
    }
    var authForm = document.getElementById('auth-form');
    if (authForm) {
        authForm.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') { e.preventDefault(); handleAuth(); }
        });
    }
    initNamePicker();
});

"use strict";
const proxy = 'https://able-hawk-60.deno.dev';
//
// Set up the page
//
if(localStorage.getItem('hl-token')) {
    await processLogin();
}
document.querySelectorAll('.change-log-item img').forEach((item, i) => {
    item.insertAdjacentHTML('afterend', `&nbsp;<button evt-click="show-image" data-src="${item.getAttribute("src")}"">Screenshot ${i+1}</button>&nbsp;`);
    item.remove();
});

//
// --- Quick reactivity
// concept from https://medium.com/@Mikepicker/unravel-reactivity-in-16-lines-of-vanilla-js-af13b185a733
//
if (/complete|interactive|loaded/.test(document.readyState)) {
    const unreact = document.querySelectorAll.bind(document)
        unreact('[reactive]').forEach(el => {
            setReactiveProxy(el);
    });
} else {
    document.addEventListener('DOMContentLoaded', function () {
        const unreact = document.querySelectorAll.bind(document)
        unreact('[reactive]').forEach(el => {
            setReactiveProxy(el);
        });
    });
}

function setReactiveProxy(el) {                 
    if(el.attributes['reactive'] != undefined && el.attributes['reactive'] != null)
    {
        const key = el.attributes['reactive'].value

        if (!window[key]){
            window[key] = { elements: [], proxy: null }
        }
        if (!window[key].elements) {
            window[key].elements = [];
        }
        window[key].elements.push(el);
        window[key].proxy = new Proxy({ value: el.innerText }, {
            set(obj, prop, value) {
                window[key].elements.forEach(el => el.innerHTML = value)
                return true
            }
            });
    }
}

function removeReactiveProxy(el) {                 
    if(el.attributes['reactive'] != undefined && el.attributes['reactive'] != null)
    {
        const key = el.attributes['reactive'].value
        window[key] = { elements: [], proxy: null };
    }
}

function setChildrenReactive(elId) {
    let children = document.getElementById(elId).querySelectorAll(":scope [reactive]");
    children.forEach(el => {
        setReactiveProxy(el);
    });
}

function unsetChildrenReactive(elId) {
    let children = document.getElementById(elId).querySelectorAll(":scope [reactive]");
    children.forEach(el => {
        removeReactiveProxy(el);
    });
}

function render(key, value) {
    if(window[key]) {
        window[key].proxy.value = value
    }
}

//
// --- Swap.js (AJAX-style navigation)
//
var loaders = {}, unloaders = {};
register_links();
new MutationObserver(dom_changes).observe(document.querySelector("html"), { childList: true, subtree: true });
window.addEventListener("popstate", () => update(location.href, "[swap-history-restore]", false, "body"));
window.addEventListener("DOMContentLoaded", dom_load);
function update(href, target, pushstate, fallback = null) {
    fetch(href, { headers: new Headers({"swap-target": target}) }).then(r => r.text()).then(html => {
        var tmp = document.createElement('html');
        tmp.innerHTML = html;
        (document.querySelector(target) ?? document.querySelector(fallback)).outerHTML = (tmp.querySelector(target) ?? tmp.querySelector(fallback)).outerHTML;
        if (pushstate)
            history.pushState({}, "", href);
        register_links();  
    });
}
function register_links() {
    for (const elt of document.querySelectorAll('*[swap-target]'))
        elt.onclick = e => {
            update(elt.getAttribute('href'), elt.getAttribute('swap-target'), elt.getAttribute('swap-history'));
            e.preventDefault();
        }
}
function dom_changes(mutations) {
    for (var selector in unloaders)
        for (var m of mutations)
            for (var n of m.removedNodes)
                if (n.matches && n.querySelector && (n.matches(selector) || n.querySelector(selector))) {
                    unloaders[selector]();
                    delete unloaders[selector];
                }
    for (var selector in loaders)
        for (var m of mutations)
            for (var n of m.addedNodes) 
                if (n.matches && n.querySelector && (n.matches(selector) || n.querySelector(selector)))
                        unloaders[selector] = loaders[selector]();
}
function dom_load() {
    for (var selector in loaders)
        if (document.querySelector(selector))
                unloaders[selector] = loaders[selector]();
}

//
// --- Helper functions
//
async function processLogin() {
    let profilePic = document.querySelector('.logged-in-avatar');
    //show spinner?
    // user
    let fetching = await fetch(`${proxy}/mentions`, { method: "GET", headers: { "Authorization": "Bearer " + localStorage.getItem('hl-token') } } );
    const results = await fetching.text();
    // if(results.error) {
    //     localStorage.removeItem('hl-token');
    //     makePopup('login-error', 'Error logging in', results.error);
    // }
    makePopup('mentions', '👥 Live Messenger', results);
}
function removeActiveWindow() {
    const activeWindow = document.querySelector('.window.active');
    if(activeWindow){
        activeWindow.classList.remove('active'); 
    }
} 
function setTabIndexToMinusOne(parentElement) {
    const elements = parentElement.querySelectorAll('*'); // Select all elements under the parent
    elements.forEach(element => {
        element.setAttribute('tabindex', '-1');
    });
}

//
// Table functions
//
const getCellValue = (tr, idx) => tr.children[idx].getAttribute('table-sort');
const comparer = (idx, asc) => (a, b) => ((v1, v2) => 
    v1 !== '' && v2 !== '' && !isNaN(v1) && !isNaN(v2) ? v1 - v2 : v1.toString().localeCompare(v2)
    )(getCellValue(asc ? a : b, idx), getCellValue(asc ? b : a, idx));

//
// Make window popup
//
const documentBaseAddr = `<div>💻</div>
                    <!--<div>Computer</div>
                    <div>System (C:)</div>-->
                    <div>Users</div>
                    <div>Guest</div>
                    <div>Documents</div>`;
function makeComputerPopup(type, content) {
    let id = `computer-${type}-${Date.now()}`;
    let inner = `
            <ul reactive="${id}-menubar" role="menubar" class="can-hover">
                    <li role="menuitem" tabindex="0" aria-haspopup="true">
                        File
                        <ul role="menu">
                        <li role="menuitem">
                            <a href="#menubar">
                            Open <span>Ctrl+O</span>
                            </a>
                        </li>
                        <li role="menuitem">
                            <a href="#menubar">
                            Save <span>Ctrl+S</span>
                            </a>
                        </li>
                        <li role="menuitem" class="has-divider">
                            <a href="#menubar">
                            Save As... <span>Ctrl+Shift+S</span>
                            </a>
                        </li>
                        <li role="menuitem"><a href="#menubar">Exit</a></li>
                        </ul>
                    </li>
                    <li role="menuitem" tabindex="0" aria-haspopup="true">
                        Edit
                        <ul role="menu">
                        <li role="menuitem"><a href="#menubar">Undo</a></li>
                        <li role="menuitem"><a href="#menubar">Copy</a></li>
                        <li role="menuitem"><a href="#menubar">Cut</a></li>
                        <li role="menuitem" class="has-divider"><a href="#menubar">Paste</a></li>
                        <li role="menuitem"><a href="#menubar">Delete</a></li>
                        <li role="menuitem"><a href="#menubar">Find...</a></li>
                        <li role="menuitem"><a href="#menubar">Replace...</a></li>
                        <li role="menuitem"><a href="#menubar">Go to...</a></li>
                        </ul>
                    </li>
                    <li role="menuitem" tabindex="0" aria-haspopup="true">
                        View
                        <ul role="menu">
                        <li role="menuitem" tabindex="0" aria-haspopup="true">
                            Zoom
                            <ul role="menu">
                            <li role="menuitem"><button>Zoom In</button></li>
                            <li role="menuitem"><button>Zoom Out</button></li>
                            </ul>
                        </li>
                        <li role="menuitem"><a href="#menubar">Status Bar</a></li>
                        </ul>
                    </li>
                    <li role="menuitem" tabindex="0" aria-haspopup="true">
                        Help
                        <ul role="menu">
                        <li role="menuitem"><a href="#menubar">View Help</a></li>
                        <li role="menuitem"><a href="#menubar">About</a></li>
                        </ul>
                    </li>
                </ul>
                <div style="display:flex;height:calc(100% - 29px);align-items: stretch;">
                    <div class="has-space has-scrollbar">
                        <ul class="tree-view" style="height:100%;width:150px;">
                            <li>
                                <details open>
                                <summary>⭐ Quick Access</summary>
                                <ul>
                                    <li>🪟 Desktop</li>
                                    <li>⬇️ Downloads</li>
                                    <li>📂 Documents</li>
                                    <li>🎙️ Audio</li>
                                    <li>🖼️ Pictures</li>
                                    <li>📽️ Video</li>
                                </ul>
                                </details>
                            </li>
                        </ul>
                    </div>
                    <div reactive="${id}-content" class="has-space has-scrollbar" style="flex-grow: 1;">
                        ${content}
                    </div>
                </div>`;
    makePopup(id, '🪟 Computer', inner.replaceAll('{{id}}', id),'','',false,`
            <div class="addrbar">
                <div class="navigation">
                    <button class="button round nav-active">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-left" viewBox="0 0 16 16">
                            <path fill-rule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8"/>
                        </svg>
                    </button>
                    <button class="button round">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-right" viewBox="0 0 16 16">
                            <path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8"/>
                        </svg>
                    </button>
                </div>
                <div reactive="${id}-addr" class="addr">${documentBaseAddr}</div>
            </div>`, true);
    setChildrenReactive(`modal-${id}`);
}
function makePopup(
        id, 
        title, 
        content, 
        footer = '', 
        statusbar = '', 
        scrollbar = true, 
        addressbar = '',
        bright = false) {
    // if it already exits, open and make active.
    if(document.getElementById('modal-' + id)) {
        removeActiveWindow();
        document.getElementById('modal-' + id).classList.add('active');
        document.getElementById('modal-' + id).classList.remove('hide');
        return document.getElementById('modal-' + id);
    }
    document.body.insertAdjacentHTML('beforeEnd', 
        '<div class="window glass active '+(bright ? 'is-bright' : '')+'" id="modal-'+id+'" role="dialog" aria-labelledby="dialog-title">' +
            '<div class="hl-dot hl-right-bottom"></div>' +
            '<div id="modal-' + id + '-titlebar" class="title-bar">' +
                '<div class="title-bar-text">' + title + '</div>' +
                '<div class="title-bar-controls">' +
                    '<button aria-label="Minimize" evt-click="minimize-window"></button>' +
                    '<button aria-label="Maximize" evt-click="maximize-window"></button>' +
                    '<button aria-label="Close" evt-click="close-window"></button>' +
                '</div>' +
            '</div>' +
            addressbar +
            '<div id="modal-' + id + '-content" class="window-body ' + (addressbar ? 'has-menu-addr' : '') + ' ' + (scrollbar ? 'has-scrollbar' : '') + ' ' + ( statusbar && footer ? 'has-footer-statusbar' : '' ) + ' ' + ( statusbar ? 'has-statusbar' : '' ) + ' ' + ( footer ? 'has-footer' : '' ) + '">' + content + '</span></div>' +
            (footer ? '<footer>' + footer + '</footer>' : '') +
            (statusbar ? '<div class="status-bar">' + statusbar + '</div>' : '') +
        '</div>'
    );

    removeActiveWindow();
    makeMoveableResizable(id);
    let buttonId = id;
    let buttonTitle = title;
    // TODO Fix this
    // if(event.target && event.target.getAttribute('data-src')) {
    //     buttonId = buttonId + event.target.getAttribute('data-src');
    //     // TODO extend to select image based on src file extension
    //     buttonTitle = `🖼️ ${event.target.getAttribute('data-src').split('/').pop()}`
    // }
    addWindowButton(buttonId, buttonTitle);
    console.log(document.getElementById('modal-' + id));
    return document.getElementById('modal-' + id);
}
function makeMoveableResizable(id) {
    let initX, initY, firstX, firstY;
    makeMoveable('modal-' + id + '-titlebar', initX, initY, firstX, firstY);
    let rightBottom = document.getElementById('modal-' + id).querySelector(".hl-right-bottom");
    rightBottom.addEventListener('mousedown', e => resizeHandler(document.getElementById('modal-' + id), e, false, false, true, true));

    function getCurrentRotation(el) {
        var st = window.getComputedStyle(el, null);
        var tm = st.getPropertyValue("-webkit-transform") ||
            st.getPropertyValue("-moz-transform") ||
            st.getPropertyValue("-ms-transform") ||
            st.getPropertyValue("-o-transform") ||
            st.getPropertyValue("transform")
        "none";
        if (tm != "none") {
            var values = tm.split('(')[1].split(')')[0].split(',');
            var angle = Math.round(Math.atan2(values[1], values[0]) * (180 / Math.PI));
            return (angle < 0 ? angle + 360 : angle);
        }
        return 0;
    }

    function repositionElement(el, x, y) {
        el.style.left = x + 'px';
        el.style.top = y + 'px';
    }

    function resize(el, w, h) {
        el.style.width = w + 'px';
        el.style.height = h + 'px';
    }

    function resizeHandler(el, event, left = false, top = false, xResize = false, yResize = false) {
        let initX = el.offsetLeft;
        let initY = el.offsetTop;
        let mousePressX = event.clientX;
        let mousePressY = event.clientY;
        let minWidth = 50;
        let minHeight = 50;

        let initW = el.offsetWidth;
        let initH = el.offsetHeight;

        let initRotate = getCurrentRotation(el);
        var initRadians = initRotate * Math.PI / 180;
        var cosFraction = Math.cos(initRadians);
        var sinFraction = Math.sin(initRadians);
        
        function eventMoveHandler(event) {
            var wDiff = (event.clientX - mousePressX);
            var hDiff = (event.clientY - mousePressY);
            var rotatedWDiff = cosFraction * wDiff + sinFraction * hDiff;
            var rotatedHDiff = cosFraction * hDiff - sinFraction * wDiff;

            var newW = initW, newH = initH, newX = initX, newY = initY;

            if (xResize) {
                if (left) {
                    newW = initW - rotatedWDiff;
                    if (newW < minWidth) {
                    newW = minWidth;
                    rotatedWDiff = initW - minWidth;
                    }
                } else {
                    newW = initW + rotatedWDiff;
                    if (newW < minWidth) {
                    newW = minWidth;
                    rotatedWDiff = minWidth - initW;
                    }
                }
                newX += 0.5 * rotatedWDiff * cosFraction;
                newY += 0.5 * rotatedWDiff * sinFraction;
            }

            if (yResize) {
                if (top) {
                    newH = initH - rotatedHDiff;
                    if (newH < minHeight) {
                    newH = minHeight;
                    rotatedHDiff = initH - minHeight;
                    }
                } else {
                    newH = initH + rotatedHDiff;
                    if (newH < minHeight) {
                    newH = minHeight;
                    rotatedHDiff = minHeight - initH;
                    }
                }
                newX -= 0.5 * rotatedHDiff * sinFraction;
                newY += 0.5 * rotatedHDiff * cosFraction;
            }

            resize(el, newW, newH);
            repositionElement(el, newX, newY);
        }


        window.addEventListener('mousemove', eventMoveHandler, false);
        window.addEventListener('mouseup', function eventEndHandler() {
            window.removeEventListener('mousemove', eventMoveHandler, false);
            window.removeEventListener('mouseup', eventEndHandler);
        }, false);
    }

    function makeMoveable(id, initX, initY, firstX, firstY) {
        var object = document.getElementById(id);
        object.addEventListener('mousedown', function(e) { 
            e.preventDefault();
            if(e.target.classList.contains('title-bar') || e.target.classList.contains('title-bar-text')) {
                initX = this.parentNode.offsetLeft;
                initY = this.parentNode.offsetTop;
                firstX = e.pageX;
                firstY = e.pageY;

                window.addEventListener('mousemove', dragIt, false);
            }
            
            window.addEventListener('mouseup', function() {
                window.removeEventListener('mousemove', dragIt, false);
            }, false);
        }, false);

        function dragIt(e) {
            object.parentNode.style.left = initX+e.pageX-firstX + 'px';
            object.parentNode.style.top = initY+e.pageY-firstY + 'px';
        }
    }
}
function liveSearch(selector, searchboxEl) {
    let cards = document.querySelectorAll(selector)
    let search_query = searchboxEl.value;
    for (var i = 0; i < cards.length; i++) {
        if(cards[i].textContent.toLowerCase().includes(search_query.toLowerCase())) {
            cards[i].classList.remove("hide");
        } else {
            cards[i].classList.add("hide");
        }
    }
}
function strip(html){
    let doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
}
function growTextArea(el) {
    el.parentNode.dataset.replicatedValue = el.value;
}
//
// Initial Setup
//
makeMoveableResizable('change-log');
makeMoveableResizable('menu');
makeMoveableResizable('index');
document.querySelector(`button[evt-target="modal-index"]`).focus();

//
// Event listeners
//
document.addEventListener("input", (event) => {  
    if(!event.target.getAttribute('evt-input')) {
        return;
    }
    if(event.target.getAttribute('evt-input') == 'grow') {
        growTextArea(event.target);
    }
    if(event.target.getAttribute('evt-input') == 'search') {
        liveSearch(event.target.getAttribute('data-element'), event.target);
    }
});
document.addEventListener("click", async (event) => {
    // comes first because we need to check the parent
    if(event.target.getAttribute('evt-click') == 'table-select' || (event.target.parentNode && event.target.parentNode.getAttribute('evt-click') == 'table-select')){
        let input = event.target.querySelector('input');
        const table = event.target.closest('table');
        const tr = event.target.closest('tr');
        if(event.target.parentNode && event.target.parentNode.getAttribute('evt-click') == 'table-select') {
            input = event.target;
        }
        var highlighted = table.querySelector('tr.highlighted');
        if(highlighted) {
            highlighted.classList.remove('highlighted');
        }
        var checked = table.querySelector('input:checked');
        if(checked) {
            checked.checked = false;
        }
        tr.classList.add('highlighted');
        input.checked = true;
    }
    if(!event.target.getAttribute('evt-click')) {
        const window = event.target.closest(".window");
        //if we click outside the start window we need to close it.
        removeActiveWindow();
        const start = document.getElementById('modal-start');
        if(window) {
            window.classList.add('active');
            if(document.querySelector(`button[evt-target="${window.getAttribute('id')}"]`)) {
                //document.querySelector(`button[evt-target="${window.getAttribute('id')}"]`).focus();
            }
        }
        if(window != start) {
            start.classList.add('hide');
        } 
        return;
    }
    event.preventDefault();
    if(event.target.getAttribute('evt-click') == 'table-sort') {
        const th = event.target;
        const table = event.target.closest('table');
        const tbody = table.querySelector('tbody');
        const searchRow = event.target.getAttribute('table-sort') == 'has-search';
        var highlighted = table.querySelector('th.highlighted');
        if(highlighted) {
            highlighted.classList.remove('highlighted');
            highlighted.classList.remove('indicator');
            highlighted.classList.remove('up');
        }
        if(event.target.asc == undefined) {
            event.target.classList.add('highlighted');
        } else if(event.target.asc) {
            event.target.classList.add('highlighted');
            event.target.classList.add('indicator');
        } else {
            event.target.classList.add('highlighted');
            event.target.classList.add('indicator');
            event.target.classList.add('up');
        }
        Array.from(searchRow ? tbody.querySelectorAll('tr:nth-child(n+2)') : tbody.querySelectorAll('tr'))
            .sort(comparer(Array.from(th.parentNode.children).indexOf(th), event.target.asc = !event.target.asc))
            .forEach(tr => tbody.appendChild(tr) );
    }
    if(event.target.getAttribute('evt-click') == 'show-login') {
        removeActiveWindow();
        document.getElementById('login-dialog').showModal();
        return;
    }
    if(event.target.getAttribute('evt-click') == 'close-login') {
        removeActiveWindow();
        document.getElementById('switch-user').innerHTML = 'Guest';
        document.getElementById('login-dialog').close();
        return;
    }
    if(event.target.getAttribute('evt-click') == 'process-login') {
        const token = document.getElementById('password').value;
        const key = document.getElementById('key').value;
        localStorage.setItem('hl-token', token);
        localStorage.setItem('key', key);
        await processLogin();
        document.getElementById('login-dialog').close();
        return;
    }
    if(event.target.getAttribute('evt-click') == 'open-note-editor') {
        const id = event.target.getAttribute('data-id');
        const notebookId = event.target.getAttribute('data-notebook-id');
        const title = document.querySelector(`[reactive="notebook-${notebookId}-note-${id}-title"]`).innerHTML;
        // check to see if already open

        // otherwise, make it
        //document.querySelector(`[reactive="notebook-${notebookId}-note-${id}-content"]`).innerHTML
        makePopup(
            `edit-notebook-${notebookId}-note-${id}`, 
            title, 
            `<div role="progressbar" class="marquee"></div>`);
        var modal = document.getElementById(`modal-edit-notebook-${notebookId}-note-${id}-content`)
        modal.innerHTML = spell().outerHTML;
        document.querySelector(`#modal-edit-notebook-${notebookId}-note-${id} .spell-content`).innerHTML = document.querySelector(`[reactive="notebook-${notebookId}-note-${id}-content"]`).innerHTML;
    }
    if(event.target.getAttribute('evt-click') == 'computer-navigate-notebook') {
        const target = event.target.getAttribute('evt-target');
        const id = event.target.getAttribute('data-id');
        const title = event.target.getAttribute('data-title');
        render(`${target}-content`, `<div role="progressbar" class="marquee"></div>`);
        let fetching = await fetch(`${proxy}/notes/notebooks/${id}?target=${target}`, { method: "GET", headers: { "Authorization": "Bearer " + localStorage.getItem('hl-token') } } );
        const results = await fetching.text();
        render(`${target}-content`, results);
        render(`${target}-addr`, `${documentBaseAddr}<div>Notes</div><div>${title}</div>`);
        render(`taskbar-${target}-button`,title)
        setChildrenReactive(`modal-${target}`);
        if(localStorage.getItem("key")) {
            document.querySelectorAll(`.decryptMe`).forEach(async (element) => {
                await decryptNote(element)
            });                        
        }
    }
    if(event.target.getAttribute('evt-click') == 'computer-navigate') {
        const target = event.target.getAttribute('evt-target');
        const id = event.target.getAttribute('data-id');
        if(target == 'blog') {
            // maybe have it as a template in HTML and then pull it in?
            alert('load blog')
        } else if(target == 'notes') {
            render(`${id}-content`, `<div role="progressbar" class="marquee"></div>`);
            render(`${id}-addr`, `${documentBaseAddr}<div>Notes</div>`);
            render(`taskbar-${id}-button`,`Notes`)
            let fetching = await fetch(`${proxy}/notes/notebooks?id=${id}`, { method: "GET", headers: { "Authorization": "Bearer " + localStorage.getItem('hl-token') } } );
            const results = await fetching.text();
            render(`${id}-content`, results);
        }
    }
    if(event.target.getAttribute('evt-click') == 'show-computer') {
        const target = event.target.getAttribute('evt-target');
        //if(target == 'documents') {
        console.log(target)
        // Here we should check if the user is logged in....
        // and only show the notes if yes....
        makeComputerPopup(target, `
            <table>
                <thead>
                    <tr class="full-width">
                        <th class="action">Select</th>
                        <th evt-click="table-sort" table-sort="has-search">Name</th>
                        <th evt-click="table-sort" table-sort="has-search">Modified</th>
                        <th evt-click="table-sort" table-sort="has-search" class="action">Count</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>&nbsp;</td>
                        <td colspan="3" class="table-search has-space">
                            <input evt-input="search" data-element=".{{id}}-table-search" type="search" placeholder="Search">
                        </td>
                    </tr>
                    <tr class="{{id}}-table-search">
                        <td class="action">
                            <div evt-click="table-select" class="field-row">
                                <input name="{{id}}-table-blog-selector" type="radio" data-id="blog" id="{{id}}-table-blog-checkbox">
                                <label for="{{id}}-table-blog-checkbox">&nbsp;</label>
                            </div>
                        </td>
                        <td table-sort="Blog" class="pointer" evt-click="computer-navigate" data-id="{{id}}" evt-target="blog" data-title="Blog">
                            📂 Blog
                        </td>
                        <td table-sort="2025-01-27T17:53:11+00:00">1/27/2025, 5:53:11 PM</td>
                        <td table-sort="00015">15</td>
                    </tr>
                    <tr class="notebooks-table-search">
                        <td class="action">
                            <div evt-click="table-select" class="field-row">
                                <input name="{{id}}-table-notes-selector" type="radio" data-id="notes" id="{{id}}-table-notes-checkbox">
                                <label for="{{id}}-table-notes-checkbox">&nbsp;</label>
                            </div>
                        </td>
                        <td table-sort="Notes" class="pointer" evt-click="computer-navigate" data-id="{{id}}" evt-target="notes" data-title="Notes">
                            📂 Notes
                        </td>
                        <td table-sort="2025-04-29T21:02:33+00:00">4/29/2025, 9:02:33 PM</td>
                        <td table-sort="00002">2</td>
                    </tr>
                </tbody>
            </table>
            `);
        //}
        return;
    }
    //show-computer
    if(event.target.getAttribute('evt-click') == 'toggle-window') {
        const target = document.getElementById(event.target.getAttribute('evt-target'));
        removeActiveWindow();
        if(!target.classList.contains('hide')) {
            target.classList.add('hide');  
        } else {
            target.classList.add('active');
            target.classList.remove('hide'); 
        }
        return;
    }
    if(event.target.getAttribute('evt-click') == 'close-window') {
        const modal = event.target.closest('[role="dialog"]');
        const button = document.querySelector(`button[evt-target="${modal.getAttribute('id')}"]`);
        if(!modal.classList.contains('hide')) {
            modal.classList.add('hide'); 
            if(button) {
                button.classList.add('hide');
            } 
        }
        render(`window-count`, document.querySelector('.window').length - document.querySelector('.window.hide').length);
        removeActiveWindow();
        return;
    }
    if(event.target.getAttribute('evt-click') == 'open-window') {
        const target = document.getElementById(event.target.getAttribute('evt-target'));
        removeActiveWindow();
        const button = document.querySelector(`button[evt-target="${event.target.getAttribute('evt-target')}"]`);
        target.classList.remove('hide'); 
        target.classList.add('active');
        if(button) {
            button.classList.remove('hide');
            button.focus();
        }
        return;
    }
    if(event.target.getAttribute('evt-click') == 'maximize-window') {
        //store old size
        const modal = event.target.closest('[role="dialog"]');
        modal.style.width = '100vw';
        modal.style.height = 'calc(100vh - 32px)';
        modal.style.left = '50vw';
        modal.style.top = 'calc(50vh - 16px)';
        removeActiveWindow();
        modal.classList.add('active');
        const button = document.querySelector(`button[evt-target="${modal.getAttribute('id')}"]`);
        if(button) {
            button.focus();
        }
    }
    if(event.target.getAttribute('evt-click') == 'minimize-window') {
        const modal = event.target.closest('[role="dialog"]');
        modal.classList.add('hide'); 
    }
    if(event.target.getAttribute('evt-click') == 'show-image') {
        // make a window with the image
        const modal = makePopup('enlarge-' + event.target.getAttribute('data-src'), event.target.getAttribute('data-src').split('/').pop(), '<img class="enlarged" src="'+event.target.getAttribute('data-src')+'" />');
        modal.style.width = 'min(100vw, '+modal.querySelector('img').naturalWidth+'px)';
        modal.style.height = 'min(80vh, '+modal.querySelector('img').naturalHeight+'px)';
    }
});

function addWindowButton(target, title) {
    if(document.querySelector(`.app-buttons button[evt-target="modal-${target}"]`)) {
        document.querySelector(`.app-buttons button[evt-target="modal-${target}"]`).focus();
        return;
    }
    let id = Date.now()
    document.querySelector('.app-buttons').insertAdjacentHTML('beforeend',`<button id="${id}" reactive="taskbar-${target}-button" evt-click="toggle-window" evt-target="modal-${target}">${title}</button>`);
    setChildrenReactive(id)
    document.querySelector(`.app-buttons button[evt-target="modal-${target}"]`).focus();
    render(`window-count`, document.querySelector('.window').length - document.querySelector('.window.hide').length);
    //document.querySelector('.fab').innerHTML = `📲 windows (${document.querySelectorAll('.app-buttons button').length - 1})`;
}
const converter = new showdown.Converter({	
    metadata: true,
    parseImgDimensions: true,
    strikethrough: true,
    tables: true,
    ghCodeBlocks: true,
    smoothLivePreview: true,
    simpleLineBreaks: true,
    emoji: true, 
});
function hexStringToArrayBuffer(hexString) {
    const length = hexString.length / 2;
    const array_buffer = new ArrayBuffer(length);
    const uint8_array = new Uint8Array(array_buffer);

    for (let i = 0; i < length; i++) {
        const byte = parseInt(hexString.substr(i * 2, 2), 16);
        uint8_array[i] = byte;
    }

    return array_buffer;
}
async function decryptWithKey(encryptedText) {
    const imported_key = localStorage.getItem("key") ? await crypto.subtle.importKey(
        'raw',
        hexStringToArrayBuffer(localStorage.getItem("key").substr(4)),
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    ) : '';
    const encrypted_data = new Uint8Array(atob(encryptedText).split('').map(char => char.charCodeAt(0)));
    const iv = encrypted_data.slice(0, 12);
    const ciphertext = encrypted_data.slice(12);

    const decrypted_buffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        imported_key,
        ciphertext
    );

    const decoder = new TextDecoder();
    const decrypted_text = decoder.decode(decrypted_buffer);
    return decrypted_text;
}
async function encryptWithKey(text) {
    const imported_key = localStorage.getItem("key") ? await crypto.subtle.importKey(
        'raw',
        hexStringToArrayBuffer(localStorage.getItem("key").substr(4)),
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    ) : '';
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const plaintext_buffer = encoder.encode(text);

    const ciphertext_buffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        imported_key,
        plaintext_buffer
    );

    const encrypted_data = new Uint8Array([...iv, ...new Uint8Array(ciphertext_buffer)]);
    const base64_encoded = btoa(String.fromCharCode(...encrypted_data));
    return base64_encoded;
}
async function decryptNote(noteEL) {
    const noteId = noteEL.getAttribute('data-id');
    const notebookId = noteEL.getAttribute('data-notebook-id');
    const markdown = await decryptWithKey(noteEL.innerHTML);
    const html = converter.makeHtml(markdown);
    // if(rawEl) {
    //     rawEl.value = markdown;
    // }
    //noteEL.innerHTML = html;

    // now we need to render the changes across all document windows
    render(`notebook-${notebookId}-note-${noteId}-content`, html);

    const metadata = converter.getMetadata();
    const title = metadata && metadata.title ? metadata.title.length > 25 ? metadata.title.substring(0,25) + '...' : metadata.title : strip(html).substring(0,25) + '...';
    render(`notebook-${notebookId}-note-${noteId}-title`, title);
    // if(metaEl){
    //     metaEl.innerHTML = '<table>' + objectToTableRows(metadata) + '</table>';
    // }
    let tags = metadata && metadata.tags ? metadata.tags.replace('[','').replace(']','').split(',') : [];
    render(`notebook-${notebookId}-note-${noteId}-tags`, metadata && metadata.tags ? tags.map(t => '#' + t).join(', ') : '');
    // if(tagsEl) {
    //     tagsEl.innerHTML = metadata && metadata.tags ? tags.map(t => '#' + t).join(', ') : ''; 
    // }
}
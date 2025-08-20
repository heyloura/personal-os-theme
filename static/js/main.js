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
const unreact = document.querySelectorAll.bind(document)

document.addEventListener('DOMContentLoaded', function () {
    unreact('[reactive]').forEach(el => {
    setReactiveProxy(el);
    })
})

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
    let children = $Id(elId).querySelectorAll(":scope [reactive]");
    children.forEach(el => {
        
        setReactiveProxy(el);
    });
}

function unsetChildrenReactive(elId) {
    let children = $Id(elId).querySelectorAll(":scope [reactive]");
    children.forEach(el => {
        removeReactiveProxy(el);
    });
}

window.render = (key, value) => window[key].proxy.value = value

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
    makePopup('mentions', 'Recent Mentions', JSON.stringify(results));
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
function makeComputerPopup(type, content) {
    let id = `computer-${type}-${Date.now()}`;
    makePopup(id, '🪟 Computer', `
            <ul role="menubar" class="can-hover">
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
                        <ul class="tree-view is-bright" style="height:100%">
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
                    <div class="has-space has-scrollbar" style="flex-grow: 1;">
                        ${content}
                    </div>
                </div>`,'','',false,`
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
                <div class="addr">
                    <div>💻</div>
                    <div>Computer</div>
                    <div>System (C:)</div>
                    <div>Users</div>
                    <div>Guest</div>
                    <div>Documents</div>
                </div>
                <form>
                    <input type="search" placeholder="Search Documents" class="winui-searchbox">
                </form>
            </div>
            `)
}
function makePopup(id, title, content, footer = '', statusbar = '', scrollbar = true, addressbar = '') {
    // if it already exits, open and make active.
    if(document.getElementById('modal-' + id)) {
        removeActiveWindow();
        document.getElementById('modal-' + id).classList.add('active');
        document.getElementById('modal-' + id).classList.remove('hide');
        return document.getElementById('modal-' + id);
    }
    document.body.insertAdjacentHTML('beforeEnd', 
        '<div class="window glass active" id="modal-'+id+'" role="dialog" aria-labelledby="dialog-title">' +
            '<div class="hl-dot hl-right-bottom"></div>' +
            '<div id="modal-' + id + '-titlebar" class="title-bar">' +
                '<div class="title-bar-text">' + title + '</div>' +
                '<div class="title-bar-controls">' +
                    '<button aria-label="Minimize" evt-click="minimize-window"></button>' +
                    '<button aria-label="Maximize" evt-click="maximize-window"></button>' +
                    '<button aria-label="Close" evt-click="close-window"></button>' +
                '</div>' +
                addressbar +
            '</div>' +
            '<div id="modal-' + id + '-content" class="window-body ' + (addressbar ? 'has-menu-addr' : '') + ' ' + (scrollbar ? '' : 'has-scrollbar') + ' ' + ( statusbar && footer ? 'has-footer-statusbar' : '' ) + ' ' + ( statusbar ? 'has-statusbar' : '' ) + ' ' + ( footer ? 'has-footer' : '' ) + '">' + content + '</span></div>' +
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
document.addEventListener("click", async (event) => {
    if(!event.target.getAttribute('evt-click')) {
        const window = event.target.closest(".window");
        //if we click outside the start window we need to close it.
        removeActiveWindow();
        const start = document.getElementById('modal-start');
        if(window) {
            window.classList.add('active');
            if(document.querySelector(`button[evt-target="${window.getAttribute('id')}"]`)) {
                document.querySelector(`button[evt-target="${window.getAttribute('id')}"]`).focus();
            }
        }
        if(window != start) {
            start.classList.add('hide');
        } 
        return;
    }
    event.preventDefault();
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
        localStorage.setItem('hl-token', token);
        await processLogin();
        document.getElementById('login-dialog').close();
        return;
    }
    if(event.target.getAttribute('evt-click') == 'show-computer') {
        const target = document.getElementById(event.target.getAttribute('evt-target'));
        makeComputerPopup(target, `<h1>Hello World</h1>`);
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
    document.querySelector('.app-buttons').insertAdjacentHTML('beforeend',`<button evt-click="toggle-window" evt-target="modal-${target}">${title}</button>`);
    document.querySelector(`.app-buttons button[evt-target="modal-${target}"]`).focus();
    document.querySelector('.fab').innerHTML = `📲 windows (${document.querySelectorAll('.app-buttons button').length - 1})`;
}
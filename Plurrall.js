// ==UserScript==
// @name         Plurall - Botão de Download XOD
// @namespace    local.plurall.download
// @version      0.1.0
// @description  Adiciona um botão para salvar o XOD que o leitor já carregou.
// @match        https://bibliotecadeconteudos.plurall.net/*
// @grant        GM_download
// @grant        GM_xmlhttpRequest
// @connect      d10q0576jc73zh.cloudfront.net
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    const books = new Map();

    function isXod(url) {
        try {
            return new URL(url, location.href).pathname.toLowerCase().endsWith('.xod');
        } catch {
            return false;
        }
    }

    function rememberXod(url) {
        if (!isXod(url)) return;

        const cleanUrl = new URL(url, location.href).href;
        const id = cleanUrl.split('/').pop().split('?')[0];

        books.set(id, cleanUrl);

        console.log('[Plurall Downloader] XOD detectado:', cleanUrl);

        updateButtons();
    }

    // Detecta fetch()
    const originalFetch = window.fetch;

    window.fetch = function (...args) {
        try {
            const request = args[0];
            const url = typeof request === 'string'
                ? request
                : request?.url;

            if (url) rememberXod(url);
        } catch {}

        return originalFetch.apply(this, args);
    };

    // Detecta XMLHttpRequest
    const originalOpen = XMLHttpRequest.prototype.open;

    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
        try {
            rememberXod(url);
        } catch {}

        return originalOpen.call(this, method, url, ...rest);
    };

    function createButton() {
        const button = document.createElement('button');

        button.textContent = '⬇ Baixar XOD';

        Object.assign(button.style, {
            display: 'block',
            width: '100%',
            marginTop: '8px',
            padding: '8px 12px',
            border: '0',
            borderRadius: '6px',
            background: '#2563eb',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
        });

        button.addEventListener('click', () => {
            const entries = [...books.entries()];

            if (!entries.length) {
                alert(
                    'Nenhum arquivo XOD foi detectado ainda.\n\n' +
                    'Abra o livro primeiro e tente novamente.'
                );
                return;
            }

            // Primeira versão: usa o XOD mais recentemente detectado.
            const [, url] = entries.at(-1);

            const filename =
                new URL(url).pathname.split('/').pop() || 'livro.xod';

            console.log('[Plurall Downloader] Baixando:', url);

            GM_download({
                url,
                name: filename,

                onload() {
                    console.log(
                        '[Plurall Downloader] Download concluído.'
                    );
                },

                onerror(error) {
                    console.error(
                        '[Plurall Downloader] Erro:',
                        error
                    );

                    alert(
                        'Não foi possível baixar o arquivo.\n\n' +
                        'A URL pode ter expirado ou o servidor pode exigir ' +
                        'uma sessão/autorização válida.'
                    );
                }
            });
        });

        return button;
    }

    function addGlobalButton() {
        if (document.getElementById('plurall-xod-download')) {
            return;
        }

        const container = document.createElement('div');

        container.id = 'plurall-xod-download';

        Object.assign(container.style, {
            position: 'fixed',
            right: '20px',
            bottom: '20px',
            zIndex: '2147483647',
            background: '#fff',
            padding: '10px',
            borderRadius: '10px',
            boxShadow: '0 4px 20px rgba(0,0,0,.25)'
        });

        const button = createButton();

        container.appendChild(button);
        document.body.appendChild(container);
    }

    function updateButtons() {
        const button = document.querySelector(
            '#plurall-xod-download button'
        );

        if (!button) return;

        button.textContent =
            books.size > 0
                ? `⬇ Baixar XOD (${books.size})`
                : '⬇ Baixar XOD';
    }

    function start() {
        addGlobalButton();
        updateButtons();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }

})();
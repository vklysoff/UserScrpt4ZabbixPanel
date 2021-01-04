// ==UserScript==
// @name myUserJSZabbix
// @description Попытки пытки Зяббакс
// @author Lysov Vitalij
// @license MIT
// @version 1.1
// @include http*://zabbix*
// @updateURL https://raw.githubusercontent.com/vklysoff/UserScrpt4ZabbixPanel/main/UserScrpt4ZabbixPanel.js
// ==/UserScript==
(function (window, undefined) {
    'use strict';
    var w;
    if (typeof unsafeWindow != undefined) {
        w = unsafeWindow
    } else {
        w = window;
    }
    if (w.self != w.top) {
        return;
    }
    if (/https:\/\/zabbix/.test(w.location.href)) {
        let defaultConfig = {
            highlight: {
                p: 'MTS-PROD',
                h: '',
                s: 'csync|Мало места на диске|mysql',
            },
            hide: {
                ack: 1, //Скрыть подтвержденное
                timeline: 1, //Удаляем идущие подряд часовые строки
            }
        }
        window.localStorage.setItem('savedConfig', JSON.stringify(defaultConfig));
        let config = JSON.parse(window.localStorage.getItem('savedConfig'));
        let filter_s = new RegExp(config.highlight.s, "i");
        let filter_h = new RegExp(config.highlight.h, "i");
        let filter_p = new RegExp(config.highlight.p, "i");
        let filter_s_hide = new RegExp('', "i");
        let color = Math.floor(Math.random() * 16777216).toString(16);
        document.body.style.backgroundColor='#000000'.slice(0, -color.length) + color;

        setInterval( function() {
            let t=document.getElementsByClassName('list-table')[0];
            for ( let i = 1, l = t.rows.length; i < l; i++ ){
                // TODO: Маркер начала дежурства
                //let row = document.createElement('tr');
                //row.innerHTML='<tr class="hover-nobg" style="background-color: lightgreen;"><td class="timeline-date"><h4>21:00</h4></td><td class="timeline-axis timeline-dot-big"></td><td class="timeline-td"></td><td colspan="7"></td></tr>';
                //t.rows[1].parentNode.insertBefore(row, t.rows[1]);

                // Подсвечиваем и пропускаем почасовые строки
                if ( t.rows[i].cells.length < 5 ) {
                    if ( t.rows[i].cells[0].textContent != '21:00' ) {
                        t.rows[i].style.backgroundColor = 'lightcyan';
                        if ( config.hide.timeline && t.rows[i-1].cells.length < 5 ) {
                            t.rows[i].parentNode.removeChild(t.rows[i]); //Удаляем идущие подряд часовые строки
                            l--;
                        }
                    } else {
                        t.rows[i].style.backgroundColor = 'lightgreen';
                    }
                    continue;
                }
                // Выделяем узлы по проектам
                if( filter_p.test(t.rows[i].cells[4].textContent) ){
                    t.rows[i].cells[4].style.border = "thick solid maroon";
                }
                // Выделяем проблемы
                if( filter_s.test(t.rows[i].cells[5].textContent) ){
                    t.rows[i].cells[5].style.border = "thick solid maroon";
                }
                // Удаляем ненужный "шум"
                //if( filter_s_hide.test(t.rows[i].cells[5].textContent) ){
                //    t.rows[i].parentNode.removeChild(t.rows[i]);
                //}

                // Скрываем подтверждённое
                if( config.hide.ack && t.rows[i].cells[8].textContent == 'Да' ){
                    t.rows[i].parentNode.removeChild(t.rows[i]);
                    l--;
                }
            }
        }, 5000);
    }
})(window);

// ==UserScript==
// @name myUserJSZabbix
// @namespace https://github.com/vklysoff/
// @copyright 2020, vklysoff
// @author Lysov Vitalij
// @description Попытки пытки Зяббакс
// @license GNU GENERAL PUBLIC LICENSE
// @encoding utf-8
// @version 1.9
// @include http*://zabbix*
// @supportURL https://github.com/vklysoff/UserScrpt4ZabbixPanel
// @updateURL https://raw.githubusercontent.com/vklysoff/UserScrpt4ZabbixPanel/main/UserScrpt4ZabbixPanel.js
// @downloadURL https://raw.githubusercontent.com/vklysoff/UserScrpt4ZabbixPanel/main/UserScrpt4ZabbixPanel.js
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
                s: 'csync|Мало места на диске|MySQL|Ошибок celery за послеждние',
            },
            hide: {
                ack: 1, //Скрыть подтвержденное
                timeline: 1, //Удаляем идущие подряд часовые строки
                phs: [
                    [
                        'DC-PROD','ds-.*','Наличие просроченных сертификатов'
                    ],
                    [
                        '','^ds-.*','Наличие просроченных сертификатов'
                    ],
                    //[
                    //    '','\.ppt.*',''
                    //],
                    [
                        '','','Нет данных по'
                    ],
                ],
            },
            duty: {
                start: 900,
                start_text: '09:00',
            }
        }
        window.localStorage.setItem('savedConfig', JSON.stringify(defaultConfig));
        let config = JSON.parse(window.localStorage.getItem('savedConfig'));
        let filter_s = new RegExp(config.highlight.s, "");
        let filter_h = new RegExp(config.highlight.h, "i");
        let filter_p = new RegExp(config.highlight.p, "i");
        //let color = Math.floor(Math.random() * 16777216).toString(16);
        //document.body.style.backgroundColor='#000000'.slice(0, -color.length) + color;


        setInterval( function() {
            let t=document.getElementsByClassName('list-table')[0];
            let prev_hour_mark = 1;
            let duty_marked = 0;
            for ( let i = 1, l = t.rows.length; i < l; i++ ){
                if ( t.rows[i].cells.length > 4 ) {
                    let c = t.rows[i].cells[5].getAttribute('class');
                    if ( c != null ) {
                        let filter = new RegExp('blink', "");
                        if ( ! filter.test(c) ) {
                            console.log(filter);
                            t.rows[i].setAttribute('class', c);
                        }
                    }
                    //console.log(c);
                }

                // TODO: Маркер начала дежурства
                if ( t.rows[i].cells.length < 5 ) {
                    if ( config.duty.start == Number(t.rows[i].cells[0].textContent.replace(':','')) ) {
                        duty_marked = 1;
                    }
                    if ( ! duty_marked ) {
                        //console.log(duty_marked, prev_hour_mark);
                        if ( config.duty.start > Number(t.rows[i].cells[0].textContent.replace(':','')) ) {
                            //console.log(duty_marked, prev_hour_mark, i, Number(t.rows[prev_hour_mark].cells[0].textContent.replace(':','')));
                            let row = document.createElement('tr');
                            row.innerHTML='<tr class="hover-nobg" style="background-color: lightgreen;"><td class="timeline-date"><h4>' + config.duty.start_text + '</h4></td><td class="timeline-axis timeline-dot-big"></td><td class="timeline-td"></td><td colspan="7"></td></tr>';
                            t.rows[i].parentNode.insertBefore(row, t.rows[prev_hour_mark]);
                            duty_marked = 1;
                        }
                        prev_hour_mark = i;
                    }
                }

                // Подсвечиваем почасовые строки и пропускаем идущие подряд
                if ( t.rows[i].cells.length < 5 ) {
                    if ( Number(t.rows[i].cells[0].textContent.replace(':','')) != config.duty.start ) {
                        t.rows[i].style.backgroundColor = 'lightblue';
                        if ( config.hide.timeline && t.rows[i-1].cells.length < 5 ) {
                            t.rows[i].parentNode.removeChild(t.rows[i]); //Удаляем идущие подряд часовые строки
                            l--;
                            i--;
                            continue;
                        }
                    } else {
                        t.rows[i].style.backgroundColor = 'lightgreen';
                    }
                    continue;
                }
                // Скрываем указанные в массиве config.hide.phs записи
                if ( config.hide.phs.length) {
                    for ( let j = 0, k = config.hide.phs.length; j < k; j++ ){
                        let filter_p_hide = new RegExp(config.hide.phs[j][0], "i");
                        let filter_h_hide = new RegExp(config.hide.phs[j][1], "i");
                        let filter_s_hide = new RegExp(config.hide.phs[j][2], "i");
                        if ( filter_p_hide.test(t.rows[i].cells[4].textContent) && filter_h_hide.test(t.rows[i].cells[4].textContent) && filter_s_hide.test(t.rows[i].cells[5].textContent) ){
                            t.rows[i].parentNode.removeChild(t.rows[i]);
                            l--;
                            i--;
                        }
                    }
                }
                // Выделяем узлы по проектам
                if( filter_p.test(t.rows[i].cells[4].textContent) ){
                    t.rows[i].cells[4].style.border = "thick solid maroon";
                }
                // Выделяем проблемы
                if( filter_s.test(t.rows[i].cells[5].textContent) ){
                    t.rows[i].cells[5].style.border = "thick solid maroon";
                }
                // Скрываем подтверждённое
                if( config.hide.ack && t.rows[i].cells[8].textContent == 'Да' ){
                    t.rows[i].parentNode.removeChild(t.rows[i]);
                    l--;
                    i--;
                    continue;
                }
            }
        }, 5000);
    }
})(window);
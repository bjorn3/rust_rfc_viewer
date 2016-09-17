/*
   Copyright 2016 bjorn3

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

//jshint enforceall:true
//jshint camelcase:false
//jshint browser:true
//jshint esnext:true
/* globals fetch, showdown */

/* globals get_rfcs_from_text_folder, get_rfcs_from_pr_list */
/* exported open_text_popup, open_url_popup, close_text_popup*/

"use strict";

let template = `<li id="rfc-{{id}}">
    <span class="state {{state}}">{{state}}</span><span class="id">{{id}}</span><span class="name">{{name}}</span>
    <span class="buttons">
        <a href="#" data-file="{{text}}" onclick="open_text_popup(event)">Text</a>
        <a href="{{discussion}}">Discussion</a>
    </span>
</li>`;

window.onload = function(){
    get_rfcs_from_text_folder();
    
    get_rfcs_from_pr_list("https://api.github.com/repos/rust-lang/rfcs/pulls?state=all")
        .then(function(url){
            requestAnimationFrame(show_rfcs);
            if(url){
                window.setTimeout(function(){
                    get_rfcs_from_pr_list(url);
                }, 5000);
            }
        });
};

let already_inserted_rfcs = [];

function show_rfcs(){
    let rfc_list = document.getElementById("rfc_list");
    window.rfc_data = window.rfc_data.sort(function(a,b){
        return a.id > b.id;
    });
    //rfc_list.innerHTML = "";
    for(let rfc of window.rfc_data){
        //if(rfc.id > 100){continue;} //HACK to prevent the browser from crashing
        if(already_inserted_rfcs.indexOf(rfc.id) !== -1){
            continue;
        }
        rfc_list.innerHTML += template
            .replace(/{{id}}/g, rfc.id)
            .replace("{{name}}", rfc.name)
            .replace("{{text}}", rfc.text)
            .replace("{{discussion}}", rfc.discussion)
            .replace(/{{state}}/g, rfc.state)
        ;
        already_inserted_rfcs.push(rfc.id);
    }
    document.getElementsByClassName("spinner-wrapper")[0].hidden = true;
}

let showdown_inst = new showdown.Converter({
    tables: true,
    ghCodeBlocks: true,
    tasklists: true,
    simplifiedAutoLink: true
});

function open_text_popup(evt){
    evt.preventDefault();
    fetch(evt.originalTarget.dataset.file)
        .then(function(res){
            return res.text();
        }).then(function(text){
            document.querySelector("#rfc_text").innerHTML = "<a href=\"#\" onclick=\"close_text_popup(event)\" class=\"close_button\">X</a>" + showdown_inst.makeHtml(text);
            document.querySelector("#rfc_text_wrapper").hidden = false;
        });
}

function open_url_popup(evt){
    document.querySelector("#rfc_text").innerHTML = `<a href="#" onclick=\"close_text_popup(event)\" class=\"close_button\">X</a><iframe src="` + evt.originalTarget.dataset["href"] +"\"></iframe>"; //jshint ignore:line
    document.querySelector("#rfc_text_wrapper").hidden = false;
}

function close_text_popup(){
    document.querySelector("#rfc_text_wrapper").hidden = true;
}

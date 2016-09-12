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
/* globals fetch */
/* exported open_text_popup, open_url_popup, close_text_popup*/

"use strict";

let rfc_data = [];

let template = `<li>
    <span class="state {{state}}">{{state}}</span><span class="id">{{id}}</span><span class="name">{{name}}</span>
    <span class="buttons">
        <a href="#" data-file="{{text}}" onclick="open_text_popup(event)">Text</a>
        <a href="{{discussion}}">Discussion</a>
    </span>
</li>`;

window.onload = function(){
    
    fetch("https://api.github.com/repos/rust-lang/rfcs/contents/text").then((res)=>res.json())
        .then(function(json){
            console.log(json);
            for(let rfc of json){
                rfc_data.push({
                    id: rfc.name.split("-")[0],
                    name: rfc.name.split("-").slice(1).join(" ").replace(/\.md$/, ""),
                    text: rfc.download_url,
                    discussion: "about:blank",
                    state: "Accepted"
                });
            }
            show_rfcs();
        });
    
    let next_pr_url = "https://api.github.com/repos/rust-lang/rfcs/pulls?state=all";
    function pr_status(url){
        fetch(url)
            .then(function(res){
                console.log(res);
                let prs_url = res.headers.get("Link").split(";")[0].replace(/^<(.*)>$/, "$1");
                if(next_pr_url === prs_url){
                    next_pr_url = null;
                }else{
                    next_pr_url = prs_url;
                }
                return res.json();
            }).then(function(json){
                console.log(json);
                for(let pr of json){
                    if(pr.number > 1500){continue;} //HACK to prevent the browser from crashing
                    let state;
                    if(pr.merged_at){
                        state = "Accepted";
                    }else if(pr.state === "open"){
                        state = "Open";
                    }else if(pr.state === "closed"){
                        state = "Rejected";
                    }else{
                        console.log(pr.state);
                    }
                    rfc_data.push({
                        id: pr.number,
                        name: pr.title,
                        text: pr.name,
                        discussion: pr.html_url,
                        state: state
                    });
                }
                show_rfcs();
            });
    }
    
    let pr_status_interval = window.setInterval(function(){
        if(next_pr_url){
            pr_status(next_pr_url);
        }else{
            window.clearInterval(pr_status_interval);
        }
    }, 5000);
    
    show_rfcs();
};

function show_rfcs(){
    let rfc_list = document.querySelector("#rfc_list");
    rfc_data = rfc_data.sort(function(a,b){
        return a.id > b.id;
    });
    rfc_list.innerHTML = "";
    for(let rfc of rfc_data){
        rfc_list.innerHTML += template
            .replace("{{id}}", rfc.id)
            .replace("{{name}}", rfc.name)
            .replace("{{text}}", rfc.text)
            .replace("{{discussion}}", rfc.discussion)
            .replace(/{{state}}/g, rfc.state)
        ;
    }
}

function open_text_popup(evt){
    evt.preventDefault();
    fetch(evt.originalTarget.dataset.file)
        .then(function(res){
            return res.text();
        }).then(function(text){
            document.querySelector("#rfc_text").innerHTML = "<a href=\"#\" onclick=\"close_text_popup(event)\" class=\"close_button\">X</a>" + text;
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

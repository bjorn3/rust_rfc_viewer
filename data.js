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

/* globals show_rfcs */
/* exported rfc_data, get_rfcs_from_text_folder, get_rfcs_from_pr_list */

window.rfc_data = [];

function get_rfcs_from_text_folder(){
    fetch("https://api.github.com/repos/rust-lang/rfcs/contents/text").then((res)=>res.json())
        .then(function(json){
            console.log(json);
            for(let rfc of json){
                window.rfc_data.push({
                    id: rfc.name.split("-")[0],
                    name: rfc.name.split("-").slice(1).join(" ").replace(/\.md$/, ""),
                    text: rfc.download_url,
                    discussion: "about:blank",
                    state: "Accepted"
                });
            }
            requestAnimationFrame(show_rfcs);
        });
}

function get_rfcs_from_pr_list(url){
    return new Promise(function(resolve){
        fetch(url)
            .then(function(res){
                console.log(res);
                let prs_url = res.headers.get("Link").split(";")[0].replace(/^<(.*)>$/, "$1");
                if(prs_url === url){
                    resolve(null);
                }else{
                    resolve(prs_url);
                }
                return res.json();
            }).then(function(json){
                console.log(json);
                for(let pr of json){
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
                    window.rfc_data.push({
                        id: pr.number,
                        name: pr.title,
                        text: null,
                        discussion: pr.html_url,
                        state: state
                    });
                }
                requestAnimationFrame(show_rfcs);
            });
    });
}
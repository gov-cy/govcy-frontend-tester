/**
 * Used to define the templates for the reports generated
 */
export class DSFReportTemplate {
    /** The main report */
    static mainReport() {
        //handlebars template   
        let handlebarsTemplate = `
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="utf-8">
                <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
                <title>{{testName}} - UI Test</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <link href="https://fonts.googleapis.com/css?family=Nunito:300,400,700" rel="stylesheet">
                <style>
                *{box-sizing:border-box}*+*{margin:.5em 0}pre{overflow:auto}@media(min-width:35em){.col{display:table-cell}.\\31{width:5%}.\\33{width:22%}.\\34{width:30%}.\\35{width:40%}.\\32{width:15%}.\\36{width:50%}.row{display:table;border-spacing:1em 0}}.row,.w-100{width:100%}.card:focus,hr{outline:0;border:solid #fa0}.card,pre{padding:1em;border:solid #eee}.btn:hover,a:hover{opacity:.6}.c{max-width:60em;padding:1em;margin:auto;font:1em/1.6 nunito}h6{font:100 1em nunito}h5{font:100 1.2em nunito}h3{font:100 2em nunito}h4{font:100 1.5em nunito}h2{font:100 2.2em nunito}h1{font:100 2.5em nunito}a{color:#fa0;text-decoration:none}.btn.primary{color:#fff;background:#fa0;border:solid #fa0}td,th{padding:1em;text-align:left;border-bottom:solid #eee}.btn{padding:1em;text-transform:uppercase;background:#fff;border:solid;font:.7em nunito}
                .pre-wrap{
                    white-space: pre-wrap;       /* css-3 */
                    white-space: -moz-pre-wrap;  /* Mozilla, since 1999 */
                    white-space: -pre-wrap;      /* Opera 4-6 */
                    white-space: -o-pre-wrap;    /* Opera 7 */
                    word-wrap: break-word;       /* Internet Explorer 5.5+ */
                }
                .hr-gray{border:solid #eee}
                .thump-img{width:100px}
                .condition-true{background-color: green;color:white;}
                .condition-false{background-color: red;color:white;}
                .inline-code{font-family: monospace;}
                @media print {
                    .page-break-after {page-break-after: always;}
                  }
                </style>
            
            </head>
            <body class="c">
            <div class="3 col">
                <ul>
                {{#pages}}
                    <li>
                        <a href="#{{id}}">{{id}}</a>
                    </li>
                {{/pages}}
                </ul>
            </div>
            <div class="9 col">
            <h1>{{testName}}</h1>
            {{#lighthouse}}<a href="{{.}}">Lighthouse report</a>{{/lighthouse}}
            {{#pages}}<h2 id="{{id}}">Page: {{id}}</h2>
            <h3>Tests</h3>
            <ul>
            {{#checks}} 
                {{#if (or (ne ../../showOnlyErrors true) (or (and ../../showOnlyErrors (ne condition true)) isFile))}}
                <li>
                    <b>{{type}}</b>
                    <br>
                    {{#isFile}}<a href="{{value}}">
                        {{#isScreenshoot}}<img class="thump-img" src="{{value}}"> {{/isScreenshoot}}
                        {{key}}</a> 
                    {{/isFile}}
                    {{#isPa11y}}
                        {{#value}}
                        <div class="row">
                            <div class="3 col"><b>type</b></div>
                            <div class="9 col">{{type}}</div>
                        </div>
                        <div class="row">
                            <div class="3 col"><b>typeCode</b></div>
                            <div class="9 col">{{typeCode}}</div>
                        </div>
                        <div class="row">
                            <div class="3 col"><b>Code</b></div>
                            <div class="9 col">{{code}}</div>
                        </div>
                        <div class="row">
                            <div class="3 col"><b>context</b></div>
                            <div class="9 col"><pre class="pre-wrap"><code>{{context}}</code></pre></div>
                        </div>
                        <div class="row">
                            <div class="3 col"><b>message</b></div>
                            <div class="9 col">{{message}}</div>
                        </div>
                        <div class="row">
                            <div class="3 col"><b>selector</b></div>
                            <div class="9 col"><pre class="pre-wrap"><code>{{selector}}</code></pre></div>
                        </div>
                        <hr class="hr-gray">
                        {{/value}}
                    {{/isPa11y}}
                    {{#isText}}
                        Value: <b>{{value}}</b><br>
                    {{/isText}}
                    {{#hasSelector}}
                    Selector: <span class="inline-code">{{HTMLselector}}</span><br>
                    {{/hasSelector}}
                    {{#hasAttribute}}
                    Attribute: <span class="inline-code">{{attribute}}</span><br> 
                    {{/hasAttribute}}
                    {{#hasCondition}}
                    Condition: <b class="condition-{{condition}}">
                        {{#condition}}Pass{{/condition}}{{^condition}}Fail{{/condition}}</b>
                    {{/hasCondition}}
                </li>
                {{/if}}
            {{/checks}}
            {{^checks}}<div class="card">No test were made.</div>({{/checks}}
            </ul>
            <hr class="page-break-after">
            {{/pages}}
            </div>
            </body>
            </html>`
        return handlebarsTemplate;
    }
}

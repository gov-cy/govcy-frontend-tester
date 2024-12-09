import fs from 'fs';
import Handlebars from 'handlebars';
import lighthouse from 'lighthouse';
import puppeteer from 'puppeteer';
import { startFlow } from 'lighthouse';
import pa11y  from 'pa11y';
import fetch from 'node-fetch';
import https from 'https';
import http from 'http';
import semver from 'semver';
import {DSFReportTemplate} from './govcy-report-template.mjs';

/**
 * Can perform client side tests using puppeteer and other packages such as lighthouse and pa11y.
 * 
 * Checkout what you can do with puppeteer at https://pptr.dev/
 */
export class DSFTesting {
    /**
     * Start the tests with this function. Will create instances for puppeteer page and lighthouse
     * 
     * @param {string} testName the name of the test  
     * @param {string} reportPath The path of the reports. Can be used to set the folder where the reports are saved  
     */
    async startTest(testName, reportPath="") {
        //register handlebars conditional functions
        Handlebars.registerHelper({
            eq: (v1, v2) => v1 === v2,
            ne: (v1, v2) => v1 !== v2,
            lt: (v1, v2) => v1 < v2,
            gt: (v1, v2) => v1 > v2,
            lte: (v1, v2) => v1 <= v2,
            gte: (v1, v2) => v1 >= v2,
            and() {
                return Array.prototype.every.call(arguments, Boolean);
            },
            or() {
                return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
            }
        });
        // compile handlebars template
        this.handlebarsTemplate = Handlebars.compile(DSFReportTemplate.mainReport());
        //set report path
        this.reportPath = reportPath;
        //set test name
        this.testName = testName;
        this.reportJSON.testName = testName;
        //create browser and new page
        // if (this.browser != null)
        // {
            this.browser = await puppeteer.launch(this.puppeteerSettings);
            if (this.isIncognito) {
                //run in incognito mode
                this.context = await this.browser.createBrowserContext();
                //new page
                this.page = await this.context.newPage();
            } else {
                //new page
                this.page = await this.browser.newPage();    
            }
            //Lighthouse
            //FLOW
            this.flow = await startFlow(this.page, {
                name: testName,
                configContext: this.lighthouseFlowConfigContext,
            });
        // }
    }


    /**
     * Always end tests with this. Will close the browser
     */
    async endTest() {
        //close browser
        await this.browser.close();
    }

    /**
     * Display Page - Action on Console
     */
    async ConsoleEcho(pageName, actionDesc="") {
        if (actionDesc=='')
        {
            console.log('***** \'' + pageName + '\' Goto '
                + (await this.RepeatStr((80-pageName.length-6),'*')).toString())
        }
        else
        {
            console.log('***** \'' + pageName + '\' Action:' + actionDesc 
                + (await this.RepeatStr((80-pageName.length-8-actionDesc.length),'*')).toString())
        }
        
    }
    
    /**
     * Repeat string 
     * 
     * @param {int} count 
     * @param {string} pattern 
     * @returns {string}
     */
    async RepeatStr(count, pattern) {
        if (count < 1) return '';
        var result = '', i = 0;
        while (i < count) {
          result = result.concat(pattern);
          i=i+1;
        }
        return result;
      };

    /**
     * Wait for some time (in miliseconds) before you execure the next thing
     * 
     * @param {int} ms Time out in miliseconds 
     * @returns 
     */
    static async timeout(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Convert RGB colour string to hex
     * 
     * @param {string} rgb The RGB value 
     * @returns {string} The hex value
     */
    static rgb2hex(rgb) {
        try {
           rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
            function hex(x) {
                return ("0" + parseInt(x).toString(16)).slice(-2);
            }
            return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]); 
        } catch (e) {
            return "#ffffff";
        }
    }
    /**
     * Adds tests details to the report JSON to be used to populate the report
     * 
     * @param {string} page The id of the page
     * @param {string} type The type of the test
     * @param {string} key A key for this test
     * @param {*} value The value returned by the test 
     * @param {boolean} condition The condition to test if true or false 
     * @param {string} selector The html selector used in the test  
     * @param {string} attribute The attribute used in the test  
     */
    async addToReportJSON(page,type,key,value,condition=undefined,selector=undefined,attribute=undefined) {
        let pageObj = this.reportJSON.pages.find(x => x.id === page);
        //costruct check object
        let checkObj = {
            'type' : type,
            'key' : key,
            'value':value,
            'isText' : (type!='pa11y' && type!='screenshoot' && type!='pa11y.issues' && type!='head'?true:false),
            'isFile' : (type=='pa11y' || type=='screenshoot' || type=='head'?true:false),
            'isScreenshoot' : (type=='screenshoot'?true:false),
            'isPa11y' : (type=='pa11y.issues'?true:false),
            'hasCondition' : (condition===undefined?false:true),
            'condition' : condition,
            'hasSelector' : (selector===undefined?false:true),
            'HTMLselector' : selector,
            'hasAttribute' : (attribute===undefined?false:true),
            'attribute' : attribute
        };
        //console.log(checkObj);
        //add to reportJSON for this page
        if (pageObj === undefined) {
            this.reportJSON.pages.push({
                "id" : page,
                "checks" : [checkObj]
            });
        } else {
            this.reportJSON.pages.find(x => x.id === page).checks.push(checkObj)
        }
    }

    /**
     * Generates an HTML report based on the `reportJSON`
     */
    async generateReport() {

        //set showOnlyErrors in object
        this.reportJSON.showOnlyErrors = this.showOnlyErrors;
        // call template as a function, passing in your data as the context
        let output = this.handlebarsTemplate(this.reportJSON);
        //write report file 
        fs.writeFileSync(this.reportPath + 'index.html', output);
    }

    /**
     * Performs a series of screenshoots, accessibility checks (with PA11Y), 
     * the tests defined in `DSFTestOptions.tests` and adds a lighthouse page check   
     * 
     * @param {string} pageName The page name  
     * @param {string} lang Lang expected in html element  
     * @param {boolean} isError if the page in an errors state (uses the error message and error summary component)  
     * @param {Array} [ignoreChecks=[]] an array of stings for the ids of the checks to ignore   
     */   
    async DSFStandardPageTest(pageName, lang, isError,ignoreChecks=[]) {
        if (this.skipLog==false){
            console.log('Check \'' + pageName.toString() +'\' page ');
        }
        //await before run
        await DSFTesting.timeout(5000);
        //set view port (resolution)
        await this.page.setViewport({ width: 1200, height: 2000, deviceScaleFactor: 1, });
        //take screenshoot
        for (let i = 0; i < this.screenshotWidths.length; i++) {
            await this.doScreenshot(pageName,this.screenshotWidths[i],'');
        }
        
        //---- Head section ----
        //get head section
        if (this.performHeadSection) {await this.getHeadSection(pageName,'');}
        
        // DSF test 
        if (this.performDSFChecks){
            //for all tests
            for (const key in this.DSFTestOptions.tests) {
                DSFChecksArea: {
                // if this check is included in the `ignoreChecks` array
                if (ignoreChecks.includes(key)) break DSFChecksArea;
                if (this.DSFTestOptions.tests[key].level < this.DSFCheckLevel) break DSFChecksArea;
                let testValue = false;
                //if version is defined see if check should be run (see more on https://www.npmjs.com/package/semver)
                if  (!(this.DSFTestOptions.tests[key].version)
                     || (semver.satisfies(this.serviceDesignSystemVersion, 
                        this.DSFTestOptions.tests[key].version))){
                    //set view port (resolution)
                    if (this.DSFTestOptions.tests[key].resize) 
                    {
                        if (this.skipLog==false)
                            {console.log('Test Resize to ' +this.DSFTestOptions.tests[key].resize.width 
                                + ' X ' + this.DSFTestOptions.tests[key].resize.height);}
    
                        await this.page.setViewport({ width: this.DSFTestOptions.tests[key].resize.width
                            , height: this.DSFTestOptions.tests[key].resize.height, deviceScaleFactor: 1, });
                    }
                    // do all type of checks
                    switch (this.DSFTestOptions.tests[key].testType) {
                        // elementAttributeTest check
                        case 'elementAttributeTest':
                            testValue = await this.getElementAttribute(this.DSFTestOptions.tests[key].selector
                                ,this.DSFTestOptions.tests[key].attribute)
    
                            if (this.skipLog==false)
                                {console.log('Test [elementAttributeTest]: ' 
                                    + this.DSFTestOptions.tests[key].selector + ' = ' + testValue);}
    
                            //add to report
                            await this.addToReportJSON(pageName,key,pageName+'.'+ key,testValue, 
                                await this.DSFTestOptions.tests[key].condition(testValue,lang),
                                this.DSFTestOptions.tests[key].selector
                                ,this.DSFTestOptions.tests[key].attribute);
                        break;
                        // pageTitleTest check
                        case 'pageTitleTest':
                            testValue = await this.page.title();
    
                            if (this.skipLog==false)
                                {console.log('Test [pageTitleTest]: ' + testValue);}
    
                            //add to report
                            await this.addToReportJSON(pageName,key,pageName+'.'+ key,testValue, 
                                await this.DSFTestOptions.tests[key].condition(testValue,lang));
                        break;
                        // countElementsTest check
                        case 'countElementsTest':
                            testValue = await this.page.$$(this.DSFTestOptions.tests[key].selector);
    
                            if (this.skipLog==false)
                                {console.log('Test [countElementsTest]: ' + testValue);}
    
                            await this.addToReportJSON(pageName,key,pageName+key,await testValue.length,
                                await this.DSFTestOptions.tests[key].condition(testValue,lang),
                                this.DSFTestOptions.tests[key].selector);
                        break;
                        // computedStyleTest check
                        case 'computedStyleTest':
                            testValue = await await this.getComputedStyle(this.DSFTestOptions.tests[key].selector
                                ,this.DSFTestOptions.tests[key].attribute);
    
                            //console.log('Test [computedStyleTest]: ' + testValue);
    
                            if(testValue)  {
                                if (this.skipLog==false)
                                {
                                    console.log('Test [computedStyleTest]: ' + testValue);
                                }
                                await this.addToReportJSON(pageName,key,pageName+key,await testValue,
                                    await this.DSFTestOptions.tests[key].condition(testValue,lang),
                                    this.DSFTestOptions.tests[key].selector
                                    ,this.DSFTestOptions.tests[key].attribute);
                            }
                        break;
                        // randomComputedStyleTest check
                        case 'randomComputedStyleTest':
                            if (isError && !this.DSFTestOptions.tests[key].onError) {break;}
                            let hoverFlag  = (this.DSFTestOptions.tests[key].hover?true:false);
                            let focusFlag  = (this.DSFTestOptions.tests[key].focus?true:false);
                            testValue = await await this.getRandomComputedStyle(this.DSFTestOptions.tests[key].selector
                                ,this.DSFTestOptions.tests[key].attribute,hoverFlag,focusFlag);
    
                            //console.log('Test [randomComputedStyleTest]: ' + testValue);
    
                            if (testValue)  
                            {   if (this.skipLog==false)
                                {
                                    console.log('Test [randomComputedStyleTest]: ' + this.DSFTestOptions.tests[key].selector + ' = ' + testValue);
                                }
                                
                                await this.addToReportJSON(pageName,key,pageName+key,await testValue,
                                    await this.DSFTestOptions.tests[key].condition(testValue,lang),
                                    this.DSFTestOptions.tests[key].selector
                                    ,this.DSFTestOptions.tests[key].attribute);
                            }
                        break;
                    }
                }
                }
            }        
        }
        
        //---- pa11y report ----
        if (this.performPa11yChecks) {await this.doPa11y(pageName,'');}
        
        //---- lighthouse FLOW ----
        if (this.performLighthouse) {await this.doLighthouseFlow( this.page.url());}
        
        //set view port (resolution)
        //sometimes needed to reach the element and click it (bigger height)
        await this.page.setViewport({ width: 1200, height: 3000, deviceScaleFactor: 1, });
        if (this.skipLog==false) {
            console.log(this.reportJSON);
        }       
        //create new report every time (if run fails at any point, a report is generated up to that point)
        await this.generateReport();

        if (this.skipLog==false){console.log('Check \'' + pageName.toString() +'\' page - DONE');}
        
    }

    /**
     * Validates a URL is reachable 
     * 
     * @param {string} urlString the url path
     * @param {boolean} isRelative if the path is relative or not
     * @returns true if page is accessible or false if not
     */
    async validateUrl(urlString,isRelative=false) {
        try {
            const urlPath = (isRelative?new URL(urlString, this.page.url()).href:urlString);
            let agent;
            if (urlPath.startsWith("https")) {
                agent = new https.Agent({
                    rejectUnauthorized: false
                })
            } else {
                agent = new http.Agent();
            }
            
            //console.log('---------' + urlPath);
            const response = await fetch(urlPath, { agent });
            //console.log('status code: ', response.status); // 👉️ 200
            if (!response.ok) 
            {
                if (this.skipLog==false)
                            {console.log('.....[validateUrl]: Response NOT OK');}
                return false
            } 
            else 
            {
                if (this.skipLog==false)
                            {console.log('.....[validateUrl]: Response OK');}
                return true;
            }
          

        } catch (err) {console.error('Error.[validateUrl]: ' + err.message);return false;}
      } 
    
    /**
     * Takes a screenshoot
     * 
     * @param {string} page the page name the acion is made. This is used to generate the report 
     * @param {int} width the width of the screenshoot 
     * @param {string} filename the name of the file to be saved. The path will be `this.reportPath + filename`
     */
     async doScreenshot(page='',width,filename='') {

        //set view port (resolution)
        await this.page.setViewport({ width: width, height: 100, deviceScaleFactor: 1, });
        //construct key for report
        const key = page.toString().replace(/\//g, '_').replace(/\?/g, '_') + (filename!=''?'.':'')+ filename + '.' + width ;
        //construct filename
        const fname = key +'.png'
        //take screenshoot
        await this.page.screenshot({ path: this.reportPath + fname ,fullPage:true});
        //add to report
        if (page!='') await this.addToReportJSON(page,'screenshoot',key, fname);
    }

    /**
     * 
     * @param {string} pageURL the url of the page
     * @returns 
     */
    async doLighthouseA11YScore(pageURL) {
        //set lighthouse settings
        let settings = this.lighthouseSettings;

        //set port on lighthouse settings
        settings.port = (new URL(this.browser.wsEndpoint())).port;

        //get lighthouse results
        let runnerResult = await lighthouse(pageURL, settings);

        //push url
        let result = [];
        result.push(runnerResult.lhr.finalUrl);

        //push performance result
        if (runnerResult.lhr.categories.accessibility.score) {
            result.push(runnerResult.lhr
                .categories.accessibility.score * 100)
        } else {
            result.push("NA");
        }
  
      return result;
    }


    /**
     * runs the lighthouse flow
     * 
     * @param {string} pageURL the url of the page
     */
    async doLighthouseFlow(pageURL) {
        //FLOW
        await this.flow.snapshot({ stepName: pageURL })
    }

    /**
     * starts the lighthouse navivation flow
     * 
     * @param {string} stepName the step name
     */
    async doLighthouseNavStart(stepName) {
        //FLOW
        await this.flow.startTimespan({ stepName: stepName })
    }

    /**
     * stops the lighthouse navivation flow
     * 
     */
    async doLighthouseNavEnd() {
        //FLOW
        await this.flow.endTimespan()
    }

    /**
     * Creates the lighthouse flow report
     * 
     * @param {string} path the report path in string. The path will be `this.reportPath + filename`
     */
    async reportLighthouseFlow(path) {
        if (this.performLighthouse)
        {
            //FLOW
            fs.writeFileSync(this.reportPath + path, await this.flow.generateReport());
            this.reportJSON.lighthouse = path;
        }
    }
    
    /**
     * Creates the pa11y report. Uses the settings defined in `pa11ySettings`
     * 
     * @param {string} page the page name the acion is made. Will be used as part of the path and to generate the report 
     * @param {string} path the report path in string. The path will be `this.reportPath + filename`
     */
    async doPa11y(page='',path='') {
        // do PA11Y
        let results = await pa11y(this.page.url(),
        Object.assign(
        {
            browser:this.context,
            page: this.page,
            hideElements: this.pa11yHideElements
        }, this.pa11ySettings));
        //construct key for report
        const key = page + '.pa11y' + (path!=''?'.':'')+ path;
        //construct filename
        const fname = key +'.html'
        //write report to file
        //fs.writeFileSync(this.reportPath + fname,await htmlReporter.results(results));
        //add to report
        if (page!='') {
            //await this.addToReportJSON(page,'pa11y',key,fname)
            await this.addToReportJSON(page,'pa11y.issues',key,results.issues
                , results.issues.length < 1)
        };
    }
    
    /**
     * gets only the head section and puts it in an HTML file
     * 
     * @param {string} page the page name the acion is made. Will be used as part of the path and to generate the report 
     * @param {string} path the report path in string. The path will be `this.reportPath + filename`
     */
    async getHeadSection(page='',path) {
        //construct key for report
        const key = page.toString().replace(/\//g, '_').replace(/\?/g, '_') + '.head' + (path!=''?'.':'')+ path;
        //construct filename
        const fname = key +'.txt'
        //get head section
        fs.writeFileSync(this.reportPath + fname, 
            await this.page.$eval("head", element => element.innerHTML));
        //add to report
        if (page!='') await this.addToReportJSON(page,'head',key,fname);
    }

    /**
     * Gets the property value of a computed style of an element of the page
     * 
     * @param {string} selector The css selector of the element  
     * @param {string} property The property to get
     * @returns computed styles object (check out https://developer.mozilla.org/en-US/docs/Web/API/Window/getComputedStyle for more)
     */
    async getComputedStyle(selector,property) {
        //console.log(selector);
        const data = await this.page.evaluate((e,f) => {
            const elements = document.querySelector(e);
            return window.getComputedStyle(elements).getPropertyValue(f);
        },selector,property);
        return data;
    }

    /**
     * Gets the property value of a computed style of a random element of the page based on the selector. 
     * 
     * @param {string} selector The css selector of the element  
     * @param {string} property The property to get
     * @param {boolean} hover If true hover over the element
     * @param {boolean} focus If true focus on the element (i.e. to get active state)
     * @returns computed styles object (check out https://developer.mozilla.org/en-US/docs/Web/API/Window/getComputedStyle for more)
     */
    async getRandomComputedStyle(selector,property, hover=false, focus=false) {
        //get all elements with selector
        let elements = await this.page.$$(selector);
        
        if (this.skipLog==false)
        {
            console.log('---- ' + selector + '.' + property + ' = ' + elements.length);
        }
        
        if (elements.length > 0) {
            //get random selector
            let randomSelector = await ((Math.floor( Math.random() * elements.length)));
           //console.log(randomSelector);

           if (this.skipLog==false) 
           {
            console.log('---- (rnd) ' + randomSelector + '.' + property + ' = ' + elements.length);
           }
            
            try {
                if (hover) {await elements[randomSelector].hover();
                    if (this.skipLog==false) {console.log('---- Hover');} }
                if (focus) {await elements[randomSelector].focus();
                    if (this.skipLog==false) {console.log('---- Focus');} }
            } catch(e){
                console.error('Error [getRandomComputedStyle]: ' +  e.message);
                return false;
            }
            
            //get computed style on random element
            const data = await this.page.evaluate((e,f) => {
                return window.getComputedStyle(e).getPropertyValue(f);
            },elements[randomSelector],property);
            return data;
        } else {
            return false;
        }
    }   

    /**
     * Gets the attributes from all the element found based on the `selector` query selector
     * 
     * @param {string} selector The css selector of the element  
     * @param {string} attribute The attribute to get
     * @returns Array of attribute values
     */
    async getElementAttributeArray(selector,attribute) {
        //return await this.page.$eval(selector, element=> element[attribute])
        return await this.page.$$(selector, (element,a)=> element[a],attribute)
    }

    /**
     * Gets the attribute from an the first element found based on the `selector` query selector
     * 
     * @param {string} selector The css selector of the element  
     * @param {string} attribute The attribute to get
     * @returns attribute value
     */
    async getElementAttribute(selector,attribute) {
        //return await this.page.$eval(selector, element=> element[attribute])
        return await this.page.$eval(selector, (element,a)=> element[a],attribute)
    }

    /**
     * Whether to show only errors in the report or show all the checks. 
     * Default value = `false`
     */
    showOnlyErrors=false;

    handlebarsTemplate = null;

    /**
     * default lighthouse settings
     * more at https://github.com/GoogleChrome/lighthouse/blob/master/docs/configuration.md 
     * Default value = `{onlyCategories: ["accessibility"],output: "csv",}`
     */
    lighthouseSettings = {onlyCategories: ["accessibility"],output: "csv",};

    /**
     * Default puppeteer Settings
     * Default value = `{ headless: true, args: ['--ignore-certificate-errors'], slowMo: 0 }`
     */
    puppeteerSettings = { headless: true, args: ['--ignore-certificate-errors'], slowMo: 0 };

    /**
     * 
     * Default lighthouse flow settings
     */
    lighthouseFlowConfigContext = {
        screenEmulation: {
            mobile: false,
            width: 1350,
            height: 940,
            deviceScaleFactor: 1,
            disabled: false,
        },
        formFactor: "desktop",
    };

    /**
     * Default pa11y settings
     * Default value = `{standard: 'WCAG2AA',ignoreUrl: true,wait: 10000} `
     */
    pa11ySettings = {standard: 'WCAG2AA',ignoreUrl: true,wait: 10000};
    
    /**
     * Default pa11y hideElements
     * Default value = `""`
     */
    pa11yHideElements = "";

    /**
     * The puppeteer page object. See more at  https://pptr.dev/
     */    
    page = null;

    /**
     * The path of the reports. Can be used to set the folder where the reports are saved. 
     * Note: the folder needs to exist.
     */
    reportPath="";

    browser = null;

    /**
     * Indicates whether to use an incognito browser content
     * Default value =  `true`
     */
    isIncognito = true;
    
    /**
     * The JSON that of the results of the tests
     */
    reportJSON = {'testName':'', 'lighthouse':false, 'pages':[]};
    
    /**
     * The widths to take screenshoots
     * Default value = `[1200,800,360]`
     */
    screenshotWidths = [1200,800,360];

    /**
     * Use this flag to skip testing
     */
    skipLog = true;

    /**
     * What version of the design system was the service build on. 
     * This will make sure the correct checks are made 
     */
    serviceDesignSystemVersion = `3.0.0`
    
    /**
     * Whether on not to get the head section
     * Default = `true`
     */
    performHeadSection = true;
    
    /**
     * Whether on not to perform lighthouse checks
     * Default = `true`
     */
    performLighthouse = true;
    
    /**
     * Whether on not to perform the DSF Checks defined under `DSFTestOptions`
     * Default = `true`
     */
    performDSFChecks = true;
    
    /**
     * Whether on not to perform the pa11y checks
     * Default = `true`
     */
    performPa11yChecks = true;

    /**
     * Define which DSF checks to perform with the `DSFStandardPageTest` function based on check level. 
     * `0` performs the mandatory plus more advanced checks that probably will need to overwrite the selector
     * `1` performs the mandatory checks only
     * 
     * Default = `1`
     */
    DSFCheckLevel = 1;
    
    /**
     * The tests options to be carried out by the `DSFStandardPageTest` function
     */
    DSFTestOptions = {
        'tests' : {
            '4.3.1.viewport': {'id':'4.3.1.viewport', 
                'selector': 'head > meta[name="viewport"]',
                'version' : '>=1',
                'level' : 1,
                'attribute':'content',
                'testType' : 'elementAttributeTest',
                'onError' : false,
                'condition':async (value,lang) => {return value.toLowerCase().replace(/\s/g, '') == 'width=device-width,initial-scale=1'}
            }
            ,'4.3.1.lang': {'id':'4.3.1.lang', 
                'selector': 'html',
                'version' : '>=1',
                'level' : 1,
                'attribute':'lang',
                'testType' : 'elementAttributeTest',
                'onError' : false,
                'condition':async (value,lang) => {return value.toLowerCase() == lang}
            }
            ,'4.3.2.title': {'id':'4.3.2.title', 
                'selector': '',
                'version' : '>=1',
                'level' : 1,
                'attribute':'',
                'testType' : 'pageTitleTest',
                'onError' : false,
                'condition':async (value,lang) => {return value.length > 0}
            }
            ,'4.3.2.description': {'id':'4.3.2.description', 
                'selector': 'head > meta[name="description"]',
                'version' : '>=1',
                'level' : 1,
                'attribute':'content',
                'testType' : 'elementAttributeTest',
                'onError' : false,
                'condition':async (value,lang) => {return value.length > 0}
            },'4.3.2.description.count': {
                'selector': 'head > meta[name="description"]',
                'version' : '>=1',
                'level' : 1,
                'attribute':'',
                'testType' : 'countElementsTest',
                'onError' : false,
                'condition':async (value,lang) => {return value.length == 1}
            }
            ,'4.3.2.title.count': {
                'selector': 'head > title',
                'version' : '>=1',
                'level' : 1,
                'attribute':'',
                'testType' : 'countElementsTest',
                'onError' : false,
                'condition':async (value,lang) => {return value.length == 1}
            }
            ,'4.3.3.meta.og:url.count': {
                'selector': 'head > meta[property="og:url"]',
                'version' : '>=1',
                'level' : 1,
                'attribute':'',
                'testType' : 'countElementsTest',
                'onError' : false,
                'condition':async (value,lang) => {return value.length == 1}
            }
            ,'4.3.3.meta.og:type.count': {
                'selector': 'head > meta[property="og:type"]',
                'version' : '>=1',
                'level' : 1,
                'attribute':'',
                'testType' : 'countElementsTest',
                'onError' : false,
                'condition':async (value,lang) => {return value.length == 1}
            }
            ,'4.3.3.meta.og:image.count': {
                'selector': 'head > meta[property="og:image"]',
                'version' : '>=1',
                'level' : 1,
                'attribute':'',
                'testType' : 'countElementsTest',
                'onError' : false,
                'condition':async (value,lang) => {return value.length == 1}
            }
            ,'4.3.3.meta.og:site_name.count': {
                'selector': 'head > meta[property="og:site_name"]',
                'version' : '>=1',
                'level' : 1,
                'attribute':'',
                'testType' : 'countElementsTest',
                'onError' : false,
                'condition':async (value,lang) => {return value.length == 1}
            }
            ,'4.3.3.meta.og:title.count': {
                'selector': 'head > meta[property="og:title"]',
                'version' : '>=1',
                'level' : 1,
                'attribute':'',
                'testType' : 'countElementsTest',
                'onError' : false,
                'condition':async (value,lang) => {return value.length == 1}
            }
            ,'4.3.3.meta.og:description.count': {
                'selector': 'head > meta[property="og:description"]',
                'version' : '>=1',
                'level' : 1,
                'attribute':'',
                'testType' : 'countElementsTest',
                'onError' : false,
                'condition':async (value,lang) => {return value.length == 1}
            }
            ,'4.3.3.meta.twitter:title.count': {
                'selector': 'head > meta[property="twitter:title"]',
                'version' : '>=1',
                'level' : 1,
                'attribute':'',
                'testType' : 'countElementsTest',
                'onError' : false,
                'condition':async (value,lang) => {return value.length == 1}
            }
            ,'4.3.3.meta.twitter:description.count': {
                'selector': 'head > meta[property="twitter:description"]',
                'version' : '>=1',
                'level' : 1,
                'attribute':'',
                'testType' : 'countElementsTest',
                'onError' : false,
                'condition':async (value,lang) => {return value.length == 1}
            }
            ,'4.3.3.meta.twitter:card.count': {
                'selector': 'head > meta[property="twitter:card"]',
                'version' : '>=1',
                'level' : 1,
                'attribute':'',
                'testType' : 'countElementsTest',
                'onError' : false,
                'condition':async (value,lang) => {return value.length == 1}
            }
            ,'4.3.3.meta.twitter:url.count': {
                'selector': 'head > meta[property="twitter:url"]',
                'version' : '>=1',
                'level' : 1,
                'attribute':'',
                'testType' : 'countElementsTest',
                'onError' : false,
                'condition':async (value,lang) => {return value.length == 1}
            }
            ,'4.3.3.meta.twitter:image.count': {
                'selector': 'head > meta[property="twitter:image"]',
                'version' : '>=1',
                'level' : 1,
                'attribute':'',
                'testType' : 'countElementsTest',
                'onError' : false,
                'condition':async (value,lang) => {return value.length == 1}
            }
            ,'4.3.3.meta.twitter:image.count': {
                'selector': 'head > meta[property="twitter:image"]',
                'version' : '>=1',
                'level' : 1,
                'attribute':'',
                'testType' : 'countElementsTest',
                'onError' : false,
                'condition':async (value,lang) => {return value.length == 1}
            }
            ,'4.3.4.manifest.exists': {
                'selector': 'head > link[rel="manifest"]',
                'version' : '>=1',
                'level' : 1,
                'attribute':'href',
                'testType' : 'elementAttributeTest',
                'onError' : false,
                'condition':async (value,lang) => {return await this.validateUrl(value)}
            }
            ,'4.3.4.theme.color': {
                'selector': 'head > meta[name="theme-color"]',
                'version' : '>=1',
                'level' : 1,
                'attribute':'content',
                'testType' : 'elementAttributeTest',
                'onError' : false,
                'condition':(value,lang) => {return value.toLowerCase() == '#31576f'}
            }
            ,'4.3.5.meta.og:image.exists': {
                'selector': 'head > meta[property="og:image"]',
                'version' : '>=1',
                'level' : 1,
                'attribute':'content',
                'testType' : 'elementAttributeTest',
                'onError' : false,
                'condition':async (value,lang) => {return await this.validateUrl(value,true)}
            }
            ,'4.3.5.meta.twitter:image.exists': {
                'selector': 'head > meta[property="twitter:image"]',
                'version' : '>=1',
                'level' : 1,
                'attribute':'content',
                'testType' : 'elementAttributeTest',
                'onError' : false,
                'condition':async (value,lang) => {return await this.validateUrl(value,true)}
            }
            ,'4.3.5.meta.favicon.48x48.exists': {
                'selector': 'head > link[rel="icon"][sizes="48x48"]',
                'version' : '>=1',
                'level' : 1,
                'attribute':'href',
                'testType' : 'elementAttributeTest',
                'onError' : false,
                'condition':async (value,lang) => {return await this.validateUrl(value)}
            }
            ,'4.3.5.meta.favicon.32x32.exists': {
                'selector': 'head > link[rel="icon"][sizes="32x32"]',
                'version' : '>=1',
                'level' : 1,
                'attribute':'href',
                'testType' : 'elementAttributeTest',
                'onError' : false,
                'condition':async (value,lang) => {return await this.validateUrl(value)}
            }
            ,'4.3.5.meta.favicon.16x16.exists': {
                'selector': 'head > link[rel="icon"][sizes="16x16"]',
                'version' : '>=1',
                'level' : 1,
                'attribute':'href',
                'testType' : 'elementAttributeTest',
                'onError' : false,
                'condition':async (value,lang) => {return await this.validateUrl(value)}
            }
            ,'4.3.5.meta.favicon.144x144.exists': {
                'selector': 'head > link[rel="apple-touch-icon-precomposed"][sizes="144x144"]',
                'version' : '>=1',
                'level' : 1,
                'attribute':'href',
                'testType' : 'elementAttributeTest',
                'onError' : false,
                'condition':async (value,lang) => {return await this.validateUrl(value)}
            }
            ,'4.3.5.meta.favicon.120x120.exists': {
                'selector': 'head > link[rel="apple-touch-icon-precomposed"][sizes="120x120"]',
                'version' : '>=1',
                'level' : 1,
                'attribute':'href',
                'testType' : 'elementAttributeTest',
                'onError' : false,
                'condition':async (value,lang) => {return await this.validateUrl(value)}
            }
            ,'4.3.5.meta.favicon.114x114.exists': {
                'selector': 'head > link[rel="apple-touch-icon-precomposed"][sizes="114x114"]',
                'version' : '>=1',
                'level' : 1,
                'attribute':'href',
                'testType' : 'elementAttributeTest',
                'onError' : false,
                'condition':async (value,lang) => {return await this.validateUrl(value)}
            }
            ,'4.3.5.meta.favicon.72x72.exists': {
                'selector': 'head > link[rel="apple-touch-icon-precomposed"][sizes="72x72"]',
                'version' : '>=1',
                'level' : 1,
                'attribute':'href',
                'testType' : 'elementAttributeTest',
                'onError' : false,
                'condition':async (value,lang) => {return await this.validateUrl(value)}
            }
            ,'4.3.5.meta.favicon.apple.exists': {
                'selector': 'head > link[rel="apple-touch-icon-precomposed"]',
                'version' : '>=1',
                'level' : 1,
                'attribute':'href',
                'testType' : 'elementAttributeTest',
                'onError' : false,
                'condition':async (value,lang) => {return await this.validateUrl(value)}
            }
            ,'4.3.7.width.v1': {
                'selector': '#mainContainer',
                'version' : '1 - 2',
                'level' : 0,
                'attribute':'width',
                'testType' : 'computedStyleTest',
                'onError' : false,
                'resize' : {"width" : 2200, "height" : 3000},
                'condition':async (value,lang) => {return await value.toLowerCase() == '1280px'}
            }
            ,'4.3.6.h1.color.v1': {
                'selector': 'main h1',
                'version' : '1 - 2',
                'level' : 0,
                'attribute':'color',
                'testType' : 'randomComputedStyleTest',
                'onError' : false,
                'condition':async (value,lang) => {return await DSFTesting.rgb2hex(value).toLowerCase() == '#272525'}
            }
            ,'4.3.6.h2.color.v1': {
                'selector': 'main h2',
                'version' : '1 - 2',
                'level' : 0,
                'attribute':'color',
                'testType' : 'randomComputedStyleTest',
                'onError' : false,
                'condition':async (value,lang) => {return await DSFTesting.rgb2hex(value).toLowerCase() == '#272525'}
            }
            ,'4.3.6.h3.color.v1': {
                'selector': 'main h3',
                'version' : '1 - 2',
                'level' : 0,
                'attribute':'color',
                'testType' : 'randomComputedStyleTest',
                'onError' : false,
                'condition':async (value,lang) => {return await DSFTesting.rgb2hex(value).toLowerCase() == '#272525'}
            }
            ,'4.3.6.h4.color.v1': {
                'selector': 'main h4',
                'version' : '1 - 2',
                'level' : 0,
                'attribute':'color',
                'testType' : 'randomComputedStyleTest',
                'onError' : false,
                'condition':async (value,lang) => {return await DSFTesting.rgb2hex(value).toLowerCase() == '#272525'}
            }
            ,'4.3.6.h5.color.v1': {
                'selector': 'main h5',
                'version' : '1 - 2',
                'level' : 0,
                'attribute':'color',
                'testType' : 'randomComputedStyleTest',
                'onError' : false,
                'condition':async (value,lang) => {return await DSFTesting.rgb2hex(value).toLowerCase() == '#272525'}
            }
            ,'4.3.6.h6.color.v1': {
                'selector': 'main h6',
                'version' : '1 - 2',
                'level' : 0,
                'attribute':'color',
                'testType' : 'randomComputedStyleTest',
                'onError' : false,
                'condition':async (value,lang) => {return await DSFTesting.rgb2hex(value).toLowerCase() == '#272525'}
            }
            ,'4.3.6.p.color.v1': {
                'selector': 'main',
                'version' : '1 - 2',
                'level' : 0,
                'attribute':'color',
                'testType' : 'randomComputedStyleTest',
                'onError' : false,
                'condition':async (value,lang) => {return await DSFTesting.rgb2hex(value).toLowerCase() == '#272525'}
            }
            ,'4.3.6.button-primary.background-color.v1': {
                'selector': 'main button.govcy-btn-primary',
                'version' : '1 - 2',
                'level' : 0,
                'attribute':'background-color',
                'testType' : 'randomComputedStyleTest',
                'onError' : false,
                'condition':async (value,lang) => {return await DSFTesting.rgb2hex(value).toLowerCase() == '#31576f'}
            }
            ,'4.3.6.a.color.v1': {
                'selector': 'main a',
                'version' : '1 - 2',
                'level' : 0,
                'attribute':'color',
                'testType' : 'randomComputedStyleTest',
                'onError' : false,
                'condition':async (value,lang) => {return await DSFTesting.rgb2hex(value).toLowerCase() == '#1d70b8'}
            }
            ,'4.3.6.a.color.hover.v1': {
                'selector': 'main a',
                'version' : '1 - 2',
                'level' : 0,
                'attribute':'color',
                'testType' : 'randomComputedStyleTest',
                'onError' : false,
                'hover' : true,
                'condition':async (value,lang) => {return await DSFTesting.rgb2hex(value).toLowerCase() == '#003078'}
            }
            ,'4.3.6.a.color.focus.v1': {
                'selector': 'main a',
                'version' : '1 - 2',
                'level' : 0,
                'attribute':'color',
                'testType' : 'randomComputedStyleTest',
                'onError' : false,
                'hover' : false,
                'focus' : true,
                'condition':async (value,lang) => {return await DSFTesting.rgb2hex(value).toLowerCase() == '#272525'}
            }
            ,'4.3.6.error-link.color.v1': {
                'selector': '.govcy-alert-error a',
                'version' : '1 - 2',
                'level' : 0,
                'attribute':'color',
                'testType' : 'randomComputedStyleTest',
                'onError' : true,
                'condition':async (value,lang) => {return await DSFTesting.rgb2hex(value).toLowerCase() == '#d4351c'}
            }
            ,'4.3.6.error-link.color.hover.v1': {
                'selector': '.govcy-alert-error a',
                'version' : '1 - 2',
                'level' : 0,
                'attribute':'color',
                'testType' : 'randomComputedStyleTest',
                'onError' : true,
                'hover' : true,
                'condition':async (value,lang) => {return await DSFTesting.rgb2hex(value).toLowerCase() == '#942514'}
            }
            ,'4.3.6.error-link.color.focus.v1': {
                'selector': '.govcy-alert-error a',
                'version' : '1 - 2',
                'level' : 0,
                'attribute':'background-color',
                'testType' : 'randomComputedStyleTest',
                'onError' : true,
                'hover' : false,
                'focus' : true,
                'condition':async (value,lang) => {return await DSFTesting.rgb2hex(value).toLowerCase() == '#ffdd00'}
            }
            ,'4.3.6.hint.color.v1': {
                'selector': 'main .govcy-hint',
                'version' : '1 - 2',
                'level' : 0,
                'attribute':'color',
                'testType' : 'randomComputedStyleTest',
                'onError' : false,
                'condition':async (value,lang) => {return await DSFTesting.rgb2hex(value).toLowerCase() == '#6d6e70'}
            }
            ,'4.3.6.header.color.v1': {
                'selector': 'header .govcy-bg-primary',
                'version' : '1 - 2',
                'level' : 0,
                'attribute':'background-color',
                'testType' : 'randomComputedStyleTest',
                'onError' : false,
                'condition':async (value,lang) => {return await DSFTesting.rgb2hex(value).toLowerCase() == '#31576f'}
            }
            ,'4.3.6.footer.color.v1': {
                'selector': '.govcy-container-fluid.govcy-br-top-8.govcy-br-top-primary.govcy-p-3.govcy-bg-light.govcy-d-print-none',
                'version' : '1 - 2',
                'level' : 0,
                'attribute':'background-color',
                'testType' : 'randomComputedStyleTest',
                'onError' : false,
                'condition':async (value,lang) => {return await DSFTesting.rgb2hex(value).toLowerCase() == '#ebf1f3'}
            }
            ,'4.3.6.footer-link.color.v1': {
                'selector': 'footer a',
                'version' : '1 - 2',
                'level' : 0,
                'attribute':'color',
                'testType' : 'randomComputedStyleTest',
                'onError' : false,
                'condition':async (value,lang) => {return await DSFTesting.rgb2hex(value).toLowerCase() == '#000000'}
            }
            ,'4.3.6.footer-link.color.focus.v1': {
                'selector': 'footer a',
                'version' : '1 - 2',
                'level' : 0,
                'attribute':'background-color',
                'testType' : 'randomComputedStyleTest',
                'onError' : false,
                'hover' : false,
                'focus' : true,
                'condition':async (value,lang) => {return await DSFTesting.rgb2hex(value).toLowerCase() == '#ffdd00'}
            }
            ,'4.3.6.back-link.color.v1': {
                'selector': '#beforeMainContainer a',
                'version' : '1 - 2',
                'level' : 0,
                'attribute':'color',
                'testType' : 'randomComputedStyleTest',
                'onError' : false,
                'condition':async (value,lang) => {return await DSFTesting.rgb2hex(value).toLowerCase() == '#272525'}
            }
            ,'4.3.6.back-link.color.focus.v1': {
                'selector': '#beforeMainContainer a',
                'version' : '1 - 2',
                'level' : 0,
                'attribute':'background-color',
                'testType' : 'randomComputedStyleTest',
                'onError' : false,
                'hover' : false,
                'focus' : true,
                'condition':async (value,lang) => {return await DSFTesting.rgb2hex(value).toLowerCase() == '#ffdd00'}
            }
        }
    };
}

